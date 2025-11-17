/**
 * New Deal Modal Component
 * Revised workflow with per-file upload progress and staged processing:
 * 1. Upload to Drive (per-file progress)
 * 2. Parse application → save deal record
 * 3. Parse bank statements → save financial data
 * Note: Lender matching step has been disabled
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader, AlertCircle, CheckCircle, Info, ChevronRight } from 'lucide-react';
import DocumentUpload, { type DealUploadFileDisplay, type DealUploadStatus } from './DocumentUpload';
import { supabase } from '../../lib/supabase';
import type { ExtractedDealData } from '../../types/deals';

interface NewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type StageStatus = 'pending' | 'in_progress' | 'success' | 'error';
type StageKey = 'upload' | 'parseApplication' | 'saveDeal' | 'parseStatements' | 'lenderOptions' | 'submitDeal';

interface WorkflowStage {
  key: StageKey;
  label: string;
  status: StageStatus;
  detail?: string;
}

interface DriveFileMeta {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
}

interface UploadFile extends DealUploadFileDisplay {
  file: File;
  driveFile?: DriveFileMeta | null;
  parsingStatus?: 'pending' | 'in_progress' | 'success' | 'error';
}

const STAGE_DEFINITIONS: Array<{ key: StageKey; label: string }> = [
  { key: 'upload', label: 'Drive\nUpload' },
  { key: 'parseApplication', label: 'Analyze\nApplication' },
  { key: 'parseStatements', label: 'Analyze\nStatements' },
  { key: 'saveDeal', label: 'Create Deal\nRecord' },
  { key: 'lenderOptions', label: 'Lender\nOptions' },
  { key: 'submitDeal', label: 'Submit\nDeal' },
];

const createId = () => (
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
);

const numberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim().length) {
    const parsed = Number(value.replace(/[^0-9.-]+/g, ''));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const buildInitialStages = (): WorkflowStage[] =>
  STAGE_DEFINITIONS.map((def) => ({ ...def, status: 'pending' as StageStatus, detail: undefined }));

const loanTypeFallback = (value: unknown): 'MCA' | 'Business LOC' =>
  value === 'Business LOC' ? 'Business LOC' : 'MCA';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const describeFunctionsError = (error: unknown): string => {
  if (!error) return 'Unknown error.';

  const serializeValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch (jsonError) {
      return String(value);
    }
  };

  if (typeof error === 'object') {
    const parts: string[] = [];
    const anyError = error as any;

    if (Object.prototype.hasOwnProperty.call(anyError, 'status')) {
      parts.push(`Status ${serializeValue(anyError.status)}`);
    }

    if (anyError.message) {
      parts.push(serializeValue(anyError.message));
    }

    if (anyError.context) {
      const context = anyError.context;
      if (context.response) {
        parts.push(`Response: ${serializeValue(context.response)}`);
      }
      if (context.body) {
        parts.push(`Body: ${serializeValue(context.body)}`);
      }
    }

    if (anyError.error) {
      parts.push(`Error: ${serializeValue(anyError.error)}`);
    }

    if (parts.length > 0) {
      return parts.join(' | ');
    }

    return serializeValue(error);
  }

  return serializeValue(error);
};

export default function NewDealModal({ isOpen, onClose, onSuccess }: NewDealModalProps) {
  const [mode, setMode] = useState<'upload' | 'processing' | 'review' | 'error'>('upload');
  const [stages, setStages] = useState<WorkflowStage[]>(() => buildInitialStages());
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dealRecord, setDealRecord] = useState<any>(null);
  const [driveFolder, setDriveFolder] = useState<{ id: string; name: string; webViewLink: string } | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedDealData | null>(null);
  const [globalWarnings, setGlobalWarnings] = useState<string[]>([]);
  const [matchWarning, setMatchWarning] = useState<string | null>(null);

  const displayFiles = useMemo<DealUploadFileDisplay[]>(
    () => files.map(({ file, driveFile, ...rest }) => ({ ...rest })),
    [files],
  );

  const resetWorkflow = useCallback(() => {
    setStages(buildInitialStages());
    setMode('upload');
    setIsWorking(false);
    setErrorMessage(null);
    setGlobalWarnings([]);
    setMatchWarning(null);
    setDealRecord(null);
    setDriveFolder(null);
    setExtractedData(null);
    setFiles((prev) => prev.map((file) => ({ ...file, status: 'pending', progress: 0, error: undefined })));
  }, []);

  const handleClose = useCallback(() => {
    if (isWorking) return;
    resetWorkflow();
    setFiles([]);
    setUploadError(null);
    onClose();
  }, [isWorking, onClose, resetWorkflow]);

  useEffect(() => {
    if (!isOpen) {
      resetWorkflow();
      setFiles([]);
      setUploadError(null);
      setErrorMessage(null);
    }
  }, [isOpen, resetWorkflow]);

  const updateStage = useCallback((key: StageKey, updates: Partial<WorkflowStage>) => {
    setStages((prev) => prev.map((stage) => (stage.key === key ? { ...stage, ...updates } : stage)));
  }, []);

  const setFileStatus = useCallback((id: string, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((file) => (file.id === id ? { ...file, ...updates } : file)));
  }, []);

  const handleAddFiles = useCallback((incoming: File[], category: 'application' | 'statements') => {
    if (!incoming.length) return;
    setFiles((prev) => ([
      ...prev,
      ...incoming.map((file) => ({
        id: createId(),
        file,
        name: file.name,
        size: file.size,
        status: 'pending' as DealUploadStatus,
        progress: 0,
        category,
      })),
    ]));
    setUploadError(null);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    if (isWorking) return;
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, [isWorking]);

  const combinedHelperText = uploadError ? uploadError : null;

  const handleSubmitDeal = useCallback(async () => {
    if (files.length === 0) {
      setUploadError('Please upload at least one document to continue.');
      return;
    }

    setIsWorking(true);
    setUploadError(null);
    setErrorMessage(null);
    setGlobalWarnings([]);
    setDealRecord(null);
    setDriveFolder(null);
    setMatchWarning(null);
    setExtractedData(null);
    setStages(() => buildInitialStages().map((stage) => (
      stage.key === 'upload' ? { ...stage, status: 'in_progress' as StageStatus, detail: 'Starting document uploads...' } : stage
    )));
    setMode('processing');

    const warningSet = new Set<string>();
    let currentStage: StageKey = 'upload';
    let currentFileId: string | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Please sign in before submitting a deal.');
      }

      // Pre-extract business name from first application document
      let businessName: string | null = null;
      const firstApplicationFile = files.find((file) => file.category === 'application');

      if (firstApplicationFile) {
        updateStage('upload', {
          status: 'in_progress',
          detail: 'Extracting business name...',
        });

        try {
          const base64 = await fileToBase64(firstApplicationFile.file);
          const { data: nameData } = await supabase.functions.invoke('extract-business-name', {
            body: {
              file: {
                name: firstApplicationFile.name,
                type: firstApplicationFile.file.type,
                content: base64,
              },
            },
          });

          businessName = nameData?.businessName || null;
          console.log('Extracted business name:', businessName);
        } catch (nameError) {
          console.error('Failed to extract business name:', nameError);
          // Continue with upload even if name extraction fails
        }
      }

      let folder = driveFolder;
      const accumulatedDriveFiles: DriveFileMeta[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        currentStage = 'upload';
        currentFileId = file.id;

        setFileStatus(file.id, { status: 'uploading', progress: 10, error: undefined });
        const base64 = await fileToBase64(file.file);

        const { data, error } = await supabase.functions.invoke('parse-deal-documents', {
          body: {
            files: [{
              name: file.name,
              type: file.file.type,
              content: base64,
              category: file.category,
            }],
            skipParsing: true,
            existingFolderId: folder?.id,
            existingFolderName: folder?.name,
            existingFolderWebViewLink: folder?.webViewLink,
            overrideBusinessName: businessName,
          },
        });

        if (error) {
          throw new Error(`Failed to upload ${file.name} to Google Drive.`);
        }

        if (Array.isArray(data?.warnings)) {
          data.warnings.forEach((w: string) => warningSet.add(w));
        }

        const uploaded: DriveFileMeta | null = Array.isArray(data?.uploadedFiles) && data.uploadedFiles.length
          ? data.uploadedFiles[0]
          : null;

        if (uploaded) {
          accumulatedDriveFiles.push(uploaded);
        }

        folder = data?.documentsFolder ?? folder;

        setFileStatus(file.id, {
          status: 'success',
          progress: 100,
          driveFile: uploaded ?? null,
        });

        updateStage('upload', {
          status: index + 1 === files.length ? 'success' : 'in_progress',
          detail: `Uploaded ${index + 1} of ${files.length} document${files.length === 1 ? '' : 's'}`,
        });
      }

      if (!folder) {
        throw new Error('Documents uploaded but Drive folder could not be created.');
      }

      setDriveFolder(folder);

      // Parse application documents
      currentStage = 'parseApplication';
      const applicationFiles = files.filter((file) => file.category === 'application');
      let applicationResult: any = null;

      if (applicationFiles.length > 0) {
        updateStage('parseApplication', {
          status: 'in_progress',
          detail: 'Analyzing application documents...',
        });

        // Set parsing status to in_progress for application files
        applicationFiles.forEach((file) => {
          setFileStatus(file.id, { parsingStatus: 'in_progress' });
        });

        const payload = await Promise.all(applicationFiles.map(async (file) => ({
          name: file.name,
          type: file.file.type,
          content: await fileToBase64(file.file),
        })));

        const { data, error } = await supabase.functions.invoke('parse-application', {
          body: { files: payload },
        });

        if (error) {
          applicationFiles.forEach((file) => {
            setFileStatus(file.id, { parsingStatus: 'error' });
          });
          throw new Error('Failed to parse application documents.');
        }

        applicationResult = data;

        console.log('📄 Application parsing result:', {
          deal: data?.deal,
          owners: data?.owners,
          confidence: data?.confidence,
          warnings: data?.warnings,
        });

        if (Array.isArray(data?.warnings)) {
          data.warnings.forEach((w: string) => warningSet.add(w));
        }

        // Set parsing status to success for application files
        applicationFiles.forEach((file) => {
          setFileStatus(file.id, { parsingStatus: 'success' });
        });

        updateStage('parseApplication', {
          status: 'success',
          detail: 'Application data extracted successfully.',
        });
      } else {
        updateStage('parseApplication', {
          status: 'success',
          detail: 'No application documents provided.',
        });
      }

      // Save deal record & owners
      currentStage = 'saveDeal';
      updateStage('saveDeal', {
        status: 'in_progress',
        detail: 'Saving deal record...',
      });

      const dealData = applicationResult?.deal ?? {};
      const owners = Array.isArray(applicationResult?.owners) ? applicationResult.owners : [];

      const legalBusinessName = (dealData.legal_business_name || '').toString().trim() || 'Untitled Deal';
      const einValue = (dealData.ein || '').toString().trim() || '000000000';
      const addressValue = dealData.address || 'Unknown';
      const cityValue = dealData.city || 'Unknown';
      const stateValue = dealData.state || 'NA';
      const zipValue = dealData.zip || '00000';
      const loanType = loanTypeFallback(dealData.loan_type);

      const desiredLoanAmount = numberOrNull(dealData.desired_loan_amount) ?? 0;
      const averageMonthlySales = numberOrNull(dealData.average_monthly_sales);
      const averageMonthlyCardSales = numberOrNull(dealData.average_monthly_card_sales);
      const franchiseUnits = numberOrNull(dealData.franchise_units);

      const businessStartDate = dealData.business_start_date || null;
      const timeInBusinessMonths = businessStartDate
        ? Math.round((Date.now() - new Date(businessStartDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : null;

      // Log the data being inserted for debugging
      const dealInsertData = {
        user_id: user.id,
        legal_business_name: legalBusinessName,
        dba_name: dealData.dba_name || null,
        ein: einValue,
        business_type: dealData.business_type || null,
        address: addressValue,
        city: cityValue,
        state: stateValue,
        zip: zipValue,
        phone: dealData.phone || null,
        website: dealData.website || null,
        franchise_business: Boolean(dealData.franchise_business),
        seasonal_business: Boolean(dealData.seasonal_business),
        peak_sales_month: dealData.peak_sales_month || null,
        business_start_date: businessStartDate,
        time_in_business_months: timeInBusinessMonths,
        product_service_sold: dealData.product_service_sold || null,
        franchise_units: franchiseUnits,
        average_monthly_sales: averageMonthlySales,
        average_monthly_sales_low: numberOrNull(dealData.average_monthly_sales_low),
        average_monthly_sales_high: numberOrNull(dealData.average_monthly_sales_high),
        average_monthly_card_sales: averageMonthlyCardSales,
        desired_loan_amount: desiredLoanAmount,
        reason_for_loan: dealData.reason_for_loan || null,
        loan_type: loanType,
        status: 'New',
        application_google_drive_link: folder?.webViewLink || null,
        statements_google_drive_link: folder?.webViewLink || null,
      };

      console.log('📝 Attempting to insert deal record:', dealInsertData);

      const { data: insertedDeal, error: dealInsertError } = await supabase
        .from('deals')
        .insert(dealInsertData)
        .select()
        .single();

      if (dealInsertError) {
        console.error('❌ Deal insert failed:', dealInsertError);
        console.error('Error details:', {
          message: dealInsertError.message,
          details: dealInsertError.details,
          hint: dealInsertError.hint,
          code: dealInsertError.code,
        });
        throw new Error(`Database error: ${dealInsertError.message}${dealInsertError.hint ? ` (Hint: ${dealInsertError.hint})` : ''}`);
      }

      console.log('✅ Deal inserted successfully:', insertedDeal);

      setDealRecord(insertedDeal);

      if (owners.length > 0) {
        for (const owner of owners) {
          if (!owner?.full_name || !owner.street_address || !owner.city || !owner.state || !owner.zip) {
            continue;
          }

          const { error: ownerError } = await supabase.from('deal_owners').insert({
            deal_id: insertedDeal.id,
            owner_number: owner.owner_number ?? 1,
            full_name: owner.full_name,
            street_address: owner.street_address,
            city: owner.city,
            state: owner.state,
            zip: owner.zip,
            phone: owner.phone || null,
            email: owner.email || null,
            ownership_percent: numberOrNull(owner.ownership_percent),
            drivers_license_number: owner.drivers_license_number || null,
            date_of_birth: owner.date_of_birth || null,
            ssn_encrypted: null,
          });

          if (ownerError) {
            throw ownerError;
          }
        }
      }

      updateStage('saveDeal', {
        status: 'success',
        detail: `Deal saved${owners.length ? ` with ${owners.length} owner${owners.length === 1 ? '' : 's'}` : ''}.`,
      });

      // Parse bank statements
      currentStage = 'parseStatements';
      const statementFiles = files.filter((file) => file.category === 'statements');
      let statementsResult: any = null;

      if (statementFiles.length > 0) {
        updateStage('parseStatements', {
          status: 'in_progress',
          detail: 'Analyzing bank statements...',
        });

        // Set parsing status to in_progress for statement files
        statementFiles.forEach((file) => {
          setFileStatus(file.id, { parsingStatus: 'in_progress' });
        });

        const payload = await Promise.all(statementFiles.map(async (file) => ({
          name: file.name,
          type: file.file.type,
          content: await fileToBase64(file.file),
        })));

        const response = await supabase.functions.invoke('parse-bank-statements', {
          body: { files: payload },
        });

        if (response.error) {
          const details = describeFunctionsError(response.error);
          console.error('parse-bank-statements invocation error:', response.error);
          statementFiles.forEach((file) => {
            setFileStatus(file.id, { parsingStatus: 'error' });
          });
          updateStage('parseStatements', {
            status: 'error',
            detail: details,
          });
          warningSet.add(`Bank statement parsing failed: ${details}`);
          throw new Error(`Failed to parse bank statements. ${details}`);
        }

        if (!response.data) {
          const detail = 'Edge function returned no data.';
          console.error('parse-bank-statements returned empty data payload.', response);
          statementFiles.forEach((file) => {
            setFileStatus(file.id, { parsingStatus: 'error' });
          });
          updateStage('parseStatements', {
            status: 'error',
            detail,
          });
          warningSet.add(`Bank statement parsing failed: ${detail}`);
          throw new Error(`Failed to parse bank statements. ${detail}`);
        }

        statementsResult = response.data;

        if (Array.isArray(response.data?.warnings)) {
          response.data.warnings.forEach((w: string) => warningSet.add(w));
        }

        // Set parsing status to success for statement files
        statementFiles.forEach((file) => {
          setFileStatus(file.id, { parsingStatus: 'success' });
        });

        updateStage('parseStatements', {
          status: 'success',
          detail: 'Bank statements processed.',
        });
      } else {
        updateStage('parseStatements', {
          status: 'success',
          detail: 'No bank statements provided.',
        });
      }

      // Save statements and funding positions (part of saveDeal stage)

      const statementIds: string[] = [];
      const statements = Array.isArray(statementsResult?.statements) ? statementsResult.statements : [];
      const fundingPositions = Array.isArray(statementsResult?.fundingPositions) ? statementsResult.fundingPositions : [];

      if (statements.length > 0) {
        for (let idx = 0; idx < statements.length; idx += 1) {
          const statement = statements[idx];
          const bankName = statement.bank_name || 'Unknown Bank';
          const statementMonth = statement.statement_month || 'Unknown';
          const statementIdentifier = statement.statement_id || `${insertedDeal.id}-statement-${idx}`;

          const { data: stmtData, error: stmtError } = await supabase
            .from('deal_bank_statements')
            .insert({
              deal_id: insertedDeal.id,
              bank_name: bankName,
              statement_month: statementMonth,
              statement_id: statementIdentifier,
              statement_file_url: folder?.webViewLink || null,
              credits: numberOrNull(statement.credits),
              debits: numberOrNull(statement.debits),
              nsfs: numberOrNull(statement.nsfs) ?? 0,
              overdrafts: numberOrNull(statement.overdrafts) ?? 0,
              average_daily_balance: numberOrNull(statement.average_daily_balance),
              deposit_count: numberOrNull(statement.deposit_count),
            })
            .select('id')
            .single();

          if (stmtError) {
            throw stmtError;
          }

          if (stmtData?.id) {
            statementIds.push(stmtData.id);
          }
        }
      }

      if (fundingPositions.length > 0 && statementIds.length > 0) {
        for (let idx = 0; idx < fundingPositions.length; idx += 1) {
          const funding = fundingPositions[idx];
          const amountValue = numberOrNull(funding.amount) ?? 0;
          const targetStatementId = statementIds[Math.min(idx, statementIds.length - 1)];

          const { error: fundingError } = await supabase.from('deal_funding_positions').insert({
            statement_id: targetStatementId,
            lender_name: funding.lender_name || 'Unknown Lender',
            amount: amountValue,
            frequency: funding.frequency || 'daily',
            detected_dates: (funding?.detected_dates && Array.isArray(funding.detected_dates)) ? funding.detected_dates : [],
          });

          if (fundingError) {
            throw fundingError;
          }
        }
      }

      // Financial data saved as part of saveDeal stage

      // Lender matching disabled for now
      // currentStage = 'match';
      // Skip the lender matching step entirely

      const warningsArray = Array.from(warningSet);
      setGlobalWarnings(warningsArray);

      const mergedExtractedData: ExtractedDealData = {
        deal: dealData,
        owners,
        statements,
        fundingPositions,
        confidence: {
          deal: applicationResult?.confidence?.deal ?? 0,
          owners: applicationResult?.confidence?.owners ?? [],
          statements: statementsResult?.confidence?.statements ?? [],
        },
        missingFields: [
          ...(applicationResult?.missingFields ?? []),
          ...(statementsResult?.missingFields ?? []),
        ],
        warnings: warningsArray,
        documentsFolder: folder
          ? {
              id: folder.id,
              name: folder.name,
              webViewLink: folder.webViewLink,
              files: accumulatedDriveFiles,
            }
          : undefined,
      };

      setExtractedData(mergedExtractedData);
      setIsWorking(false);
      setMode('review');
      onSuccess?.();
    } catch (error) {
      console.error('Deal submission error:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred during deal submission.';
      setErrorMessage(message);
      setIsWorking(false);
      setMode('error');
      setGlobalWarnings((prev) => Array.from(new Set(prev)));

      if (currentStage) {
        updateStage(currentStage, {
          status: 'error',
          detail: message,
        });
      }

      if (currentFileId) {
        setFileStatus(currentFileId, {
          status: 'error',
          progress: 100,
          error: message,
        });
      }
    }
  }, [files, driveFolder, onSuccess, setFileStatus, updateStage]);

  const renderStageStatus = (stage: WorkflowStage) => {
    let icon = <Info className="w-4 h-4 text-gray-500" />;
    let badgeClass = 'text-gray-400 border-gray-600';

    if (stage.status === 'success') {
      icon = <CheckCircle className="w-4 h-4 text-green-400" />;
      badgeClass = 'text-green-300 border-green-400/40';
    } else if (stage.status === 'error') {
      icon = <AlertCircle className="w-4 h-4 text-red-400" />;
      badgeClass = 'text-red-300 border-red-400/40';
    } else if (stage.status === 'in_progress') {
      icon = <Loader className="w-4 h-4 text-indigo-300 animate-spin" />;
      badgeClass = 'text-indigo-300 border-indigo-400/40';
    }

    return (
      <div key={stage.key} className="flex flex-col gap-1 border border-gray-700/40 bg-gray-800/30 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            {icon}
            {stage.label}
          </div>
          <span className={`text-xs px-2 py-0.5 border rounded-full ${badgeClass}`}>
            {stage.status === 'pending' && 'Pending'}
            {stage.status === 'in_progress' && 'In progress'}
            {stage.status === 'success' && 'Completed'}
            {stage.status === 'error' && 'Needs attention'}
          </span>
        </div>
        {stage.detail && <p className="text-xs text-gray-400 leading-snug">{stage.detail}</p>}
      </div>
    );
  };

  const renderHorizontalProgress = () => {
    return (
      <div className="flex items-center justify-between gap-2">
        {stages.map((stage, index) => {
          let stepColor = 'text-gray-500';
          let bgColor = 'bg-gray-700/30';
          let icon = <div className="w-6 h-6 rounded-full border-2 border-gray-600 bg-gray-800" />;

          if (stage.status === 'success') {
            stepColor = 'text-green-400';
            bgColor = 'bg-green-500/20';
            icon = <CheckCircle className="w-6 h-6 text-green-400" />;
          } else if (stage.status === 'error') {
            stepColor = 'text-red-400';
            bgColor = 'bg-red-500/20';
            icon = <AlertCircle className="w-6 h-6 text-red-400" />;
          } else if (stage.status === 'in_progress') {
            stepColor = 'text-indigo-400';
            bgColor = 'bg-indigo-500/20';
            icon = <Loader className="w-6 h-6 text-indigo-400 animate-spin" />;
          }

          return (
            <div key={stage.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${bgColor}`}>
                  {icon}
                </div>
                <span className={`text-xs font-medium ${stepColor} text-center whitespace-pre-line leading-tight`}>
                  {stage.label}
                </span>
              </div>
              {index < stages.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 mx-1" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderFileWithDualStatus = (file: UploadFile) => {
    const uploadIcon = file.status === 'success'
      ? <CheckCircle className="w-4 h-4 text-green-400" />
      : file.status === 'uploading'
      ? <Loader className="w-4 h-4 text-indigo-400 animate-spin" />
      : file.status === 'error'
      ? <AlertCircle className="w-4 h-4 text-red-400" />
      : <div className="w-4 h-4 rounded border-2 border-gray-600" />;

    const parsingIcon = file.parsingStatus === 'success'
      ? <CheckCircle className="w-4 h-4 text-green-400" />
      : file.parsingStatus === 'in_progress'
      ? <Loader className="w-4 h-4 text-indigo-400 animate-spin" />
      : file.parsingStatus === 'error'
      ? <AlertCircle className="w-4 h-4 text-red-400" />
      : <div className="w-4 h-4 rounded-full border-2 border-gray-600" />;

    return (
      <div key={file.id} className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/30 rounded-lg p-2.5">
        <div className="flex gap-1.5">
          {uploadIcon}
          {parsingIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white truncate">{file.name}</p>
          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          {file.error && file.status === 'error' && (
            <p className="text-xs text-red-400 truncate">{file.error}</p>
          )}
        </div>
        {file.status === 'uploading' && (
          <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, file.progress))}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between bg-gray-900 border-b border-gray-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">New Deal Submission</h2>
            {mode === 'review' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-md">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">Deal saved successfully</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {mode === 'review' && dealRecord?.id && (
              <Link
                to={`/deals/${dealRecord.id}`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all font-semibold flex items-center gap-2"
              >
                View Full Deal Details
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={handleClose}
              disabled={isWorking}
              className={`text-gray-400 hover:text-gray-200 transition-colors ${isWorking ? 'cursor-not-allowed opacity-50' : ''}`}
              aria-label="Close deal submission"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {mode === 'upload' && (
            <div className="space-y-5">
              <DocumentUpload
                files={displayFiles}
                onAddFiles={handleAddFiles}
                onRemoveFile={handleRemoveFile}
                disabled={isWorking}
                helperText={combinedHelperText}
                maxFiles={20}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitDeal}
                  disabled={isWorking}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-2"
                >
                  {isWorking && <Loader className="w-4 h-4 animate-spin" />}
                  Start Deal Intake
                </button>
              </div>
            </div>
          )}

          {mode === 'processing' && (
            <div className="space-y-6">
              {/* Horizontal Progress Bar */}
              <div className="border border-gray-700/40 bg-gray-800/30 rounded-lg p-6">
                <div className="flex items-center gap-2 text-sm text-indigo-300 mb-6">
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing deal submission...
                </div>
                {renderHorizontalProgress()}
              </div>

              {/* Documents with dual status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Documents</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded border-2 border-gray-600" />
                      <span>Upload</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full border-2 border-gray-600" />
                      <span>Analyze</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
                  {files.map(renderFileWithDualStatus)}
                </div>
              </div>
            </div>
          )}

          {mode === 'review' && extractedData && (
            <div className="space-y-6">
              {/* Deal Snapshot - Full Width Top Row */}
              <div className="border border-gray-800 rounded-lg bg-gray-800/40 p-5">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">Deal snapshot</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-300">
                  <div>
                    <span className="text-gray-500 block mb-1">Business:</span>
                    <span className="text-white font-medium">{extractedData.deal.legal_business_name || 'Untitled Deal'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Loan type:</span>
                    <span className="text-white">{extractedData.deal.loan_type || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Desired Loan Amount:</span>
                    <span className="text-white">${numberOrNull(extractedData.deal.desired_loan_amount)?.toLocaleString() ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Average monthly sales:</span>
                    <span className="text-white">${numberOrNull(extractedData.deal.average_monthly_sales)?.toLocaleString() ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Drive Folder:</span>
                    {driveFolder ? (
                      <a
                        href={driveFolder.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-300 hover:text-indigo-200 font-medium"
                      >
                        {driveFolder.name}
                      </a>
                    ) : (
                      <span className="text-white">N/A</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Horizontal Progress Bar */}
              <div className="border border-gray-700/40 bg-gray-800/30 rounded-lg p-5">
                {renderHorizontalProgress()}
              </div>

              {/* Bank Statements Table */}
              {extractedData.statements && extractedData.statements.length > 0 && (() => {
                // Sort statements by month ascending (oldest first)
                const sortedStatements = [...extractedData.statements].sort((a, b) => {
                  const monthA = a.statement_month || '';
                  const monthB = b.statement_month || '';
                  return monthA.localeCompare(monthB);
                });

                // Calculate 3-month and 6-month averages (take from end for most recent)
                const last3Months = sortedStatements.slice(-3);
                const last6Months = sortedStatements.slice(-6);

                const calculateAverage = (statements: typeof sortedStatements) => {
                  const count = statements.length;
                  if (count === 0) return { credits: null, debits: null, nsfs: 0, deposits: null, avgBal: null };

                  let totalCredits = 0;
                  let totalDebits = 0;
                  let totalNsfs = 0;
                  let totalDeposits = 0;
                  let totalAvgBal = 0;

                  statements.forEach((stmt) => {
                    totalCredits += stmt.credits || 0;
                    totalDebits += stmt.debits || 0;
                    totalNsfs += stmt.nsfs || 0;
                    totalDeposits += stmt.deposit_count || 0;
                    totalAvgBal += stmt.average_daily_balance || 0;
                  });

                  return {
                    credits: Math.round(totalCredits / count),
                    debits: Math.round(totalDebits / count),
                    nsfs: Math.round(totalNsfs / count),
                    deposits: Math.round(totalDeposits / count),
                    avgBal: Math.round(totalAvgBal / count),
                  };
                };

                const avg3Month = calculateAverage(last3Months);
                const avg6Month = calculateAverage(last6Months);

                return (
                  <div className="border border-gray-800 rounded-lg bg-gray-800/40 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-700/50">
                      <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Bank Statements</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-900/50 border-b border-gray-700/30">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Month</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Credits</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Debits</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">NSFs</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Dep</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Ave Bal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/20">
                          {sortedStatements.map((statement, index) => (
                            <tr key={index} className={`hover:bg-gray-700/10 transition-colors ${index % 2 === 0 ? 'bg-gray-900/20' : ''}`}>
                              <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                                {statement.statement_id || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-white font-medium">
                                {statement.statement_month || 'Unknown'}
                              </td>
                              <td className="px-4 py-3 text-right text-green-400 font-medium">
                                ${statement.credits?.toLocaleString() ?? 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-right text-red-400 font-medium">
                                ${statement.debits?.toLocaleString() ?? 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-center text-white">
                                {statement.nsfs ?? 0}
                              </td>
                              <td className="px-4 py-3 text-center text-white">
                                {statement.deposit_count ?? statement.overdrafts ?? 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-right text-blue-400 font-medium">
                                ${statement.average_daily_balance?.toLocaleString() ?? 'N/A'}
                              </td>
                            </tr>
                          ))}

                          {/* 3-Month Average */}
                          {last3Months.length >= 3 && (
                            <tr className="bg-indigo-500/10 border-t-2 border-indigo-500/30 font-semibold">
                              <td className="px-4 py-3 text-gray-400 text-xs" colSpan={2}>
                                Last 3 Month Average
                              </td>
                              <td className="px-4 py-3 text-right text-green-300">
                                ${avg3Month.credits?.toLocaleString() ?? 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-right text-red-300">
                                ${avg3Month.debits?.toLocaleString() ?? 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-center text-white">
                                {avg3Month.nsfs}
                              </td>
                              <td className="px-4 py-3 text-center text-white">
                                {avg3Month.deposits}
                              </td>
                              <td className="px-4 py-3 text-right text-blue-300">
                                ${avg3Month.avgBal?.toLocaleString() ?? 'N/A'}
                              </td>
                            </tr>
                          )}

                          {/* 6-Month Average */}
                          {last6Months.length >= 6 && (
                            <tr className="bg-purple-500/10 border-t border-purple-500/30 font-semibold">
                              <td className="px-4 py-3 text-gray-400 text-xs" colSpan={2}>
                                Last 6 Month Average
                              </td>
                              <td className="px-4 py-3 text-right text-green-300">
                                ${avg6Month.credits?.toLocaleString() ?? 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-right text-red-300">
                                ${avg6Month.debits?.toLocaleString() ?? 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-center text-white">
                                {avg6Month.nsfs}
                              </td>
                              <td className="px-4 py-3 text-center text-white">
                                {avg6Month.deposits}
                              </td>
                              <td className="px-4 py-3 text-right text-blue-300">
                                ${avg6Month.avgBal?.toLocaleString() ?? 'N/A'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {(() => {
                // Define critical warning patterns (things users should act on)
                const CRITICAL_WARNING_PATTERNS = [
                  /failed to/i,
                  /error/i,
                  /missing required/i,
                  /invalid/i,
                  /could not (find|extract|parse)/i,
                  /unable to/i,
                ];

                // Filter out informational AI transparency messages
                const criticalWarnings = globalWarnings.filter(warning => {
                  // Always show if it matches a critical pattern
                  if (CRITICAL_WARNING_PATTERNS.some(pattern => pattern.test(warning))) {
                    return true;
                  }

                  // Hide informational AI transparency messages
                  const isInformational =
                    warning.includes('SKIP_PARSING') ||
                    warning.includes('inferred') ||
                    warning.includes('approximated') ||
                    warning.includes('assumed') ||
                    warning.includes('estimated') ||
                    warning.includes('not explicitly') ||
                    warning.includes('may vary') ||
                    warning.includes('may have minor') ||
                    warning.includes('set to null') ||
                    warning.includes('set as null');

                  return !isInformational;
                });

                // Log informational warnings to console for debugging
                if (globalWarnings.length > criticalWarnings.length) {
                  console.log('ℹ️ Informational warnings (not shown to user):',
                    globalWarnings.filter(w => !criticalWarnings.includes(w))
                  );
                }

                return (criticalWarnings.length > 0 || matchWarning) && (
                  <div className="space-y-3">
                    {criticalWarnings.length > 0 && (
                      <div className="border border-yellow-500/40 bg-yellow-500/10 rounded-lg p-3 space-y-1">
                        <p className="text-sm font-semibold text-yellow-100">Warnings</p>
                        {criticalWarnings.map((warning) => (
                          <p className="text-xs text-yellow-100/90" key={warning}>{warning}</p>
                        ))}
                      </div>
                    )}
                    {matchWarning && (
                      <div className="border border-orange-500/40 bg-orange-500/10 rounded-lg p-3 text-xs text-orange-100">
                        {matchWarning}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {mode === 'error' && (
            <div className="space-y-5">
              <div className="border border-red-500/40 bg-red-500/10 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-300 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Deal submission interrupted</h3>
                  <p className="text-sm text-red-100">{errorMessage}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {stages.map(renderStageStatus)}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setMode('upload');
                    setErrorMessage(null);
                    setIsWorking(false);
                    setStages(buildInitialStages());
                    setFiles((prev) => prev.map((file) => ({
                      ...file,
                      status: 'pending',
                      progress: 0,
                      error: undefined,
                    })));
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg transition-all"
                >
                  Fix issues & retry
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

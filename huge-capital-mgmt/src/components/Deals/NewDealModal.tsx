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
type StageKey = 'upload' | 'parseApplication' | 'saveDeal' | 'parseStatements' | 'saveFinancials' | 'match';

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
}

const STAGE_DEFINITIONS: Array<{ key: StageKey; label: string }> = [
  { key: 'upload', label: 'Upload documents to Drive' },
  { key: 'parseApplication', label: 'Analyze application documents' },
  { key: 'saveDeal', label: 'Create deal record' },
  { key: 'parseStatements', label: 'Analyze bank statements' },
  { key: 'saveFinancials', label: 'Store financial metrics' },
  // { key: 'match', label: 'Generate lender matches' }, // Disabled for now
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
  const [driveFiles, setDriveFiles] = useState<DriveFileMeta[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedDealData | null>(null);
  const [globalWarnings, setGlobalWarnings] = useState<string[]>([]);
  const [matchWarning, setMatchWarning] = useState<string | null>(null);
  const [matchLogId, setMatchLogId] = useState<string | null>(null);

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
    setMatchLogId(null);
    setDealRecord(null);
    setDriveFolder(null);
    setDriveFiles([]);
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
    setDriveFiles([]);
    setMatchWarning(null);
    setMatchLogId(null);
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
      setDriveFiles(accumulatedDriveFiles);

      // Parse application documents
      currentStage = 'parseApplication';
      const applicationFiles = files.filter((file) => file.category === 'application');
      let applicationResult: any = null;

      if (applicationFiles.length > 0) {
        updateStage('parseApplication', {
          status: 'in_progress',
          detail: 'Analyzing application documents...',
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
          throw new Error('Failed to parse application documents.');
        }

        applicationResult = data;

        if (Array.isArray(data?.warnings)) {
          data.warnings.forEach((w: string) => warningSet.add(w));
        }

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

      const { data: insertedDeal, error: dealInsertError } = await supabase
        .from('deals')
        .insert({
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
          average_monthly_card_sales: averageMonthlyCardSales,
          desired_loan_amount: desiredLoanAmount,
          reason_for_loan: dealData.reason_for_loan || null,
          loan_type: loanType,
          status: 'New',
          application_google_drive_link: folder.webViewLink,
          statements_google_drive_link: folder.webViewLink,
        })
        .select()
        .single();

      if (dealInsertError) {
        throw dealInsertError;
      }

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

      // Save statements and funding positions
      currentStage = 'saveFinancials';
      updateStage('saveFinancials', {
        status: 'in_progress',
        detail: 'Saving financial data...',
      });

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
              statement_file_url: folder.webViewLink,
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
            detected_dates: Array.isArray(funding.detected_dates) ? funding.detected_dates : [],
          });

          if (fundingError) {
            throw fundingError;
          }
        }
      }

      updateStage('saveFinancials', {
        status: 'success',
        detail: statementIds.length
          ? `Saved ${statementIds.length} statement${statementIds.length === 1 ? '' : 's'}.`
          : 'No financial data to store.',
      });

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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between bg-gray-900 border-b border-gray-800 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-white">New Deal Submission</h2>
            <p className="text-sm text-gray-400">Upload documents, verify extracted data, and save the deal.</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isWorking}
            className={`text-gray-400 hover:text-gray-200 transition-colors ${isWorking ? 'cursor-not-allowed opacity-50' : ''}`}
            aria-label="Close deal submission"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {(mode === 'upload' || mode === 'processing') && (
            <div className="space-y-5">
              <DocumentUpload
                files={displayFiles}
                onAddFiles={handleAddFiles}
                onRemoveFile={handleRemoveFile}
                disabled={mode !== 'upload' || isWorking}
                helperText={combinedHelperText}
                maxFiles={20}
              />
              {mode === 'upload' && (
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
              )}
            </div>
          )}

          {mode === 'processing' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-indigo-300">
                <Loader className="w-4 h-4 animate-spin" />
                Processing deal submission...
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {stages.map(renderStageStatus)}
              </div>
            </div>
          )}

          {mode === 'review' && extractedData && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 border border-green-500/30 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-300 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Deal saved successfully</h3>
                  <p className="text-sm text-gray-300">Review the extracted data below or click into the deal record to edit details.</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {stages.map(renderStageStatus)}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-gray-800 rounded-lg bg-gray-800/40 p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Deal snapshot</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div>
                      <span className="text-gray-500">Business:</span>
                      <span className="ml-2 text-white font-medium">{extractedData.deal.legal_business_name || 'Untitled Deal'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Loan type:</span>
                      <span className="ml-2">{extractedData.deal.loan_type || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Requested amount:</span>
                      <span className="ml-2">${numberOrNull(extractedData.deal.desired_loan_amount)?.toLocaleString() ?? 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Average monthly sales:</span>
                      <span className="ml-2">${numberOrNull(extractedData.deal.average_monthly_sales)?.toLocaleString() ?? 'N/A'}</span>
                    </div>
                  </div>
                  {dealRecord?.id && (
                    <Link
                      to={`/deals/${dealRecord.id}`}
                      className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 font-medium"
                    >
                      View full customer deal details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                <div className="border border-gray-800 rounded-lg bg-gray-800/40 p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Documents</h4>
                  {driveFolder ? (
                    <div className="text-sm text-gray-300 space-y-2">
                      <div>
                        <span className="text-gray-500">Drive folder:</span>
                        <a
                          href={driveFolder.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-indigo-300 hover:text-indigo-200"
                        >
                          {driveFolder.name}
                        </a>
                      </div>
                      {driveFiles.length > 0 && (
                        <ul className="text-xs text-gray-400 space-y-1 max-h-32 overflow-y-auto border border-gray-700/40 rounded-md p-2">
                          {driveFiles.map((doc) => (
                            <li key={doc.id} className="flex items-center gap-2">
                              <span className="text-gray-300">{doc.name}</span>
                              <span className="text-gray-600 text-[11px]">{doc.mimeType}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {matchLogId && (
                        <div className="text-xs text-gray-500 border-t border-gray-700/40 pt-2 mt-2">
                          Match log ID:
                          <span className="ml-2 font-mono text-gray-300">{matchLogId}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No Drive folder metadata available.</p>
                  )}
                </div>
              </div>

              {(globalWarnings.length > 0 || matchWarning) && (
                <div className="space-y-3">
                  {globalWarnings.length > 0 && (
                    <div className="border border-yellow-500/40 bg-yellow-500/10 rounded-lg p-3 space-y-1">
                      <p className="text-sm font-semibold text-yellow-100">Warnings</p>
                      {globalWarnings.map((warning) => (
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
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    resetWorkflow();
                    setFiles([]);
                    setUploadError(null);
                    setMode('upload');
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg transition-all"
                >
                  Start another deal
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all"
                >
                  Close
                </button>
              </div>
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

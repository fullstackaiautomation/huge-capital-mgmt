/**
 * New Deal Modal Component - OPTIMIZED VERSION
 * Key optimizations:
 * 1. Batch upload - all files uploaded in single request to edge function
 * 2. Parallel parsing - application and bank statements parsed simultaneously
 * 3. Parallel database inserts - owners, statements, funding positions
 *
 * Expected time savings: ~30-40 seconds (from ~93s to ~55s)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader, AlertCircle, CheckCircle, Info, ChevronRight, Star, Building2, TrendingUp } from 'lucide-react';
import DocumentUpload, { type DealUploadFileDisplay, type DealUploadStatus } from './DocumentUpload';
import { supabase } from '../../lib/supabase';
import type { ExtractedDealData } from '../../types/deals';

// Lender recommendation types from the Lending Guru Agent
interface LenderRecommendation {
  lenderId: string;
  lenderName: string;
  lenderTable: string;
  isIfs: boolean;
  matchScore: number;
  approvalProbability: 'very_high' | 'high' | 'medium' | 'low';
  approvalCriteria: string[];
  documentationNeeded: string[];
  redFlags: string[];
  reasoning: string;
}

interface LenderMatchSummary {
  totalLendersMatched: number;
  topChoice: string;
  hugecapitalLenders: number;
  ifsLenders: number;
  nextSteps: string[];
}

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
    } catch {
      return String(value);
    }
  };

  if (typeof error === 'object') {
    const parts: string[] = [];
    const anyError = error as Record<string, unknown>;

    if (Object.prototype.hasOwnProperty.call(anyError, 'status')) {
      parts.push(`Status ${serializeValue(anyError.status)}`);
    }

    if (anyError.message) {
      parts.push(serializeValue(anyError.message));
    }

    if (anyError.context) {
      const context = anyError.context as Record<string, unknown>;
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
  const [dealRecord, setDealRecord] = useState<Record<string, unknown> | null>(null);
  const [driveFolder, setDriveFolder] = useState<{ id: string; name: string; webViewLink: string } | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedDealData | null>(null);
  const [globalWarnings, setGlobalWarnings] = useState<string[]>([]);
  const [matchWarning, setMatchWarning] = useState<string | null>(null);
  const [lenderRecommendations, setLenderRecommendations] = useState<LenderRecommendation[]>([]);
  const [lenderMatchSummary, setLenderMatchSummary] = useState<LenderMatchSummary | null>(null);
  const [selectedLenders, setSelectedLenders] = useState<Set<string>>(new Set());

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
    setLenderRecommendations([]);
    setLenderMatchSummary(null);
    setSelectedLenders(new Set());
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

  // ============================================================
  // OPTIMIZED DEAL SUBMISSION HANDLER
  // ============================================================
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
    const currentFileId: string | null = null;

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
        }
      }

      // ============================================================
      // OPTIMIZED: Batch upload + parallel parsing
      // ============================================================

      const applicationFiles = files.filter((file) => file.category === 'application');
      const statementFiles = files.filter((file) => file.category === 'statements');

      let folder: { id: string; name: string; webViewLink: string } | null = driveFolder;
      const accumulatedDriveFiles: DriveFileMeta[] = [];
      let applicationResult: Record<string, unknown> | null = null;
      let statementsResult: Record<string, unknown> | null = null;

      // Helper: Upload ALL files in a single batch request
      const uploadFilesBatch = async (filesToUpload: UploadFile[], existingFolder: typeof folder) => {
        if (filesToUpload.length === 0) return { folder: existingFolder, uploadedFiles: [] as DriveFileMeta[], warnings: [] as string[] };

        filesToUpload.forEach((f) => setFileStatus(f.id, { status: 'uploading', progress: 10, error: undefined }));

        const filePayloads = await Promise.all(filesToUpload.map(async (f) => ({
          name: f.name, type: f.file.type, content: await fileToBase64(f.file), category: f.category,
        })));

        const { data, error } = await supabase.functions.invoke('parse-deal-documents', {
          body: {
            files: filePayloads,
            skipParsing: true,
            existingFolderId: existingFolder?.id,
            existingFolderName: existingFolder?.name,
            existingFolderWebViewLink: existingFolder?.webViewLink,
            overrideBusinessName: businessName
          },
        });

        if (error) {
          filesToUpload.forEach((f) => setFileStatus(f.id, { status: 'error', progress: 100, error: 'Upload failed' }));
          throw new Error('Failed to upload documents to Google Drive.');
        }

        const uploadedFiles: DriveFileMeta[] = Array.isArray(data?.uploadedFiles) ? data.uploadedFiles : [];
        filesToUpload.forEach((f, idx) => setFileStatus(f.id, { status: 'success', progress: 100, driveFile: uploadedFiles[idx] || null }));

        return { folder: data?.documentsFolder ?? existingFolder, uploadedFiles, warnings: Array.isArray(data?.warnings) ? data.warnings : [] };
      };

      // Helper: Parse application documents
      const parseAppAsync = async (appFiles: UploadFile[]) => {
        if (appFiles.length === 0) return null;

        updateStage('parseApplication', { status: 'in_progress', detail: 'Analyzing application documents...' });
        appFiles.forEach((f) => setFileStatus(f.id, { parsingStatus: 'in_progress' }));

        const payload = await Promise.all(appFiles.map(async (f) => ({ name: f.name, type: f.file.type, content: await fileToBase64(f.file) })));
        const { data, error } = await supabase.functions.invoke('parse-application', { body: { files: payload } });

        if (error) {
          appFiles.forEach((f) => setFileStatus(f.id, { parsingStatus: 'error' }));
          throw new Error('Failed to parse application documents.');
        }

        console.log('📄 Application parsing result:', { deal: data?.deal, owners: data?.owners, confidence: data?.confidence });
        appFiles.forEach((f) => setFileStatus(f.id, { parsingStatus: 'success' }));
        updateStage('parseApplication', { status: 'success', detail: 'Application data extracted successfully.' });

        return data;
      };

      // Helper: Parse bank statements
      const parseBankAsync = async (stmtFiles: UploadFile[]) => {
        if (stmtFiles.length === 0) return null;

        updateStage('parseStatements', { status: 'in_progress', detail: 'Analyzing bank statements...' });
        stmtFiles.forEach((f) => setFileStatus(f.id, { parsingStatus: 'in_progress' }));

        const payload = await Promise.all(stmtFiles.map(async (f) => ({ name: f.name, type: f.file.type, content: await fileToBase64(f.file) })));
        const response = await supabase.functions.invoke('parse-bank-statements', { body: { files: payload } });

        if (response.error) {
          const details = describeFunctionsError(response.error);
          stmtFiles.forEach((f) => setFileStatus(f.id, { parsingStatus: 'error' }));
          updateStage('parseStatements', { status: 'error', detail: details });
          throw new Error(`Failed to parse bank statements. ${details}`);
        }

        if (!response.data) {
          stmtFiles.forEach((f) => setFileStatus(f.id, { parsingStatus: 'error' }));
          throw new Error('Failed to parse bank statements. No data returned.');
        }

        stmtFiles.forEach((f) => setFileStatus(f.id, { parsingStatus: 'success' }));
        updateStage('parseStatements', { status: 'success', detail: 'Bank statements processed.' });

        return response.data;
      };

      // STEP 1: Upload ALL files in a single batch (much faster!)
      updateStage('upload', { status: 'in_progress', detail: `Uploading ${files.length} document${files.length === 1 ? '' : 's'}...` });
      const uploadResult = await uploadFilesBatch(files, folder);
      folder = uploadResult.folder;
      accumulatedDriveFiles.push(...uploadResult.uploadedFiles);
      uploadResult.warnings.forEach((w: string) => warningSet.add(w));

      if (!folder) throw new Error('Documents uploaded but Drive folder could not be created.');
      setDriveFolder(folder);
      updateStage('upload', { status: 'success', detail: `Uploaded ${files.length} document${files.length === 1 ? '' : 's'}` });

      // STEP 2: Parse application AND bank statements IN PARALLEL
      currentStage = 'parseApplication';
      const [appResult, bankResult] = await Promise.all([
        applicationFiles.length > 0 ? parseAppAsync(applicationFiles) : Promise.resolve(null),
        statementFiles.length > 0 ? parseBankAsync(statementFiles) : Promise.resolve(null),
      ]);
      applicationResult = appResult;
      statementsResult = bankResult;

      if (Array.isArray(applicationResult?.warnings)) (applicationResult.warnings as string[]).forEach((w: string) => warningSet.add(w));
      if (Array.isArray(statementsResult?.warnings)) (statementsResult.warnings as string[]).forEach((w: string) => warningSet.add(w));
      if (applicationFiles.length === 0) updateStage('parseApplication', { status: 'success', detail: 'No application documents provided.' });
      if (statementFiles.length === 0) updateStage('parseStatements', { status: 'success', detail: 'No bank statements provided.' });

      // STEP 3: Save deal record & owners
      currentStage = 'saveDeal';
      updateStage('saveDeal', {
        status: 'in_progress',
        detail: 'Saving deal record...',
      });

      const dealData = (applicationResult?.deal ?? {}) as Record<string, unknown>;
      const owners = Array.isArray(applicationResult?.owners) ? applicationResult.owners as Record<string, unknown>[] : [];

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
        ? Math.round((Date.now() - new Date(businessStartDate as string).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : null;

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
        throw new Error(`Database error: ${dealInsertError.message}${dealInsertError.hint ? ` (Hint: ${dealInsertError.hint})` : ''}`);
      }

      console.log('✅ Deal inserted successfully:', insertedDeal);
      setDealRecord(insertedDeal);

      // Insert owners in PARALLEL
      // Only require full_name - other fields can be partial/missing
      if (owners.length > 0) {
        const ownerInserts = owners
          .filter((owner) => owner?.full_name)
          .map((owner) =>
            supabase.from('deal_owners').insert({
              deal_id: insertedDeal.id,
              owner_number: owner.owner_number ?? 1,
              full_name: owner.full_name,
              street_address: owner.street_address || 'Unknown',
              city: owner.city || 'Unknown',
              state: owner.state || 'Unknown',
              zip: owner.zip || '00000',
              phone: owner.phone || null,
              email: owner.email || null,
              ownership_percent: numberOrNull(owner.ownership_percent),
              drivers_license_number: owner.drivers_license_number || null,
              date_of_birth: owner.date_of_birth || null,
              ssn_encrypted: null,
            })
          );

        const ownerResults = await Promise.all(ownerInserts);
        const ownerError = ownerResults.find((r) => r.error)?.error;
        if (ownerError) throw ownerError;
      }

      updateStage('saveDeal', {
        status: 'success',
        detail: `Deal saved${owners.length ? ` with ${owners.length} owner${owners.length === 1 ? '' : 's'}` : ''}.`,
      });

      // Save statements and funding positions in PARALLEL
      const statementIds: string[] = [];
      const statements = Array.isArray(statementsResult?.statements) ? statementsResult.statements as Record<string, unknown>[] : [];
      const fundingPositions = Array.isArray(statementsResult?.fundingPositions) ? statementsResult.fundingPositions as Record<string, unknown>[] : [];

      if (statements.length > 0) {
        const statementInserts = statements.map((statement, idx) => {
          const bankName = statement.bank_name || 'Unknown Bank';
          const statementMonth = statement.statement_month || 'Unknown';
          const statementIdentifier = statement.statement_id || `${insertedDeal.id}-statement-${idx}`;

          return supabase
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
              negative_days: numberOrNull(statement.negative_days) ?? 0,
              average_daily_balance: numberOrNull(statement.average_daily_balance),
              deposit_count: numberOrNull(statement.deposit_count),
            })
            .select('id')
            .single();
        });

        const statementResults = await Promise.all(statementInserts);
        for (const result of statementResults) {
          if (result.error) throw result.error;
          if (result.data?.id) statementIds.push(result.data.id);
        }
      }

      if (fundingPositions.length > 0 && statementIds.length > 0) {
        // Build a map of statement_month -> statement DB id
        const statementMonthToId = new Map<string, string>();
        statements.forEach((stmt, idx) => {
          const month = (stmt.statement_month as string) || '';
          if (month && statementIds[idx]) {
            statementMonthToId.set(month, statementIds[idx]);
          }
        });

        // Analyze frequency patterns based on ALL detected dates for each lender+amount
        // Key: "lender_name|amount" -> array of all detected dates
        const lenderAmountToDates = new Map<string, string[]>();
        fundingPositions.forEach((funding) => {
          const lender = ((funding.lender_name as string) || '').toLowerCase().trim();
          const amount = numberOrNull(funding.amount) ?? 0;
          const dates = (funding.detected_dates as string[]) || [];
          if (lender && amount > 0) {
            const key = `${lender}|${amount}`;
            if (!lenderAmountToDates.has(key)) {
              lenderAmountToDates.set(key, []);
            }
            const allDates = lenderAmountToDates.get(key)!;
            dates.forEach(d => {
              if (d && !allDates.includes(d)) {
                allDates.push(d);
              }
            });
          }
        });

        // Determine inferred frequency based on date patterns
        const inferFrequency = (lenderName: string, amount: number, originalFreq: string | null): string => {
          const key = `${(lenderName || '').toLowerCase().trim()}|${amount}`;
          const dates = lenderAmountToDates.get(key) || [];

          if (dates.length < 2) {
            // Not enough data to determine pattern, use AI's guess
            return originalFreq || 'daily';
          }

          // Sort dates and calculate average gap between payments
          const sortedDates = dates
            .map(d => new Date(d).getTime())
            .filter(t => !isNaN(t))
            .sort((a, b) => a - b);

          if (sortedDates.length < 2) {
            return originalFreq || 'daily';
          }

          // Calculate gaps between consecutive payments
          const gaps: number[] = [];
          for (let i = 1; i < sortedDates.length; i++) {
            const gapDays = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
            gaps.push(gapDays);
          }

          const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

          // Determine frequency based on average gap
          // Daily: 1-4 days average gap
          // Weekly: 5-10 days average gap
          // Bi-weekly: 11-18 days average gap (treat as weekly for DB)
          // Monthly: 19+ days average gap
          if (avgGap <= 4) {
            return 'daily';
          } else if (avgGap <= 18) {
            return 'weekly'; // Covers weekly (5-10) and bi-weekly (11-18)
          } else {
            return 'monthly';
          }
        };

        const fundingInserts = fundingPositions.map((funding) => {
          const amountValue = numberOrNull(funding.amount) ?? 0;
          const lenderName = (funding.lender_name as string) || 'Unknown Lender';

          // Try to match funding position to correct statement by statement_month
          let targetStatementId = statementIds[0]; // fallback to first statement

          const fundingMonth = (funding.statement_month as string) || '';
          if (fundingMonth && statementMonthToId.has(fundingMonth)) {
            targetStatementId = statementMonthToId.get(fundingMonth)!;
          } else if (funding.detected_dates && Array.isArray(funding.detected_dates) && funding.detected_dates.length > 0) {
            // Try to derive month from detected_dates if statement_month not provided
            const firstDate = funding.detected_dates[0] as string;
            const derivedMonth = firstDate?.substring(0, 7); // "2025-10-22" -> "2025-10"
            if (derivedMonth && statementMonthToId.has(derivedMonth)) {
              targetStatementId = statementMonthToId.get(derivedMonth)!;
            }
          }

          // Infer frequency based on cross-month pattern analysis
          const inferredFrequency = inferFrequency(lenderName, amountValue, funding.frequency as string | null);

          return supabase.from('deal_funding_positions').insert({
            statement_id: targetStatementId,
            lender_name: lenderName,
            amount: amountValue,
            frequency: inferredFrequency,
            detected_dates: (funding?.detected_dates && Array.isArray(funding.detected_dates)) ? funding.detected_dates : [],
          });
        });

        const fundingResults = await Promise.all(fundingInserts);
        const fundingError = fundingResults.find((r) => r.error)?.error;
        if (fundingError) throw fundingError;
      }

      const warningsArray = Array.from(warningSet);
      setGlobalWarnings(warningsArray);

      // Safely extract missingFields arrays (handle null/undefined)
      const appMissingFields = Array.isArray(applicationResult?.missingFields) ? applicationResult.missingFields : [];
      const stmtMissingFields = Array.isArray(statementsResult?.missingFields) ? statementsResult.missingFields : [];

      const mergedExtractedData: ExtractedDealData = {
        deal: dealData,
        owners,
        statements,
        fundingPositions,
        confidence: {
          deal: (applicationResult?.confidence as Record<string, unknown>)?.deal as number ?? 0,
          owners: Array.isArray((applicationResult?.confidence as Record<string, unknown>)?.owners)
            ? (applicationResult?.confidence as Record<string, unknown>)?.owners as number[]
            : [],
          statements: Array.isArray((statementsResult?.confidence as Record<string, unknown>)?.statements)
            ? (statementsResult?.confidence as Record<string, unknown>)?.statements as number[]
            : [],
        },
        missingFields: [...appMissingFields, ...stmtMissingFields],
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

      // ============================================================
      // STEP 5: Lending Guru Agent - Match deal to lenders
      // ============================================================
      currentStage = 'lenderOptions';
      updateStage('lenderOptions', {
        status: 'in_progress',
        detail: 'Analyzing deal for lender matches...',
      });

      try {
        const lenderMatchPayload = {
          dealId: insertedDeal.id,
          loanType,
          deal: {
            deal: {
              legal_business_name: legalBusinessName,
              dba_name: dealData.dba_name,
              ein: einValue,
              business_type: dealData.business_type,
              address: addressValue,
              city: cityValue,
              state: stateValue,
              zip: zipValue,
              average_monthly_sales: averageMonthlySales,
              average_monthly_card_sales: averageMonthlyCardSales,
              desired_loan_amount: desiredLoanAmount,
              reason_for_loan: dealData.reason_for_loan,
              business_start_date: businessStartDate,
              product_service_sold: dealData.product_service_sold,
              seasonal_business: Boolean(dealData.seasonal_business),
              franchise_business: Boolean(dealData.franchise_business),
            },
            owners: owners.map((o: Record<string, unknown>) => ({
              full_name: o.full_name,
              email: o.email,
              phone: o.phone,
              ownership_percent: o.ownership_percent,
            })),
            statements: statements.map((s: Record<string, unknown>) => ({
              bank_name: s.bank_name,
              statement_month: s.statement_month,
              credits: s.credits,
              debits: s.debits,
              nsfs: s.nsfs ?? 0,
              overdrafts: s.overdrafts ?? 0,
              average_daily_balance: s.average_daily_balance,
              deposit_count: s.deposit_count,
            })),
            fundingPositions: fundingPositions.map((f: Record<string, unknown>) => ({
              lender_name: f.lender_name,
              amount: f.amount,
              frequency: f.frequency,
            })),
          },
        };

        console.log('🎯 Calling Lending Guru Agent with payload:', lenderMatchPayload);

        const { data: lenderMatchResult, error: lenderMatchError } = await supabase.functions.invoke(
          'match-deal-to-lenders',
          { body: lenderMatchPayload }
        );

        if (lenderMatchError) {
          console.error('Lending Guru Agent error:', lenderMatchError);
          updateStage('lenderOptions', {
            status: 'error',
            detail: 'Could not get lender recommendations. You can still proceed with the deal.',
          });
          warningSet.add('Lender matching failed - manual lender selection may be required.');
        } else if (lenderMatchResult) {
          console.log('✅ Lending Guru Agent recommendations:', lenderMatchResult);

          const recommendations = lenderMatchResult.recommendations || [];
          const summary = lenderMatchResult.summary || null;

          setLenderRecommendations(recommendations);
          setLenderMatchSummary(summary);

          // Auto-select top lender if score is high enough
          if (recommendations.length > 0 && recommendations[0].matchScore >= 70) {
            setSelectedLenders(new Set([recommendations[0].lenderId]));
          }

          updateStage('lenderOptions', {
            status: 'success',
            detail: `Found ${recommendations.length} lender${recommendations.length === 1 ? '' : 's'}${summary?.topChoice ? `. Top: ${summary.topChoice}` : ''}`,
          });
        }
      } catch (lenderError) {
        console.error('Lending Guru Agent exception:', lenderError);
        updateStage('lenderOptions', {
          status: 'error',
          detail: 'Lender matching encountered an error.',
        });
      }

      // Mark submit stage as pending (future feature)
      updateStage('submitDeal', {
        status: 'pending',
        detail: 'Ready for broker review and submission.',
      });

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
            {mode === 'review' && typeof dealRecord?.id === 'string' && (
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
              <div className="border border-gray-700/40 bg-gray-800/30 rounded-lg p-6">
                <div className="flex items-center gap-2 text-sm text-indigo-300 mb-6">
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing deal submission...
                </div>
                {renderHorizontalProgress()}
              </div>

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
              <div className="border border-gray-800 rounded-lg bg-gray-800/40 p-5">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">Deal snapshot</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-300">
                  <div>
                    <span className="text-gray-500 block mb-1">Business:</span>
                    <span className="text-white font-medium">{(extractedData.deal as Record<string, unknown>).legal_business_name as string || 'Untitled Deal'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Loan type:</span>
                    <span className="text-white">{(extractedData.deal as Record<string, unknown>).loan_type as string || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Desired Loan Amount:</span>
                    <span className="text-white">${numberOrNull((extractedData.deal as Record<string, unknown>).desired_loan_amount)?.toLocaleString() ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Average monthly sales:</span>
                    <span className="text-white">${numberOrNull((extractedData.deal as Record<string, unknown>).average_monthly_sales)?.toLocaleString() ?? 'N/A'}</span>
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

              <div className="border border-gray-700/40 bg-gray-800/30 rounded-lg p-5">
                {renderHorizontalProgress()}
              </div>

              {extractedData.statements && extractedData.statements.length > 0 && (() => {
                const stmts = extractedData.statements as Record<string, unknown>[];
                const sortedStatements = [...stmts].sort((a, b) => {
                  const monthA = (a.statement_month as string) || '';
                  const monthB = (b.statement_month as string) || '';
                  return monthA.localeCompare(monthB);
                });

                const last3Months = sortedStatements.slice(-3);
                const last6Months = sortedStatements.slice(-6);

                const calculateAverage = (statements: typeof sortedStatements) => {
                  const count = statements.length;
                  if (count === 0) return { credits: null, debits: null, nsfs: 0, negativeDays: 0, deposits: null, avgBal: null };

                  let totalCredits = 0;
                  let totalDebits = 0;
                  let totalNsfs = 0;
                  let totalNegativeDays = 0;
                  let totalDeposits = 0;
                  let totalAvgBal = 0;

                  statements.forEach((stmt) => {
                    totalCredits += (stmt.credits as number) || 0;
                    totalDebits += (stmt.debits as number) || 0;
                    totalNsfs += (stmt.nsfs as number) || 0;
                    totalNegativeDays += (stmt.negative_days as number) || 0;
                    totalDeposits += (stmt.deposit_count as number) || 0;
                    totalAvgBal += (stmt.average_daily_balance as number) || 0;
                  });

                  return {
                    credits: Math.round(totalCredits / count),
                    debits: Math.round(totalDebits / count),
                    nsfs: Math.round(totalNsfs / count),
                    negativeDays: Math.round(totalNegativeDays / count),
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
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">NEG</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Dep</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Ave Bal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/20">
                          {sortedStatements.map((statement, index) => (
                            <tr key={index} className={`hover:bg-gray-700/10 transition-colors ${index % 2 === 0 ? 'bg-gray-900/20' : ''}`}>
                              <td className="px-4 py-3 text-gray-300 font-mono text-xs">{(statement.statement_id as string) || 'N/A'}</td>
                              <td className="px-4 py-3 text-white font-medium">{(statement.statement_month as string) || 'Unknown'}</td>
                              <td className="px-4 py-3 text-right text-green-400 font-medium">${(statement.credits as number)?.toLocaleString() ?? 'N/A'}</td>
                              <td className="px-4 py-3 text-right text-red-400 font-medium">${(statement.debits as number)?.toLocaleString() ?? 'N/A'}</td>
                              <td className="px-4 py-3 text-center text-white">{(statement.nsfs as number) ?? 0}</td>
                              <td className={`px-4 py-3 text-center ${Number(statement.negative_days || 0) > 0 ? 'text-orange-400' : 'text-white'}`}>
                                {Number(statement.negative_days || 0) > 0 ? statement.negative_days : ''}
                              </td>
                              <td className="px-4 py-3 text-center text-white">{(statement.deposit_count as number) ?? (statement.overdrafts as number) ?? 'N/A'}</td>
                              <td className="px-4 py-3 text-right text-blue-400 font-medium">${(statement.average_daily_balance as number)?.toLocaleString() ?? 'N/A'}</td>
                            </tr>
                          ))}
                          {last3Months.length >= 3 && (
                            <tr className="bg-indigo-500/10 border-t-2 border-indigo-500/30 font-semibold">
                              <td className="px-4 py-3 text-gray-400 text-xs" colSpan={2}>Last 3 Month Average</td>
                              <td className="px-4 py-3 text-right text-green-300">${avg3Month.credits?.toLocaleString() ?? 'N/A'}</td>
                              <td className="px-4 py-3 text-right text-red-300">${avg3Month.debits?.toLocaleString() ?? 'N/A'}</td>
                              <td className="px-4 py-3 text-center text-white">{avg3Month.nsfs}</td>
                              <td className="px-4 py-3 text-center text-orange-300">{avg3Month.negativeDays}</td>
                              <td className="px-4 py-3 text-center text-white">{avg3Month.deposits}</td>
                              <td className="px-4 py-3 text-right text-blue-300">${avg3Month.avgBal?.toLocaleString() ?? 'N/A'}</td>
                            </tr>
                          )}
                          {last6Months.length >= 6 && (
                            <tr className="bg-purple-500/10 border-t border-purple-500/30 font-semibold">
                              <td className="px-4 py-3 text-gray-400 text-xs" colSpan={2}>Last 6 Month Average</td>
                              <td className="px-4 py-3 text-right text-green-300">${avg6Month.credits?.toLocaleString() ?? 'N/A'}</td>
                              <td className="px-4 py-3 text-right text-red-300">${avg6Month.debits?.toLocaleString() ?? 'N/A'}</td>
                              <td className="px-4 py-3 text-center text-white">{avg6Month.nsfs}</td>
                              <td className="px-4 py-3 text-center text-orange-300">{avg6Month.negativeDays}</td>
                              <td className="px-4 py-3 text-center text-white">{avg6Month.deposits}</td>
                              <td className="px-4 py-3 text-right text-blue-300">${avg6Month.avgBal?.toLocaleString() ?? 'N/A'}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Lending Guru Agent - Lender Recommendations */}
              {lenderRecommendations.length > 0 && (
                <div className="border border-gray-800 rounded-lg bg-gray-800/40 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-indigo-400" />
                      <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Lender Recommendations</h4>
                      {lenderMatchSummary && (
                        <span className="text-xs text-gray-400">
                          {lenderMatchSummary.hugecapitalLenders} Huge Capital, {lenderMatchSummary.ifsLenders} IFS
                        </span>
                      )}
                    </div>
                    {lenderMatchSummary?.topChoice && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                        <Star className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs font-medium text-green-300">Top: {lenderMatchSummary.topChoice}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    {lenderRecommendations.slice(0, 5).map((lender, index) => {
                      const isSelected = selectedLenders.has(lender.lenderId);
                      const probabilityColors = {
                        very_high: 'text-green-400 bg-green-500/20 border-green-500/30',
                        high: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
                        medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
                        low: 'text-red-400 bg-red-500/20 border-red-500/30',
                      };
                      const scoreColor = lender.matchScore >= 80 ? 'text-green-400' : lender.matchScore >= 60 ? 'text-yellow-400' : 'text-red-400';

                      return (
                        <div
                          key={lender.lenderId}
                          className={`border rounded-lg p-4 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-500/50 bg-indigo-500/10'
                              : 'border-gray-700/40 bg-gray-900/30 hover:border-gray-600/50'
                          }`}
                          onClick={() => {
                            setSelectedLenders((prev) => {
                              const next = new Set(prev);
                              if (next.has(lender.lenderId)) {
                                next.delete(lender.lenderId);
                              } else {
                                next.add(lender.lenderId);
                              }
                              return next;
                            });
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? 'bg-yellow-500/30 text-yellow-300' : 'bg-gray-700/50 text-gray-400'
                                }`}>
                                  {index + 1}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                  <span className="font-semibold text-white">{lender.lenderName}</span>
                                  {lender.isIfs && (
                                    <span className="text-xs px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded">IFS</span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-400 leading-relaxed mb-3">{lender.reasoning}</p>

                              {lender.redFlags && lender.redFlags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {lender.redFlags.map((flag, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded">
                                      {flag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {lender.approvalCriteria && lender.approvalCriteria.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {lender.approvalCriteria.slice(0, 3).map((criteria, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded">
                                      {criteria}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className={`text-2xl font-bold ${scoreColor}`}>
                                {lender.matchScore}
                              </div>
                              <span className={`text-xs px-2 py-1 border rounded-full ${probabilityColors[lender.approvalProbability]}`}>
                                {lender.approvalProbability.replace('_', ' ')}
                              </span>
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'
                              }`}>
                                {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {lenderMatchSummary?.nextSteps && lenderMatchSummary.nextSteps.length > 0 && (
                    <div className="px-5 py-3 bg-gray-900/50 border-t border-gray-700/30">
                      <p className="text-xs font-medium text-gray-400 mb-2">Next Steps:</p>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {lenderMatchSummary.nextSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {lenderRecommendations.length === 0 && stages.find(s => s.key === 'lenderOptions')?.status === 'error' && (
                <div className="border border-yellow-500/40 bg-yellow-500/10 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-200">Lender matching unavailable</p>
                      <p className="text-xs text-yellow-300/80 mt-1">
                        The Lending Guru Agent could not generate recommendations. You can still view this deal and manually select lenders from the Deal Details page.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(() => {
                const CRITICAL_WARNING_PATTERNS = [
                  /failed to/i,
                  /error/i,
                  /missing required/i,
                  /invalid/i,
                  /could not (find|extract|parse)/i,
                  /unable to/i,
                ];

                const criticalWarnings = globalWarnings.filter(warning => {
                  if (CRITICAL_WARNING_PATTERNS.some(pattern => pattern.test(warning))) {
                    return true;
                  }
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

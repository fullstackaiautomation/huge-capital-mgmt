/**
 * New Deal Modal Component
 * Multi-step workflow: Upload Documents → AI Parse → Review Extracted Data → Save
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import { supabase } from '../../lib/supabase';
import type { ExtractedDealData } from '../../types/deals';

interface NewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type WorkflowStep = 'upload' | 'parsing' | 'review' | 'success' | 'error';

export default function NewDealModal({ isOpen, onClose, onSuccess }: NewDealModalProps) {
  const [step, setStep] = useState<WorkflowStep>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; category: 'application' | 'statements' }[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedDealData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsingProgress, setParsingProgress] = useState('');
  const [parseLogId, setParseLogId] = useState<string | null>(null);
  const [matchLogId, setMatchLogId] = useState<string | null>(null);
  const [matchWarning, setMatchWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFilesReady = (files: { file: File; category: 'application' | 'statements' }[]) => {
    setUploadedFiles(files);
    setExtractedData(null);
    setParseLogId(null);
    setMatchLogId(null);
    setMatchWarning(null);
  };

  const handleStartParsing = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStep('parsing');
      setParsingProgress('Uploading documents...');
      setParseLogId(null);
      setMatchLogId(null);
      setMatchWarning(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Convert files to base64 for edge function processing
      const fileData: Array<{ name: string; content: string; type: string; category: string }> = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const { file, category } = uploadedFiles[i];
        setParsingProgress(`Reading file ${i + 1} of ${uploadedFiles.length}...`);

        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
              // Extract base64 content (remove data:*;base64, prefix)
              const base64 = result.split(',')[1] || result;
              resolve(base64);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        fileData.push({
          name: file.name,
          content,
          type: file.type,
          category, // Include category so AI knows what type of document this is
        });
      }

      // Call parse-deal-documents edge function with base64 file data
      setParsingProgress('AI is analyzing documents...');

      const { data: parseResult, error: parseError } = await supabase.functions.invoke(
        'parse-deal-documents',
        {
          body: {
            files: fileData,
          },
        }
      );

      if (parseError) throw parseError;
      if (!parseResult) throw new Error('No data returned from parsing function');

      setParseLogId(parseResult.logId ?? null);
      setExtractedData(parseResult);
      setStep('review');
    } catch (err) {
      console.error('Error parsing documents:', err);
      setParseLogId(null);
      setError(err instanceof Error ? err.message : 'Failed to parse documents');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!extractedData) return;

    try {
      setIsLoading(true);
      setError(null);
      setMatchLogId(null);
      setMatchWarning(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Create deal from extracted data
      const legalBusinessName = extractedData.deal.legal_business_name || 'Unknown Business';
      const einValue = extractedData.deal.ein || '000000000';
      const addressValue = extractedData.deal.address || 'Unknown';
      const cityValue = extractedData.deal.city || 'Unknown';
      const stateValue = extractedData.deal.state || 'NA';
      const zipValue = extractedData.deal.zip || '00000';
      const loanTypeValue = extractedData.deal.loan_type || 'MCA';

      const desiredLoanAmount = typeof extractedData.deal.desired_loan_amount === 'number'
        ? extractedData.deal.desired_loan_amount
        : (extractedData.deal.desired_loan_amount ? parseFloat(String(extractedData.deal.desired_loan_amount)) : 0);

      const averageMonthlySales = typeof extractedData.deal.average_monthly_sales === 'number'
        ? extractedData.deal.average_monthly_sales
        : (extractedData.deal.average_monthly_sales ? parseFloat(String(extractedData.deal.average_monthly_sales)) : null);

      const averageMonthlyCardSales = typeof extractedData.deal.average_monthly_card_sales === 'number'
        ? extractedData.deal.average_monthly_card_sales
        : (extractedData.deal.average_monthly_card_sales ? parseFloat(String(extractedData.deal.average_monthly_card_sales)) : null);

      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .insert({
          user_id: user.id,
          legal_business_name: legalBusinessName,
          dba_name: extractedData.deal.dba_name || null,
          ein: einValue,
          business_type: extractedData.deal.business_type || null,
          address: addressValue,
          city: cityValue,
          state: stateValue,
          zip: zipValue,
          phone: extractedData.deal.phone || null,
          website: extractedData.deal.website || null,
          franchise_business: extractedData.deal.franchise_business || false,
          seasonal_business: extractedData.deal.seasonal_business || false,
          peak_sales_month: extractedData.deal.peak_sales_month || null,
          business_start_date: extractedData.deal.business_start_date || null,
          time_in_business_months: extractedData.deal.business_start_date
            ? Math.round(
                (new Date().getTime() - new Date(extractedData.deal.business_start_date).getTime()) /
                  (1000 * 60 * 60 * 24 * 30)
              )
            : null,
          product_service_sold: extractedData.deal.product_service_sold || null,
          franchise_units_percent: extractedData.deal.franchise_units_percent || null,
          average_monthly_sales: averageMonthlySales,
          average_monthly_card_sales: averageMonthlyCardSales,
          desired_loan_amount: Number.isNaN(desiredLoanAmount) ? 0 : desiredLoanAmount,
          reason_for_loan: extractedData.deal.reason_for_loan || null,
          loan_type: loanTypeValue,
          application_google_drive_link: extractedData.documentsFolder?.webViewLink ?? null,
          statements_google_drive_link: extractedData.documentsFolder?.webViewLink ?? null,
          status: 'New',
        })
        .select()
        .single();

      if (dealError) {
        console.error('Supabase deal insert failed:', dealError);
        throw dealError;
      }

      const createdStatementIds: string[] = [];

      // Create deal owners (skip empty owners)
      for (const owner of extractedData.owners) {
        // Skip owners with no name (they're empty)
        if (!owner.full_name || owner.full_name.trim() === '') {
          continue;
        }

        if (!owner.street_address || !owner.city || !owner.state || !owner.zip) {
          console.warn('Skipping owner with incomplete address information:', owner.full_name);
          continue;
        }

        const { error: ownerError } = await supabase.from('deal_owners').insert({
          deal_id: dealData.id,
          owner_number: owner.owner_number,
          full_name: owner.full_name,
          street_address: owner.street_address,
          city: owner.city,
          state: owner.state,
          zip: owner.zip,
          phone: owner.phone || null,
          email: owner.email,
          ownership_percent: typeof owner.ownership_percent === 'number'
            ? owner.ownership_percent
            : (owner.ownership_percent ? parseFloat(String(owner.ownership_percent)) : null),
          drivers_license_number: owner.drivers_license_number || null,
          date_of_birth: owner.date_of_birth || null,
          ssn_encrypted: null, // TODO: Implement SSN encryption
        });

        if (ownerError) {
          console.error('Supabase owner insert failed:', ownerError);
          throw ownerError;
        }
      }

      // Create deal bank statements if available
      if (extractedData.statements && extractedData.statements.length > 0) {
        for (let i = 0; i < extractedData.statements.length; i++) {
          const statement = extractedData.statements[i];
          const bankName = statement.bank_name || 'Unknown Bank';
          const statementMonth = statement.statement_month || 'Unknown';
          const statementIdentifier = statement.statement_id
            || (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : `${dealData.id}-statement-${i}`);

          const { data: stmtData, error: stmtError } = await supabase
            .from('deal_bank_statements')
            .insert({
            deal_id: dealData.id,
              bank_name: bankName,
              statement_month: statementMonth,
            credits: statement.credits,
            debits: statement.debits,
            nsfs: statement.nsfs || 0,
            overdrafts: statement.overdrafts || 0,
            average_daily_balance: statement.average_daily_balance,
              deposit_count: statement.deposit_count,
              statement_id: statementIdentifier,
              statement_file_url: statement.statement_file_url
                || extractedData.documentsFolder?.webViewLink
                || null,
            })
            .select('id')
            .single();

          if (stmtError) {
            console.error('Supabase bank statement insert failed:', stmtError);
            throw stmtError;
          }
          if (stmtData?.id) {
            createdStatementIds.push(stmtData.id);
          }
        }
      }

      // Create deal funding positions if available
      if (
        extractedData.fundingPositions &&
        extractedData.fundingPositions.length > 0 &&
        createdStatementIds.length > 0
      ) {
        for (let i = 0; i < extractedData.fundingPositions.length; i++) {
          const funding = extractedData.fundingPositions[i];
          const targetStatementId = createdStatementIds[Math.min(i, createdStatementIds.length - 1)];

          const fundingAmount = typeof funding.amount === 'number'
            ? funding.amount
            : (funding.amount ? parseFloat(String(funding.amount)) : 0);

          const { error: fundError } = await supabase.from('deal_funding_positions').insert({
            statement_id: targetStatementId,
            lender_name: funding.lender_name,
            amount: Number.isNaN(fundingAmount) ? 0 : fundingAmount,
            frequency: funding.frequency,
            detected_dates: funding.detected_dates ?? [],
          });

          if (fundError) {
            console.error('Supabase funding position insert failed:', fundError);
            throw fundError;
          }
        }
      } else if (extractedData.fundingPositions && extractedData.fundingPositions.length > 0) {
        console.warn('Skipping funding positions insert: no bank statements created to attach positions.');
      }

      // Automatically get lender recommendations using Lending Expert Agent
      setParsingProgress('Getting lender recommendations...');
      try {
        const { data: recommendations, error: recError } = await supabase.functions.invoke(
          'match-deal-to-lenders',
          {
            body: {
              dealId: dealData.id,
              deal: extractedData,
              loanType: extractedData.deal.loan_type,
              brokerPreferences: {},
            },
          }
        );

        if (recError) {
          console.error('Error getting recommendations:', recError);
          setMatchWarning('Lender recommendations are temporarily unavailable. The deal was saved successfully.');
        } else if (recommendations) {
          setMatchLogId(recommendations.logId ?? null);

          if (Array.isArray(recommendations.recommendations) && recommendations.recommendations.length > 0) {
            const { error: updateError } = await supabase
              .from('deals')
              .update({ status: 'Matched' })
              .eq('id', dealData.id);

            if (updateError) {
              console.error('Error updating deal status:', updateError);
            }
          }
        }
      } catch (invokeError) {
        console.error('Failed to invoke match-deal-to-lenders:', invokeError);
        setMatchWarning('Lender recommendations could not be generated. The deal was saved successfully.');
      }

      setStep('success');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      console.error('Error saving deal:', err);
      setError(err instanceof Error ? err.message : 'Failed to save deal');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between bg-gray-800 border-b border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white">
            {step === 'upload' && 'Upload Deal Documents'}
            {step === 'parsing' && 'Analyzing Documents'}
            {step === 'review' && 'Review Extracted Data'}
            {step === 'success' && 'Deal Created'}
            {step === 'error' && 'Error'}
          </h2>
          {step !== 'success' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <DocumentUpload onFilesReady={handleFilesReady} />
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
              <button
                onClick={handleStartParsing}
                disabled={uploadedFiles.length === 0 || isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-2"
              >
                {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Processing...' : 'Continue to Analysis'}
              </button>
            </div>
          )}

          {/* Parsing Step */}
          {step === 'parsing' && (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Analyzing Documents</h3>
              <p className="text-gray-400">{parsingProgress}</p>
              <p className="text-sm text-gray-500 mt-4">This may take a moment...</p>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && extractedData && (
            <div className="space-y-6">
              {/* Confidence Score */}
              {extractedData.confidence && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                  <p className="text-sm text-indigo-300">
                    AI Confidence: <span className="font-semibold">{Math.min(100, Math.round(extractedData.confidence.deal))}%</span>
                  </p>
                </div>
              )}

              {parseLogId && (
                <div className="bg-gray-900/50 border border-gray-700/40 rounded-lg p-3 text-xs text-gray-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span>
                    Parse log ID: <span className="font-mono text-gray-100">{parseLogId}</span>
                  </span>
                  <Link to="/agent-logs" className="text-indigo-300 hover:text-indigo-200 font-medium">
                    Open Agent Logs
                  </Link>
                </div>
              )}

              {extractedData.documentsFolder && (
                <div className="bg-gray-900/40 border border-gray-700/40 rounded-lg p-4 space-y-2 text-sm text-gray-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="font-semibold text-white">Documents uploaded to Drive</p>
                    <a
                      href={extractedData.documentsFolder.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-300 hover:text-indigo-200 font-medium"
                    >
                      Open folder
                    </a>
                  </div>
                  {(extractedData.documentsFolder?.files?.length ?? 0) > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-xs text-gray-400">
                      {extractedData.documentsFolder?.files?.map((file) => (
                        <li key={file.id}>
                          <span className="text-gray-300">{file.name}</span>
                          <span className="text-gray-500"> • {file.mimeType}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">No files were stored for this upload.</p>
                  )}
                </div>
              )}

              {/* Warnings */}
              {extractedData.warnings && extractedData.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 space-y-1">
                  <p className="text-sm text-yellow-300 font-semibold">Warnings:</p>
                  {extractedData.warnings.map((warning, i) => (
                    <p key={i} className="text-sm text-yellow-300/80">{warning}</p>
                  ))}
                </div>
              )}

              {/* Missing Fields */}
              {extractedData.missingFields && extractedData.missingFields.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 space-y-1">
                  <p className="text-sm text-orange-300 font-semibold">Missing Fields (Please fill manually):</p>
                  {extractedData.missingFields.map((field, i) => (
                    <p key={i} className="text-sm text-orange-300/80">{field}</p>
                  ))}
                </div>
              )}

              {/* Deal Summary */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Deal Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-800/30 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Business Name</p>
                    <p className="text-white font-medium">{extractedData.deal.legal_business_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">EIN</p>
                    <p className="text-white font-medium">{extractedData.deal.ein || 'Not extracted'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Loan Type</p>
                    <p className="text-white font-medium">{extractedData.deal.loan_type || 'Not extracted'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Loan Amount</p>
                    <p className="text-white font-medium">
                      ${extractedData.deal.desired_loan_amount ? parseFloat(extractedData.deal.desired_loan_amount).toLocaleString() : 'Not extracted'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Address</p>
                    <p className="text-white font-medium text-sm">{extractedData.deal.address || 'Not extracted'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Monthly Sales</p>
                    <p className="text-white font-medium">
                      ${extractedData.deal.average_monthly_sales ? parseFloat(extractedData.deal.average_monthly_sales).toLocaleString() : 'Not extracted'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Owners */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Business Owners ({extractedData.owners.length})</h3>
                <div className="space-y-3">
                  {extractedData.owners.map((owner, i) => (
                    <div key={i} className="bg-gray-800/30 rounded-lg p-3">
                      <p className="text-white font-medium">{owner.full_name}</p>
                      <p className="text-sm text-gray-400">{owner.email || 'No email'}</p>
                      <p className="text-xs text-gray-500 mt-1">{owner.ownership_percent ? `${owner.ownership_percent}% ownership` : 'Ownership % not specified'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('upload')}
                  disabled={isLoading}
                  className="flex-1 bg-gray-700/30 hover:bg-gray-700/50 disabled:opacity-50 text-gray-300 px-4 py-2 rounded-lg transition-all"
                >
                  Back to Upload
                </button>
                <button
                  onClick={handleConfirmAndSave}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Saving...' : 'Confirm & Save Deal'}
                </button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Deal Created Successfully!</h3>
              <p className="text-gray-400">Your deal has been saved and is ready for lender matching.</p>
              {extractedData?.documentsFolder && (
                <div className="mt-4 bg-gray-900/60 border border-gray-700/40 rounded-lg px-4 py-3 text-sm text-gray-200">
                  <p className="font-medium text-white">Documents stored in Google Drive</p>
                  <a
                    href={extractedData.documentsFolder.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-300 hover:text-indigo-200"
                  >
                    Open folder
                  </a>
                </div>
              )}
              {(parseLogId || matchLogId) && (
                <div className="mt-6 bg-gray-900/60 border border-gray-700/40 rounded-lg px-4 py-3 text-sm text-gray-200 space-y-2 text-left">
                  {parseLogId && (
                    <div className="flex items-center justify-between gap-2">
                      <span>Document parse log ID:</span>
                      <span className="font-mono text-gray-100">{parseLogId}</span>
                    </div>
                  )}
                  {matchLogId && (
                    <div className="flex items-center justify-between gap-2">
                      <span>Lender match log ID:</span>
                      <span className="font-mono text-gray-100">{matchLogId}</span>
                    </div>
                  )}
                  <div className="text-right">
                    <Link to="/agent-logs" className="text-indigo-300 hover:text-indigo-200 font-medium">
                      Review in Agent Logs
                    </Link>
                  </div>
                </div>
              )}
              {matchWarning && (
                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 text-sm text-yellow-200">
                  {matchWarning}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-4">Closing in a moment...</p>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-400 font-semibold">Error Saving Deal</h3>
                  <p className="text-red-300 text-sm mt-1">{error}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('review')}
                  className="flex-1 bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 px-4 py-2 rounded-lg transition-all"
                >
                  Back to Review
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

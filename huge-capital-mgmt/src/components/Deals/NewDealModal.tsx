/**
 * New Deal Modal Component
 * Multi-step workflow: Upload Documents → AI Parse → Review Extracted Data → Save
 */

import { useState } from 'react';
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedDealData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsingProgress, setParsingProgress] = useState('');

  if (!isOpen) return null;

  const handleFilesReady = (files: File[]) => {
    setUploadedFiles(files);
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

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Upload files to Supabase Storage
      const fileUrls: string[] = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${i}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        setParsingProgress(`Uploading file ${i + 1} of ${uploadedFiles.length}...`);

        const { error: uploadError } = await supabase.storage
          .from('deal-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('deal-documents')
          .getPublicUrl(filePath);

        fileUrls.push(urlData.publicUrl);
      }

      // Call parse-deal-documents edge function
      setParsingProgress('AI is analyzing documents...');

      const { data: parseResult, error: parseError } = await supabase.functions.invoke(
        'parse-deal-documents',
        {
          body: {
            fileUrls,
          },
        }
      );

      if (parseError) throw parseError;
      if (!parseResult) throw new Error('No data returned from parsing function');

      setExtractedData(parseResult);
      setStep('review');
    } catch (err) {
      console.error('Error parsing documents:', err);
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

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Create deal from extracted data
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .insert({
          user_id: user.id,
          legal_business_name: extractedData.deal.legal_business_name,
          dba_name: extractedData.deal.dba_name || null,
          ein: extractedData.deal.ein,
          business_type: extractedData.deal.business_type || null,
          address: extractedData.deal.address,
          city: extractedData.deal.city,
          state: extractedData.deal.state,
          zip: extractedData.deal.zip,
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
          average_monthly_sales: extractedData.deal.average_monthly_sales ? parseFloat(extractedData.deal.average_monthly_sales) : 0,
          average_monthly_card_sales: extractedData.deal.average_monthly_card_sales ? parseFloat(extractedData.deal.average_monthly_card_sales) : 0,
          desired_loan_amount: extractedData.deal.desired_loan_amount ? parseFloat(extractedData.deal.desired_loan_amount) : 0,
          reason_for_loan: extractedData.deal.reason_for_loan || null,
          loan_type: extractedData.deal.loan_type,
          status: 'New',
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // Create deal owners
      for (const owner of extractedData.owners) {
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
          ownership_percent: owner.ownership_percent ? parseFloat(owner.ownership_percent) : null,
          drivers_license_number: owner.drivers_license_number || null,
          date_of_birth: owner.date_of_birth || null,
          ssn_encrypted: null, // TODO: Implement SSN encryption
        });

        if (ownerError) throw ownerError;
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
                    AI Confidence: <span className="font-semibold">{Math.round(extractedData.confidence.deal * 100)}%</span>
                  </p>
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

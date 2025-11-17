/**
 * Deal Submission Service
 * Orchestrates the complete deal submission workflow
 */

import { supabase } from '../lib/supabase';
import type { ExtractedDealData, DealFormData, OwnerFormData, DealBankStatement, DealFundingPosition, LoanType } from '../types/deals';

export interface DealSubmissionProgress {
  step: number;
  total: number;
  message: string;
  percentage: number;
}

export interface DealSubmissionResult {
  success: boolean;
  dealId?: string;
  error?: string;
  extractedData?: ExtractedDealData;
}

export interface UploadedFile {
  file: File;
  url?: string;
  uploaded: boolean;
}

/**
 * Step 1: Upload documents to Google Drive via edge function
 */
export async function uploadDocumentsToGoogleDrive(
  files: File[],
  businessName: string,
  onProgress?: (progress: DealSubmissionProgress) => void
): Promise<{ folderId: string; folderUrl: string; files: any[] }> {
  try {
    onProgress?.({
      step: 1,
      total: 7,
      message: 'Uploading documents to Google Drive...',
      percentage: 14,
    });

    // Create FormData with files
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('businessName', businessName);
    formData.append('date', new Date().toISOString().split('T')[0]);

    // Call edge function to handle Drive upload
    const { data, error } = await supabase.functions.invoke('upload-deal-documents', {
      body: formData,
    });

    if (error) throw error;

    return {
      folderId: data.folderId,
      folderUrl: data.folderUrl,
      files: data.files,
    };
  } catch (error) {
    console.error('Error uploading documents to Google Drive:', error);
    throw new Error('Failed to upload documents to Google Drive');
  }
}

/**
 * Step 2: Parse application document
 */
export async function parseApplicationDocument(
  applicationFileUrl: string,
  onProgress?: (progress: DealSubmissionProgress) => void
): Promise<{ businessInfo: Partial<DealFormData>; owners: Partial<OwnerFormData>[]; confidence: number }> {
  try {
    onProgress?.({
      step: 2,
      total: 7,
      message: 'Analyzing application document...',
      percentage: 28,
    });

    const { data, error } = await supabase.functions.invoke('parse-application', {
      body: { applicationFileUrl, fileType: 'pdf' },
    });

    if (error) throw error;

    return {
      businessInfo: data.businessInfo,
      owners: data.owners,
      confidence: data.confidence,
    };
  } catch (error) {
    console.error('Error parsing application:', error);
    throw new Error('Failed to parse application document');
  }
}

/**
 * Step 3: Parse bank statement documents
 */
export async function parseBankStatements(
  statementFileUrls: string[],
  onProgress?: (progress: DealSubmissionProgress) => void
): Promise<{
  statements: Partial<DealBankStatement>[];
  fundingPositions: Partial<DealFundingPosition>[];
  threeMonthAverages: any;
  confidence: number;
  warnings: string[];
}> {
  try {
    onProgress?.({
      step: 3,
      total: 7,
      message: 'Analyzing bank statements...',
      percentage: 42,
    });

    const { data, error } = await supabase.functions.invoke('parse-bank-statements', {
      body: { statementFileUrls },
    });

    if (error) throw error;

    return {
      statements: data.statements,
      fundingPositions: data.fundingPositions,
      threeMonthAverages: data.threeMonthAverages,
      confidence: data.confidence,
      warnings: data.warnings || [],
    };
  } catch (error) {
    console.error('Error parsing bank statements:', error);
    throw new Error('Failed to parse bank statements');
  }
}

/**
 * Step 4: Create complete deal record in database
 */
export async function createDealRecord(
  userId: string,
  businessInfo: Partial<DealFormData>,
  owners: Partial<OwnerFormData>[],
  statements: Partial<DealBankStatement>[],
  fundingPositions: Partial<DealFundingPosition>[],
  documentsFolder: { folderId: string; folderUrl: string },
  onProgress?: (progress: DealSubmissionProgress) => void
): Promise<{ dealId: string; status: string }> {
  try {
    onProgress?.({
      step: 4,
      total: 7,
      message: 'Creating deal record...',
      percentage: 56,
    });

    // Calculate time in business from start date
    let timeInBusinessMonths = null;
    if (businessInfo.business_start_date) {
      const startDate = new Date(businessInfo.business_start_date);
      const now = new Date();
      const months = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
      timeInBusinessMonths = months;
    }

    // Insert main deal record
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        user_id: userId,
        legal_business_name: businessInfo.legal_business_name,
        dba_name: businessInfo.dba_name || null,
        ein: businessInfo.ein,
        business_type: businessInfo.business_type || null,
        address: businessInfo.address,
        city: businessInfo.city,
        state: businessInfo.state,
        zip: businessInfo.zip,
        phone: businessInfo.phone || null,
        website: businessInfo.website || null,
        franchise_business: businessInfo.franchise_business || false,
        seasonal_business: businessInfo.seasonal_business || false,
        peak_sales_month: businessInfo.peak_sales_month || null,
        business_start_date: businessInfo.business_start_date || null,
        time_in_business_months: timeInBusinessMonths,
        product_service_sold: businessInfo.product_service_sold || null,
        franchise_units: businessInfo.franchise_units ? parseInt(businessInfo.franchise_units) : null,
        average_monthly_sales: businessInfo.average_monthly_sales ? parseFloat(businessInfo.average_monthly_sales) : null,
        average_monthly_card_sales: businessInfo.average_monthly_card_sales ? parseFloat(businessInfo.average_monthly_card_sales) : null,
        desired_loan_amount: businessInfo.desired_loan_amount ? parseFloat(businessInfo.desired_loan_amount) : 0,
        reason_for_loan: businessInfo.reason_for_loan || null,
        loan_type: businessInfo.loan_type || 'MCA',
        status: 'New',
        application_google_drive_link: documentsFolder.folderUrl,
        statements_google_drive_link: documentsFolder.folderUrl,
      })
      .select()
      .single();

    if (dealError) throw dealError;
    if (!deal) throw new Error('Failed to create deal record');

    // Insert owners
    if (owners.length > 0) {
      const ownersData = owners.map((owner) => ({
        deal_id: deal.id,
        owner_number: owner.owner_number || 1,
        full_name: owner.full_name,
        street_address: owner.street_address,
        city: owner.city,
        state: owner.state,
        zip: owner.zip,
        phone: owner.phone || null,
        email: owner.email || null,
        ownership_percent: owner.ownership_percent ? parseFloat(owner.ownership_percent) : null,
        drivers_license_number: owner.drivers_license_number || null,
        date_of_birth: owner.date_of_birth || null,
        // Note: SSN encryption should be handled here
        ssn_encrypted: null, // TODO: Implement encryption
      }));

      const { error: ownersError } = await supabase.from('deal_owners').insert(ownersData);
      if (ownersError) throw ownersError;
    }

    // Insert bank statements
    if (statements.length > 0) {
      const statementsData = statements.map((stmt) => ({
        deal_id: deal.id,
        statement_id: stmt.statement_id,
        bank_name: stmt.bank_name,
        statement_month: stmt.statement_month,
        statement_file_url: stmt.statement_file_url || null,
        credits: stmt.credits,
        debits: stmt.debits,
        nsfs: stmt.nsfs || 0,
        overdrafts: stmt.overdrafts || 0,
        average_daily_balance: stmt.average_daily_balance,
        deposit_count: stmt.deposit_count,
      }));

      const { data: insertedStatements, error: statementsError } = await supabase
        .from('deal_bank_statements')
        .insert(statementsData)
        .select();

      if (statementsError) throw statementsError;

      // Insert funding positions if any
      if (fundingPositions.length > 0 && insertedStatements) {
        const positionsData = fundingPositions.map((pos) => ({
          statement_id: insertedStatements[0].id, // Associate with first statement for now
          lender_name: pos.lender_name,
          amount: pos.amount,
          frequency: pos.frequency || 'daily',
          detected_dates: pos.detected_dates || [],
        }));

        const { error: positionsError } = await supabase.from('deal_funding_positions').insert(positionsData);
        if (positionsError) throw positionsError;
      }
    }

    return {
      dealId: deal.id,
      status: deal.status,
    };
  } catch (error) {
    console.error('Error creating deal record:', error);
    throw new Error('Failed to create deal record in database');
  }
}

/**
 * Step 7: Update final deal status
 */
export async function updateDealStatus(
  dealId: string,
  status: string,
  onProgress?: (progress: DealSubmissionProgress) => void
): Promise<void> {
  try {
    onProgress?.({
      step: 7,
      total: 7,
      message: 'Finalizing deal record...',
      percentage: 100,
    });

    const { error } = await supabase
      .from('deals')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating deal status:', error);
    throw new Error('Failed to update deal status');
  }
}

/**
 * Main orchestrator function - runs all steps in sequence
 */
export async function submitDeal(
  files: File[],
  userId: string,
  loanType: LoanType,
  onProgress?: (progress: DealSubmissionProgress) => void
): Promise<DealSubmissionResult> {
  try {
    // Validate input
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    // Identify file types
    const statementFiles = files.filter(f =>
      f.name.toLowerCase().includes('statement') ||
      f.name.toLowerCase().includes('bank')
    );

    if (statementFiles.length < 2) {
      throw new Error('At least 2 bank statements are required');
    }

    // Step 1: Upload to Google Drive (placeholder - needs edge function)
    const businessName = 'Pending'; // Will be extracted from application
    const driveResult = await uploadDocumentsToGoogleDrive(files, businessName, onProgress);

    // Get file URLs from Drive
    const applicationFileUrl = driveResult.files[0]?.webViewLink || '';
    const statementFileUrls = driveResult.files.slice(1).map(f => f.webViewLink);

    // Steps 2 & 3: Parse application and bank statements in parallel
    const [appResult, bankResult] = await Promise.all([
      parseApplicationDocument(applicationFileUrl, onProgress),
      parseBankStatements(statementFileUrls, onProgress),
    ]);

    // Check confidence scores
    if (appResult.confidence < 0.7 || bankResult.confidence < 0.7) {
      // Return extracted data for manual review
      return {
        success: false,
        error: 'Low confidence in document parsing. Manual review required.',
        extractedData: {
          deal: appResult.businessInfo,
          owners: appResult.owners,
          statements: bankResult.statements,
          fundingPositions: bankResult.fundingPositions,
          confidence: {
            deal: appResult.confidence,
            owners: appResult.owners.map(() => appResult.confidence),
            statements: bankResult.statements.map(() => bankResult.confidence),
          },
          missingFields: [],
          warnings: bankResult.warnings,
          documentsFolder: {
            id: driveResult.folderId,
            name: businessName,
            webViewLink: driveResult.folderUrl,
            files: driveResult.files,
          },
        },
      };
    }

    // Step 4: Create deal record
    const { dealId } = await createDealRecord(
      userId,
      { ...appResult.businessInfo, loan_type: loanType },
      appResult.owners,
      bankResult.statements,
      bankResult.fundingPositions,
      driveResult,
      onProgress
    );

    // Steps 5 & 6: Future - Lender matching and submission prep
    onProgress?.({
      step: 5,
      total: 7,
      message: 'Lender recommendations (coming soon)...',
      percentage: 70,
    });

    onProgress?.({
      step: 6,
      total: 7,
      message: 'Submission preparation (coming soon)...',
      percentage: 85,
    });

    // Step 7: Final status update
    await updateDealStatus(dealId, 'Ready for Matching', onProgress);

    return {
      success: true,
      dealId,
    };
  } catch (error) {
    console.error('Deal submission failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

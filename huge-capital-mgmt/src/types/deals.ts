// Deal and related types for the deals pipeline feature

export type DealStatus = 'New' | 'Analyzing' | 'Matched' | 'Submitted' | 'Pending' | 'Approved' | 'Funded' | 'Declined';
export type LoanType = 'MCA' | 'Business LOC';
export type SubmissionStatus = 'Not Started' | 'Prepared' | 'Submitted' | 'Pending' | 'Approved' | 'Declined';
export type PaymentFrequency = 'daily' | 'weekly' | 'monthly';

export interface Deal {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  broker_email?: string; // Email of the broker who submitted (from auth.users)
  broker_name?: string; // Name of the broker (from auth.users metadata)

  // Business Information
  legal_business_name: string;
  dba_name: string | null;
  ein: string;
  business_type: string | null;

  // Address Information
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  website: string | null;

  // Business Details
  franchise_business: boolean;
  seasonal_business: boolean;
  peak_sales_month: string | null;
  business_start_date: string | null;
  time_in_business_months: number | null;

  // Products & Services
  product_service_sold: string | null;
  franchise_units: number | null; // Count of franchise units owned (integer)

  // Financial Information
  average_monthly_sales: number | null; // Midpoint of range (calculated)
  average_monthly_sales_low: number | null; // Lower bound of range
  average_monthly_sales_high: number | null; // Upper bound of range
  average_monthly_card_sales: number | null;
  desired_loan_amount: number;
  reason_for_loan: string | null;

  // Deal Classification
  loan_type: LoanType;
  status: DealStatus;

  // Document Links
  application_google_drive_link: string | null;
  statements_google_drive_link: string | null;

  // Metadata
  submission_date: string | null;
}

export interface DealOwner {
  id: string;
  deal_id: string;
  owner_number: 1 | 2;

  // Personal Information
  full_name: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  email: string | null;

  // Ownership Details
  ownership_percent: number | null;

  // Sensitive Information
  drivers_license_number: string | null;
  date_of_birth: string | null;
  ssn_encrypted: string | null;

  created_at: string;
  updated_at: string;
}

export interface DealBankStatement {
  id: string;
  deal_id: string;

  // Statement Information
  statement_id: string;
  bank_name: string;
  statement_month: string;
  statement_file_url: string | null;

  // Financial Metrics
  credits: number | null;
  debits: number | null;
  nsfs: number;
  overdrafts: number;
  average_daily_balance: number | null;
  deposit_count: number | null;

  created_at: string;
  updated_at: string;
}

export interface DealFundingPosition {
  id: string;
  statement_id: string;

  // Lender Information
  lender_name: string;
  amount: number;
  frequency: PaymentFrequency;

  // Detection Data
  detected_dates: string[];

  created_at: string;
  updated_at: string;
}

export interface DealLenderMatch {
  id: string;
  deal_id: string;

  // Lender Information
  lender_table: 'lenders_mca' | 'lenders_business_line_of_credit';
  lender_id: string;
  lender_name: string;

  // Match Information
  match_score: number;
  match_reasoning: string | null;

  // Submission Tracking
  selected_by_broker: boolean;
  submission_status: SubmissionStatus;
  submission_date: string | null;
  response_date: string | null;
  lender_response: string | null;

  created_at: string;
  updated_at: string;
}

// Form data types for validation and processing
export interface DealFormData {
  legal_business_name: string;
  dba_name: string;
  ein: string;
  business_type: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  franchise_business: boolean;
  seasonal_business: boolean;
  peak_sales_month: string;
  business_start_date: string;
  product_service_sold: string;
  franchise_units: string;
  average_monthly_sales: string;
  average_monthly_card_sales: string;
  desired_loan_amount: string;
  reason_for_loan: string;
  loan_type: LoanType;
}

export interface OwnerFormData {
  owner_number: 1 | 2;
  full_name: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  ownership_percent: string;
  drivers_license_number: string;
  date_of_birth: string;
  ssn: string; // Not encrypted at form level
}

// AI-extracted data from documents
export interface ExtractedDealData {
  deal: Partial<DealFormData>;
  owners: Partial<OwnerFormData>[];
  statements: Partial<DealBankStatement>[];
  fundingPositions: Partial<DealFundingPosition>[];
  confidence: {
    deal: number;
    owners: number[];
    statements: number[];
  };
  missingFields: string[];
  warnings: string[];
  logId?: string;
  documentsFolder?: {
    id: string;
    name: string;
    webViewLink: string;
    files: Array<{
      id: string;
      name: string;
      mimeType: string;
      webViewLink: string;
    }>;
  };
}

// Lender match result
export interface LenderMatchResult {
  lender_id: string;
  lender_name: string;
  lender_table: 'lenders_mca' | 'lenders_business_line_of_credit';
  match_score: number;
  match_reasoning: string;
}

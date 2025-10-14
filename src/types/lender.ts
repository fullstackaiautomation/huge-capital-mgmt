// Lender Types
// Epic 2: Lenders Dashboard (LD-001)

// =====================================================
// ENUMS & CONSTANTS
// =====================================================

export type LenderCompanyType =
  | 'bank'
  | 'credit_union'
  | 'private_lender'
  | 'hard_money'
  | 'institutional'
  | 'other';

export type LenderStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'archived';

export type ProgramStatus =
  | 'active'
  | 'paused'
  | 'discontinued';

export type RateType =
  | 'fixed'
  | 'variable'
  | 'hybrid';

export type ContactMethod =
  | 'email'
  | 'phone'
  | 'mobile'
  | 'text';

export type CommunicationType =
  | 'email'
  | 'phone'
  | 'meeting'
  | 'text'
  | 'other';

export type CommunicationDirection =
  | 'outbound'
  | 'inbound';

export type ContactStatus =
  | 'active'
  | 'inactive';

// =====================================================
// MAIN INTERFACES
// =====================================================

export interface Lender {
  id: string;
  companyName: string;
  website?: string;
  companyType: LenderCompanyType;
  fundingType?: string; // Which sheet tab (SBA, Term Loans, etc)
  headquartersLocation?: string;
  geographicCoverage: string[];
  licenseNumbers?: Record<string, string>;
  status: LenderStatus;
  rating?: number; // 1-5 stars
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastSynced?: string;
}

export interface LenderProgram {
  id: string;
  lenderId: string;
  programName: string;
  loanTypes: string[];
  minLoanAmount?: number;
  maxLoanAmount?: number;
  minCreditScore?: number;
  minDscr?: number;
  maxLtv?: number;
  propertyTypes: string[];
  interestRateMin?: number;
  interestRateMax?: number;
  rateType: RateType;
  termMonths?: number;
  closingDays?: number;
  requirements?: Record<string, any>;
  specialFeatures: string[];
  status: ProgramStatus;
  effectiveDate?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LenderContact {
  id: string;
  lenderId: string;
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  preferredContactMethod?: ContactMethod;
  isPrimary: boolean;
  status: ContactStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LenderCommunication {
  id: string;
  lenderId: string;
  contactId?: string;
  communicationType: CommunicationType;
  subject?: string;
  summary: string;
  date: string;
  direction: CommunicationDirection;
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  createdBy?: string;
  createdAt: string;
}

export interface LenderPerformance {
  id: string;
  lenderId: string;
  totalDealsSubmitted: number;
  totalDealsApproved: number;
  totalDealsFunded: number;
  approvalRate?: number;
  averageApprovalDays?: number;
  averageClosingDays?: number;
  totalFundedAmount: number;
  lastDealDate?: string;
  lastUpdated: string;
}

// =====================================================
// EXTENDED INTERFACES
// =====================================================

export interface LenderWithDetails extends Lender {
  programs: LenderProgram[];
  contacts: LenderContact[];
  performance?: LenderPerformance;
  communicationCount: number;
  lastCommunication?: LenderCommunication;
}

// =====================================================
// DATABASE TRANSFORM TYPES
// =====================================================

// Database row types (snake_case from Supabase)
export interface LenderDB {
  id: string;
  company_name: string;
  website?: string;
  company_type: LenderCompanyType;
  funding_type?: string;
  headquarters_location?: string;
  geographic_coverage: string[];
  license_numbers?: Record<string, string>;
  status: LenderStatus;
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_synced?: string;
}

export interface LenderProgramDB {
  id: string;
  lender_id: string;
  program_name: string;
  loan_types: string[];
  min_loan_amount?: number;
  max_loan_amount?: number;
  min_credit_score?: number;
  min_dscr?: number;
  max_ltv?: number;
  property_types: string[];
  interest_rate_min?: number;
  interest_rate_max?: number;
  rate_type: RateType;
  term_months?: number;
  closing_days?: number;
  requirements?: Record<string, any>;
  special_features: string[];
  status: ProgramStatus;
  effective_date?: string;
  expiration_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LenderContactDB {
  id: string;
  lender_id: string;
  first_name: string;
  last_name: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  preferred_contact_method?: ContactMethod;
  is_primary: boolean;
  status: ContactStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LenderCommunicationDB {
  id: string;
  lender_id: string;
  contact_id?: string;
  communication_type: CommunicationType;
  subject?: string;
  summary: string;
  date: string;
  direction: CommunicationDirection;
  outcome?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  created_by?: string;
  created_at: string;
}

export interface LenderPerformanceDB {
  id: string;
  lender_id: string;
  total_deals_submitted: number;
  total_deals_approved: number;
  total_deals_funded: number;
  approval_rate?: number;
  average_approval_days?: number;
  average_closing_days?: number;
  total_funded_amount: number;
  last_deal_date?: string;
  last_updated: string;
}

// =====================================================
// FILTER & SEARCH TYPES
// =====================================================

export interface LenderFilters {
  search?: string;
  companyTypes?: LenderCompanyType[];
  status?: LenderStatus;
  minRating?: number;
  geographicCoverage?: string[];

  // Program-based filters
  loanAmount?: number;
  minCreditScore?: number;
  propertyType?: string;
  loanType?: string;
  maxLtv?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: LenderFilters;
  userId: string;
  createdAt: string;
}

// =====================================================
// FORM & UI TYPES
// =====================================================

export interface LenderFormData {
  companyName: string;
  website?: string;
  companyType: LenderCompanyType;
  headquartersLocation?: string;
  geographicCoverage: string[];
  status: LenderStatus;
  rating?: number;
  notes?: string;
  programs?: Omit<LenderProgram, 'id' | 'lenderId' | 'createdAt' | 'updatedAt'>[];
  contacts?: Omit<LenderContact, 'id' | 'lenderId' | 'createdAt' | 'updatedAt'>[];
}

export interface ProgramFormData {
  programName: string;
  loanTypes: string[];
  minLoanAmount?: number;
  maxLoanAmount?: number;
  minCreditScore?: number;
  minDscr?: number;
  maxLtv?: number;
  propertyTypes: string[];
  interestRateMin?: number;
  interestRateMax?: number;
  rateType: RateType;
  termMonths?: number;
  closingDays?: number;
  requirements?: Record<string, any>;
  specialFeatures: string[];
  status: ProgramStatus;
  effectiveDate?: string;
  expirationDate?: string;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  preferredContactMethod?: ContactMethod;
  isPrimary: boolean;
  notes?: string;
}

export interface CommunicationFormData {
  contactId?: string;
  communicationType: CommunicationType;
  subject?: string;
  summary: string;
  date: string;
  direction: CommunicationDirection;
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: string;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface LenderStats {
  totalLenders: number;
  activeLenders: number;
  totalPrograms: number;
  averageRating: number;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSynced?: string;
  recordsUpdated?: number;
  error?: string;
}

// =====================================================
// CONSTANTS
// =====================================================

export const COMPANY_TYPE_LABELS: Record<LenderCompanyType, string> = {
  bank: 'Bank',
  credit_union: 'Credit Union',
  private_lender: 'Private Lender',
  hard_money: 'Hard Money',
  institutional: 'Institutional',
  other: 'Other',
};

export const STATUS_LABELS: Record<LenderStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  archived: 'Archived',
};

export const STATUS_COLORS: Record<LenderStatus, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  pending: 'bg-yellow-500',
  archived: 'bg-gray-400',
};

export const PROGRAM_STATUS_COLORS: Record<ProgramStatus, string> = {
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  discontinued: 'bg-red-500',
};

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  fixed: 'Fixed',
  variable: 'Variable',
  hybrid: 'Hybrid',
};

export const COMMUNICATION_TYPE_ICONS: Record<CommunicationType, string> = {
  email: '📧',
  phone: '📞',
  meeting: '🤝',
  text: '💬',
  other: '📝',
};

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export const LOAN_TYPES = [
  'commercial',
  'residential',
  'bridge',
  'construction',
  'refinance',
  'purchase',
  'cash_out',
];

export const PROPERTY_TYPES = [
  'single_family',
  'multifamily',
  'commercial',
  'retail',
  'office',
  'industrial',
  'mixed_use',
  'land',
  'special_purpose',
];

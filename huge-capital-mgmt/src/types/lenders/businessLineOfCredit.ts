// Business Line of Credit Lender Types
export interface BusinessLineOfCreditLender {
  id: string;
  lender_name: string;
  bank_non_bank: 'Bank' | 'Non-Bank';
  website?: string;

  // Contact Info
  iso_contacts?: string;
  phone?: string;
  email?: string;

  // Requirements & Criteria
  credit_requirement?: number;
  credit_used?: string;
  min_time_in_business?: string;
  minimum_deposit_count?: number;
  min_monthly_revenue_amount?: string;
  min_avg_daily_balance?: string;

  // Product & Limits
  max_loan?: string;
  positions?: string;
  products_offered?: string;

  // Terms & Fees
  terms?: string;
  payments?: string;
  draw_fees?: string;

  // Industry Info
  preferred_industries?: string;
  restricted_industries?: string;
  ineligible_states?: string;

  // Submission Info
  submission_docs?: string;
  submission_type?: string;
  submission_process?: string;

  // Links & Documentation
  drive_link?: string;
  notes?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship: 'Huge Capital' | 'IFS';
}

export interface BusinessLineOfCreditLenderFormData {
  lender_name: string;
  bank_non_bank: 'Bank' | 'Non-Bank';
  website?: string;
  iso_contacts?: string;
  phone?: string;
  email?: string;
  credit_requirement?: number;
  credit_used?: string;
  min_time_in_business?: string;
  minimum_deposit_count?: number;
  min_monthly_revenue_amount?: string;
  min_avg_daily_balance?: string;
  max_loan?: string;
  positions?: string;
  products_offered?: string;
  terms?: string;
  payments?: string;
  draw_fees?: string;
  preferred_industries?: string;
  restricted_industries?: string;
  ineligible_states?: string;
  submission_docs?: string;
  submission_type?: string;
  submission_process?: string;
  drive_link?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship?: 'Huge Capital' | 'IFS';
}

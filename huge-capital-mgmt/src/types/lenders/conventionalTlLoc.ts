// Conventional Bank TL/LOC Lender Types
export interface ConventionalTlLocLender {
  id: string;
  lender_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  states_available?: string;
  submission_process?: string;
  docs_required?: string;
  timeline?: string;
  terms?: string;
  rates?: string;
  min_loan_amount?: string;
  max_loan_amount?: string;
  credit_requirement?: string;
  banking_relationship_required?: string;
  bank_account_opened_to_fund?: string;
  use_of_funds?: string;
  preferred_industries?: string;
  restricted_industries?: string;
  notes?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship: 'Huge Capital' | 'IFS';
}

export interface ConventionalTlLocLenderFormData {
  lender_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  states_available?: string;
  submission_process?: string;
  docs_required?: string;
  timeline?: string;
  terms?: string;
  rates?: string;
  min_loan_amount?: string;
  max_loan_amount?: string;
  credit_requirement?: string;
  banking_relationship_required?: string;
  bank_account_opened_to_fund?: string;
  use_of_funds?: string;
  preferred_industries?: string;
  restricted_industries?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship?: 'Huge Capital' | 'IFS';
}

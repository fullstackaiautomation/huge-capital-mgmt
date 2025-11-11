// Term Loans Lender Types
export interface TermLoansLender {
  id: string;
  lender_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  submission_docs?: string;
  submission_process?: string;
  timeline?: string;
  states_available?: string;
  products_offered?: string;
  min_loan_amount?: string;
  max_loan_amount?: string;
  use_of_funds?: string;
  credit_requirement?: string;
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

export interface TermLoansLenderFormData {
  lender_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  submission_docs?: string;
  submission_process?: string;
  timeline?: string;
  states_available?: string;
  products_offered?: string;
  min_loan_amount?: string;
  max_loan_amount?: string;
  use_of_funds?: string;
  credit_requirement?: string;
  preferred_industries?: string;
  restricted_industries?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship?: 'Huge Capital' | 'IFS';
}

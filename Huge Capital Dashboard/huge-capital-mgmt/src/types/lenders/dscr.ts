// DSCR Lender Types
export interface DscrLender {
  id: string;
  lender_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  submission_process?: string;
  min_loan_amount?: string;
  max_loan_amount?: string;
  max_ltv?: string;
  credit_requirement?: string;
  rural?: string;
  states?: string;
  drive_link?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship: 'Huge Capital' | 'IFS';
}

export interface DscrLenderFormData {
  lender_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  submission_process?: string;
  min_loan_amount?: string;
  max_loan_amount?: string;
  max_ltv?: string;
  credit_requirement?: string;
  rural?: string;
  states?: string;
  drive_link?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship?: 'Huge Capital' | 'IFS';
}

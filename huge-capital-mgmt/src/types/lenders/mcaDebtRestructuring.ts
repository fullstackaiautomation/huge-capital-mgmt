// MCA Debt Restructuring Lender Types
export interface McaDebtRestructuringLender {
  id: string;
  lender_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
  products_offered?: string;
  min_loan_amount?: string;
  max_loan_amount?: string;
  states_available?: string;
  credit_requirement?: string;
  notes?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship: 'Huge Capital' | 'IFS';
}

export interface McaDebtRestructuringLenderFormData {
  lender_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
  products_offered?: string;
  min_loan_amount?: string;
  max_loan_amount?: string;
  states_available?: string;
  credit_requirement?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship?: 'Huge Capital' | 'IFS';
}

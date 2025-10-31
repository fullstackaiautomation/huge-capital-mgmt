export interface SbaLender {
  id: string;
  lender_name: string;
  website: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  submission_docs: string | null;
  submission_type: string | null;
  submission_process: string | null;
  timeline: string | null;
  states_available: string | null;
  products_offered: string | null;
  minimum_loan_amount: string | null;
  max_loan_amount: string | null;
  use_of_funds: string | null;
  credit_requirement: number | null;
  preferred_industries: string | null;
  industry_restrictions: string | null;
  google_drive: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship: 'Huge Capital' | 'IFS';
}

export interface SbaLenderFormData {
  lender_name: string;
  website?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  submission_docs?: string;
  submission_type?: string;
  submission_process?: string;
  timeline?: string;
  states_available?: string;
  products_offered?: string;
  minimum_loan_amount?: string;
  max_loan_amount?: string;
  use_of_funds?: string;
  credit_requirement?: number;
  preferred_industries?: string;
  industry_restrictions?: string;
  google_drive?: string;
  note?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship?: 'Huge Capital' | 'IFS';
}

// Equipment Financing Lender Types
export interface EquipmentLender {
  id: string;
  lender_name: string;
  iso_rep?: string;
  phone?: string;
  email?: string;
  submission_process?: string;
  minimum_credit_requirement?: string;
  min_time_in_business?: string;
  min_loan_amount?: string;
  max_loan_amount?: string;
  terms?: string;
  rates?: string;
  do_positions_matter?: string;
  financing_types?: string;
  states_restrictions?: string;
  preferred_equipment?: string;
  equipment_restrictions?: string;
  website?: string;
  notes?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship: 'Huge Capital' | 'IFS';
}

export interface EquipmentLenderFormData {
  lender_name: string;
  iso_rep?: string;
  phone?: string;
  email?: string;
  submission_process?: string;
  minimum_credit_requirement?: string;
  min_time_in_business?: string;
  min_loan_amount?: string;
  max_loan_amount?: string;
  terms?: string;
  rates?: string;
  do_positions_matter?: string;
  financing_types?: string;
  states_restrictions?: string;
  preferred_equipment?: string;
  equipment_restrictions?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship?: 'Huge Capital' | 'IFS';
}

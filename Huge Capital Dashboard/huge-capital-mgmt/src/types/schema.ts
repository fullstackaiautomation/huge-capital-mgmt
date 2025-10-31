// Schema Type Definitions for Dynamic Lender Forms
// This file defines the structure for configuring lender types dynamically

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'url'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'multiselect'
  | 'currency';

export type FieldCategory =
  | 'contact'
  | 'requirements'
  | 'terms'
  | 'restrictions'
  | 'links'
  | 'submission'
  | 'products'
  | 'other';

export interface FieldDefinition {
  // Identification
  id: string;                        // Unique field ID (e.g., 'min_loan_amount')
  dbColumnName: string;              // Database column name
  displayName: string;               // User-friendly label
  placeholder?: string;              // Placeholder text

  // Type & Validation
  type: FieldType;
  required?: boolean;
  validation?: {
    pattern?: string;                // Regex pattern
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };

  // Organization
  category: FieldCategory;
  description?: string;              // Help text

  // UI Customization
  visible?: boolean;                 // Show in form (default true)
  displayInTable?: boolean;          // Show in list view (default false)
  displayInExpanded?: boolean;       // Show in expanded card (default true)
  searchable?: boolean;              // Include in search (default true)

  // Select options
  options?: Array<{ value: string; label: string }>;

  // CSV Integration
  csvHeader?: string;                // Matches CSV column header
  csvIndex?: number;                 // Position in CSV (0-indexed)
}

export interface LenderTypeSchema {
  // Metadata
  id: string;                        // Unique type ID (e.g., 'term-loans')
  displayName: string;               // Display name (e.g., 'Term Loans')
  description?: string;              // Description for UI
  category: 'basic' | 'real-estate' | 'specialized' | 'equipment';

  // Database
  tableName: string;                 // Database table name

  // Structure
  fields: FieldDefinition[];         // All available fields

  // Display Configuration
  alwaysShowColumns: string[];       // Fields always shown in table
  expandableColumns: string[];       // Fields shown in expanded view
  hiddenColumns?: string[];          // Fields hidden from UI (still stored)

  // CSV Mapping
  csvHeaders: Record<string, string>;  // Maps CSV header -> dbColumnName
  csvFilePath?: string;              // Path to source CSV (for reference)

  // Metadata
  isoRepField?: string;              // Some types use 'ISO Rep' vs 'Contact Person'
  createdAt?: string;
  updatedAt?: string;
}

export interface UnifiedLenderRow {
  // These fields are common across ALL lender types
  id: string;
  lender_name: string;
  contact_person?: string;           // Some use this
  iso_rep?: string;                  // Some use this
  phone?: string;
  email?: string;
  website?: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  relationship: 'Huge Capital' | 'IFS';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;

  // Type identifier (for filtering/display)
  lender_type: string;               // Matches LenderTypeSchema.id

  // Type-specific fields (stored as JSON or in dedicated columns)
  [key: string]: any;
}

export interface LenderFormState {
  typeId: string;
  data: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isDirty: boolean;
}

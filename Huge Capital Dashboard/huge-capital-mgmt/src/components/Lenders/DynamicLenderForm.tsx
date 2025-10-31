// Dynamic Lender Form Component
// Generates form fields based on lender type schema
import { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { getLenderTypeSchema } from '../../config/lenderTypeSchema';
import type { FieldDefinition, FieldCategory } from '../../types/schema';

interface DynamicLenderFormProps {
  typeId: string;
  initialData?: Record<string, any>;
  onSubmit: (formData: Record<string, any>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  [key: string]: string | undefined;
}

interface FormTouched {
  [key: string]: boolean;
}

const CATEGORY_LABELS: Record<FieldCategory, string> = {
  contact: 'Contact Information',
  requirements: 'Requirements & Criteria',
  terms: 'Terms & Rates',
  restrictions: 'Restrictions & Limitations',
  links: 'Links & Documentation',
  submission: 'Submission Information',
  products: 'Products & Services',
  other: 'Additional Information',
};

export default function DynamicLenderForm({
  typeId,
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
}: DynamicLenderFormProps) {
  const schema = getLenderTypeSchema(typeId);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSaving, setIsSaving] = useState(false);

  if (!schema) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-400 font-medium">Invalid Lender Type</p>
          <p className="text-red-300 text-sm">Lender type "{typeId}" not found in schema</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateField = useCallback((field: FieldDefinition, value: any): string | null => {
    if (field.required && (!value || value.trim?.() === '')) {
      return `${field.displayName} is required`;
    }

    if (!value) return null;

    if (field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        return `${field.displayName} format is invalid`;
      }
    }

    if (field.validation?.minLength && value.length < field.validation.minLength) {
      return `${field.displayName} must be at least ${field.validation.minLength} characters`;
    }

    if (field.validation?.maxLength && value.length > field.validation.maxLength) {
      return `${field.displayName} must be no more than ${field.validation.maxLength} characters`;
    }

    if (field.type === 'number' || field.type === 'currency') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return `${field.displayName} must be a number`;
      }
      if (field.validation?.min !== undefined && num < field.validation.min) {
        return `${field.displayName} must be at least ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && num > field.validation.max) {
        return `${field.displayName} must be no more than ${field.validation.max}`;
      }
    }

    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (field.type === 'url') {
      try {
        new URL(value);
      } catch {
        return 'Please enter a valid URL';
      }
    }

    return null;
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    schema.fields.forEach((field) => {
      if (field.visible === false) return;

      const error = validateField(field, formData[field.dbColumnName]);
      if (error) {
        newErrors[field.dbColumnName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [schema, formData, validateField]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Validate on change if field has been touched
    if (touched[fieldId]) {
      const field = schema.fields.find((f) => f.dbColumnName === fieldId);
      if (field) {
        const error = validateField(field, value);
        setErrors((prev) => ({
          ...prev,
          [fieldId]: error || undefined,
        }));
      }
    }
  };

  const handleBlur = (fieldId: string) => {
    setTouched((prev) => ({
      ...prev,
      [fieldId]: true,
    }));

    const field = schema.fields.find((f) => f.dbColumnName === fieldId);
    if (field) {
      const error = validateField(field, formData[fieldId]);
      setErrors((prev) => ({
        ...prev,
        [fieldId]: error || undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit(formData);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // RENDER FIELD BY TYPE
  // ============================================================================

  const renderField = (field: FieldDefinition) => {
    const value = formData[field.dbColumnName] || '';
    const error = errors[field.dbColumnName];
    const isTouched = touched[field.dbColumnName];

    const baseInputClasses = `w-full px-3 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 transition-colors ${
      error && isTouched
        ? 'border-red-500/50 focus:border-red-500/75'
        : 'border-gray-700 focus:border-brand-500/50'
    } focus:outline-none`;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            key={field.dbColumnName}
            type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            placeholder={field.placeholder || field.displayName}
            value={value}
            onChange={(e) => handleChange(field.dbColumnName, e.target.value)}
            onBlur={() => handleBlur(field.dbColumnName)}
            className={baseInputClasses}
            disabled={isLoading || isSaving}
          />
        );

      case 'number':
      case 'currency':
        return (
          <input
            key={field.dbColumnName}
            type="number"
            placeholder={field.placeholder || field.displayName}
            value={value}
            onChange={(e) => handleChange(field.dbColumnName, e.target.value)}
            onBlur={() => handleBlur(field.dbColumnName)}
            className={baseInputClasses}
            disabled={isLoading || isSaving}
          />
        );

      case 'textarea':
        return (
          <textarea
            key={field.dbColumnName}
            placeholder={field.placeholder || field.displayName}
            value={value}
            onChange={(e) => handleChange(field.dbColumnName, e.target.value)}
            onBlur={() => handleBlur(field.dbColumnName)}
            rows={3}
            className={`${baseInputClasses} resize-vertical`}
            disabled={isLoading || isSaving}
          />
        );

      case 'select':
        return (
          <select
            key={field.dbColumnName}
            value={value}
            onChange={(e) => handleChange(field.dbColumnName, e.target.value)}
            onBlur={() => handleBlur(field.dbColumnName)}
            className={baseInputClasses}
            disabled={isLoading || isSaving}
          >
            <option value="">Select {field.displayName}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label key={field.dbColumnName} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleChange(field.dbColumnName, e.target.checked)}
              onBlur={() => handleBlur(field.dbColumnName)}
              className="w-4 h-4 rounded bg-gray-900 border border-gray-700 cursor-pointer"
              disabled={isLoading || isSaving}
            />
            <span className="text-white">{field.displayName}</span>
          </label>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
        return (
          <select
            key={field.dbColumnName}
            multiple
            value={selectedValues}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
              handleChange(field.dbColumnName, selected);
            }}
            onBlur={() => handleBlur(field.dbColumnName)}
            className={baseInputClasses}
            disabled={isLoading || isSaving}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // GROUP FIELDS BY CATEGORY
  // ============================================================================

  const groupedFields = schema.fields.reduce(
    (acc, field) => {
      if (field.visible === false) return acc;
      if (!acc[field.category]) {
        acc[field.category] = [];
      }
      acc[field.category].push(field);
      return acc;
    },
    {} as Record<FieldCategory, FieldDefinition[]>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Add {schema.displayName}</h2>
        {schema.description && (
          <p className="text-gray-400">{schema.description}</p>
        )}
      </div>

      {/* Form Sections */}
      {Object.entries(groupedFields).map(([category, fields]) => (
        <div key={category} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            {CATEGORY_LABELS[category as FieldCategory] || category}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.dbColumnName}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {field.displayName}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>

                {renderField(field)}

                {field.description && (
                  <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                )}

                {errors[field.dbColumnName] && touched[field.dbColumnName] && (
                  <p className="text-xs text-red-400 mt-1">{errors[field.dbColumnName]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSaving || isLoading}
          className="flex-1 py-2 px-4 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSaving ? 'Saving...' : 'Save Lender'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving || isLoading}
            className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

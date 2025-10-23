import { useState } from 'react';
import { X } from 'lucide-react';
import type { SbaLender, SbaLenderFormData } from '../../types/lenders/sba';

interface SbaFormProps {
  lender?: SbaLender;
  onSubmit: (data: SbaLenderFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SbaForm({
  lender,
  onSubmit,
  onCancel,
  isLoading,
}: SbaFormProps) {
  const [formData, setFormData] = useState<SbaLenderFormData>({
    lender_name: lender?.lender_name || '',
    website: lender?.website || '',
    contact_person: lender?.contact_person || '',
    phone: lender?.phone || '',
    email: lender?.email || '',
    submission_docs: lender?.submission_docs || '',
    submission_type: lender?.submission_type || '',
    submission_process: lender?.submission_process || '',
    timeline: lender?.timeline || '',
    states_available: lender?.states_available || '',
    products_offered: lender?.products_offered || '',
    minimum_loan_amount: lender?.minimum_loan_amount || '',
    max_loan_amount: lender?.max_loan_amount || '',
    use_of_funds: lender?.use_of_funds || '',
    credit_requirement: lender?.credit_requirement || undefined,
    preferred_industries: lender?.preferred_industries || '',
    industry_restrictions: lender?.industry_restrictions || '',
    google_drive: lender?.google_drive || '',
    note: lender?.note || '',
    status: lender?.status || 'active',
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credit_requirement'
        ? value ? parseInt(value) : undefined
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.lender_name) {
      setError('Lender name is required');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lender');
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">
          {lender ? 'Edit Lender' : 'Add New Lender'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-400 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Lender Name *
            </label>
            <input
              type="text"
              name="lender_name"
              value={formData.lender_name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., US Bank"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Availability & Requirements */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Availability & Requirements</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                States Available
              </label>
              <input
                type="text"
                name="states_available"
                value={formData.states_available || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Credit Requirement
              </label>
              <input
                type="number"
                name="credit_requirement"
                value={formData.credit_requirement || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Timeline
              </label>
              <input
                type="text"
                name="timeline"
                value={formData.timeline || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Products Offered
              </label>
              <input
                type="text"
                name="products_offered"
                value={formData.products_offered || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Loan Amounts */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Loan Amounts</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Minimum Loan Amount
              </label>
              <input
                type="text"
                name="minimum_loan_amount"
                value={formData.minimum_loan_amount || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Loan Amount
              </label>
              <input
                type="text"
                name="max_loan_amount"
                value={formData.max_loan_amount || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submission Info */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Submission Information</h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Submission Docs
              </label>
              <textarea
                name="submission_docs"
                value={formData.submission_docs || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Submission Type
                </label>
                <input
                  type="text"
                  name="submission_type"
                  value={formData.submission_type || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Submission Process
                </label>
                <input
                  type="text"
                  name="submission_process"
                  value={formData.submission_process || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Industry & Restrictions */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Industry & Restrictions</h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Use of Funds
              </label>
              <textarea
                name="use_of_funds"
                value={formData.use_of_funds || ''}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Preferred Industries
              </label>
              <textarea
                name="preferred_industries"
                value={formData.preferred_industries || ''}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Industry Restrictions
              </label>
              <textarea
                name="industry_restrictions"
                value={formData.industry_restrictions || ''}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Links & Notes */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Links & Documentation</h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Google Drive
              </label>
              <input
                type="url"
                name="google_drive"
                value={formData.google_drive || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                name="note"
                value={formData.note || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="border-t border-gray-700 pt-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Lender'}
          </button>
        </div>
      </form>
    </div>
  );
}

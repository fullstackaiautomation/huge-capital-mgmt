import { useState } from 'react';
import { X } from 'lucide-react';
import type { BusinessLineOfCreditLender, BusinessLineOfCreditLenderFormData } from '../../types/lenders/businessLineOfCredit';

interface BusinessLineOfCreditFormProps {
  lender?: BusinessLineOfCreditLender;
  onSubmit: (data: BusinessLineOfCreditLenderFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BusinessLineOfCreditForm({
  lender,
  onSubmit,
  onCancel,
  isLoading,
}: BusinessLineOfCreditFormProps) {
  const [formData, setFormData] = useState<BusinessLineOfCreditLenderFormData>({
    lender_name: lender?.lender_name || '',
    bank_non_bank: lender?.bank_non_bank || 'Bank',
    website: lender?.website || '',
    iso_contacts: lender?.iso_contacts || '',
    phone: lender?.phone || '',
    email: lender?.email || '',
    credit_requirement: lender?.credit_requirement || undefined,
    credit_used: lender?.credit_used || '',
    min_time_in_business: lender?.min_time_in_business || '',
    minimum_deposit_count: lender?.minimum_deposit_count || undefined,
    min_monthly_revenue_amount: lender?.min_monthly_revenue_amount || '',
    min_avg_daily_balance: lender?.min_avg_daily_balance || '',
    max_loan: lender?.max_loan || '',
    positions: lender?.positions || '',
    products_offered: lender?.products_offered || '',
    terms: lender?.terms || '',
    payments: lender?.payments || '',
    draw_fees: lender?.draw_fees || '',
    preferred_industries: lender?.preferred_industries || '',
    restricted_industries: lender?.restricted_industries || '',
    ineligible_states: lender?.ineligible_states || '',
    submission_docs: lender?.submission_docs || '',
    submission_type: lender?.submission_type || '',
    submission_process: lender?.submission_process || '',
    drive_link: lender?.drive_link || '',
    notes: lender?.notes || '',
    status: lender?.status || 'active',
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'minimum_deposit_count' || name === 'credit_requirement'
        ? value ? parseInt(value) : undefined
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.lender_name || !formData.bank_non_bank) {
      setError('Lender name and bank/non-bank type are required');
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
              placeholder="e.g., ARF Financial"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Type *
            </label>
            <select
              name="bank_non_bank"
              value={formData.bank_non_bank}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Bank">Bank</option>
              <option value="Non-Bank">Non-Bank</option>
            </select>
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
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
                ISO Contacts
              </label>
              <input
                type="text"
                name="iso_contacts"
                value={formData.iso_contacts}
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
                value={formData.phone}
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
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Requirements & Criteria</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Credit Used
              </label>
              <input
                type="text"
                name="credit_used"
                value={formData.credit_used}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Min Time in Business
              </label>
              <input
                type="text"
                name="min_time_in_business"
                value={formData.min_time_in_business}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Min Deposit Count
              </label>
              <input
                type="number"
                name="minimum_deposit_count"
                value={formData.minimum_deposit_count || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Min Monthly Revenue Amount
              </label>
              <input
                type="text"
                name="min_monthly_revenue_amount"
                value={formData.min_monthly_revenue_amount}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Min Avg Daily Balance
              </label>
              <input
                type="text"
                name="min_avg_daily_balance"
                value={formData.min_avg_daily_balance}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Products & Terms */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Products & Terms</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Loan
              </label>
              <input
                type="text"
                name="max_loan"
                value={formData.max_loan}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Positions
              </label>
              <input
                type="text"
                name="positions"
                value={formData.positions}
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
                value={formData.products_offered}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Terms
              </label>
              <input
                type="text"
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Payments
              </label>
              <input
                type="text"
                name="payments"
                value={formData.payments}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Draw Fees
              </label>
              <input
                type="text"
                name="draw_fees"
                value={formData.draw_fees}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Industry Info */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Industry Information</h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Preferred Industries
              </label>
              <textarea
                name="preferred_industries"
                value={formData.preferred_industries}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Restricted Industries
              </label>
              <textarea
                name="restricted_industries"
                value={formData.restricted_industries}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Ineligible States
              </label>
              <input
                type="text"
                name="ineligible_states"
                value={formData.ineligible_states}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submission Info */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Submission Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Submission Docs
              </label>
              <textarea
                name="submission_docs"
                value={formData.submission_docs}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Submission Type
              </label>
              <input
                type="text"
                name="submission_type"
                value={formData.submission_type}
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
                value={formData.submission_process}
                onChange={handleChange}
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
                Drive Link
              </label>
              <input
                type="url"
                name="drive_link"
                value={formData.drive_link}
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
                name="notes"
                value={formData.notes}
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

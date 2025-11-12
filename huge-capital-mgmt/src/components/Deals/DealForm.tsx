/**
 * Deal Form Component
 * Multi-step form for deal submission with business and owner information
 */

import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { DealFormData, OwnerFormData } from '../../types/deals';

interface DealFormProps {
  onSubmit: (data: { deal: DealFormData; owners: OwnerFormData[] }) => void;
  isLoading?: boolean;
  initialData?: Partial<DealFormData>;
}

export default function DealForm({
  onSubmit,
  isLoading = false,
  initialData,
}: DealFormProps) {
  const [step, setStep] = useState(1);
  const [dealData, setDealData] = useState<DealFormData>({
    legal_business_name: initialData?.legal_business_name || '',
    dba_name: initialData?.dba_name || '',
    ein: initialData?.ein || '',
    business_type: initialData?.business_type || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '',
    phone: initialData?.phone || '',
    website: initialData?.website || '',
    franchise_business: initialData?.franchise_business || false,
    seasonal_business: initialData?.seasonal_business || false,
    peak_sales_month: initialData?.peak_sales_month || '',
    business_start_date: initialData?.business_start_date || '',
    product_service_sold: initialData?.product_service_sold || '',
    franchise_units_percent: initialData?.franchise_units_percent || '',
    average_monthly_sales: initialData?.average_monthly_sales || '',
    average_monthly_card_sales: initialData?.average_monthly_card_sales || '',
    desired_loan_amount: initialData?.desired_loan_amount || '',
    reason_for_loan: initialData?.reason_for_loan || '',
    loan_type: initialData?.loan_type || 'MCA',
  });

  const [owners, setOwners] = useState<OwnerFormData[]>([
    {
      owner_number: 1,
      full_name: '',
      street_address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      email: '',
      ownership_percent: '',
      drivers_license_number: '',
      date_of_birth: '',
      ssn: '',
    },
  ]);

  const handleDealChange = (field: keyof DealFormData, value: any) => {
    setDealData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOwnerChange = (index: number, field: keyof OwnerFormData, value: any) => {
    const updatedOwners = [...owners];
    updatedOwners[index] = {
      ...updatedOwners[index],
      [field]: value,
    };
    setOwners(updatedOwners);
  };

  const addOwner = () => {
    if (owners.length < 2) {
      setOwners([
        ...owners,
        {
          owner_number: 2,
          full_name: '',
          street_address: '',
          city: '',
          state: '',
          zip: '',
          phone: '',
          email: '',
          ownership_percent: '',
          drivers_license_number: '',
          date_of_birth: '',
          ssn: '',
        },
      ]);
    }
  };

  const removeOwner = (index: number) => {
    setOwners(owners.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSubmit({ deal: dealData, owners });
  };

  const isStep1Valid = dealData.legal_business_name && dealData.ein && dealData.address;
  const isStep2Valid = dealData.average_monthly_sales && dealData.desired_loan_amount;
  const isStep3Valid = owners.every((o) => o.full_name && o.email);

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1 rounded-full transition-all ${
                s <= step ? 'bg-indigo-500' : 'bg-gray-700'
              }`}
            />
            <p className="text-xs text-gray-500 mt-1 text-center">Step {s}</p>
          </div>
        ))}
      </div>

      {/* Step 1: Business Information */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Business Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Legal Business Name *"
              value={dealData.legal_business_name}
              onChange={(e) => handleDealChange('legal_business_name', e.target.value)}
              className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              placeholder="DBA Name (optional)"
              value={dealData.dba_name}
              onChange={(e) => handleDealChange('dba_name', e.target.value)}
              className="bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              placeholder="EIN *"
              value={dealData.ein}
              onChange={(e) => handleDealChange('ein', e.target.value)}
              className="bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              placeholder="Address *"
              value={dealData.address}
              onChange={(e) => handleDealChange('address', e.target.value)}
              className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              placeholder="City"
              value={dealData.city}
              onChange={(e) => handleDealChange('city', e.target.value)}
              className="bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="State"
                value={dealData.state}
                onChange={(e) => handleDealChange('state', e.target.value)}
                maxLength={2}
                className="w-16 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
              <input
                type="text"
                placeholder="ZIP"
                value={dealData.zip}
                onChange={(e) => handleDealChange('zip', e.target.value)}
                className="flex-1 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <input
              type="text"
              placeholder="Business Type"
              value={dealData.business_type}
              onChange={(e) => handleDealChange('business_type', e.target.value)}
              className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              placeholder="Phone"
              value={dealData.phone}
              onChange={(e) => handleDealChange('phone', e.target.value)}
              className="bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              placeholder="Website"
              value={dealData.website}
              onChange={(e) => handleDealChange('website', e.target.value)}
              className="bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <label className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                checked={dealData.franchise_business}
                onChange={(e) => handleDealChange('franchise_business', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-300">Franchise Business</span>
            </label>

            <label className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                checked={dealData.seasonal_business}
                onChange={(e) => handleDealChange('seasonal_business', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-300">Seasonal Business</span>
            </label>
          </div>
        </div>
      )}

      {/* Step 2: Financial Information */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Financial Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Average Monthly Sales *"
              value={dealData.average_monthly_sales}
              onChange={(e) => handleDealChange('average_monthly_sales', e.target.value)}
              className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="number"
              placeholder="Avg Monthly Card Sales"
              value={dealData.average_monthly_card_sales}
              onChange={(e) => handleDealChange('average_monthly_card_sales', e.target.value)}
              className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="number"
              placeholder="Desired Loan Amount *"
              value={dealData.desired_loan_amount}
              onChange={(e) => handleDealChange('desired_loan_amount', e.target.value)}
              className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={dealData.loan_type}
              onChange={(e) => handleDealChange('loan_type', e.target.value)}
              className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="MCA">MCA (Merchant Cash Advance)</option>
              <option value="Business LOC">Business Line of Credit</option>
            </select>

            <textarea
              placeholder="Reason for Loan"
              value={dealData.reason_for_loan}
              onChange={(e) => handleDealChange('reason_for_loan', e.target.value)}
              className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-24"
            />

            <input
              type="date"
              placeholder="Business Start Date"
              value={dealData.business_start_date}
              onChange={(e) => handleDealChange('business_start_date', e.target.value)}
              className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              placeholder="Products/Services Sold"
              value={dealData.product_service_sold}
              onChange={(e) => handleDealChange('product_service_sold', e.target.value)}
              className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Step 3: Owner Information */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Business Owner(s)</h3>

          {owners.map((owner, index) => (
            <div
              key={index}
              className="bg-gray-800/20 border border-gray-700/30 rounded-lg p-4 space-y-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-300">Owner {index + 1}</h4>
                {owners.length > 1 && (
                  <button
                    onClick={() => removeOwner(index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={owner.full_name}
                  onChange={(e) => handleOwnerChange(index, 'full_name', e.target.value)}
                  className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <input
                  type="email"
                  placeholder="Email *"
                  value={owner.email}
                  onChange={(e) => handleOwnerChange(index, 'email', e.target.value)}
                  className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <input
                  type="text"
                  placeholder="Phone"
                  value={owner.phone}
                  onChange={(e) => handleOwnerChange(index, 'phone', e.target.value)}
                  className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <input
                  type="number"
                  placeholder="Ownership %"
                  value={owner.ownership_percent}
                  onChange={(e) => handleOwnerChange(index, 'ownership_percent', e.target.value)}
                  className="bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={owner.date_of_birth}
                  onChange={(e) => handleOwnerChange(index, 'date_of_birth', e.target.value)}
                  className="bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <input
                  type="text"
                  placeholder="Street Address"
                  value={owner.street_address}
                  onChange={(e) => handleOwnerChange(index, 'street_address', e.target.value)}
                  className="col-span-2 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <input
                  type="text"
                  placeholder="City"
                  value={owner.city}
                  onChange={(e) => handleOwnerChange(index, 'city', e.target.value)}
                  className="bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="State"
                    value={owner.state}
                    onChange={(e) => handleOwnerChange(index, 'state', e.target.value)}
                    maxLength={2}
                    className="w-16 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={owner.zip}
                    onChange={(e) => handleOwnerChange(index, 'zip', e.target.value)}
                    className="flex-1 bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}

          {owners.length < 2 && (
            <button
              onClick={addOwner}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            >
              + Add Second Owner
            </button>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gray-700/30 hover:bg-gray-700/50 disabled:opacity-50 text-gray-300 px-4 py-2 rounded-lg transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {step < 3 && (
          <button
            onClick={() => {
              if ((step === 1 && isStep1Valid) || (step === 2 && isStep2Valid)) {
                setStep(step + 1);
              }
            }}
            disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) || isLoading}
            className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {step === 3 && (
          <button
            onClick={handleSubmit}
            disabled={!isStep3Valid || isLoading}
            className="ml-auto bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-all font-medium"
          >
            {isLoading ? 'Submitting...' : 'Submit Deal'}
          </button>
        )}
      </div>
    </div>
  );
}

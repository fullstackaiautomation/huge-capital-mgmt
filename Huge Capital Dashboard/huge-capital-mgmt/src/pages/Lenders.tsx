// Lenders Page
// Epic 2: Lenders Dashboard (LD-001)

import { useState } from 'react';
import { Building2, Edit, Plus, X } from 'lucide-react';
import { useAllLenders, type UnifiedLender } from '../hooks/useAllLenders';

export default function Lenders() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLenderType, setSelectedLenderType] = useState<'Business Line of Credit' | 'MCA' | 'SBA' | null>(null);
  const { lenders, loading, error } = useAllLenders(activeFilter === 'all' ? undefined : activeFilter);

  const filters = [
    { id: 'all', label: 'All Lenders' },
    { id: 'Business Line of Credit', label: 'Business Line of Credit' },
    { id: 'MCA', label: 'MCA' },
    { id: 'SBA', label: 'SBA' },
    // TODO: Add remaining 8 lender types
  ];

  const stats = {
    total: lenders.length,
    byType: {
      'Business Line of Credit': lenders.filter((l: UnifiedLender) => l.lender_type === 'Business Line of Credit').length,
      'MCA': lenders.filter((l: UnifiedLender) => l.lender_type === 'MCA').length,
      'SBA': lenders.filter((l: UnifiedLender) => l.lender_type === 'SBA').length,
    },
  };

  return (
    <div className="w-full px-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white">Lenders</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Lender
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Lenders</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Business Line of Credit</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{stats.byType['Business Line of Credit']}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">MCA</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{stats.byType['MCA']}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">SBA</div>
          <div className="text-2xl font-bold text-green-400 mt-1">{stats.byType['SBA']}</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(filter => {
          let buttonColor = 'bg-blue-600';

          if (filter.id === 'Business Line of Credit') {
            buttonColor = 'bg-blue-600';
          } else if (filter.id === 'MCA') {
            buttonColor = 'bg-purple-600';
          } else if (filter.id === 'SBA') {
            buttonColor = 'bg-green-600';
          }

          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === filter.id
                  ? `${buttonColor} text-white`
                  : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
          Error: {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 text-gray-400">
          Loading lenders...
        </div>
      )}

      {/* Lenders Table */}
      {!loading && lenders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300" style={{ tableLayout: 'fixed' }}>
            <thead className="border-b border-gray-700 bg-gray-800/50">
              <tr>
                <th className="text-left py-3 pr-2 pl-4 font-semibold w-56">Lender Name</th>
                <th className="text-center py-3 px-2 font-semibold w-28">Type</th>
                <th className="text-center py-3 px-4 font-semibold w-48">Contact</th>
                <th className="text-center py-3 px-4 font-semibold w-16">Credit Req</th>
                <th className="text-center py-3 px-4 font-semibold w-20">Min Loan</th>
                <th className="text-center py-3 px-4 font-semibold w-24">Max Loan</th>
                <th className="text-center py-3 px-4 font-semibold">Products Offered</th>
                <th className="text-center py-3 px-4 font-semibold">Submission Type</th>
                <th className="text-center py-3 px-4 font-semibold">Contact Email</th>
                <th className="text-center py-3 px-4 font-semibold w-16">Edit</th>
              </tr>
            </thead>
            <tbody>
              {lenders.map(lender => (
                <tr key={`${lender.lender_type}-${lender.id}`} className="border-b border-gray-700 hover:bg-gray-800/30 transition-colors">
                  <td className="text-left py-3 pr-2 pl-4 font-medium text-white">{lender.lender_name}</td>
                  <td className="text-center py-3 px-2 w-32">
                    <span className={`px-2 py-1 rounded text-xs font-semibold inline-block ${
                      lender.lender_type === 'Business Line of Credit'
                        ? 'bg-blue-500/20 text-blue-300'
                        : lender.lender_type === 'MCA'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-green-500/20 text-green-300'
                    }`}>
                      {lender.lender_type}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="text-sm">
                      {lender.raw_data && 'iso_contacts' in lender.raw_data && lender.raw_data.iso_contacts && <div className="text-gray-300">{lender.raw_data.iso_contacts}</div>}
                      {lender.raw_data && 'iso_rep' in lender.raw_data && lender.raw_data.iso_rep && <div className="text-gray-300">{lender.raw_data.iso_rep}</div>}
                      {lender.raw_data && 'contact_person' in lender.raw_data && lender.raw_data.contact_person && <div className="text-gray-300">{lender.raw_data.contact_person}</div>}
                      {lender.phone && <div className="text-gray-500 text-xs">{lender.phone}</div>}
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">{lender.credit_requirement || 'N/A'}</td>
                  <td className="text-center py-3 px-4">{lender.minimum_loan_amount || 'N/A'}</td>
                  <td className="text-center py-3 px-4">{lender.max_loan_amount || 'N/A'}</td>
                  <td className="text-center py-3 px-4">{lender.products_offered || 'N/A'}</td>
                  <td className="text-center py-3 px-4">{lender.submission_type || 'N/A'}</td>
                  <td className="text-center py-3 px-4">{lender.email || 'N/A'}</td>
                  <td className="text-center py-3 px-4 w-16">
                    <button
                      onClick={() => setEditingId(editingId === lender.id ? null : lender.id)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit lender"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && lenders.length === 0 && (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-700 rounded-lg">
          No lenders found for the selected filter
        </div>
      )}

      {/* Summary */}
      {!loading && lenders.length > 0 && (
        <div className="text-xs text-gray-400">
          Showing {lenders.length} lender{lenders.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Add Lender Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg w-[95vw] max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b sticky top-0 bg-gray-800 ${
              selectedLenderType === 'Business Line of Credit' ? 'border-blue-500' :
              selectedLenderType === 'MCA' ? 'border-purple-500' :
              selectedLenderType === 'SBA' ? 'border-green-500' :
              'border-gray-700'
            }`}>
              <h3 className="text-xl font-bold text-white">
                {selectedLenderType ? `Add ${selectedLenderType} Lender` : 'Select Lender Type'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedLenderType(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {!selectedLenderType ? (
                <div className="space-y-3">
                  <p className="text-gray-400 mb-4">Choose a lender type to add:</p>
                  {['Business Line of Credit', 'MCA', 'SBA'].map(lenderType => {
                    let bgColor = 'bg-blue-600/20';
                    let borderColor = 'border-blue-500';
                    let hoverColor = 'hover:bg-blue-600/30';
                    let textColor = 'text-blue-300';

                    if (lenderType === 'Business Line of Credit') {
                      bgColor = 'bg-blue-600/20';
                      borderColor = 'border-blue-500';
                      hoverColor = 'hover:bg-blue-600/30';
                      textColor = 'text-blue-300';
                    } else if (lenderType === 'MCA') {
                      bgColor = 'bg-purple-600/20';
                      borderColor = 'border-purple-500';
                      hoverColor = 'hover:bg-purple-600/30';
                      textColor = 'text-purple-300';
                    } else if (lenderType === 'SBA') {
                      bgColor = 'bg-green-600/20';
                      borderColor = 'border-green-500';
                      hoverColor = 'hover:bg-green-600/30';
                      textColor = 'text-green-300';
                    }

                    return (
                      <button
                        key={lenderType}
                        onClick={() => setSelectedLenderType(lenderType as 'Business Line of Credit' | 'MCA' | 'SBA')}
                        className={`w-full p-4 ${bgColor} border ${borderColor} rounded-lg ${textColor} text-left font-medium transition-colors ${hoverColor}`}
                      >
                        {lenderType}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {selectedLenderType === 'Business Line of Credit' ? (
                <div className="space-y-5">
                  {/* Company Information Section */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Company Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Lender Name *</label>
                        <input type="text" placeholder="Enter lender name" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Bank / Non-Bank *</label>
                        <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500">
                          <option value="">Select Type</option>
                          <option value="Bank">Bank</option>
                          <option value="Non-Bank">Non-Bank</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">ISO Contacts *</label>
                        <input type="text" placeholder="Contact names" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                        <input type="email" placeholder="email@example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                        <input type="tel" placeholder="(555) 123-4567" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                        <input type="url" placeholder="https://example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Requirements & Criteria */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Requirements & Criteria</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Credit Requirement</label>
                        <input type="number" placeholder="e.g., 500" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Credit Used</label>
                        <input type="text" placeholder="e.g., FICO" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Time in Business</label>
                        <input type="text" placeholder="e.g., 2 years" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Monthly Revenue</label>
                        <input type="text" placeholder="e.g., $10,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Deposit Count</label>
                        <input type="number" placeholder="e.g., 6" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Avg Daily Balance</label>
                        <input type="text" placeholder="e.g., $5,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Product & Offers */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Product & Offers</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Products Offered</label>
                        <input type="text" placeholder="e.g., Line of Credit, Term Loan" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Max Loan</label>
                        <input type="text" placeholder="e.g., $1,500,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Positions</label>
                        <input type="text" placeholder="e.g., 1st, 2nd" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Terms</label>
                        <input type="text" placeholder="e.g., 12-60 months" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Payments</label>
                        <input type="text" placeholder="e.g., Monthly, Weekly" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Draw Fees</label>
                        <input type="text" placeholder="e.g., 1-2%" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Row 6: Submission Information */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Submission Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Submission Type</label>
                        <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500">
                          <option value="">Select Submission Type</option>
                          <option value="Email">Email</option>
                          <option value="Online Portal">Online Portal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Submission Documents</label>
                        <input type="text" placeholder="e.g., Bank statements, Tax returns" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Submission Process</label>
                        <input type="text" placeholder="Description of submission process" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Row 7: Industry Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Industry Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Industries</label>
                        <input type="text" placeholder="e.g., Retail, Services" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Restricted Industries</label>
                        <input type="text" placeholder="e.g., Healthcare, Finance" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Ineligible States</label>
                        <input type="text" placeholder="e.g., NY, CA" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Row 8: Links & Documentation */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Links & Documentation</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Google Drive Link</label>
                      <input type="url" placeholder="https://drive.google.com/..." className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                      <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                      <textarea placeholder="Additional notes" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none" rows={2} />
                    </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedLenderType === 'MCA' ? (
                <div className="space-y-5">
                  {/* Basic Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Lender Name *</label>
                        <input type="text" placeholder="Enter lender name" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Paper</label>
                        <input type="text" placeholder="e.g., Direct" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                        <input type="url" placeholder="https://example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">ISO Rep</label>
                        <input type="text" placeholder="Rep name" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input type="email" placeholder="email@example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                        <input type="tel" placeholder="(555) 123-4567" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Requirements & Criteria */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Requirements & Criteria</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Credit</label>
                        <input type="number" placeholder="e.g., 500" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Monthly Revenue</label>
                        <input type="text" placeholder="e.g., $10,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Business Years</label>
                        <input type="text" placeholder="e.g., 2 years" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Max NSF Days</label>
                        <input type="text" placeholder="e.g., 5 days" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Daily Balance</label>
                        <input type="text" placeholder="e.g., $2,500" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Product & Limits */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Product & Limits</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Loan</label>
                        <input type="text" placeholder="e.g., $5,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Max Loan</label>
                        <input type="text" placeholder="e.g., $500,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Products</label>
                        <input type="text" placeholder="e.g., MCA" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Positions</label>
                        <input type="text" placeholder="e.g., 1st, 2nd" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Buyouts</label>
                        <input type="text" placeholder="e.g., Yes/No" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Terms</label>
                        <input type="text" placeholder="e.g., 3-24mo" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Industry Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Industry Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Restricted States</label>
                        <input type="text" placeholder="e.g., NY, CA" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Industries</label>
                        <input type="text" placeholder="e.g., Retail" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Restricted Industries</label>
                        <input type="text" placeholder="e.g., Healthcare" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Links & Documentation */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Links & Documentation</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Google Drive Link</label>
                        <input type="url" placeholder="https://drive.google.com/..." className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                        <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-purple-500">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                        <textarea placeholder="Additional notes" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none" rows={2} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedLenderType === 'SBA' ? (
                <div className="space-y-5">
                  {/* Basic Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Lender Name *</label>
                        <input type="text" placeholder="Enter lender name" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                        <input type="url" placeholder="https://example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person</label>
                        <input type="text" placeholder="Name of contact" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input type="email" placeholder="email@example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                        <input type="tel" placeholder="(555) 123-4567" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Requirements & Criteria */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Requirements & Criteria</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Credit Requirement</label>
                        <input type="number" placeholder="e.g., 680" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Product & Limits */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Product & Limits</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Loan</label>
                        <input type="text" placeholder="e.g., $50,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Max Loan</label>
                        <input type="text" placeholder="e.g., $5,000,000" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Products</label>
                        <input type="text" placeholder="e.g., 7(a) Loan" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Use of Funds</label>
                        <input type="text" placeholder="e.g., Working Capital" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Location Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">States Available</label>
                        <input type="text" placeholder="e.g., All except NY" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Timeline</label>
                        <input type="text" placeholder="e.g., 30-45 days" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Industry Info */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Industry Information</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Industries</label>
                        <input type="text" placeholder="e.g., Retail" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Restricted Industries</label>
                        <input type="text" placeholder="e.g., Healthcare" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Links & Documentation */}
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Links & Documentation</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Google Drive Link</label>
                        <input type="url" placeholder="https://drive.google.com/..." className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                        <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-green-500">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                        <textarea placeholder="Additional notes" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 resize-none" rows={2} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-700 bg-gray-800/50 sticky bottom-0">
              <button
                onClick={() => {
                  if (selectedLenderType) {
                    setSelectedLenderType(null);
                  } else {
                    setShowAddModal(false);
                  }
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                {selectedLenderType ? 'Back' : 'Cancel'}
              </button>
              {selectedLenderType && (
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Add Lender
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

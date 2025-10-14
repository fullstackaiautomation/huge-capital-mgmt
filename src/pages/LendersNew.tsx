// Lenders Page - Updated with Google Sheets Sync
import { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, CheckCircle, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { useLenderDetails } from '../hooks/useLenders';
import type { LenderFilters } from '../types/lender';
import LenderCard from '../components/Lenders/LenderCard';
import { syncAllLendersComplete as syncAllLenders, getLastSyncTime } from '../services/lendersSyncFull';
import { supabase } from '../lib/supabase';

export default function Lenders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<LenderFilters>({});
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [lenders, setLenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasAutoSynced, setHasAutoSynced] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLender, setEditingLender] = useState<any>(null);

  // Fetch lenders with details
  const fetchLenders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('lenders')
        .select(`
          *,
          programs:lender_programs(*),
          contacts:lender_contacts(*),
          performance:lender_performance(*)
        `);

      if (searchTerm) {
        query = query.or(`company_name.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
      }

      query = query.order('company_name');

      const { data, error } = await query;
      if (error) throw error;

      // Transform to app format
      const transformed = (data || []).map((item: any) => ({
        id: item.id,
        companyName: item.company_name,
        website: item.website,
        companyType: item.company_type,
        fundingType: item.funding_type,
        headquartersLocation: item.headquarters_location,
        geographicCoverage: item.geographic_coverage || [],
        status: item.status,
        rating: item.rating,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        programs: (item.programs || []).map((p: any) => ({
          id: p.id,
          lenderId: p.lender_id,
          programName: p.program_name,
          minLoanAmount: p.min_loan_amount,
          maxLoanAmount: p.max_loan_amount,
          minCreditScore: p.min_credit_score,
          rateType: p.rate_type,
          status: p.status,
        })),
        contacts: (item.contacts || []).map((c: any) => ({
          id: c.id,
          lenderId: c.lender_id,
          firstName: c.first_name,
          lastName: c.last_name,
          title: c.title,
          email: c.email,
          phone: c.phone,
          isPrimary: c.is_primary,
          status: c.status,
        })),
        performance: item.performance ? {
          id: item.performance.id,
          lenderId: item.performance.lender_id,
          totalDealsSubmitted: item.performance.total_deals_submitted,
          totalDealsApproved: item.performance.total_deals_approved,
          approvalRate: item.performance.approval_rate,
        } : undefined,
        communicationCount: 0,
      }));

      setLenders(transformed);

      // Get last sync time
      const syncTime = await getLastSyncTime();
      setLastSyncTime(syncTime);
    } catch (error) {
      console.error('Error fetching lenders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load from Supabase
  useEffect(() => {
    fetchLenders();
  }, []);

  // Debounced search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchLenders();
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    setSyncMessage('');

    try {
      const result = await syncAllLenders();

      setSyncStatus('success');
      setSyncMessage(`Synced! Added: ${result.added}, Updated: ${result.updated}`);

      // Refresh the lenders list
      await fetchLenders();

      // Clear message after 5 seconds
      setTimeout(() => setSyncStatus('idle'), 5000);
    } catch (error: any) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setSyncMessage(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const activeLenders = lenders.filter(l => l.status === 'active');
  const avgRating = lenders.filter(l => l.rating).length > 0
    ? (lenders.reduce((sum, l) => sum + (l.rating || 0), 0) / lenders.filter(l => l.rating).length).toFixed(1)
    : 'N/A';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Lenders</h1>
          <p className="text-gray-400 mt-1">
            Manage your lender database and relationships
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-5 h-5" />
          Add Lender
        </button>
      </div>

      {/* Sync Status */}
      {syncStatus !== 'idle' && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            syncStatus === 'success'
              ? 'bg-green-500/10 border border-green-500 text-green-400'
              : 'bg-red-500/10 border border-red-500 text-red-400'
          }`}
        >
          {syncStatus === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Last Sync Time */}
      {lastSyncTime && (
        <div className="text-sm text-gray-400">
          Last synced: {new Date(lastSyncTime).toLocaleString()}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search lenders by name or notes..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Lenders</div>
          <div className="text-2xl font-bold text-white mt-1">
            {loading ? '...' : lenders.length}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Active Lenders</div>
          <div className="text-2xl font-bold text-green-500 mt-1">
            {loading ? '...' : activeLenders.length}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Average Rating</div>
          <div className="text-2xl font-bold text-brand-500 mt-1">
            {loading ? '...' : avgRating}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">With Contacts</div>
          <div className="text-2xl font-bold text-blue-500 mt-1">
            {loading ? '...' : lenders.filter(l => l.contacts.length > 0).length}
          </div>
        </div>
      </div>

      {/* Lenders Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      ) : lenders.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No lenders found</h3>
          <p className="text-gray-400">
            Data synced from Google Sheets
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* SBA Column */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 px-2">SBA</h3>
            <div className="space-y-4">
              {lenders.filter(l => l.fundingType === 'SBA').map((lender) => (
                <LenderCard
                  key={lender.id}
                  lender={lender}
                  onClick={() => console.log('View details:', lender.id)}
                  onEdit={(lender) => {
                    setEditingLender(lender);
                    setShowEditModal(true);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Term Loans Column */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 px-2">Term Loans</h3>
            <div className="space-y-4">
              {lenders.filter(l => l.fundingType === 'Term Loans').map((lender) => (
                <LenderCard
                  key={lender.id}
                  lender={lender}
                  onClick={() => console.log('View details:', lender.id)}
                  onEdit={(lender) => {
                    setEditingLender(lender);
                    setShowEditModal(true);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Business Line of Credits Column */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 px-2">Line of Credit</h3>
            <div className="space-y-4">
              {lenders.filter(l => l.fundingType === 'Business Line of Credits').map((lender) => (
                <LenderCard
                  key={lender.id}
                  lender={lender}
                  onClick={() => console.log('View details:', lender.id)}
                  onEdit={(lender) => {
                    setEditingLender(lender);
                    setShowEditModal(true);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Equipment Financing Column */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 px-2">Equipment Financing</h3>
            <div className="space-y-4">
              {lenders.filter(l => l.fundingType === 'Equipment Financing').map((lender) => (
                <LenderCard
                  key={lender.id}
                  lender={lender}
                  onClick={() => console.log('View details:', lender.id)}
                  onEdit={(lender) => {
                    setEditingLender(lender);
                    setShowEditModal(true);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Lender Modal */}
      {showEditModal && editingLender && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Edit Lender</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingLender(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);

              const lenderData = {
                company_name: formData.get('companyName') as string,
                website: formData.get('website') as string || undefined,
                company_type: formData.get('companyType') as string,
                funding_type: formData.get('fundingType') as string,
                headquarters_location: formData.get('location') as string || undefined,
                notes: formData.get('notes') as string || undefined,
              };

              const { error } = await supabase
                .from('lenders')
                .update(lenderData)
                .eq('id', editingLender.id);

              if (error) {
                console.error('Error updating lender:', error);
                alert('Failed to update lender');
              } else {
                setShowEditModal(false);
                setEditingLender(null);
                await fetchLenders();
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  required
                  defaultValue={editingLender.companyName}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Type *
                  </label>
                  <select
                    name="companyType"
                    required
                    defaultValue={editingLender.companyType}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="bank">Bank</option>
                    <option value="credit_union">Credit Union</option>
                    <option value="private_lender">Private Lender</option>
                    <option value="hard_money">Hard Money</option>
                    <option value="institutional">Institutional</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Funding Type *
                  </label>
                  <select
                    name="fundingType"
                    required
                    defaultValue={editingLender.fundingType}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="SBA">SBA</option>
                    <option value="Term Loans">Term Loans</option>
                    <option value="Business Line of Credits">Business Line of Credits</option>
                    <option value="Equipment Financing">Equipment Financing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  placeholder="https://example.com"
                  defaultValue={editingLender.website}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="City, State"
                  defaultValue={editingLender.headquartersLocation}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={editingLender.notes}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingLender(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lender Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Add New Lender</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);

              const lenderData = {
                company_name: formData.get('companyName') as string,
                website: formData.get('website') as string || undefined,
                company_type: formData.get('companyType') as string,
                funding_type: formData.get('fundingType') as string,
                headquarters_location: formData.get('location') as string || undefined,
                status: 'active' as const,
                notes: formData.get('notes') as string || undefined,
              };

              const { error } = await supabase.from('lenders').insert([lenderData]);

              if (error) {
                console.error('Error adding lender:', error);
                alert('Failed to add lender');
              } else {
                setShowAddModal(false);
                await fetchLenders();
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Type *
                  </label>
                  <select
                    name="companyType"
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="bank">Bank</option>
                    <option value="credit_union">Credit Union</option>
                    <option value="private_lender">Private Lender</option>
                    <option value="hard_money">Hard Money</option>
                    <option value="institutional">Institutional</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Funding Type *
                  </label>
                  <select
                    name="fundingType"
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="SBA">SBA</option>
                    <option value="Term Loans">Term Loans</option>
                    <option value="Business Line of Credits">Business Line of Credits</option>
                    <option value="Equipment Financing">Equipment Financing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="City, State"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                >
                  Add Lender
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

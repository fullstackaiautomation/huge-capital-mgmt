/**
 * Deals Page - Deal Pipeline Management
 * Displays all deals in a pipeline view with status tracking, filtering, and actions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  TrendingUp,
  Building2,
  AlertCircle,
  Loader,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import NewDealModal from '../components/Deals/NewDealModal';
import type { Deal, DealStatus } from '../types/deals';

interface DealWithOwners extends Deal {
  owner_count?: number;
}

interface StatusSummary {
  status: DealStatus;
  count: number;
  color: string;
}

const STATUS_COLORS: Record<DealStatus, string> = {
  New: 'bg-gray-500/20 text-gray-400',
  Analyzing: 'bg-blue-500/20 text-blue-400',
  Matched: 'bg-purple-500/20 text-purple-400',
  Submitted: 'bg-yellow-500/20 text-yellow-400',
  Pending: 'bg-orange-500/20 text-orange-400',
  Approved: 'bg-green-500/20 text-green-400',
  Funded: 'bg-emerald-500/20 text-emerald-400',
  Declined: 'bg-red-500/20 text-red-400',
};

export default function Deals() {
  const [deals, setDeals] = useState<DealWithOwners[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<DealStatus | 'All'>('All');
  const [filterLoanType, setFilterLoanType] = useState<'All' | 'MCA' | 'Business LOC'>('All');
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [sortBy, setSortBy] = useState<'created' | 'amount' | 'status'>('created');
  const navigate = useNavigate();

  // Fetch deals on mount
  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (dealsError) throw dealsError;

      // Fetch owner counts for each deal
      const dealsWithOwners = await Promise.all(
        (dealsData || []).map(async (deal) => {
          const { count } = await supabase
            .from('deal_owners')
            .select('*', { count: 'exact', head: true })
            .eq('deal_id', deal.id);

          return {
            ...deal,
            owner_count: count || 0,
          };
        })
      );

      setDeals(dealsWithOwners);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search deals
  let filteredDeals = deals;

  if (searchTerm) {
    filteredDeals = filteredDeals.filter(
      (d) =>
        d.legal_business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.dba_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.ein?.includes(searchTerm)
    );
  }

  if (filterStatus !== 'All') {
    filteredDeals = filteredDeals.filter((d) => d.status === filterStatus);
  }

  if (filterLoanType !== 'All') {
    filteredDeals = filteredDeals.filter((d) => d.loan_type === filterLoanType);
  }

  // Sort deals
  if (sortBy === 'amount') {
    filteredDeals.sort((a, b) => (b.desired_loan_amount || 0) - (a.desired_loan_amount || 0));
  } else if (sortBy === 'status') {
    const statusOrder: Record<DealStatus, number> = {
      New: 0,
      Analyzing: 1,
      Matched: 2,
      Submitted: 3,
      Pending: 4,
      Approved: 5,
      Funded: 6,
      Declined: 7,
    };
    filteredDeals.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }

  // Calculate status summary
  const statusSummary: StatusSummary[] = (
    [
      'New',
      'Analyzing',
      'Matched',
      'Submitted',
      'Pending',
      'Approved',
      'Funded',
      'Declined',
    ] as DealStatus[]
  )
    .map((status) => ({
      status,
      count: deals.filter((d) => d.status === status).length,
      color: STATUS_COLORS[status],
    }))
    .filter((s) => s.count > 0);

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const { error } = await supabase.from('deals').delete().eq('id', dealId);
      if (error) throw error;
      setDeals(deals.filter((d) => d.id !== dealId));
    } catch (err) {
      console.error('Error deleting deal:', err);
      alert('Failed to delete deal');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700/30 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-indigo-400" />
                Deals Pipeline
              </h1>
              <p className="text-gray-400 mt-1">Manage and track deal submissions</p>
            </div>
            <button
              onClick={() => setShowNewDealModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              New Deal
            </button>
          </div>

          {/* Status Pipeline */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {statusSummary.map((item) => (
              <button
                key={item.status}
                onClick={() => setFilterStatus(filterStatus === item.status ? 'All' : item.status)}
                className={`p-3 rounded-lg text-center transition-all ${
                  filterStatus === item.status ? item.color : 'bg-gray-700/30 text-gray-400'
                }`}
              >
                <div className="text-lg font-bold">{item.count}</div>
                <div className="text-xs">{item.status}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-4 flex-col sm:flex-row">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search by business name, DBA, or EIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700/30 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterLoanType}
                onChange={(e) => setFilterLoanType(e.target.value as any)}
                className="bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Loan Types</option>
                <option value="MCA">MCA</option>
                <option value="Business LOC">Business LOC</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-800/50 border border-gray-700/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="created">Newest First</option>
                <option value="amount">Highest Amount</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-red-400 font-medium">Error</h3>
              <p className="text-red-300/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Deals Grid */}
        {!loading && !error && filteredDeals.length > 0 && (
          <div className="grid gap-4">
            {filteredDeals.map((deal) => (
              <div
                key={deal.id}
                className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-lg p-5 hover:border-gray-700/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                      {deal.legal_business_name}
                    </h3>
                    {deal.dba_name && <p className="text-sm text-gray-400">DBA: {deal.dba_name}</p>}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[deal.status]}`}>
                    {deal.status}
                  </div>
                </div>

                {/* Deal Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Loan Amount</p>
                    <p className="text-base font-semibold text-white">
                      ${(deal.desired_loan_amount || 0).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Loan Type</p>
                    <p className="text-sm text-gray-300">{deal.loan_type}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">EIN</p>
                    <p className="text-sm text-gray-300">{deal.ein || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created</p>
                    <p className="text-sm text-gray-300">
                      {new Date(deal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-700/30">
                  <button
                    onClick={() => navigate(`/deals/${deal.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-3 py-2 rounded-lg transition-all text-sm font-medium"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      /* Edit deal */
                    }}
                    className="px-3 py-2 bg-gray-700/20 hover:bg-gray-700/40 text-gray-400 hover:text-gray-300 rounded-lg transition-all text-sm font-medium"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteDeal(deal.id)}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredDeals.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-400 mb-1">No deals found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'All' || filterLoanType !== 'All'
                ? 'Try adjusting your filters'
                : 'Create your first deal to get started'}
            </p>
            {!searchTerm && filterStatus === 'All' && filterLoanType === 'All' && (
              <button
                onClick={() => setShowNewDealModal(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                Create First Deal
              </button>
            )}
          </div>
        )}
      </div>

      {/* New Deal Modal */}
      <NewDealModal
        isOpen={showNewDealModal}
        onClose={() => setShowNewDealModal(false)}
        onSuccess={fetchDeals}
      />
    </div>
  );
}

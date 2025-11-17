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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import NewDealModal from '../components/Deals/NewDealModal';
import type { Deal, DealStatus, DealOwner, DealBankStatement } from '../types/deals';

interface DealWithOwners extends Deal {
  owner_count?: number;
  owners?: DealOwner[];
  statements?: DealBankStatement[];
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
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);
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

      // Get unique user IDs
      const userIds = [...new Set(dealsData?.map(d => d.user_id) || [])];

      // Fetch broker emails for all unique users using RPC
      const brokerMap = new Map<string, string | null>();

      for (const userId of userIds) {
        try {
          const { data: email } = await supabase.rpc('get_user_email', { user_uuid: userId });
          brokerMap.set(userId, email);
        } catch (e) {
          console.error(`Failed to fetch email for user ${userId}:`, e);
          brokerMap.set(userId, null);
        }
      }

      // Fetch owner counts, owners, and statements for each deal
      const dealsWithOwners = await Promise.all(
        (dealsData || []).map(async (deal) => {
          const [{ count }, { data: owners }, { data: statements }] = await Promise.all([
            supabase
              .from('deal_owners')
              .select('*', { count: 'exact', head: true })
              .eq('deal_id', deal.id),
            supabase
              .from('deal_owners')
              .select('*')
              .eq('deal_id', deal.id)
              .order('owner_number', { ascending: true }),
            supabase
              .from('deal_bank_statements')
              .select('*')
              .eq('deal_id', deal.id)
              .order('statement_month', { ascending: false }),
          ]);

          const brokerEmail = brokerMap.get(deal.user_id) || null;
          const brokerName = brokerEmail?.split('@')[0] || 'Unknown';

          return {
            ...deal,
            owner_count: count || 0,
            owners: owners || [],
            statements: statements || [],
            broker_email: brokerEmail,
            broker_name: brokerName,
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
          <div className="flex items-center justify-between gap-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-indigo-400" />
                Deals Pipeline
              </h1>
              <p className="text-gray-400 mt-1">Manage and track deal submissions</p>
            </div>

            {/* Status Cards */}
            <div className="flex gap-3">
              {statusSummary.slice(0, 2).map((item) => (
                <button
                  key={item.status}
                  onClick={() => setFilterStatus(filterStatus === item.status ? 'All' : item.status)}
                  className={`p-3 rounded-lg text-center transition-all min-w-[100px] ${
                    filterStatus === item.status ? item.color : 'bg-gray-700/30 text-gray-400'
                  }`}
                >
                  <div className="text-2xl font-bold">{item.count}</div>
                  <div className="text-sm">{item.status}</div>
                </button>
              ))}
            </div>

            {/* New Deal Button */}
            <button
              onClick={() => setShowNewDealModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-all font-bold text-lg"
            >
              <Plus className="w-8 h-8" />
              New Deal
            </button>
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
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                    {/* Business Name Column */}
                    <div>
                      <p className="text-sm text-gray-400 mb-1">BUSINESS NAME</p>
                      <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                        {deal.legal_business_name}
                      </h3>
                      {deal.dba_name && <p className="text-sm text-gray-400">{deal.dba_name}</p>}
                    </div>

                    {/* Broker */}
                    <div>
                      <p className="text-sm text-gray-400 mb-1">BROKER</p>
                      <h3 className="text-lg font-semibold text-white">
                        {deal.broker_name || 'Unknown'}
                      </h3>
                    </div>

                    {/* Loan Amount */}
                    <div>
                      <p className="text-sm text-gray-400 mb-1">LOAN AMOUNT</p>
                      <h3 className="text-lg font-semibold text-white">
                        ${(deal.desired_loan_amount || 0).toLocaleString()}
                      </h3>
                    </div>

                    {/* Loan Type */}
                    <div>
                      <p className="text-sm text-gray-400 mb-1">LOAN TYPE</p>
                      <h3 className="text-lg font-semibold text-white">{deal.loan_type}</h3>
                    </div>

                    {/* EIN */}
                    <div>
                      <p className="text-sm text-gray-400 mb-1">EIN</p>
                      <h3 className="text-lg font-semibold text-white">{deal.ein || 'N/A'}</h3>
                    </div>

                    {/* Created */}
                    <div>
                      <p className="text-sm text-gray-400 mb-1">CREATED</p>
                      <h3 className="text-lg font-semibold text-white">
                        {new Date(deal.created_at).toLocaleDateString()}
                      </h3>
                    </div>
                  </div>

                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[deal.status]}`}>
                    {deal.status}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedDealId === deal.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column - Owners */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="w-5 h-5 text-indigo-400" />
                          <h4 className="text-lg font-semibold text-white">Owners</h4>
                        </div>
                        <div className="space-y-3">
                          {deal.owners && deal.owners.length > 0 ? (
                            deal.owners.map((owner) => (
                              <div
                                key={owner.id}
                                className="bg-gray-700/20 rounded-lg p-3 border border-gray-700/30"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-semibold text-white">{owner.full_name}</h5>
                                  {owner.ownership_percent && (
                                    <span className="text-sm text-indigo-400 font-medium">
                                      {owner.ownership_percent}%
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1 text-sm text-gray-400">
                                  <p>
                                    {owner.street_address}, {owner.city}, {owner.state} {owner.zip}
                                  </p>
                                  {owner.email && (
                                    <p>
                                      <span className="text-gray-500">Email:</span> {owner.email}
                                    </p>
                                  )}
                                  {owner.phone && (
                                    <p>
                                      <span className="text-gray-500">Phone:</span> {owner.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 italic">No owners recorded</p>
                          )}
                        </div>
                      </div>

                      {/* Right Column - Financial Overview */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                          <h4 className="text-lg font-semibold text-white">Financial Overview</h4>
                        </div>
                        <div className="space-y-3">
                          {/* Key Financial Metrics */}
                          <div className="bg-gray-700/20 rounded-lg p-3 border border-gray-700/30 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-400">Avg Monthly Sales</span>
                              <span className="text-sm font-semibold text-white">
                                {deal.average_monthly_sales
                                  ? `$${deal.average_monthly_sales.toLocaleString()}`
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-400">Avg Monthly Card Sales</span>
                              <span className="text-sm font-semibold text-white">
                                {deal.average_monthly_card_sales
                                  ? `$${deal.average_monthly_card_sales.toLocaleString()}`
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-400">Time in Business</span>
                              <span className="text-sm font-semibold text-white">
                                {deal.time_in_business_months
                                  ? `${Math.floor(deal.time_in_business_months / 12)} years, ${
                                      deal.time_in_business_months % 12
                                    } months`
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* Bank Statements Table */}
                          {deal.statements && deal.statements.length > 0 && (() => {
                            // Sort statements by month ascending (oldest first)
                            const sortedStatements = [...deal.statements].sort((a, b) => {
                              return a.statement_month.localeCompare(b.statement_month);
                            });

                            // Calculate 3-month and 6-month averages (take from end for most recent)
                            const last3Months = sortedStatements.slice(-3);
                            const last6Months = sortedStatements.slice(-6);

                            const calculateAverage = (statements: typeof sortedStatements) => {
                              const count = statements.length;
                              if (count === 0) return { credits: null, debits: null, nsfs: 0, deposits: null, avgBal: null };

                              const totals = statements.reduce((acc, stmt) => ({
                                credits: acc.credits + (stmt.credits || 0),
                                debits: acc.debits + (stmt.debits || 0),
                                nsfs: acc.nsfs + (stmt.nsfs || 0),
                                deposits: acc.deposits + (stmt.deposit_count || 0),
                                avgBal: acc.avgBal + (stmt.average_daily_balance || 0),
                              }), { credits: 0, debits: 0, nsfs: 0, deposits: 0, avgBal: 0 });

                              return {
                                credits: Math.round(totals.credits / count),
                                debits: Math.round(totals.debits / count),
                                nsfs: Math.round(totals.nsfs / count),
                                deposits: Math.round(totals.deposits / count),
                                avgBal: Math.round(totals.avgBal / count),
                              };
                            };

                            const avg3Month = calculateAverage(last3Months);
                            const avg6Month = calculateAverage(last6Months);

                            return (
                              <div className="bg-gray-700/20 rounded-lg border border-gray-700/30 overflow-hidden">
                                <div className="px-3 py-2 border-b border-gray-700/30">
                                  <h5 className="text-sm font-semibold text-gray-300">
                                    Bank Statements ({deal.statements.length})
                                  </h5>
                                </div>
                                <div className="overflow-x-auto max-h-96">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-800/50 border-b border-gray-700/30 sticky top-0">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">ID</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Month</th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Credits</th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Debits</th>
                                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-400 uppercase">NSFs</th>
                                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-400 uppercase">Dep</th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Ave Bal</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700/20">
                                      {sortedStatements.map((statement, index) => (
                                        <tr key={statement.id} className={`hover:bg-gray-700/10 transition-colors ${index % 2 === 0 ? 'bg-gray-900/20' : ''}`}>
                                          <td className="px-3 py-2 text-gray-300 font-mono text-xs">
                                            {statement.id.slice(0, 5)}
                                          </td>
                                          <td className="px-3 py-2 text-white font-medium">
                                            {statement.statement_month}
                                          </td>
                                          <td className="px-3 py-2 text-right text-green-400 font-medium">
                                            ${statement.credits?.toLocaleString() ?? 'N/A'}
                                          </td>
                                          <td className="px-3 py-2 text-right text-red-400 font-medium">
                                            ${statement.debits?.toLocaleString() ?? 'N/A'}
                                          </td>
                                          <td className="px-3 py-2 text-center text-white">
                                            {statement.nsfs ?? 0}
                                          </td>
                                          <td className="px-3 py-2 text-center text-white">
                                            {statement.deposit_count ?? statement.overdrafts ?? 'N/A'}
                                          </td>
                                          <td className="px-3 py-2 text-right text-blue-400 font-medium">
                                            ${statement.average_daily_balance?.toLocaleString() ?? 'N/A'}
                                          </td>
                                        </tr>
                                      ))}

                                      {/* 3-Month Average */}
                                      {last3Months.length >= 3 && (
                                        <tr className="bg-indigo-500/10 border-t-2 border-indigo-500/30 font-semibold">
                                          <td className="px-3 py-2 text-gray-400 text-xs" colSpan={2}>
                                            Last 3 Month Avg
                                          </td>
                                          <td className="px-3 py-2 text-right text-green-300">
                                            ${avg3Month.credits?.toLocaleString() ?? 'N/A'}
                                          </td>
                                          <td className="px-3 py-2 text-right text-red-300">
                                            ${avg3Month.debits?.toLocaleString() ?? 'N/A'}
                                          </td>
                                          <td className="px-3 py-2 text-center text-white">
                                            {avg3Month.nsfs}
                                          </td>
                                          <td className="px-3 py-2 text-center text-white">
                                            {avg3Month.deposits}
                                          </td>
                                          <td className="px-3 py-2 text-right text-blue-300">
                                            ${avg3Month.avgBal?.toLocaleString() ?? 'N/A'}
                                          </td>
                                        </tr>
                                      )}

                                      {/* 6-Month Average */}
                                      {last6Months.length >= 6 && (
                                        <tr className="bg-purple-500/10 border-t border-purple-500/30 font-semibold">
                                          <td className="px-3 py-2 text-gray-400 text-xs" colSpan={2}>
                                            Last 6 Month Avg
                                          </td>
                                          <td className="px-3 py-2 text-right text-green-300">
                                            ${avg6Month.credits?.toLocaleString() ?? 'N/A'}
                                          </td>
                                          <td className="px-3 py-2 text-right text-red-300">
                                            ${avg6Month.debits?.toLocaleString() ?? 'N/A'}
                                          </td>
                                          <td className="px-3 py-2 text-center text-white">
                                            {avg6Month.nsfs}
                                          </td>
                                          <td className="px-3 py-2 text-center text-white">
                                            {avg6Month.deposits}
                                          </td>
                                          <td className="px-3 py-2 text-right text-blue-300">
                                            ${avg6Month.avgBal?.toLocaleString() ?? 'N/A'}
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Documents Link */}
                          {deal.application_google_drive_link && (
                            <a
                              href={deal.application_google_drive_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors py-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20"
                            >
                              View Documents Folder →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-700/30">
                  <button
                    onClick={() => setExpandedDealId(expandedDealId === deal.id ? null : deal.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-3 py-2 rounded-lg transition-all text-sm font-medium"
                  >
                    {expandedDealId === deal.id ? (
                      <>
                        Hide Details
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        View Details
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => navigate(`/deals/${deal.id}`)}
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

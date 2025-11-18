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
  FileText,
  MapPin,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import NewDealModal from '../components/Deals/NewDealModal';
import type { Deal, DealStatus, DealOwner, DealBankStatement } from '../types/deals';

interface DealWithOwners extends Deal {
  broker_name?: string;
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
              .select(`
                *,
                deal_funding_positions (*)
              `)
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
                      {deal.city && deal.state && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {deal.city}, {deal.state}
                        </p>
                      )}
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

                    {/* Time in Business */}
                    <div>
                      <p className="text-sm text-gray-400 mb-1">TIME IN BUSINESS</p>
                      <h3 className="text-lg font-semibold text-white">
                        {deal.time_in_business_months ? (() => {
                          const years = Math.floor(deal.time_in_business_months / 12);
                          const months = deal.time_in_business_months % 12;
                          if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
                          if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
                          return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
                        })() : '—'}
                      </h3>
                    </div>

                    {/* Broker */}
                    <div>
                      <p className="text-sm text-gray-400 mb-1">BROKER</p>
                      <h3 className="text-lg font-semibold text-white">
                        {deal.broker_name || 'Unknown'}
                      </h3>
                    </div>
                  </div>

                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[deal.status]}`}>
                    {deal.status}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedDealId === deal.id && (() => {
                  // Calculate funding position summaries
                  let activeMonthlyCommitment = 0;
                  let unclearTotal = 0;
                  let activeCount = 0;
                  let unclearCount = 0;

                  if (deal.statements && deal.statements.length > 0) {
                    // Helper function to normalize lender names
                    const normalizeLenderName = (name: string): string => {
                      let normalized = name.toLowerCase().trim();
                      const suffixes = ['payments', 'payment', 'funding', 'capital', 'partners', 'partner', 'inc', 'llc', 'corp', 'corporation', 'select', 'group', 'financial', 'services'];
                      let changed = true;
                      while (changed) {
                        changed = false;
                        for (const suffix of suffixes) {
                          const pattern = new RegExp(`\\s+${suffix}$`, 'i');
                          if (pattern.test(normalized)) {
                            normalized = normalized.replace(pattern, '').trim();
                            changed = true;
                          }
                        }
                      }
                      return normalized;
                    };

                    // Consolidate positions
                    const consolidatedPositions = new Map<string, { lender_name: string; amount: number; frequency: string; dates: string[] }>();
                    deal.statements.forEach((statement: any) => {
                      statement.deal_funding_positions?.forEach((position: any) => {
                        const normalizedName = normalizeLenderName(position.lender_name);
                        const key = `${normalizedName}|${position.amount}`;
                        if (consolidatedPositions.has(key)) {
                          const existing = consolidatedPositions.get(key)!;
                          existing.dates.push(...position.detected_dates);
                        } else {
                          consolidatedPositions.set(key, {
                            lender_name: position.lender_name,
                            amount: position.amount,
                            frequency: position.frequency,
                            dates: [...position.detected_dates],
                          });
                        }
                      });
                    });

                    // Determine status
                    const getStatus = (dates: string[]): 'New' | 'Active' | 'Closed' | 'Unclear' => {
                      const uniqueDates = [...new Set(dates)].sort();
                      if (uniqueDates.length === 0) return 'Closed';
                      const statementMonths = new Set<string>();
                      deal.statements?.forEach((stmt: any) => statementMonths.add(stmt.statement_month));
                      const sortedMonths = Array.from(statementMonths).sort().reverse();
                      if (sortedMonths.length === 0) return 'Closed';
                      const mostRecentMonth = sortedMonths[0];
                      const secondMostRecentMonth = sortedMonths.length > 1 ? sortedMonths[1] : null;
                      const hasRecentPayment = uniqueDates.some(dateStr => dateStr.startsWith(mostRecentMonth.substring(0, 7)));
                      const hasSecondRecentPayment = secondMostRecentMonth ? uniqueDates.some(dateStr => dateStr.startsWith(secondMostRecentMonth.substring(0, 7))) : false;
                      if (uniqueDates.length === 1 && (hasRecentPayment || hasSecondRecentPayment)) return 'Unclear';
                      if (hasRecentPayment && !hasSecondRecentPayment && uniqueDates.length >= 2) return 'New';
                      if (!hasRecentPayment && !hasSecondRecentPayment) return 'Closed';
                      if (hasRecentPayment && hasSecondRecentPayment) return 'Active';
                      return 'Closed';
                    };

                    // Calculate totals
                    Array.from(consolidatedPositions.values()).forEach(position => {
                      const status = getStatus(position.dates);
                      if (status === 'Active') {
                        activeCount++;
                        let monthlyAmount = 0;
                        if (position.frequency.toLowerCase().includes('weekly')) monthlyAmount = position.amount * 4;
                        else if (position.frequency.toLowerCase().includes('daily')) monthlyAmount = position.amount * 22;
                        else if (position.frequency.toLowerCase().includes('bi-weekly') || position.frequency.toLowerCase().includes('biweekly')) monthlyAmount = position.amount * 2;
                        else monthlyAmount = position.amount;
                        activeMonthlyCommitment += monthlyAmount;
                      } else if (status === 'Unclear') {
                        unclearCount++;
                        unclearTotal += position.amount;
                      }
                    });
                  }

                  return (
                  <div className="mt-4 pt-4 border-t border-gray-700/30">
                    {/* Info Cards Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                      <div className="bg-gray-900/40 rounded-lg border border-gray-700/40 p-4">
                        {deal.owners && deal.owners.length > 0 ? (
                          <>
                            <p className="text-xs text-gray-500 uppercase mb-1">
                              {deal.owners[0].full_name || 'Unknown'} ({deal.owners[0].ownership_percent || 0}%)
                            </p>
                            <p className="text-sm text-gray-400">
                              {deal.owners[0].email || 'No email'}
                            </p>
                            <p className="text-sm text-gray-400">
                              {deal.owners[0].phone || 'No phone'}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500 uppercase">No owner info</p>
                        )}
                      </div>
                      <div className="bg-gray-900/40 rounded-lg border border-gray-700/40 p-4">
                        <p className="text-xs text-gray-500 uppercase">Monthly Revenue</p>
                        <p className="text-lg text-white font-semibold mt-2">
                          {deal.average_monthly_sales ? `$${Number(deal.average_monthly_sales).toLocaleString()}` : '—'}
                        </p>
                      </div>
                      <div className="bg-gray-900/40 rounded-lg border border-gray-700/40 p-4">
                        <p className="text-xs text-gray-500 uppercase">Card Sales</p>
                        <p className="text-lg text-white font-semibold mt-2">
                          {deal.average_monthly_card_sales ? `$${Number(deal.average_monthly_card_sales).toLocaleString()}` : '—'}
                        </p>
                      </div>
                      {activeCount > 0 && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                          <p className="text-xs text-green-400 uppercase font-semibold mb-2">{activeCount} Active Position{activeCount !== 1 ? 's' : ''}</p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-2xl text-green-300 font-bold">
                              ${Math.round(activeMonthlyCommitment).toLocaleString()}
                            </p>
                            <p className="text-xs text-green-400/80">Monthly</p>
                          </div>
                        </div>
                      )}
                      {unclearCount > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                          <p className="text-xs text-yellow-400 uppercase font-semibold mb-2">{unclearCount} Unclear Position{unclearCount !== 1 ? 's' : ''}</p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-2xl text-yellow-300 font-bold">
                              ${Math.round(unclearTotal).toLocaleString()}
                            </p>
                            <p className="text-xs text-yellow-400/80">Total</p>
                          </div>
                        </div>
                      )}
                      <div className="bg-gray-900/40 rounded-lg border border-gray-700/40 p-4">
                        <p className="text-xs text-gray-500 uppercase">Created</p>
                        <p className="text-lg text-white font-semibold mt-2">
                          {new Date(deal.created_at).toLocaleDateString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Two-column layout: Bank Statements & Funding Positions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Bank Statements Section */}
                      <section className="bg-gray-800/30 border border-gray-700/30 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-gray-700/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-6 h-6 text-indigo-300" />
                              <div>
                                <h2 className="text-xl font-semibold text-white">Bank Statements</h2>
                                <p className="text-gray-400 text-sm">Financial metrics from analyzed statements.</p>
                              </div>
                            </div>
                            {deal.application_google_drive_link && (
                              <a
                                href={deal.application_google_drive_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 font-medium"
                              >
                                <FileText className="w-4 h-4" />
                                View in Drive
                              </a>
                            )}
                          </div>
                        </div>

                        {!deal.statements || deal.statements.length === 0 ? (
                          <div className="p-6">
                            <p className="text-gray-400 text-sm">No bank statements were attached to this deal.</p>
                          </div>
                        ) : (() => {
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
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-900/50 border-b border-gray-700/30">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Month</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Credits</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Debits</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">NSFs</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Dep</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Ave Bal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/20">
                                  {sortedStatements.map((statement, index) => (
                                    <tr key={statement.id} className={`hover:bg-gray-700/10 transition-colors ${index % 2 === 0 ? 'bg-gray-900/20' : ''}`}>
                                      <td className="px-4 py-3 text-white font-medium">
                                        {statement.statement_month}
                                      </td>
                                      <td className="px-4 py-3 text-right text-green-400 font-medium">
                                        ${statement.credits ? Math.round(statement.credits).toLocaleString() : 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-right text-red-400 font-medium">
                                        ${statement.debits ? Math.round(statement.debits).toLocaleString() : 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-center text-white">
                                        {statement.nsfs ?? 0}
                                      </td>
                                      <td className="px-4 py-3 text-center text-white">
                                        {statement.deposit_count ?? statement.overdrafts ?? 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-right text-blue-400 font-medium">
                                        ${statement.average_daily_balance ? Math.round(statement.average_daily_balance).toLocaleString() : 'N/A'}
                                      </td>
                                    </tr>
                                  ))}

                                  {/* 3-Month Average */}
                                  {last3Months.length >= 3 && (
                                    <tr className="bg-indigo-500/10 border-t-2 border-indigo-500/30 font-semibold">
                                      <td className="px-4 py-3 text-gray-400 text-xs">
                                        Last 3 Month Average
                                      </td>
                                      <td className="px-4 py-3 text-right text-green-300">
                                        ${avg3Month.credits?.toLocaleString() ?? 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-right text-red-300">
                                        ${avg3Month.debits?.toLocaleString() ?? 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-center text-white">
                                        {avg3Month.nsfs}
                                      </td>
                                      <td className="px-4 py-3 text-center text-white">
                                        {avg3Month.deposits}
                                      </td>
                                      <td className="px-4 py-3 text-right text-blue-300">
                                        ${avg3Month.avgBal?.toLocaleString() ?? 'N/A'}
                                      </td>
                                    </tr>
                                  )}

                                  {/* 6-Month Average */}
                                  {last6Months.length >= 6 && (
                                    <tr className="bg-purple-500/10 border-t border-purple-500/30 font-semibold">
                                      <td className="px-4 py-3 text-gray-400 text-xs">
                                        Last 6 Month Average
                                      </td>
                                      <td className="px-4 py-3 text-right text-green-300">
                                        ${avg6Month.credits?.toLocaleString() ?? 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-right text-red-300">
                                        ${avg6Month.debits?.toLocaleString() ?? 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-center text-white">
                                        {avg6Month.nsfs}
                                      </td>
                                      <td className="px-4 py-3 text-center text-white">
                                        {avg6Month.deposits}
                                      </td>
                                      <td className="px-4 py-3 text-right text-blue-300">
                                        ${avg6Month.avgBal?.toLocaleString() ?? 'N/A'}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </section>

                      {/* Funding Positions Section */}
                      {deal.statements && deal.statements.some((s: any) => s.deal_funding_positions?.length > 0) && (
                        <section className="bg-gray-800/30 border border-gray-700/30 rounded-xl overflow-hidden">
                          <div className="p-6 border-b border-gray-700/30 bg-gray-900/20">
                            <h3 className="text-xl font-semibold text-white mb-1">Detected Funding Positions</h3>
                            <p className="text-gray-400 text-sm">Active and historical funding detected from bank statements.</p>
                          </div>
                          <div className="p-6 space-y-4">
                            {(() => {
                              // Helper function to normalize lender names for matching
                              const normalizeLenderName = (name: string): string => {
                                let normalized = name.toLowerCase().trim();

                              // Remove common suffixes iteratively (in case there are multiple)
                              const suffixes = ['payments', 'payment', 'funding', 'capital', 'partners', 'partner', 'inc', 'llc', 'corp', 'corporation', 'select', 'group', 'financial', 'services'];

                              let changed = true;
                              while (changed) {
                                changed = false;
                                for (const suffix of suffixes) {
                                  const pattern = new RegExp(`\\s+${suffix}$`, 'i');
                                  if (pattern.test(normalized)) {
                                    normalized = normalized.replace(pattern, '').trim();
                                    changed = true;
                                  }
                                }
                              }

                              return normalized;
                            };

                            // Consolidate funding positions by normalized name + amount
                            const consolidatedPositions = new Map<string, {
                              lender_name: string;
                              amount: number;
                              frequency: string;
                              dates: string[];
                            }>();

                            deal.statements.forEach((statement: any) => {
                              statement.deal_funding_positions?.forEach((position: any) => {
                                const normalizedName = normalizeLenderName(position.lender_name);
                                const key = `${normalizedName}|${position.amount}`;

                                if (consolidatedPositions.has(key)) {
                                  const existing = consolidatedPositions.get(key)!;
                                  existing.dates.push(...position.detected_dates);
                                } else {
                                  consolidatedPositions.set(key, {
                                    lender_name: position.lender_name,
                                    amount: position.amount,
                                    frequency: position.frequency,
                                    dates: [...position.detected_dates],
                                  });
                                }
                              });
                            });

                            // Format date for display
                            const formatDate = (dateStr: string): string => {
                              const date = new Date(dateStr);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            };

                            // Determine status based on date patterns
                            const getStatus = (dates: string[]): 'New' | 'Active' | 'Closed' | 'Unclear' => {
                              const uniqueDates = [...new Set(dates)].sort();
                              if (uniqueDates.length === 0) return 'Closed';

                              // Find all unique bank statements (by month)
                              const statementMonths = new Set<string>();
                              deal.statements?.forEach((stmt: any) => {
                                statementMonths.add(stmt.statement_month);
                              });

                              // Get sorted statement months (most recent first)
                              const sortedMonths = Array.from(statementMonths).sort().reverse();

                              if (sortedMonths.length === 0) return 'Closed';

                              const mostRecentMonth = sortedMonths[0];
                              const secondMostRecentMonth = sortedMonths.length > 1 ? sortedMonths[1] : null;

                              // Check if any payment dates fall within the most recent statement month
                              const hasRecentPayment = uniqueDates.some(dateStr => {
                                return dateStr.startsWith(mostRecentMonth.substring(0, 7)); // YYYY-MM comparison
                              });

                              // Check if any payment dates fall within the second most recent month
                              const hasSecondRecentPayment = secondMostRecentMonth
                                ? uniqueDates.some(dateStr => dateStr.startsWith(secondMostRecentMonth.substring(0, 7)))
                                : false;

                              // Unclear: Only one occurrence detected AND it's in the most recent two months
                              if (uniqueDates.length === 1 && (hasRecentPayment || hasSecondRecentPayment)) {
                                return 'Unclear';
                              }

                              // New: Appears in recent month, has multiple occurrences, but no older history
                              if (hasRecentPayment && !hasSecondRecentPayment && uniqueDates.length >= 2) {
                                return 'New';
                              }

                              // Closed: Does NOT appear in the most recent 2 months
                              if (!hasRecentPayment && !hasSecondRecentPayment) {
                                return 'Closed';
                              }

                              // Active: Appears in recent month and has history from previous months
                              if (hasRecentPayment && hasSecondRecentPayment) {
                                return 'Active';
                              }

                              return 'Closed';
                            };

                            // Sort positions by number of occurrences (descending)
                            const sortedPositions = Array.from(consolidatedPositions.values()).sort((a, b) => {
                              const uniqueDatesA = [...new Set(a.dates)].length;
                              const uniqueDatesB = [...new Set(b.dates)].length;
                              return uniqueDatesB - uniqueDatesA; // Descending order
                            });

                            // Calculate summaries for Active and Unclear positions
                            const positionsWithStatus = sortedPositions.map(position => {
                              const uniqueDates = [...new Set(position.dates)].sort();
                              const status = getStatus(position.dates);
                              return { ...position, status, uniqueDates };
                            });

                            const activePositions = positionsWithStatus.filter(p => p.status === 'Active');
                            const unclearPositions = positionsWithStatus.filter(p => p.status === 'Unclear');

                            const activeMonthlyCommitment = activePositions.reduce((sum, p) => {
                              // Estimate monthly amount based on frequency
                              let monthlyAmount = 0;
                              if (p.frequency.toLowerCase().includes('weekly')) {
                                monthlyAmount = p.amount * 4;
                              } else if (p.frequency.toLowerCase().includes('daily')) {
                                monthlyAmount = p.amount * 22; // ~22 business days
                              } else if (p.frequency.toLowerCase().includes('bi-weekly') || p.frequency.toLowerCase().includes('biweekly')) {
                                monthlyAmount = p.amount * 2;
                              } else {
                                // Assume monthly
                                monthlyAmount = p.amount;
                              }
                              return sum + monthlyAmount;
                            }, 0);

                            const unclearTotal = unclearPositions.reduce((sum, p) => sum + p.amount, 0);

                            // Status badge colors
                            const statusColors = {
                              'New': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                              'Active': 'bg-green-500/20 text-green-300 border-green-500/30',
                              'Closed': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                              'Unclear': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                            };

                              return (
                                <>
                                  {/* Positions List */}
                                  <div className="space-y-3">
                                    {positionsWithStatus.map((position, idx) => {
                                      const formattedDates = position.uniqueDates.map(formatDate).join(', ');
                                      const status = position.status;

                                      return (
                                        <div key={idx} className="group/position flex items-center gap-3 text-sm bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3 relative isolate">
                                          <span className={`text-xs font-semibold px-2 py-1 rounded border flex-shrink-0 ${statusColors[status]}`}>
                                            {status}
                                          </span>
                                          <span className="font-medium text-indigo-100 text-lg flex-1">{position.lender_name}</span>
                                          <div className="flex items-center gap-3 text-lg flex-shrink-0 relative whitespace-nowrap">
                                            <span className="text-indigo-200 font-medium">{position.uniqueDates.length}x</span>
                                            <span className="text-indigo-200 font-medium">${Math.round(position.amount).toLocaleString()} • {position.frequency}</span>
                                            {position.uniqueDates.length > 0 && (
                                              <div className="absolute top-full right-0 mt-2 hidden group-hover/position:block bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-indigo-300 whitespace-nowrap z-[100] shadow-lg pointer-events-none">
                                                Dates: {formattedDates}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </section>
                      )}
                    </div>
                  </div>
                  );
                })()}

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

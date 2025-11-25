import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader, AlertCircle, Building2, DollarSign, MapPin, FileText, ChevronRight, Pencil, Star, TrendingUp, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Deal } from '../types/deals';
import EditDealModal from '../components/Deals/EditDealModal';

interface DealOwner {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  ownership_percent: number | null;
  street_address: string;
  city: string;
  state: string;
  zip: string;
}

interface DealBankStatement {
  id: string;
  bank_name: string;
  statement_month: string;
  credits: number | null;
  debits: number | null;
  nsfs: number;
  overdrafts: number;
  negative_days: number;
  average_daily_balance: number | null;
  deposit_count: number | null;
  deal_funding_positions: Array<{
    id: string;
    lender_name: string;
    amount: number;
    frequency: string;
    detected_dates: string[];
  }>;
}

interface DealWithRelations extends Deal {
  broker_name?: string;
  deal_owners: DealOwner[];
  deal_bank_statements: DealBankStatement[];
  deal_lender_matches: Array<{
    id: string;
    lender_name: string;
    lender_table: string;
    is_ifs: boolean;
    match_score: number | null;
    match_reasoning: string | null;
    selected_by_broker: boolean;
    submission_status: string;
  }>;
}

export default function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<DealWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchDeal = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('deals')
        .select(`
          *,
          deal_owners(*),
          deal_bank_statements(*, deal_funding_positions(*)),
          deal_lender_matches(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Fetch broker email for this deal
      if (data?.user_id) {
        try {
          const { data: brokerEmail } = await supabase.rpc('get_user_email', { user_uuid: data.user_id });
          const brokerName = brokerEmail?.split('@')[0] || 'Unknown';

          setDeal({
            ...data,
            broker_email: brokerEmail,
            broker_name: brokerName
          } as DealWithRelations);
        } catch (e) {
          console.error('Failed to fetch broker email:', e);
          setDeal(data as DealWithRelations);
        }
      } else {
        setDeal(data as DealWithRelations);
      }
    } catch (err) {
      console.error('Failed to load deal details:', err);
      setError('Unable to load deal details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4 text-center px-6">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <div>
          <h1 className="text-2xl font-semibold text-white">Deal not available</h1>
          <p className="text-gray-400 mt-2">{error ?? 'The selected deal could not be found.'}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deals
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Deals
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all font-medium"
          >
            <Pencil className="w-4 h-4" />
            Edit Deal
          </button>
        </div>

        <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Building2 className="w-8 h-8 text-indigo-400" />
                {deal.legal_business_name}
              </h1>

              {/* DBA and Address Row */}
              <div className="mt-1 flex flex-wrap items-center gap-3 text-gray-400 text-sm">
                {deal.dba_name && <span>DBA: {deal.dba_name}</span>}
                {deal.deal_owners.length > 0 && (
                  <>
                    {deal.deal_owners.map((owner, idx) => (
                      <span key={owner.id}>
                        {idx === 0 && deal.dba_name && <span className="mx-2">•</span>}
                        {owner.street_address}, {owner.city}, {owner.state} {owner.zip}
                      </span>
                    ))}
                  </>
                )}
              </div>

              {/* Owner Details Row */}
              {deal.deal_owners.length > 0 && (
                <div className="mt-2 space-y-1">
                  {deal.deal_owners.map((owner) => (
                    <div key={owner.id} className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-medium text-indigo-200">{owner.full_name}</span>
                      {owner.ownership_percent !== null && (
                        <span className="text-indigo-300">{owner.ownership_percent}%</span>
                      )}
                      {owner.email && <span className="text-gray-400">{owner.email}</span>}
                      {owner.phone && <span className="text-gray-400">{owner.phone}</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-300">
                <span className="inline-flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-300" />
                  ${(deal.desired_loan_amount || 0).toLocaleString()} requested
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-300" />
                  {deal.city}, {deal.state}
                </span>
                <span>{deal.loan_type}</span>
                <span>EIN: {deal.ein}</span>
              </div>
            </div>
            {deal.application_google_drive_link && (
              <a
                href={deal.application_google_drive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-600/30 text-sm font-medium transition-colors"
              >
                <FileText className="w-4 h-4" /> View uploaded documents
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gray-900/40 rounded-lg border border-gray-700/40 p-4">
              <p className="text-xs text-gray-500 uppercase">Broker</p>
              <p className="text-lg text-white font-semibold mt-2">
                {deal.broker_name || 'Unknown'}
              </p>
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
            <div className="bg-gray-900/40 rounded-lg border border-gray-700/40 p-4">
              <p className="text-xs text-gray-500 uppercase">Time in Business</p>
              <p className="text-lg text-white font-semibold mt-2">
                {deal.time_in_business_months ? `${deal.time_in_business_months} months` : '—'}
              </p>
            </div>
            <div className="bg-gray-900/40 rounded-lg border border-gray-700/40 p-4">
              <p className="text-xs text-gray-500 uppercase">Created</p>
              <p className="text-lg text-white font-semibold mt-2">
                {new Date(deal.created_at).toLocaleString()}
              </p>
            </div>
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
                {deal.statements_google_drive_link && (
                  <a
                    href={deal.statements_google_drive_link}
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

            {deal.deal_bank_statements.length === 0 ? (
              <div className="p-6">
                <p className="text-gray-400 text-sm">No bank statements were attached to this deal.</p>
              </div>
            ) : (() => {
              // Sort statements by month ascending (oldest first)
              const sortedStatements = [...deal.deal_bank_statements].sort((a, b) => {
                return a.statement_month.localeCompare(b.statement_month);
              });

              // Calculate 3-month and 6-month averages (take from end for most recent)
              const last3Months = sortedStatements.slice(-3);
              const last6Months = sortedStatements.slice(-6);

              const calculateAverage = (statements: typeof sortedStatements) => {
                const count = statements.length;
                if (count === 0) return { credits: null, debits: null, nsfs: 0, negativeDays: 0, deposits: null, avgBal: null };

                const totals = statements.reduce((acc, stmt) => ({
                  credits: acc.credits + (stmt.credits || 0),
                  debits: acc.debits + (stmt.debits || 0),
                  nsfs: acc.nsfs + (stmt.nsfs || 0),
                  negativeDays: acc.negativeDays + (stmt.negative_days || 0),
                  deposits: acc.deposits + (stmt.deposit_count || 0),
                  avgBal: acc.avgBal + (stmt.average_daily_balance || 0),
                }), { credits: 0, debits: 0, nsfs: 0, negativeDays: 0, deposits: 0, avgBal: 0 });

                return {
                  credits: Math.round(totals.credits / count),
                  debits: Math.round(totals.debits / count),
                  nsfs: Math.round(totals.nsfs / count),
                  negativeDays: Math.round(totals.negativeDays / count),
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
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">NEG</th>
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
                          <td className={`px-4 py-3 text-center ${Number(statement.negative_days || 0) > 0 ? 'text-orange-400' : 'text-white'}`}>
                            {Number(statement.negative_days || 0) > 0 ? statement.negative_days : ''}
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
                          <td className={`px-4 py-3 text-center ${Number(avg3Month.negativeDays || 0) > 0 ? 'text-orange-300' : 'text-white'}`}>
                            {Number(avg3Month.negativeDays || 0) > 0 ? avg3Month.negativeDays : ''}
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
                          <td className={`px-4 py-3 text-center ${Number(avg6Month.negativeDays || 0) > 0 ? 'text-orange-300' : 'text-white'}`}>
                            {Number(avg6Month.negativeDays || 0) > 0 ? avg6Month.negativeDays : ''}
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
          {deal.deal_bank_statements.some(s => s.deal_funding_positions.length > 0) && (
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

                  // Consolidate funding positions by normalized name + amount (ignore frequency)
                  const consolidatedPositions = new Map<string, {
                    lender_name: string;
                    amount: number;
                    frequency: string;
                    dates: string[];
                  }>();

                  deal.deal_bank_statements.forEach(statement => {
                    statement.deal_funding_positions.forEach(position => {
                      const normalizedName = normalizeLenderName(position.lender_name);
                      // Key is now just normalized name + amount (frequency can vary due to parsing errors)
                      const key = `${normalizedName}|${position.amount}`;

                      if (consolidatedPositions.has(key)) {
                        const existing = consolidatedPositions.get(key)!;
                        existing.dates.push(...position.detected_dates);
                        // Use the shorter name if available
                        if (position.lender_name.length < existing.lender_name.length) {
                          existing.lender_name = position.lender_name;
                        }
                        // Keep the most common frequency (or first one if tie)
                      } else {
                        consolidatedPositions.set(key, {
                          lender_name: position.lender_name,
                          amount: Number(position.amount),
                          frequency: position.frequency,
                          dates: [...position.detected_dates]
                        });
                      }
                    });
                  });

                  // Sort and format dates to M/D format
                  const formatDate = (dateStr: string) => {
                    const date = new Date(dateStr);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  };

                  // Determine status based on date patterns
                  const getStatus = (dates: string[]): 'New' | 'Active' | 'Closed' | 'Unclear' => {
                    const uniqueDates = [...new Set(dates)].sort();
                    if (uniqueDates.length === 0) return 'Closed';

                    // Find all unique bank statements (by month)
                    const statementMonths = new Set<string>();
                    deal.deal_bank_statements.forEach(stmt => {
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

                  return (
                    <>
                      {/* Summary Section */}
                      {(activePositions.length > 0 || unclearPositions.length > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-gray-700/30">
                          {activePositions.length > 0 && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                              <div className="text-xs text-green-400 uppercase font-semibold mb-1">Active Monthly Commitment</div>
                              <div className="text-2xl font-bold text-green-300">
                                ${Math.round(activeMonthlyCommitment).toLocaleString()}
                              </div>
                              <div className="text-xs text-green-400/80 mt-1">
                                {activePositions.length} active position{activePositions.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          )}
                          {unclearPositions.length > 0 && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                              <div className="text-xs text-yellow-400 uppercase font-semibold mb-1">Unclear Positions Total</div>
                              <div className="text-2xl font-bold text-yellow-300">
                                ${Math.round(unclearTotal).toLocaleString()}
                              </div>
                              <div className="text-xs text-yellow-400/80 mt-1">
                                {unclearPositions.length} unclear position{unclearPositions.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Positions List */}
                      <div className="space-y-3">
                        {positionsWithStatus.map((position, idx) => {
                          const formattedDates = position.uniqueDates.map(formatDate).join(', ');
                          const status = position.status;

                          // Status badge colors
                          const statusColors = {
                            'New': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                            'Active': 'bg-green-500/20 text-green-300 border-green-500/30',
                            'Closed': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                            'Unclear': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          };

                          return (
                            <div key={idx} className="group/position flex items-center gap-3 text-sm bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3 relative isolate">
                              <span className={`text-xs font-semibold px-2 py-1 rounded border flex-shrink-0 ${statusColors[status]}`}>
                                {status}
                              </span>
                              <span className="font-medium text-indigo-100 text-lg flex-1 min-w-0 max-w-[300px]">{position.lender_name}</span>
                              <div className="flex items-center gap-3 text-lg flex-shrink-0 relative whitespace-nowrap w-[280px]">
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

        {/* Recommended Lenders Section */}
        <section className="bg-gray-800/30 border border-gray-700/30 rounded-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-indigo-400" />
              <div>
                <h2 className="text-xl font-semibold text-white">Recommended Lenders</h2>
                <p className="text-gray-400 text-sm">AI-matched lenders for this deal based on criteria fit.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {deal.deal_lender_matches.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                  <span className="text-xs font-medium text-indigo-300">
                    {deal.deal_lender_matches.length} match{deal.deal_lender_matches.length !== 1 ? 'es' : ''}
                  </span>
                </div>
              )}
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { error } = await supabase.functions.invoke('match-deal-to-lenders', {
                      body: {
                        dealId: deal.id,
                        deal: {
                          deal: {
                            legal_business_name: deal.legal_business_name,
                            desired_loan_amount: deal.desired_loan_amount,
                            average_monthly_sales: deal.average_monthly_sales,
                            average_monthly_card_sales: deal.average_monthly_card_sales,
                            business_type: deal.business_type,
                            product_service_sold: deal.product_service_sold,
                            business_start_date: deal.business_start_date,
                            city: deal.city,
                            state: deal.state,
                            loan_type: deal.loan_type,
                          },
                          owners: deal.deal_owners,
                          statements: deal.deal_bank_statements,
                          fundingPositions: deal.deal_bank_statements.flatMap(s => s.deal_funding_positions),
                        },
                        loanType: deal.loan_type || 'MCA',
                      }
                    });

                    if (error) throw error;
                    await fetchDeal();
                  } catch (e) {
                    console.error('Failed to generate recommendations:', e);
                    setError('Failed to generate recommendations. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                {deal.deal_lender_matches.length === 0 ? 'Generate Recommendations' : 'Refresh Matches'}
              </button>
            </div>
          </div>

          {deal.deal_lender_matches.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-400 text-sm mb-4">No lender matches recorded yet.</p>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { error } = await supabase.functions.invoke('match-deal-to-lenders', {
                      body: {
                        dealId: deal.id,
                        deal: {
                          deal: {
                            legal_business_name: deal.legal_business_name,
                            desired_loan_amount: deal.desired_loan_amount,
                            average_monthly_sales: deal.average_monthly_sales,
                            average_monthly_card_sales: deal.average_monthly_card_sales,
                            business_type: deal.business_type,
                            product_service_sold: deal.product_service_sold,
                            business_start_date: deal.business_start_date,
                            city: deal.city,
                            state: deal.state,
                            loan_type: deal.loan_type,
                          },
                          owners: deal.deal_owners,
                          statements: deal.deal_bank_statements,
                          fundingPositions: deal.deal_bank_statements.flatMap(s => s.deal_funding_positions),
                        },
                        loanType: deal.loan_type || 'MCA',
                      }
                    });

                    if (error) throw error;
                    await fetchDeal();
                  } catch (e) {
                    console.error('Failed to generate recommendations:', e);
                    setError('Failed to generate recommendations. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                Generate Recommendations Now
              </button>
            </div>
          ) : (
            <div className="p-6">
              {/* Top Lender Highlight */}
              {(() => {
                const sortedMatches = [...deal.deal_lender_matches].sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
                const topMatch = sortedMatches[0];

                return topMatch && (topMatch.match_score ?? 0) >= 70 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm font-semibold text-green-300">Top Recommendation</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">{topMatch.lender_name}</h3>
                        {topMatch.is_ifs && (
                          <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded mt-1 inline-block">IFS Partner</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-400">{topMatch.match_score}</div>
                        <div className="text-xs text-green-300">Match Score</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Lender Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...deal.deal_lender_matches]
                  .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
                  .slice(0, 5)
                  .map((match, index) => {
                    const score = match.match_score ?? 0;
                    const scoreColor = score >= 80 ? 'text-green-400 bg-green-500/20 border-green-500/30'
                      : score >= 60 ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
                        : 'text-red-400 bg-red-500/20 border-red-500/30';

                    const probabilityLabel = score >= 90 ? 'Very High'
                      : score >= 70 ? 'High'
                        : score >= 50 ? 'Medium'
                          : 'Low';

                    const probabilityColor = score >= 90 ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : score >= 70 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : score >= 50 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30';

                    return (
                      <div
                        key={match.id}
                        className={`relative bg-gray-900/40 border rounded-lg p-4 transition-all hover:border-gray-600/50 ${match.selected_by_broker ? 'border-indigo-500/50 ring-1 ring-indigo-500/30' : 'border-gray-700/40'
                          }`}
                      >
                        {/* Rank Badge */}
                        <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
                          }`}>
                          {index + 1}
                        </div>

                        {/* Selected Badge */}
                        {match.selected_by_broker && (
                          <div className="absolute -top-2 -right-2">
                            <CheckCircle className="w-5 h-5 text-indigo-400" />
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <h3 className="font-semibold text-white truncate">{match.lender_name}</h3>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {match.is_ifs && (
                                <span className="text-xs px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded">IFS</span>
                              )}
                              <span className={`text-xs px-1.5 py-0.5 border rounded ${probabilityColor}`}>
                                {probabilityLabel}
                              </span>
                            </div>
                          </div>
                          <div className={`flex-shrink-0 w-12 h-12 rounded-lg border flex items-center justify-center ${scoreColor}`}>
                            <span className="text-lg font-bold">{score}</span>
                          </div>
                        </div>

                        {match.match_reasoning && (
                          <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-3">
                            {match.match_reasoning}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-gray-700/30">
                          <span className={`text-xs px-2 py-1 rounded ${match.submission_status === 'Approved' ? 'bg-green-500/20 text-green-300' :
                              match.submission_status === 'Submitted' ? 'bg-blue-500/20 text-blue-300' :
                                match.submission_status === 'Declined' ? 'bg-red-500/20 text-red-300' :
                                  'bg-gray-700/50 text-gray-400'
                            }`}>
                            {match.submission_status || 'Not Started'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {deal.deal_lender_matches.length > 5 && (
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Showing top 5 of {deal.deal_lender_matches.length} matched lenders
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <EditDealModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        deal={deal}
        onSuccess={fetchDeal}
      />
    </div>
  );
}

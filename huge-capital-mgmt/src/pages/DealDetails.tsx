import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader, AlertCircle, Building2, DollarSign, MapPin, Users, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Deal } from '../types/deals';

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

  useEffect(() => {
    if (!id) return;

    const fetchDeal = async () => {
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
    };

    fetchDeal();
  }, [id]);

  const statusBadge = useMemo(() => {
    if (!deal) return null;
    const colors: Record<string, string> = {
      New: 'bg-gray-500/20 text-gray-200 border border-gray-500/40',
      Analyzing: 'bg-blue-500/20 text-blue-200 border border-blue-500/40',
      Matched: 'bg-purple-500/20 text-purple-200 border border-purple-500/40',
      Submitted: 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/40',
      Pending: 'bg-orange-500/20 text-orange-200 border border-orange-500/40',
      Approved: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40',
      Funded: 'bg-green-500/20 text-green-200 border border-green-500/40',
      Declined: 'bg-red-500/20 text-red-200 border border-red-500/40',
    };
    return colors[deal.status] ?? 'bg-gray-700/20 text-gray-200 border border-gray-600/40';
  }, [deal]);

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
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deals
        </button>

        <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Building2 className="w-8 h-8 text-indigo-400" />
                {deal.legal_business_name}
              </h1>
              {deal.dba_name && <p className="text-gray-400 mt-1">DBA: {deal.dba_name}</p>}
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
            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${statusBadge}`}>
              {deal.status}
            </span>
          </div>

          {deal.application_google_drive_link && (
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={deal.application_google_drive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-600/30 text-sm font-medium transition-colors"
              >
                <FileText className="w-4 h-4" /> View uploaded documents
              </a>
            </div>
          )}

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

        <section className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-300" />
            <div>
              <h2 className="text-xl font-semibold text-white">Owners</h2>
              <p className="text-gray-400 text-sm">Key principals associated with this deal.</p>
            </div>
          </div>

          {deal.deal_owners.length === 0 ? (
            <p className="text-gray-400 text-sm">No owners recorded for this deal.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deal.deal_owners.map((owner) => (
                <div key={owner.id} className="bg-gray-900/40 border border-gray-700/40 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg text-white font-semibold">{owner.full_name}</h3>
                    {owner.ownership_percent !== null && (
                      <span className="text-sm text-indigo-300">{owner.ownership_percent}%</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300">{owner.street_address}, {owner.city}, {owner.state} {owner.zip}</p>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Email: {owner.email ?? '—'}</p>
                    <p>Phone: {owner.phone ?? '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
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
                        <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                          {statement.id.slice(0, 5)}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {statement.statement_month}
                        </td>
                        <td className="px-4 py-3 text-right text-green-400 font-medium">
                          ${statement.credits?.toLocaleString() ?? 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400 font-medium">
                          ${statement.debits?.toLocaleString() ?? 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center text-white">
                          {statement.nsfs ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center text-white">
                          {statement.deposit_count ?? statement.overdrafts ?? 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-400 font-medium">
                          ${statement.average_daily_balance?.toLocaleString() ?? 'N/A'}
                        </td>
                      </tr>
                    ))}

                    {/* 3-Month Average */}
                    {last3Months.length >= 3 && (
                      <tr className="bg-indigo-500/10 border-t-2 border-indigo-500/30 font-semibold">
                        <td className="px-4 py-3 text-gray-400 text-xs" colSpan={2}>
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
                        <td className="px-4 py-3 text-gray-400 text-xs" colSpan={2}>
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

          {/* Funding Positions Section */}
          {deal.deal_bank_statements.some(s => s.deal_funding_positions.length > 0) && (
            <div className="p-6 border-t border-gray-700/30 bg-gray-900/20">
              <h3 className="text-sm font-semibold text-indigo-200 mb-4">Detected Funding Positions</h3>
              <div className="space-y-3">
                {deal.deal_bank_statements.map((statement) =>
                  statement.deal_funding_positions.map((position) => (
                    <div key={position.id} className="flex flex-wrap items-center justify-between gap-3 text-sm bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3">
                      <span className="font-medium text-indigo-100">{position.lender_name}</span>
                      <span className="text-indigo-200">${Number(position.amount).toLocaleString()} • {position.frequency}</span>
                      {position.detected_dates.length > 0 && (
                        <span className="text-xs text-indigo-300/80">
                          Dates: {position.detected_dates.join(', ')}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        <section className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <ChevronRight className="w-6 h-6 text-indigo-300" />
            <div>
              <h2 className="text-xl font-semibold text-white">Lender Matches</h2>
              <p className="text-gray-400 text-sm">Recommendations generated for this deal.</p>
            </div>
          </div>

          {deal.deal_lender_matches.length === 0 ? (
            <p className="text-gray-400 text-sm">No lender matches recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {deal.deal_lender_matches.map((match) => (
                <div key={match.id} className="bg-gray-900/40 border border-gray-700/40 rounded-lg p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg text-white font-semibold">{match.lender_name}</h3>
                      <p className="text-sm text-gray-400">Status: {match.submission_status}</p>
                    </div>
                    <div className="text-sm text-indigo-200">
                      Score: {match.match_score ?? '—'}
                    </div>
                  </div>
                  {match.match_reasoning && (
                    <p className="text-sm text-gray-300 mt-2">{match.match_reasoning}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Lender Match Grid Component
 * Deterministic lender matching based on:
 * - Monthly Revenue (avg of last 3 months credits from bank statements)
 * - Time in Business (from application)
 * - State (from application)
 * - Credit Score (optional, from broker input)
 */

import { useEffect, useState, useMemo } from 'react';
import { Check, X, Minus, Loader, TrendingUp, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BankStatement {
  id: string;
  statement_month: string;
  credits: number | null;
}

interface LenderMatchGridProps {
  loanType: string;
  state: string;
  timeInBusinessMonths: number | null;
  creditScore: number | null;
  bankStatements: BankStatement[];
}

interface Lender {
  id: string;
  lender_name: string;
  // MCA fields
  minimum_credit_requirement?: number;
  minimum_monthly_revenue?: string;
  minimum_time_in_business?: string;
  states_restrictions?: string;
  // LOC fields
  credit_requirement?: number;
  min_monthly_revenue_amount?: string;
  min_time_in_business?: string;
  ineligible_states?: string;
}

interface LenderMatch {
  lender: Lender;
  revenueMatch: boolean | null; // null = N/A (no requirement)
  timeInBusinessMatch: boolean | null;
  stateMatch: boolean | null;
  creditScoreMatch: boolean | null;
  allCriteriaMet: boolean;
}

// Parse revenue string like "$10,000" or "10000" or "$10K" to number
const parseRevenue = (value: string | undefined | null): number | null => {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.kKmM]/g, '');
  if (!cleaned) return null;

  let num = parseFloat(cleaned.replace(/[kKmM]/g, ''));
  if (isNaN(num)) return null;

  if (/k/i.test(value)) num *= 1000;
  if (/m/i.test(value)) num *= 1000000;

  return num;
};

// Parse time in business string like "6 months", "1 year", "12 mo" to months
const parseTimeInBusiness = (value: string | undefined | null): number | null => {
  if (!value) return null;
  const lower = value.toLowerCase();

  // Extract numbers
  const numMatch = lower.match(/(\d+)/);
  if (!numMatch) return null;
  const num = parseInt(numMatch[1], 10);

  // Check if it's years
  if (lower.includes('year') || lower.includes('yr')) {
    return num * 12;
  }

  // Default to months
  return num;
};

// Check if state is in the ineligible/restricted states list
const isStateRestricted = (state: string, restrictedStates: string | undefined | null): boolean => {
  if (!restrictedStates || !state) return false;

  const stateUpper = state.toUpperCase().trim();
  const restrictedList = restrictedStates.toUpperCase();

  // Check for exact state abbreviation match
  // Handle various formats: "CA, NY, TX" or "CA NY TX" or "California, New York"
  const statePattern = new RegExp(`\\b${stateUpper}\\b`);
  return statePattern.test(restrictedList);
};

// Map loan type to table name
const getLenderTable = (loanType: string): string => {
  const tableMap: Record<string, string> = {
    'MCA': 'lenders_mca',
    'Business LOC': 'lenders_business_line_of_credit',
    'Term Loan': 'lenders_term_loans',
    'SBA': 'lenders_sba',
    'DSCR': 'lenders_dscr',
    'Equipment': 'lenders_equipment_financing',
    'Fix & Flip': 'lenders_fix_flip',
    'CRE': 'lenders_commercial_real_estate',
  };
  return tableMap[loanType] || 'lenders_mca';
};

export default function LenderMatchGrid({
  loanType,
  state,
  timeInBusinessMonths,
  creditScore,
  bankStatements,
}: LenderMatchGridProps) {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Calculate monthly revenue from last 3 months of bank statements
  const monthlyRevenue = useMemo(() => {
    if (!bankStatements || bankStatements.length === 0) return null;

    // Sort by statement_month descending and take last 3
    const sorted = [...bankStatements]
      .filter(s => s.credits !== null)
      .sort((a, b) => b.statement_month.localeCompare(a.statement_month))
      .slice(0, 3);

    if (sorted.length === 0) return null;

    const total = sorted.reduce((sum, s) => sum + (s.credits || 0), 0);
    return Math.round(total / sorted.length);
  }, [bankStatements]);

  // Fetch lenders based on loan type
  useEffect(() => {
    const fetchLenders = async () => {
      try {
        setLoading(true);
        setError(null);

        const tableName = getLenderTable(loanType);
        const { data, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .eq('status', 'active')
          .order('lender_name');

        if (fetchError) throw fetchError;
        setLenders(data || []);
      } catch (err) {
        console.error('Failed to fetch lenders:', err);
        setError('Failed to load lenders');
      } finally {
        setLoading(false);
      }
    };

    fetchLenders();
  }, [loanType]);

  // Calculate matches for each lender
  const lenderMatches = useMemo<LenderMatch[]>(() => {
    return lenders.map(lender => {
      // Get the correct field names based on table structure
      const minRevenue = parseRevenue(lender.minimum_monthly_revenue || lender.min_monthly_revenue_amount);
      const minTIB = parseTimeInBusiness(lender.minimum_time_in_business || lender.min_time_in_business);
      const minCredit = lender.minimum_credit_requirement || lender.credit_requirement;
      const restrictedStates = lender.states_restrictions || lender.ineligible_states;

      // Revenue match
      let revenueMatch: boolean | null = null;
      if (minRevenue !== null && monthlyRevenue !== null) {
        revenueMatch = monthlyRevenue >= minRevenue;
      } else if (minRevenue === null) {
        revenueMatch = null; // No requirement
      }

      // Time in business match
      let timeInBusinessMatch: boolean | null = null;
      if (minTIB !== null && timeInBusinessMonths !== null) {
        timeInBusinessMatch = timeInBusinessMonths >= minTIB;
      } else if (minTIB === null) {
        timeInBusinessMatch = null; // No requirement
      }

      // State match (true if NOT restricted)
      let stateMatch: boolean | null = null;
      if (restrictedStates && state) {
        stateMatch = !isStateRestricted(state, restrictedStates);
      } else {
        stateMatch = null; // No restrictions
      }

      // Credit score match (only if credit score provided AND lender has requirement)
      let creditScoreMatch: boolean | null = null;
      if (minCredit !== null && minCredit !== undefined && creditScore !== null) {
        creditScoreMatch = creditScore >= minCredit;
      } else if (minCredit === null || minCredit === undefined) {
        creditScoreMatch = null; // No requirement
      } else if (creditScore === null) {
        creditScoreMatch = null; // No score provided, skip this criterion
      }

      // All criteria met (treat null as passed)
      const allCriteriaMet =
        (revenueMatch === null || revenueMatch === true) &&
        (timeInBusinessMatch === null || timeInBusinessMatch === true) &&
        (stateMatch === null || stateMatch === true) &&
        (creditScoreMatch === null || creditScoreMatch === true);

      return {
        lender,
        revenueMatch,
        timeInBusinessMatch,
        stateMatch,
        creditScoreMatch,
        allCriteriaMet,
      };
    });
  }, [lenders, monthlyRevenue, timeInBusinessMonths, state, creditScore]);

  // Sort: qualifying lenders first, then by name
  const sortedMatches = useMemo(() => {
    return [...lenderMatches].sort((a, b) => {
      if (a.allCriteriaMet && !b.allCriteriaMet) return -1;
      if (!a.allCriteriaMet && b.allCriteriaMet) return 1;
      return a.lender.lender_name.localeCompare(b.lender.lender_name);
    });
  }, [lenderMatches]);

  // Count qualifying lenders
  const qualifyingCount = sortedMatches.filter(m => m.allCriteriaMet).length;

  // Display limited or all
  const displayMatches = showAll ? sortedMatches : sortedMatches.slice(0, 10);

  const renderMatchIcon = (match: boolean | null) => {
    if (match === null) return <Minus className="w-4 h-4 text-gray-500" />;
    if (match) return <Check className="w-4 h-4 text-green-400" />;
    return <X className="w-4 h-4 text-red-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 mx-auto"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Deal Criteria Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-900/40 rounded-lg border border-gray-700/40">
        <div>
          <p className="text-xs text-gray-500 uppercase">Monthly Revenue</p>
          <p className="text-sm font-semibold text-white">
            {monthlyRevenue ? `$${monthlyRevenue.toLocaleString()}` : 'N/A'}
          </p>
          <p className="text-xs text-gray-500">Avg last 3 months</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Time in Business</p>
          <p className="text-sm font-semibold text-white">
            {timeInBusinessMonths !== null ? `${timeInBusinessMonths} months` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">State</p>
          <p className="text-sm font-semibold text-white">{state || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Credit Score</p>
          <p className="text-sm font-semibold text-white">
            {creditScore !== null ? creditScore : 'Not provided'}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <span className="text-sm text-gray-300">
            <span className="font-semibold text-green-400">{qualifyingCount}</span> of {lenders.length} lenders qualify
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> Meets</span>
          <span className="flex items-center gap-1"><X className="w-3 h-3 text-red-400" /> Doesn't meet</span>
          <span className="flex items-center gap-1"><Minus className="w-3 h-3 text-gray-500" /> N/A</span>
        </div>
      </div>

      {/* Lender Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/50 border-b border-gray-700/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Lender</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">TIB</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">State</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Credit</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Qualifies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/20">
            {displayMatches.map((match, index) => (
              <tr
                key={match.lender.id}
                className={`transition-colors ${
                  match.allCriteriaMet
                    ? 'bg-green-500/5 hover:bg-green-500/10'
                    : index % 2 === 0 ? 'bg-gray-900/20 hover:bg-gray-700/10' : 'hover:bg-gray-700/10'
                }`}
              >
                <td className="px-4 py-3">
                  <span className={`font-medium ${match.allCriteriaMet ? 'text-green-300' : 'text-white'}`}>
                    {match.lender.lender_name}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{renderMatchIcon(match.revenueMatch)}</td>
                <td className="px-4 py-3 text-center">{renderMatchIcon(match.timeInBusinessMatch)}</td>
                <td className="px-4 py-3 text-center">{renderMatchIcon(match.stateMatch)}</td>
                <td className="px-4 py-3 text-center">{renderMatchIcon(match.creditScoreMatch)}</td>
                <td className="px-4 py-3 text-center">
                  {match.allCriteriaMet ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
                      <Check className="w-3 h-3" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-300 text-xs font-medium rounded-full border border-red-500/30">
                      <X className="w-3 h-3" /> No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More/Less Button */}
      {sortedMatches.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" /> Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" /> Show All {sortedMatches.length} Lenders
            </>
          )}
        </button>
      )}
    </div>
  );
}

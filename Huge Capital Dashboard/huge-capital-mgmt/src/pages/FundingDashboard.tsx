import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, BarChart3, Percent, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchFundingData, formatCurrency, formatPercentage } from '../lib/googleSheets';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cleanDealType, getBrokerColor, formatDate } from '../utils/formatters';

interface FundingMetrics {
  fundedAmount: number;
  commission: number;
  requestedAmount: number;
  totalDeals: number;
  byStage: Record<string, { count: number; amount: number }>;
  byTier: Record<string, { count: number; amount: number }>;
}

export const FundingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FundingMetrics | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter states for the funding by date chart
  const [selectedBroker, setSelectedBroker] = useState<string>('all');
  const [selectedDealType, setSelectedDealType] = useState<string>('all');
  const [selectedFundingPartner, setSelectedFundingPartner] = useState<string>('all');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { deals: fetchedDeals, metrics: calculatedMetrics } = await fetchFundingData();

      if (!calculatedMetrics) {
        throw new Error('No data found in spreadsheet');
      }

      setDeals(fetchedDeals);
      setMetrics(calculatedMetrics);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error loading funding data:', err);
      setError(err.message || 'Failed to load data from Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        <p className="text-gray-400">Loading funding data from Google Sheets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-100">Funding Dashboard</h1>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                Error Loading Data
              </h3>
              <p className="text-sm text-red-300 mb-4">{error}</p>
              <div className="text-sm text-red-300 space-y-2">
                <p><strong>Common issues:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Google Sheets API key might be invalid</li>
                  <li>Spreadsheet ID might be incorrect</li>
                  <li>Sheet might not be publicly accessible</li>
                  <li>Sheet name in code might not match actual sheet name</li>
                </ul>
                <p className="mt-4">
                  Check the browser console (F12) for more details.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">
            Configuration Check
          </h3>
          <div className="text-sm text-blue-300 space-y-1">
            <p>✓ Google Sheets API Key: {import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ? 'Configured' : '❌ Missing'}</p>
            <p>✓ Spreadsheet ID: {import.meta.env.VITE_GOOGLE_SHEETS_ID ? 'Configured' : '❌ Missing'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-400 mb-2">
          No Data Found
        </h3>
        <p className="text-sm text-yellow-300">
          The spreadsheet appears to be empty or has no data in the expected format.
        </p>
      </div>
    );
  }

  // Helper function to apply filters to deals
  const getFilteredDeals = () => {
    return deals.filter(deal => {
      const hasFundedDate = deal.DateFunded || deal['Date Funded'] || deal.FundedDate;
      if (!hasFundedDate) return false;

      const broker = deal['Owner (Broker)'] || deal.Owner || deal.Broker || 'Unknown';
      const dealType = deal.Pipeline || deal.pipeline || deal['Deal Type'] || deal.DealType || deal.Stage || 'Unknown';
      const fundingPartner = deal.FundingPartner || deal['Funding Partner'] || deal.Lender || 'Unknown';

      if (selectedBroker !== 'all' && broker !== selectedBroker) return false;
      if (selectedDealType !== 'all' && dealType !== selectedDealType) return false;
      if (selectedFundingPartner !== 'all' && fundingPartner !== selectedFundingPartner) return false;

      // Time period filter
      if (selectedTimePeriod !== 'all') {
        const dealDate = new Date(hasFundedDate);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const dealMonth = dealDate.getMonth();
        const dealYear = dealDate.getFullYear();

        if (selectedTimePeriod === 'thisMonth') {
          if (dealMonth !== currentMonth || dealYear !== currentYear) return false;
        } else if (selectedTimePeriod === 'lastMonth') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          if (dealMonth !== lastMonth || dealYear !== lastMonthYear) return false;
        }
      }

      return true;
    });
  };

  const filteredDeals = getFilteredDeals();

  // Calculate filtered metrics
  let filteredFundedAmount = 0;
  let filteredCommission = 0;
  let filteredTotalDeals = 0;

  filteredDeals.forEach(deal => {
    const fundedAmount = parseFloat(
      String(deal.FundedAmount || deal['Funded Amount'] || deal.Amount || '0')
        .replace(/[$,]/g, '')
    ) || 0;
    const commission = parseFloat(
      String(deal.Commission || deal.commission || '0')
        .replace(/[$,]/g, '')
    ) || 0;

    filteredFundedAmount += fundedAmount;
    filteredCommission += commission;
    filteredTotalDeals += 1;
  });

  // Calculate average commission percentage
  const avgCommissionPct = filteredFundedAmount > 0
    ? (filteredCommission / filteredFundedAmount) * 100
    : 0;

  // Calculate broker leaderboards
  interface BrokerStats {
    fundedAmount: number;
    commission: number;
    totalDeals: number;
    totalCommissionPct: number;
    dealsCount: number;
  }

  const brokerStats: Record<string, BrokerStats> = {};
  const fundingPartnerStats: Record<string, BrokerStats> = {};

  filteredDeals.forEach(deal => {
    const broker = deal['Owner (Broker)'] || deal.Owner || deal.Broker || 'Unknown';
    const fundingPartner = deal.FundingPartner || deal['Funding Partner'] || deal.Lender || 'Unknown';
    const fundedAmount = parseFloat(
      String(deal.FundedAmount || deal['Funded Amount'] || deal.Amount || '0')
        .replace(/[$,]/g, '')
    ) || 0;
    const commission = parseFloat(
      String(deal.Commission || deal.commission || '0')
        .replace(/[$,]/g, '')
    ) || 0;

    // Track broker stats
    if (!brokerStats[broker]) {
      brokerStats[broker] = {
        fundedAmount: 0,
        commission: 0,
        totalDeals: 0,
        totalCommissionPct: 0,
        dealsCount: 0,
      };
    }

    brokerStats[broker].fundedAmount += fundedAmount;
    brokerStats[broker].commission += commission;
    brokerStats[broker].totalDeals += 1;

    if (fundedAmount > 0) {
      brokerStats[broker].totalCommissionPct += (commission / fundedAmount) * 100;
      brokerStats[broker].dealsCount += 1;
    }

    // Track funding partner stats (only for funded deals)
    const hasFundedDate = deal.DateFunded || deal['Date Funded'] || deal.FundedDate;
    if (hasFundedDate && fundedAmount > 0) {
      if (!fundingPartnerStats[fundingPartner]) {
        fundingPartnerStats[fundingPartner] = {
          fundedAmount: 0,
          commission: 0,
          totalDeals: 0,
          totalCommissionPct: 0,
          dealsCount: 0,
        };
      }

      fundingPartnerStats[fundingPartner].fundedAmount += fundedAmount;
      fundingPartnerStats[fundingPartner].commission += commission;
      fundingPartnerStats[fundingPartner].totalDeals += 1;

      if (fundedAmount > 0) {
        fundingPartnerStats[fundingPartner].totalCommissionPct += (commission / fundedAmount) * 100;
        fundingPartnerStats[fundingPartner].dealsCount += 1;
      }
    }
  });

  // Create leaderboards
  const fundedLeaderboard = Object.entries(brokerStats)
    .sort((a, b) => b[1].fundedAmount - a[1].fundedAmount)
    .slice(0, 3);

  const commissionLeaderboard = Object.entries(brokerStats)
    .sort((a, b) => b[1].commission - a[1].commission)
    .slice(0, 3);

  const avgCommissionLeaderboard = Object.entries(brokerStats)
    .map(([broker, stats]) => ({
      broker,
      avgPct: stats.dealsCount > 0 ? stats.totalCommissionPct / stats.dealsCount : 0,
    }))
    .sort((a, b) => b.avgPct - a.avgPct)
    .slice(0, 3);

  const dealsLeaderboard = Object.entries(brokerStats)
    .sort((a, b) => b[1].totalDeals - a[1].totalDeals)
    .slice(0, 3);

  const fundingPartnerLeaderboard = Object.entries(fundingPartnerStats)
    .sort((a, b) => b[1].fundedAmount - a[1].fundedAmount)
    .slice(0, 3);

  const stats = [
    {
      name: 'Total Funded',
      value: formatCurrency(filteredFundedAmount),
      icon: DollarSign,
      color: 'bg-blue-600',
      leaderboard: fundedLeaderboard,
      type: 'currency' as const,
      leaderboardTitle: 'TOP BROKERS FUNDED',
    },
    {
      name: 'Total Deals',
      value: filteredTotalDeals.toString(),
      icon: BarChart3,
      color: 'bg-blue-800',
      leaderboard: dealsLeaderboard,
      type: 'count' as const,
      leaderboardTitle: 'TOP BROKERS DEALS',
    },
    {
      name: 'Total Commission',
      value: formatCurrency(filteredCommission),
      icon: TrendingUp,
      color: 'bg-blue-600',
      leaderboard: commissionLeaderboard,
      type: 'currency' as const,
      leaderboardTitle: 'TOP BROKERS COMMISSION',
    },
    {
      name: 'Average Commission',
      value: formatPercentage(avgCommissionPct),
      icon: Percent,
      color: 'bg-blue-700',
      leaderboard: avgCommissionLeaderboard,
      type: 'percentage' as const,
      leaderboardTitle: 'TOP BROKERS COMMISSION %',
    },
  ];

  // Get deal types sorted by funded amount (from filtered deals)
  const dealTypeStats: Record<string, { count: number; amount: number }> = {};
  filteredDeals.forEach(deal => {
    const dealType = deal.Pipeline || deal.pipeline || deal['Deal Type'] || deal.DealType || deal.Stage || 'Unknown';
    const fundedAmount = parseFloat(
      String(deal.FundedAmount || deal['Funded Amount'] || deal.Amount || '0')
        .replace(/[$,]/g, '')
    ) || 0;

    if (!dealTypeStats[dealType]) {
      dealTypeStats[dealType] = { count: 0, amount: 0 };
    }
    dealTypeStats[dealType].count += 1;
    dealTypeStats[dealType].amount += fundedAmount;
  });

  const stageEntries = Object.entries(dealTypeStats)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 6); // Show top 6 deal types

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-primary">Funding Dashboard</h1>
        <div className="text-right">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 shadow-lg shadow-brand-500/20"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-blue-900/20 rounded-lg shadow-xl border border-blue-700/30 px-6 py-4 hover:border-blue-500/50 transition-all backdrop-blur-sm"
            >
              <div className="flex flex-col gap-6">
                {/* Row 1: Title + Amount (2 columns) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-medium text-blue-400">
                      {stat.name}
                    </h3>
                  </div>
                  <p className="text-4xl font-bold text-gray-100">
                    {stat.value}
                  </p>
                </div>

                {/* Row 2: Leaderboard Title + Items (2 columns) */}
                <div className="flex items-start gap-4">
                  <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide flex-shrink-0 w-24">{stat.leaderboardTitle}</h4>
                  <div className="flex-1 space-y-1">
                    {stat.type === 'currency' && stat.leaderboard.map(([broker, brokerStat], idx) => {
                      const rankColors = ['text-yellow-400 font-bold', 'text-slate-400 font-semibold', 'text-amber-700 font-semibold', 'text-gray-100 font-semibold'];
                      const colorClass = rankColors[idx] || 'text-gray-300 font-semibold';
                      return (
                        <div key={broker} className={`text-base leading-snug ${colorClass}`}>
                          <span className="font-bold">#{idx + 1}</span> <span>-</span> {formatCurrency(index === 0 ? brokerStat.fundedAmount : brokerStat.commission)} <span>-</span> <span className="font-bold">{broker}</span>
                        </div>
                      );
                    })}
                    {stat.type === 'percentage' && stat.leaderboard.map((item, idx) => {
                      const rankColors = ['text-yellow-400 font-bold', 'text-slate-400 font-semibold', 'text-amber-700 font-semibold', 'text-gray-100 font-semibold'];
                      const colorClass = rankColors[idx] || 'text-gray-300 font-semibold';
                      return (
                        <div key={item.broker} className={`text-base leading-snug ${colorClass}`}>
                          <span className="font-bold">#{idx + 1}</span> <span>-</span> {formatPercentage(item.avgPct)} <span>-</span> <span className="font-bold">{item.broker}</span>
                        </div>
                      );
                    })}
                    {stat.type === 'count' && stat.leaderboard.map(([broker, brokerStat], idx) => {
                      const rankColors = ['text-yellow-400 font-bold', 'text-slate-400 font-semibold', 'text-amber-700 font-semibold', 'text-gray-100 font-semibold'];
                      const colorClass = rankColors[idx] || 'text-gray-300 font-semibold';
                      return (
                        <div key={broker} className={`text-base leading-snug ${colorClass}`}>
                          <span className="font-bold">#{idx + 1}</span> <span>-</span> {brokerStat.totalDeals} {brokerStat.totalDeals === 1 ? 'Deal' : 'Deals'} <span>-</span> <span className="font-bold">{broker}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal Type, Funding Partner & Chart Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Column - Deal Type and Funding Partner Cards */}
        <div className="space-y-6">
          {/* Deal Type Card */}
          <div className="bg-blue-900/20 rounded-lg shadow-xl border border-blue-700/30 px-6 py-4 hover:border-blue-500/50 transition-all backdrop-blur-sm">
            <div className="flex flex-col gap-6">
              {/* Row 1: Title + Count (2 columns) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-600">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-blue-400">
                    Deal Types
                  </h3>
                </div>
                <p className="text-4xl font-bold text-gray-100">
                  {stageEntries.length}
                </p>
              </div>

              {/* Row 2: Leaderboard Title + Items (2 columns) */}
              <div className="flex items-start gap-4">
                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide flex-shrink-0 w-24">TOP DEAL TYPES</h4>
                <div className="flex-1 space-y-1">
                  {stageEntries.slice(0, 3).map(([stage, data], idx) => {
                    const rankColors = ['text-yellow-400 font-bold', 'text-slate-400 font-semibold', 'text-amber-700 font-semibold', 'text-gray-100 font-semibold', 'text-gray-300 font-semibold'];
                    const colorClass = rankColors[idx] || 'text-gray-300 font-semibold';
                    const cleanedStage = cleanDealType(stage);
                    return (
                      <div key={stage} className={`text-base leading-snug ${colorClass}`}>
                        <span className="font-bold">#{idx + 1}</span> <span>-</span> {formatCurrency(data.amount)} <span>-</span> <span className="font-bold">{cleanedStage}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Funding Partner Card */}
          <div className="bg-blue-900/20 rounded-lg shadow-xl border border-blue-700/30 px-6 py-4 hover:border-blue-500/50 transition-all backdrop-blur-sm">
            <div className="flex flex-col gap-6">
              {/* Row 1: Title + Count (2 columns) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-600">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-blue-400">
                    Funding Partners
                  </h3>
                </div>
                <p className="text-4xl font-bold text-gray-100">
                  {fundingPartnerLeaderboard.length}
                </p>
              </div>

              {/* Row 2: Leaderboard Title + Items (2 columns) */}
              <div className="flex items-start gap-4">
                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide flex-shrink-0 w-24">TOP PARTNERS</h4>
                <div className="flex-1 space-y-1">
                  {fundingPartnerLeaderboard.map(([partner, data], idx) => {
                    const rankColors = ['text-yellow-400 font-bold', 'text-slate-400 font-semibold', 'text-amber-700 font-semibold', 'text-gray-100 font-semibold', 'text-gray-300 font-semibold'];
                    const colorClass = rankColors[idx] || 'text-gray-300 font-semibold';
                    return (
                      <div key={partner} className={`text-base leading-snug ${colorClass}`}>
                        <span className="font-bold">#{idx + 1}</span> <span>-</span> {formatCurrency(data.fundedAmount)} <span>-</span> <span className="font-bold">{partner}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Funding by Date Chart - spans 3 columns */}
        <div className="lg:col-span-3 bg-blue-950/30 rounded-lg shadow-xl border border-blue-800/30 px-6 py-4">
          <div className="flex flex-col gap-2">
            {/* Title, Filters, and Color Key on same row */}
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-blue-300 whitespace-nowrap">Huge Capital Funding</h2>

              {/* Filter Controls */}
              <div className="flex gap-2 flex-1">
                {/* Time Period Filter */}
                <select
                  value={selectedTimePeriod}
                  onChange={(e) => setSelectedTimePeriod(e.target.value)}
                  className="px-2 py-1 bg-blue-950 border border-blue-700/50 rounded-lg text-gray-100 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                </select>

                {/* Broker Filter */}
                <select
                  value={selectedBroker}
                  onChange={(e) => setSelectedBroker(e.target.value)}
                  className="px-2 py-1 bg-blue-950 border border-blue-700/50 rounded-lg text-gray-100 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Brokers</option>
                  {Array.from(
                    new Set(
                      deals
                        .filter(deal => deal.DateFunded || deal['Date Funded'] || deal.FundedDate)
                        .map(deal => deal['Owner (Broker)'] || deal.Owner || deal.Broker || 'Unknown')
                    )
                  )
                    .sort()
                    .map(broker => (
                      <option key={broker} value={broker}>
                        {broker}
                      </option>
                    ))}
                </select>

                {/* Deal Type Filter */}
                <select
                  value={selectedDealType}
                  onChange={(e) => setSelectedDealType(e.target.value)}
                  className="px-2 py-1 bg-blue-950 border border-blue-700/50 rounded-lg text-gray-100 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Deal Types</option>
                  {Array.from(
                    new Set(
                      deals
                        .filter(deal => deal.DateFunded || deal['Date Funded'] || deal.FundedDate)
                        .map(deal => deal.Pipeline || deal.pipeline || deal['Deal Type'] || deal.DealType || deal.Stage || 'Unknown')
                    )
                  )
                    .sort()
                    .map(dealType => (
                      <option key={dealType} value={dealType}>
                        {cleanDealType(dealType)}
                      </option>
                    ))}
                </select>

                {/* Funding Partner Filter */}
                <select
                  value={selectedFundingPartner}
                  onChange={(e) => setSelectedFundingPartner(e.target.value)}
                  className="px-2 py-1 bg-blue-950 border border-blue-700/50 rounded-lg text-gray-100 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Partners</option>
                  {Array.from(
                    new Set(
                      deals
                        .filter(deal => deal.DateFunded || deal['Date Funded'] || deal.FundedDate)
                        .map(deal => deal.FundingPartner || deal['Funding Partner'] || deal.Lender || 'Unknown')
                    )
                  )
                    .sort()
                    .map(partner => (
                      <option key={partner} value={partner}>
                        {partner}
                      </option>
                    ))}
                </select>
              </div>

              {/* Color Key */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#60a5fa' }}></div>
                  <span className="text-xs text-gray-300">Zac</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                  <span className="text-xs text-gray-300">Luke</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }}></div>
                  <span className="text-xs text-gray-300">Aaron</span>
                </div>
              </div>
            </div>

            {/* Stacked Bar Chart */}
            <ResponsiveContainer width="100%" height={360}>
              <BarChart margin={{ top: 5, right: 10, left: 0, bottom: 0 }} data={(() => {
                // Filter deals based on selected filters
                let filteredDeals = deals.filter(deal => {
                  const hasFundedDate = deal.DateFunded || deal['Date Funded'] || deal.FundedDate;
                  if (!hasFundedDate) return false;

                  const broker = deal['Owner (Broker)'] || deal.Owner || deal.Broker || 'Unknown';
                  const dealType = deal.Pipeline || deal.pipeline || deal['Deal Type'] || deal.DealType || deal.Stage || 'Unknown';
                  const fundingPartner = deal.FundingPartner || deal['Funding Partner'] || deal.Lender || 'Unknown';

                  if (selectedBroker !== 'all' && broker !== selectedBroker) return false;
                  if (selectedDealType !== 'all' && dealType !== selectedDealType) return false;
                  if (selectedFundingPartner !== 'all' && fundingPartner !== selectedFundingPartner) return false;

                  // Time period filter
                  if (selectedTimePeriod !== 'all') {
                    const dealDate = new Date(hasFundedDate);
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();
                    const dealMonth = dealDate.getMonth();
                    const dealYear = dealDate.getFullYear();

                    if (selectedTimePeriod === 'thisMonth') {
                      if (dealMonth !== currentMonth || dealYear !== currentYear) return false;
                    } else if (selectedTimePeriod === 'lastMonth') {
                      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                      if (dealMonth !== lastMonth || dealYear !== lastMonthYear) return false;
                    }
                  }

                  return true;
                });

                // Group by date and broker
                const dateMap: Record<string, Record<string, number>> = {};
                const brokersSet = new Set<string>();

                filteredDeals.forEach(deal => {
                  const date = deal.DateFunded || deal['Date Funded'] || deal.FundedDate;
                  const broker = deal['Owner (Broker)'] || deal.Owner || deal.Broker || 'Unknown';
                  const fundedAmount = parseFloat(
                    String(deal.FundedAmount || deal['Funded Amount'] || deal.Amount || '0')
                      .replace(/[$,]/g, '')
                  ) || 0;

                  brokersSet.add(broker);

                  if (!dateMap[date]) {
                    dateMap[date] = {};
                  }

                  if (dateMap[date][broker]) {
                    dateMap[date][broker] += fundedAmount;
                  } else {
                    dateMap[date][broker] = fundedAmount;
                  }
                });

                // Convert to array format for recharts
                const chartData = Object.entries(dateMap)
                  .map(([date, brokerData]) => ({
                    date,
                    ...brokerData
                  }))
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                return { chartData, brokers: Array.from(brokersSet).sort() };
              })().chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
                <XAxis
                  dataKey="date"
                  stroke="#60a5fa"
                  tick={{ fill: '#60a5fa', fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                  tickFormatter={(value) => formatDate(value)}
                />
                <YAxis
                  stroke="#60a5fa"
                  tick={{ fill: '#60a5fa', fontSize: 12 }}
                  tickFormatter={(value) => value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1f2e',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  labelStyle={{ color: '#60a5fa' }}
                />
                {(() => {
                  // Get unique brokers from filtered data
                  const brokersSet = new Set<string>();
                  deals.forEach(deal => {
                    const hasFundedDate = deal.DateFunded || deal['Date Funded'] || deal.FundedDate;
                    if (!hasFundedDate) return;

                    const broker = deal['Owner (Broker)'] || deal.Owner || deal.Broker || 'Unknown';
                    const dealType = deal.Pipeline || deal.pipeline || deal['Deal Type'] || deal.DealType || deal.Stage || 'Unknown';
                    const fundingPartner = deal.FundingPartner || deal['Funding Partner'] || deal.Lender || 'Unknown';

                    if (selectedBroker !== 'all' && broker !== selectedBroker) return;
                    if (selectedDealType !== 'all' && dealType !== selectedDealType) return;
                    if (selectedFundingPartner !== 'all' && fundingPartner !== selectedFundingPartner) return;

                    brokersSet.add(broker);
                  });

                  return Array.from(brokersSet)
                    .sort()
                    .map(broker => (
                      <Bar
                        key={broker}
                        dataKey={broker}
                        stackId="funding"
                        fill={getBrokerColor(broker)}
                        radius={[8, 8, 0, 0]}
                      />
                    ));
                })()}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Funded Deals Table */}
      <div className="bg-blue-950/30 rounded-lg shadow-xl border border-blue-800/30 p-6">
        <h2 className="text-xl font-bold text-blue-300 mb-4">
          Funded Deals Log
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-blue-800/30">
                <th className="px-4 py-3 font-semibold text-blue-400 min-w-fit">Broker</th>
                <th className="px-4 py-3 font-semibold text-blue-400 min-w-fit">Date Funded</th>
                <th className="px-4 py-3 font-semibold text-blue-400 min-w-fit">Funded Amount</th>
                <th className="px-4 py-3 font-semibold text-blue-400 min-w-fit">Commission</th>
                <th className="px-4 py-3 font-semibold text-blue-400 min-w-fit">Commission %</th>
                <th className="px-4 py-3 font-semibold text-blue-400 min-w-fit">Business Name</th>
                <th className="px-4 py-3 font-semibold text-blue-400 min-w-fit">Funding Partner</th>
                <th className="px-4 py-3 font-semibold text-blue-400 min-w-fit">Deal Type</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredDealsForTable = deals
                  .filter(deal => {
                    const hasFundedDate = deal.DateFunded || deal['Date Funded'] || deal.FundedDate;
                    if (!hasFundedDate) return false;

                    const broker = deal['Owner (Broker)'] || deal.Owner || deal.Broker || 'Unknown';
                    const dealType = deal.Pipeline || deal.pipeline || deal['Deal Type'] || deal.DealType || deal.Stage || 'Unknown';
                    const fundingPartner = deal.FundingPartner || deal['Funding Partner'] || deal.Lender || 'Unknown';

                    if (selectedBroker !== 'all' && broker !== selectedBroker) return false;
                    if (selectedDealType !== 'all' && dealType !== selectedDealType) return false;
                    if (selectedFundingPartner !== 'all' && fundingPartner !== selectedFundingPartner) return false;

                    // Time period filter
                    if (selectedTimePeriod !== 'all') {
                      const dealDate = new Date(hasFundedDate);
                      const now = new Date();
                      const currentMonth = now.getMonth();
                      const currentYear = now.getFullYear();
                      const dealMonth = dealDate.getMonth();
                      const dealYear = dealDate.getFullYear();

                      if (selectedTimePeriod === 'thisMonth') {
                        if (dealMonth !== currentMonth || dealYear !== currentYear) return false;
                      } else if (selectedTimePeriod === 'lastMonth') {
                        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                        if (dealMonth !== lastMonth || dealYear !== lastMonthYear) return false;
                      }
                    }

                    return true;
                  })
                  .sort((a, b) => {
                    const dateA = new Date(a.DateFunded || a['Date Funded'] || a.FundedDate || '');
                    const dateB = new Date(b.DateFunded || b['Date Funded'] || b.FundedDate || '');
                    return dateB.getTime() - dateA.getTime();
                  });

                // Calculate totals
                const totalFunded = filteredDealsForTable.reduce((sum, deal) => {
                  const amount = parseFloat(
                    String(deal.FundedAmount || deal['Funded Amount'] || deal.Amount || '0')
                      .replace(/[$,]/g, '')
                  ) || 0;
                  return sum + amount;
                }, 0);

                const totalCommission = filteredDealsForTable.reduce((sum, deal) => {
                  const amount = parseFloat(
                    String(deal.Commission || deal.commission || '0')
                      .replace(/[$,]/g, '')
                  ) || 0;
                  return sum + amount;
                }, 0);

                const avgCommissionPct = totalFunded > 0 ? (totalCommission / totalFunded) * 100 : 0;

                return (
                  <>
                    {filteredDealsForTable.map((deal, index) => {
                      const fundedAmount = parseFloat(
                        String(deal.FundedAmount || deal['Funded Amount'] || deal.Amount || '0')
                          .replace(/[$,]/g, '')
                      ) || 0;
                      const commission = parseFloat(
                        String(deal.Commission || deal.commission || '0')
                          .replace(/[$,]/g, '')
                      ) || 0;
                      const commissionPct = fundedAmount > 0 ? (commission / fundedAmount) * 100 : 0;
                      const dealType = deal.Pipeline || deal.pipeline || deal['Deal Type'] || deal.DealType || deal.Stage || 'Unknown';
                      const cleanedDealType = cleanDealType(dealType);

                      return (
                        <tr key={index} className="border-b border-blue-900/20 hover:bg-blue-900/10 transition-colors">
                          <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                            {deal['Owner (Broker)'] || deal.Owner || deal.Broker || deal.Rep || deal.SalesRep || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                            {formatDate(deal.DateFunded || deal['Date Funded'] || deal.FundedDate || '')}
                          </td>
                          <td className="px-4 py-3 text-blue-300 font-semibold whitespace-nowrap">
                            {formatCurrency(fundedAmount)}
                          </td>
                          <td className="px-4 py-3 text-brand-400 font-semibold whitespace-nowrap">
                            {formatCurrency(commission)}
                          </td>
                          <td className="px-4 py-3 text-brand-300 whitespace-nowrap">
                            {formatPercentage(commissionPct)}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {deal.BusinessName || deal['Business Name'] || deal.Business || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {deal.FundingPartner || deal['Funding Partner'] || deal.Lender || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                            {cleanedDealType}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-blue-700/50 bg-blue-900/30">
                      <td className="px-4 py-3 text-gray-200 font-bold whitespace-nowrap">TOTAL</td>
                      <td className="px-4 py-3 text-gray-400"></td>
                      <td className="px-4 py-3 text-blue-300 font-bold whitespace-nowrap">
                        {formatCurrency(totalFunded)}
                      </td>
                      <td className="px-4 py-3 text-brand-400 font-bold whitespace-nowrap">
                        {formatCurrency(totalCommission)}
                      </td>
                      <td className="px-4 py-3 text-brand-300 font-bold whitespace-nowrap">
                        {formatPercentage(avgCommissionPct)}
                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
          {deals.filter(deal => deal.DateFunded || deal['Date Funded'] || deal.FundedDate).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No funded deals found in the data
            </div>
          )}
        </div>
      </div>

      {/* Success indicator */}
      <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-brand-500">
            Connected to Google Sheets • {deals.length} records loaded
          </p>
        </div>
      </div>
    </div>
  );
};

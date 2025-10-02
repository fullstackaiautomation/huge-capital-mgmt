import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, BarChart3, Percent, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchFundingData, formatCurrency, formatPercentage } from '../lib/googleSheets';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  // Calculate average commission percentage
  const avgCommissionPct = metrics.fundedAmount > 0
    ? (metrics.commission / metrics.fundedAmount) * 100
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

  deals.forEach(deal => {
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
    .slice(0, 5);

  const commissionLeaderboard = Object.entries(brokerStats)
    .sort((a, b) => b[1].commission - a[1].commission)
    .slice(0, 5);

  const avgCommissionLeaderboard = Object.entries(brokerStats)
    .map(([broker, stats]) => ({
      broker,
      avgPct: stats.dealsCount > 0 ? stats.totalCommissionPct / stats.dealsCount : 0,
    }))
    .sort((a, b) => b.avgPct - a.avgPct)
    .slice(0, 5);

  const dealsLeaderboard = Object.entries(brokerStats)
    .sort((a, b) => b[1].totalDeals - a[1].totalDeals)
    .slice(0, 5);

  const fundingPartnerLeaderboard = Object.entries(fundingPartnerStats)
    .sort((a, b) => b[1].fundedAmount - a[1].fundedAmount)
    .slice(0, 5);

  const stats = [
    {
      name: 'Total Funded',
      value: formatCurrency(metrics.fundedAmount),
      icon: DollarSign,
      color: 'bg-blue-600',
      leaderboard: fundedLeaderboard,
      type: 'currency' as const,
      leaderboardTitle: 'TOP BROKERS - FUNDED',
    },
    {
      name: 'Total Commission',
      value: formatCurrency(metrics.commission),
      icon: TrendingUp,
      color: 'bg-blue-500',
      leaderboard: commissionLeaderboard,
      type: 'currency' as const,
      leaderboardTitle: 'TOP BROKERS - COMMISSION',
    },
    {
      name: 'Average Commission',
      value: formatPercentage(avgCommissionPct),
      icon: Percent,
      color: 'bg-blue-700',
      leaderboard: avgCommissionLeaderboard,
      type: 'percentage' as const,
      leaderboardTitle: 'TOP BROKERS - COMMISSION %',
    },
    {
      name: 'Total Deals',
      value: metrics.totalDeals.toString(),
      icon: BarChart3,
      color: 'bg-blue-800',
      leaderboard: dealsLeaderboard,
      type: 'count' as const,
      leaderboardTitle: 'TOP BROKERS - DEALS',
    },
  ];

  // Get stages sorted by funded amount
  const stageEntries = Object.entries(metrics.byStage)
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
              className="bg-blue-900/20 rounded-lg shadow-xl border border-blue-700/30 p-6 hover:border-blue-500/50 transition-all backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left side - Title and Total */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-medium text-blue-400 leading-tight">
                      {stat.name.split(' ').map((word, i) => (
                        <div key={i}>{word}</div>
                      ))}
                    </h3>
                  </div>
                  <p className="text-4xl font-bold text-gray-100 mb-1 ml-2">
                    {stat.value}
                  </p>
                </div>

                {/* Right side - Leaderboard */}
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-wide">{stat.leaderboardTitle}</h4>
                  {stat.type === 'currency' && stat.leaderboard.map(([broker, brokerStat], idx) => {
                    const rankColors = ['text-yellow-400 font-bold', 'text-slate-400 font-semibold', 'text-amber-700 font-semibold', 'text-gray-100 font-semibold'];
                    const colorClass = rankColors[idx] || 'text-gray-300 font-semibold';
                    return (
                      <div key={broker} className={`text-sm leading-relaxed ${colorClass}`}>
                        <span className="font-bold">#{idx + 1}</span> <span>-</span> {formatCurrency(index === 0 ? brokerStat.fundedAmount : brokerStat.commission)} <span>-</span> <span className="font-bold">{broker}</span>
                      </div>
                    );
                  })}
                  {stat.type === 'percentage' && stat.leaderboard.map((item, idx) => {
                    const rankColors = ['text-yellow-400 font-bold', 'text-slate-400 font-semibold', 'text-amber-700 font-semibold', 'text-gray-100 font-semibold'];
                    const colorClass = rankColors[idx] || 'text-gray-300 font-semibold';
                    return (
                      <div key={item.broker} className={`text-sm leading-relaxed ${colorClass}`}>
                        <span className="font-bold">#{idx + 1}</span> <span>-</span> {formatPercentage(item.avgPct)} <span>-</span> <span className="font-bold">{item.broker}</span>
                      </div>
                    );
                  })}
                  {stat.type === 'count' && stat.leaderboard.map(([broker, brokerStat], idx) => {
                    const rankColors = ['text-yellow-400 font-bold', 'text-slate-400 font-semibold', 'text-amber-700 font-semibold', 'text-gray-100 font-semibold'];
                    const colorClass = rankColors[idx] || 'text-gray-300 font-semibold';
                    return (
                      <div key={broker} className={`text-sm leading-relaxed ${colorClass}`}>
                        <span className="font-bold">#{idx + 1}</span> <span>-</span> {brokerStat.totalDeals} {brokerStat.totalDeals === 1 ? 'Deal' : 'Deals'} <span>-</span> <span className="font-bold">{broker}</span>
                      </div>
                    );
                  })}
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
          <div className="bg-blue-900/20 rounded-lg shadow-xl border border-blue-700/30 p-6 hover:border-blue-500/50 transition-all backdrop-blur-sm">
            <div className="flex items-start gap-1">
              {/* Left side - Title and Total */}
              <div className="flex-shrink-0" style={{width: '145px'}}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-blue-600">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-blue-400 leading-tight">
                    <div>DEAL</div>
                    <div>TYPES</div>
                  </h3>
                </div>
                <p className="text-4xl font-bold text-gray-100 mb-1 ml-2">
                  {stageEntries.length}
                </p>
              </div>

              {/* Right side - Deal Type Leaderboard */}
              <div className="flex-1 space-y-2 min-w-0 pl-4">
                <h4 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-wide">TOP DEAL TYPES</h4>
                {stageEntries.slice(0, 5).map(([stage, data], idx) => {
                  const rankColors = ['text-yellow-400 font-bold', 'text-slate-400 font-semibold', 'text-amber-700 font-semibold', 'text-gray-100 font-semibold', 'text-gray-300 font-semibold'];
                  const colorClass = rankColors[idx] || 'text-gray-300 font-semibold';
                  return (
                    <div key={stage} className={`text-sm leading-relaxed ${colorClass} whitespace-nowrap overflow-hidden text-ellipsis`}>
                      <span className="font-bold">#{idx + 1}</span> <span>-</span> {formatCurrency(data.amount)} <span>-</span> <span className="font-bold">{stage}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Funding Partner Card */}
          <div className="bg-blue-900/20 rounded-lg shadow-xl border border-blue-700/30 p-6 hover:border-blue-500/50 transition-all backdrop-blur-sm">
            <div className="flex items-start gap-1">
              {/* Left side - Title and Total */}
              <div className="flex-shrink-0" style={{width: '145px'}}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-blue-600">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-blue-400 leading-tight">
                    <div>FUNDING</div>
                    <div>PARTNERS</div>
                  </h3>
                </div>
                <p className="text-4xl font-bold text-gray-100 mb-1 ml-2">
                  {fundingPartnerLeaderboard.length}
                </p>
              </div>

              {/* Right side - Funding Partner Leaderboard */}
              <div className="flex-1 space-y-2 min-w-0 pl-4">
                <h4 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-wide">TOP PARTNERS</h4>
                {fundingPartnerLeaderboard.map(([partner, data], idx) => {
                  const rankColors = ['text-yellow-400 font-bold', 'text-slate-400 font-semibold', 'text-amber-700 font-semibold', 'text-gray-100 font-semibold', 'text-gray-300 font-semibold'];
                  const colorClass = rankColors[idx] || 'text-gray-300 font-semibold';
                  return (
                    <div key={partner} className={`text-sm leading-relaxed ${colorClass} whitespace-nowrap overflow-hidden text-ellipsis`}>
                      <span className="font-bold">#{idx + 1}</span> <span>-</span> {formatCurrency(data.fundedAmount)} <span>-</span> <span className="font-bold">{partner}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Funding by Date Chart - spans 3 columns */}
        <div className="lg:col-span-3 bg-blue-950/30 rounded-lg shadow-xl border border-blue-800/30 p-6">
          <h2 className="text-xl font-bold text-blue-300 mb-4">Funding by Date</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={(() => {
              // Group deals by date and sum funded amounts
              const dateMap: Record<string, number> = {};
              deals
                .filter(deal => deal.DateFunded || deal['Date Funded'] || deal.FundedDate)
                .forEach(deal => {
                  const date = deal.DateFunded || deal['Date Funded'] || deal.FundedDate;
                  const fundedAmount = parseFloat(
                    String(deal.FundedAmount || deal['Funded Amount'] || deal.Amount || '0')
                      .replace(/[$,]/g, '')
                  ) || 0;

                  if (dateMap[date]) {
                    dateMap[date] += fundedAmount;
                  } else {
                    dateMap[date] = fundedAmount;
                  }
                });

              // Convert to array and sort by date
              return Object.entries(dateMap)
                .map(([date, amount]) => ({ date, amount }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            })()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
              <XAxis
                dataKey="date"
                stroke="#60a5fa"
                tick={{ fill: '#60a5fa', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#60a5fa"
                tick={{ fill: '#60a5fa', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Funded']}
                labelStyle={{ color: '#60a5fa' }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funded Deals Table */}
      <div className="bg-blue-950/30 rounded-lg shadow-xl border border-blue-800/30 p-6">
        <h2 className="text-xl font-bold text-blue-300 mb-4">
          Funded Deals Log
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr className="border-b border-blue-800/30">
                <th className="pb-3 text-sm font-semibold text-blue-400">Business Name</th>
                <th className="pb-3 text-sm font-semibold text-blue-400">Date Funded</th>
                <th className="pb-3 text-sm font-semibold text-blue-400">Funded Amount</th>
                <th className="pb-3 text-sm font-semibold text-blue-400">Commission</th>
                <th className="pb-3 text-sm font-semibold text-blue-400">Commission %</th>
                <th className="pb-3 text-sm font-semibold text-blue-400">Funding Partner</th>
                <th className="pb-3 text-sm font-semibold text-blue-400">Deal Type</th>
                <th className="pb-3 text-sm font-semibold text-blue-400">Broker</th>
                <th className="pb-3 text-sm font-semibold text-blue-400">Referral Partner</th>
                <th className="pb-3 text-sm font-semibold text-blue-400">Referral Commission</th>
                <th className="pb-3 text-sm font-semibold text-blue-400">Requested Amount</th>
                <th className="pb-3 text-sm font-semibold text-blue-400">% of Request Funded</th>
              </tr>
            </thead>
            <tbody>
              {deals
                .filter(deal => deal.DateFunded || deal['Date Funded'] || deal.FundedDate)
                .sort((a, b) => {
                  const dateA = new Date(a.DateFunded || a['Date Funded'] || a.FundedDate || '');
                  const dateB = new Date(b.DateFunded || b['Date Funded'] || b.FundedDate || '');
                  return dateB.getTime() - dateA.getTime();
                })
                .map((deal, index) => {
                  const fundedAmount = parseFloat(
                    String(deal.FundedAmount || deal['Funded Amount'] || deal.Amount || '0')
                      .replace(/[$,]/g, '')
                  ) || 0;
                  const commission = parseFloat(
                    String(deal.Commission || deal.commission || '0')
                      .replace(/[$,]/g, '')
                  ) || 0;
                  const commissionPct = fundedAmount > 0 ? (commission / fundedAmount) * 100 : 0;
                  const referralCommission = parseFloat(
                    String(deal['Referral Partner Commission'] || deal.ReferralPartnerCommission || deal.ReferralCommission || deal['Referral Commission'] || '0')
                      .replace(/[$,]/g, '')
                  ) || 0;
                  const requestedAmount = parseFloat(
                    String(deal.RequestedAmount || deal['Requested Amount'] || deal['Requested Funding Amount'] || '0')
                      .replace(/[$,]/g, '')
                  ) || 0;
                  const percentFunded = requestedAmount > 0 ? (fundedAmount / requestedAmount) * 100 : 0;

                  return (
                    <tr key={index} className="border-b border-blue-900/20 hover:bg-blue-900/10 transition-colors">
                      <td className="py-3 text-sm text-gray-300">
                        {deal.BusinessName || deal['Business Name'] || deal.Business || '-'}
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {deal.DateFunded || deal['Date Funded'] || deal.FundedDate || '-'}
                      </td>
                      <td className="py-3 text-sm text-blue-300 font-semibold">
                        {formatCurrency(fundedAmount)}
                      </td>
                      <td className="py-3 text-sm text-brand-400 font-semibold">
                        {formatCurrency(commission)}
                      </td>
                      <td className="py-3 text-sm text-brand-300">
                        {formatPercentage(commissionPct)}
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {deal.FundingPartner || deal['Funding Partner'] || deal.Lender || '-'}
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {deal.Pipeline || deal.Source || '-'}
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {deal['Owner (Broker)'] || deal.Owner || deal.Broker || deal.Rep || deal.SalesRep || '-'}
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {deal.ReferralPartner || deal['Referral Partner'] || deal.Referral || '-'}
                      </td>
                      <td className="py-3 text-sm text-brand-400">
                        {referralCommission > 0 ? formatCurrency(referralCommission) : '-'}
                      </td>
                      <td className="py-3 text-sm text-blue-300">
                        {requestedAmount > 0 ? formatCurrency(requestedAmount) : '-'}
                      </td>
                      <td className="py-3 text-sm text-brand-300">
                        {percentFunded > 0 ? formatPercentage(percentFunded) : '-'}
                      </td>
                    </tr>
                  );
                })}
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

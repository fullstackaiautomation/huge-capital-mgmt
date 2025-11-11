// Google Sheets API integration
const SHEETS_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SHEETS_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID;

interface SheetData {
  range: string;
  majorDimension: string;
  values: any[][];
}

/**
 * Fetch data from a Google Sheet
 * @param range - The A1 notation range (e.g., 'Sheet1!A1:Z100')
 * @returns Parsed sheet data
 */
export async function fetchSheetData(range: string): Promise<any[][]> {
  if (!SHEETS_API_KEY || !SHEETS_ID) {
    console.warn('Google Sheets credentials not configured');
    return [];
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${range}?key=${SHEETS_API_KEY}`;

  try {
    console.log('Fetching from URL:', url);
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || response.statusText;
      console.error('API Error:', errorData);
      throw new Error(`Failed to fetch sheet data: ${errorMessage}`);
    }

    const data: SheetData = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
}

/**
 * Convert sheet rows to objects using first row as headers
 * @param rows - Raw rows from Google Sheets
 * @returns Array of objects with header keys
 */
export function rowsToObjects<T = Record<string, any>>(rows: any[][]): T[] {
  if (rows.length === 0) return [];

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return dataRows.map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj as T;
  });
}

/**
 * Fetch and parse funding pipeline data
 */
export async function fetchFundingData() {
  try {
    // Adjust the range based on your actual sheet structure
    // Format: 'SheetName!A1:Z1000' - fetches columns A through Z, rows 1-1000
    // Using A1:Z1000 without sheet name gets the first sheet
    const rows = await fetchSheetData('A1:Z1000');

    if (rows.length === 0) {
      return { deals: [], metrics: null };
    }

    const deals = rowsToObjects(rows);

    // Calculate metrics from the deals data
    const metrics = calculateMetrics(deals);

    return { deals, metrics };
  } catch (error) {
    console.error('Error fetching funding data:', error);
    return { deals: [], metrics: null };
  }
}

interface FundingMetrics {
  fundedAmount: number;
  commission: number;
  requestedAmount: number;
  totalDeals: number;
  byStage: Record<string, { count: number; amount: number }>;
  byTier: Record<string, { count: number; amount: number }>;
}

/**
 * Calculate metrics from deals data
 */
function calculateMetrics(deals: any[]): FundingMetrics {
  const metrics: FundingMetrics = {
    fundedAmount: 0,
    commission: 0,
    requestedAmount: 0,
    totalDeals: deals.length,
    byStage: {},
    byTier: {},
  };

  if (deals.length === 0) return metrics;

  deals.forEach(deal => {
    // Parse funded amount
    const fundedAmount = parseFloat(
      String(deal.FundedAmount || deal['Funded Amount'] || deal.Amount || '0')
        .replace(/[$,]/g, '')
    ) || 0;

    // Parse commission
    const commission = parseFloat(
      String(deal.Commission || deal.commission || '0')
        .replace(/[$,]/g, '')
    ) || 0;

    // Parse requested amount
    const requestedAmount = parseFloat(
      String(deal.RequestedAmount || deal['Requested Amount'] || deal.Request || '0')
        .replace(/[$,]/g, '')
    ) || 0;

    // Get deal type (from Pipeline column) and tier
    const stage = deal.Pipeline || deal.pipeline || deal['Deal Type'] || deal.DealType || deal.Stage || deal.stage || 'Unknown';
    const tier = deal.Tier || deal.tier || deal.Paper || 'Unknown';

    // Accumulate totals
    metrics.fundedAmount += fundedAmount;
    metrics.commission += commission;
    metrics.requestedAmount += requestedAmount;

    // Track by stage/deal type (from Pipeline column)
    // Only track deals that have a funded date
    const hasFundedDate = deal.DateFunded || deal['Date Funded'] || deal.FundedDate;
    if (hasFundedDate && fundedAmount > 0) {
      if (!metrics.byStage[stage]) {
        metrics.byStage[stage] = { count: 0, amount: 0 };
      }
      metrics.byStage[stage].count++;
      metrics.byStage[stage].amount += fundedAmount;
    }

    // Track by tier
    const stageAmount = fundedAmount || requestedAmount;
    if (stageAmount > 0) {
      if (!metrics.byTier[tier]) {
        metrics.byTier[tier] = { count: 0, amount: 0 };
      }
      metrics.byTier[tier].count++;
      metrics.byTier[tier].amount += stageAmount;
    }
  });

  return metrics;
}

/**
 * Format currency for display - full dollar amount with commas
 */
export function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Format percentage - removes trailing zeros (5.00% becomes 5%, but 2.14% stays 2.14%)
 */
export function formatPercentage(value: number): string {
  // Round to 2 decimal places
  const rounded = Math.round(value * 100) / 100;

  // If it's a whole number, don't show decimals
  if (rounded % 1 === 0) {
    return `${rounded}%`;
  }

  // Otherwise show up to 2 decimals, removing trailing zeros
  return `${rounded.toFixed(2).replace(/\.?0+$/, '')}%`;
}

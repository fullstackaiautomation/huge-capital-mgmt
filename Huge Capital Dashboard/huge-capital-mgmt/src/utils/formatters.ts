/**
 * Utility functions for formatting and transforming data display
 */

/**
 * Clean deal type display names by removing prefix letters and numbers
 * Removes patterns like "E. ", "C.D. ", "B. ", "I. ", "D. " from the beginning
 * Also removes number prefixes like "1. ", "2. ", etc.
 *
 * @param dealType - The raw deal type string from the data source
 * @returns Cleaned deal type name suitable for display
 *
 * @example
 * cleanDealType("E. SBA 7A") // Returns "SBA 7A"
 * cleanDealType("C.D. MCA") // Returns "MCA"
 * cleanDealType("1. Business Credit") // Returns "Business Credit"
 */
export function cleanDealType(dealType: string): string {
  if (!dealType) return '';

  return dealType
    // Remove letter prefixes like "E. ", "C.D. ", "B. ", "I. ", "D. "
    .replace(/^[A-Z]+\.?\s*/g, '')
    // Remove number prefixes like "1. ", "2. ", etc.
    .replace(/^\d+\.?\s*/g, '')
    .trim();
}

/**
 * Format date as M/D/YY (e.g., 7/14/25)
 *
 * @param dateString - The date string to format
 * @returns Formatted date string in M/D/YY format
 *
 * @example
 * formatDate("2025-07-14") // Returns "7/14/25"
 * formatDate("07/14/2025") // Returns "7/14/25"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear() % 100; // Get last 2 digits of year
    return `${month}/${day}/${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Broker color mapping for consistent visualization across the dashboard
 * Maps broker/rep names to brand colors
 */
export const brokerColorMap: Record<string, string> = {
  'Zac': '#60a5fa',      // Blue (matching icon backgrounds)
  'Luke': '#10b981',      // Green
  'Aaron Sonego': '#f97316', // Orange
  'Zac Hathaway': '#60a5fa',
  'Luke Chen': '#10b981',
  // Add more brokers as needed
};

/**
 * Get a consistent color for a broker/rep
 * Falls back to a default color if broker not in map
 *
 * @param broker - The broker/rep name
 * @returns Hex color code for the broker
 */
export function getBrokerColor(broker: string): string {
  if (!broker) return '#64748b'; // slate-500

  // Check exact match first
  if (brokerColorMap[broker]) {
    return brokerColorMap[broker];
  }

  // Check if name contains common broker names
  if (broker.includes('Zac')) {
    return '#60a5fa';
  }
  if (broker.includes('Luke')) {
    return '#10b981';
  }

  // Generate a consistent color based on name hash
  return generateColorFromHash(broker);
}

/**
 * Generate a consistent color from a string hash
 * Ensures the same name always gets the same color
 *
 * @param str - String to hash
 * @returns Hex color code
 */
function generateColorFromHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Color palette for generated colors
  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#f97316', // orange
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

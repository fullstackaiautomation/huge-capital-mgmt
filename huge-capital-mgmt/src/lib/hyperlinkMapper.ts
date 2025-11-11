// Hyperlink Mapper Utility
// Maps hyperlinks from extracted CSV to actual lender fields
// File: Master Huge Capital Lender List - Extracted Hyperlinks.csv

export interface HyperlinkMapping {
  sheetName: string;
  row: number;
  column: string;
  columnLetter: string;
  displayText: string;
  url: string;
}

export interface ExtractedHyperlinks {
  [key: string]: HyperlinkMapping[];
}

// Column to field mappings
const COLUMN_FIELD_MAP: Record<string, string> = {
  // Email columns (usually column E)
  'E': 'email',
  // Phone columns (usually column D)
  'D': 'phone',
  // Website columns (usually column F)
  'F': 'website',
  // Google Drive columns (usually column R)
  'R': 'drive_link',
  'S': 'google_drive',
  // Portal URLs
  'T': 'portal_url',
  // Document links
  'U': 'preferred_industries_doc_link',
  'V': 'restricted_industries_doc_link',
};

/**
 * Parse hyperlinks CSV and organize by sheet and row
 * Used after importing the Extracted Hyperlinks CSV
 */
export function parseHyperlinkCSV(csvData: string[][]): ExtractedHyperlinks {
  const hyperlinks: ExtractedHyperlinks = {};

  csvData.forEach((row) => {
    const [sheetName, rowNum, col, colLetter, displayText, url] = row;

    if (!sheetName || sheetName === 'Sheet Name') return; // Skip header

    const key = `${sheetName}-${rowNum}`;
    if (!hyperlinks[key]) {
      hyperlinks[key] = [];
    }

    hyperlinks[key].push({
      sheetName,
      row: parseInt(rowNum),
      column: col,
      columnLetter: colLetter,
      displayText,
      url,
    });
  });

  return hyperlinks;
}

/**
 * Extract hyperlinks for a specific lender from hyperlinks mapping
 * Maps display text like "Google Drive" to actual URLs
 */
export function extractHyperlinksForLender(
  rowNumber: number,
  sheetName: string,
  hyperlinks: ExtractedHyperlinks
): Record<string, string> {
  const key = `${sheetName}-${rowNumber}`;
  const lenderLinks = hyperlinks[key] || [];

  const extracted: Record<string, string> = {};

  lenderLinks.forEach((link) => {
    const fieldName = COLUMN_FIELD_MAP[link.columnLetter];

    if (!fieldName) return; // Unknown column

    // Map display text to field if no direct column match
    const displayLower = link.displayText.toLowerCase();

    if (displayLower.includes('google drive') || displayLower.includes('drive')) {
      extracted['drive_link'] = link.url;
    } else if (displayLower.includes('portal') || displayLower.includes('application')) {
      extracted['portal_url'] = link.url;
    } else if (displayLower.includes('preferred industries')) {
      extracted['preferred_industries_doc_link'] = link.url;
    } else if (displayLower.includes('restricted industries')) {
      extracted['restricted_industries_doc_link'] = link.url;
    } else if (displayLower.includes('website') || displayLower.includes('link')) {
      extracted['website'] = link.url;
    } else if (link.displayText.includes('@')) {
      extracted['email'] = link.url.replace('mailto:', '');
    } else if (fieldName) {
      extracted[fieldName] = link.url;
    }
  });

  return extracted;
}

/**
 * Process raw email/phone from CSV and merge with hyperlink data
 * Example: "tyler.ryan@usbank.com" with hyperlink "mailto:tyler.ryan@usbank.com"
 */
export function mergeContactData(
  csvData: Record<string, string>,
  hyperlinks: Record<string, string>
): Record<string, string> {
  return {
    ...csvData,
    ...hyperlinks,
  };
}

/**
 * Convert display text to field name
 * Useful for parsing CSV headers that might not be exact
 */
export function normalizeDisplayText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();
}

/**
 * Check if a hyperlink is valid/accessible
 * (Client-side validation - won't actually fetch)
 */
export function isValidHyperlink(url: string): boolean {
  try {
    if (url.startsWith('mailto:')) {
      const email = url.replace('mailto:', '');
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    if (url.startsWith('tel:')) {
      return /^tel:\+?[\d\s\-()]+$/.test(url);
    }

    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format hyperlink for display
 * Shows friendly text instead of raw URL
 */
export function formatHyperlinkForDisplay(
  url: string,
  displayText?: string
): { text: string; href: string; type: 'email' | 'phone' | 'web' | 'unknown' } {
  if (url.startsWith('mailto:')) {
    return {
      type: 'email',
      text: displayText || url.replace('mailto:', ''),
      href: url,
    };
  }

  if (url.startsWith('tel:')) {
    return {
      type: 'phone',
      text: displayText || url.replace('tel:', ''),
      href: url,
    };
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('http')) {
    return {
      type: 'web',
      text: displayText || new URL(url).hostname,
      href: url,
    };
  }

  return {
    type: 'unknown',
    text: displayText || url,
    href: url,
  };
}

/**
 * Batch process multiple lenders' hyperlinks
 */
export function processBatchHyperlinks(
  lenders: Array<{ lenderName: string; row: number; sheet: string }>,
  hyperlinks: ExtractedHyperlinks
): Array<Record<string, string>> {
  return lenders.map((lender) => {
    const { lenderName, ...linkData } = extractHyperlinksForLender(
      lender.row,
      lender.sheet,
      hyperlinks
    );
    return {
      lenderName: lender.lenderName,
      ...linkData,
    };
  });
}

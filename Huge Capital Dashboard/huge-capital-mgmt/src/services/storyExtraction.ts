/**
 * AI Story Extraction Service
 * Extracts structured data from voice memo transcripts
 */

import type { FundingType, StoryType } from '../types/story';

interface ExtractedStoryData {
  title: string;
  storyType: StoryType;
  fundingType?: FundingType;
  loanAmountRange?: string;
  clientIndustry?: string;
  themes: string[];
  keyTakeaways: string[];
}

export async function extractStoryData(transcript: string): Promise<ExtractedStoryData> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase not configured, using fallback extraction');
    return extractStoryDataFallback(transcript);
  }

  try {
    // Call the Supabase Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/extract-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Edge function error:', errorData);
      throw new Error(errorData.error || 'AI extraction failed');
    }

    const extracted = await response.json();

    return {
      title: extracted.title,
      storyType: extracted.storyType,
      fundingType: extracted.fundingType || undefined,
      loanAmountRange: extracted.loanAmountRange || undefined,
      clientIndustry: extracted.clientIndustry || undefined,
      themes: extracted.themes || [],
      keyTakeaways: extracted.keyTakeaways || [],
    };
  } catch (error) {
    console.error('Story extraction error:', error);
    // Fall back to basic extraction
    return extractStoryDataFallback(transcript);
  }
}

/**
 * Fallback extraction using simple pattern matching
 * Used when API key is not available or API call fails
 */
function extractStoryDataFallback(transcript: string): ExtractedStoryData {
  const text = transcript.toLowerCase();

  // Detect funding type
  let fundingType: FundingType | undefined;
  if (text.includes('sba 7(a)') || text.includes('sba 7a')) {
    fundingType = 'SBA 7(a)';
  } else if (text.includes('sba 504') || text.includes('504 loan')) {
    fundingType = 'SBA 504';
  } else if (text.includes('construction loan') || text.includes('construction financing')) {
    fundingType = 'Construction Loan';
  } else if (text.includes('equipment financing') || text.includes('equipment loan')) {
    fundingType = 'Equipment Financing';
  }

  // Detect loan amount range
  let loanAmountRange: string | undefined;
  const amountMatch = text.match(/\$?\d+[km]?/gi);
  if (amountMatch) {
    const amounts = amountMatch.map(a => {
      const num = parseFloat(a.replace(/[$,k]/gi, ''));
      if (a.toLowerCase().includes('m')) return num * 1000000;
      if (a.toLowerCase().includes('k')) return num * 1000;
      return num;
    });
    const maxAmount = Math.max(...amounts);

    if (maxAmount < 100000) loanAmountRange = '< $100k';
    else if (maxAmount < 500000) loanAmountRange = '$100k - $500k';
    else if (maxAmount < 1000000) loanAmountRange = '$500k - $1M';
    else if (maxAmount < 5000000) loanAmountRange = '$1M - $5M';
    else loanAmountRange = '$5M+';
  }

  // Detect industry keywords
  const industries = {
    construction: ['construction', 'contractor', 'builder', 'building'],
    healthcare: ['healthcare', 'medical', 'hospital', 'clinic'],
    manufacturing: ['manufacturing', 'factory', 'production'],
    retail: ['retail', 'store', 'shop'],
    restaurant: ['restaurant', 'food service', 'cafe'],
  };

  let clientIndustry: string | undefined;
  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      clientIndustry = industry.charAt(0).toUpperCase() + industry.slice(1);
      break;
    }
  }

  // Generate basic title
  const firstSentence = transcript.split(/[.!?]/)[0].trim();
  const title = firstSentence.length > 60
    ? firstSentence.substring(0, 57) + '...'
    : firstSentence;

  // Detect themes
  const themes: string[] = [];
  if (text.includes('quick') || text.includes('fast') || text.includes('days')) {
    themes.push('speed to close');
  }
  if (text.includes('save') || text.includes('saving')) {
    themes.push('cost savings');
  }
  if (text.includes('challenge') || text.includes('difficult') || text.includes('problem')) {
    themes.push('overcoming obstacles');
  }
  if (text.includes('relationship') || text.includes('trust')) {
    themes.push('relationship building');
  }

  // Extract key takeaways (look for numbers/achievements)
  const keyTakeaways: string[] = [];
  const achievementPatterns = [
    /closed in \d+ (days|weeks)/gi,
    /saved.*\$\d+[km]?/gi,
    /\d+ year[s]? experience/gi,
  ];

  for (const pattern of achievementPatterns) {
    const matches = transcript.match(pattern);
    if (matches) {
      keyTakeaways.push(...matches.map(m => m.trim()));
    }
  }

  return {
    title: title || 'Funding Story',
    storyType: 'funding_success', // Default assumption
    fundingType,
    loanAmountRange,
    clientIndustry,
    themes: themes.length > 0 ? themes : ['business funding'],
    keyTakeaways: keyTakeaways.length > 0 ? keyTakeaways : ['Client success story'],
  };
}

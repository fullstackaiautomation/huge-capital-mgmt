import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

interface ExtractedStoryData {
  title: string;
  storyType: string;
  fundingType?: string;
  loanAmountRange?: string;
  clientIndustry?: string;
  themes: string[];
  keyTakeaways: string[];
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'Transcript is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const systemPrompt = `You are an expert at analyzing business funding stories and extracting structured information. You work for a business funding company and need to extract key details from voice memos.

READ THE ENTIRE TRANSCRIPT CAREFULLY and extract the following information:

1. **Title**: Create a specific, compelling title (8-15 words) that captures the UNIQUE aspects of this deal
   - Include specific dollar amounts, property types, or unique achievements
   - Examples: "Duplex Refinance Nets Client $160K Cash Out in One Month" or "$2M SBA 7(a) for Manufacturing Expansion - Closed in 14 Days"

2. **Story Type**: Choose ONE that BEST fits:
   - funding_success: Successfully closed a loan/funding
   - client_challenge: Overcame a difficult challenge for a client
   - industry_insight: General insight about the industry
   - personal_experience: Personal lesson or experience
   - case_study: Detailed case study of a deal

3. **Funding Type**: Read carefully and identify the PRIMARY loan type mentioned:
   - SBA 7(a): Small Business Administration 7(a) loan
   - SBA 504: Small Business Administration 504 loan
   - Construction Loan: For building/renovating
   - Equipment Financing: For purchasing equipment
   - Working Capital: For operational expenses
   - Commercial Real Estate: For purchasing commercial property (duplexes, apartments, office buildings, etc.) OR refinancing existing commercial property
   - Business Acquisition: For buying an existing business
   - Other: If none of the above fit

   IMPORTANT: If the story mentions "refinance" or "refinancing" a duplex, apartment, or any commercial property, use "Commercial Real Estate"

4. **Loan Amount Range**: Find the ACTUAL dollar amount mentioned and categorize it:
   - Look for phrases like "$160,000", "$300,000", "half a million", etc.
   - Use the HIGHEST amount mentioned (e.g., if $160K cash out is mentioned, use that)
   - < $100k, $100k - $500k, $500k - $1M, $1M - $5M, $5M+

5. **Client Industry**: What type of business or property is this for?
   - For real estate: "Real Estate Investment", "Property Investment", "Multi-Family Housing"
   - For businesses: "Construction", "Healthcare", "Manufacturing", "Retail", etc.

6. **Themes**: Extract 3-5 SPECIFIC themes that actually appear in the story (not generic):
   - Look for: timeline mentions (e.g., "closed in one month", "quick turnaround")
   - Cost savings (e.g., "no fees charged", "saved $50K", "no out-of-pocket costs")
   - Unique aspects (e.g., "retained ownership", "cash-out refinance", "tenants service debt")
   - Emotional elements (e.g., "client excited", "flew family to celebrate")
   - Relationship aspects (e.g., "long-time client", "personal friend")

7. **Key Takeaways**: List 3-5 SPECIFIC, MEASURABLE achievements from THIS story:
   - Include exact dollar amounts: "$160,000 cash out", "$15,000 in fees covered"
   - Include timelines: "Closed in 30 days", "Refinanced in one month"
   - Include unique benefits: "Maintained property ownership", "Tenants continue servicing debt"
   - Include personal touches: "Flew family to Tennessee to celebrate"
   - Be SPECIFIC - avoid generic phrases like "client success" or "good deal"

IMPORTANT:
- Extract information that's ACTUALLY in the transcript, don't make things up
- Be SPECIFIC with numbers, timelines, and details
- Look for the emotional/human elements that make the story compelling
- When in doubt about funding type, consider: Is this about purchasing/refinancing property? → Commercial Real Estate

Respond ONLY with valid JSON in this exact format:
{
  "title": "string",
  "storyType": "funding_success | client_challenge | industry_insight | personal_experience | case_study",
  "fundingType": "SBA 7(a) | SBA 504 | Construction Loan | Equipment Financing | Working Capital | Commercial Real Estate | Business Acquisition | Other" or null,
  "loanAmountRange": "< $100k | $100k - $500k | $500k - $1M | $1M - $5M | $5M+" or null,
  "clientIndustry": "string" or null,
  "themes": ["specific theme 1", "specific theme 2", "specific theme 3"],
  "keyTakeaways": ["Specific achievement 1 with numbers", "Specific achievement 2 with numbers", "Specific achievement 3"]
}`;

    const userPrompt = `Extract structured information from this funding story transcript:

${transcript}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      throw new Error(`AI extraction failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse the JSON response
    const extracted: ExtractedStoryData = JSON.parse(content);

    return new Response(
      JSON.stringify(extracted),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Story extraction error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Story extraction failed'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

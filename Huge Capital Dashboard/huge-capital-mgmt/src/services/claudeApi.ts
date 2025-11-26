/**
 * Claude API Integration Service
 *
 * This service handles AI-powered content generation using the Claude API.
 * It uses persona YAML configurations as system prompts to maintain voice consistency.
 *
 * PRODUCTION NOTE: For production deployment, implement a backend proxy
 * (Supabase Edge Function, Vercel Function, etc.) to securely call the Claude API.
 * Never expose API keys in client-side code.
 */

import type { Person, Platform } from '../types/content';

// =============================================================================
// TYPES
// =============================================================================

export interface ClaudeGenerationRequest {
  persona: Person;
  platform: Platform;
  topic?: string;
  inspiration?: string;
  contentType?: 'post' | 'carousel' | 'reel_script' | 'story';
}

export interface ClaudeGenerationResponse {
  content: string;
  hashtags: string[];
  imagePrompt: {
    subject: string;
    briefConceptPrompt: string;
    plugAndPlayPrompt: string;
  };
  metadata: {
    model: string;
    tokensUsed?: number;
    generatedAt: string;
  };
}

// =============================================================================
// PERSONA SYSTEM PROMPTS
// Extracted from YAML configuration files for use as Claude system prompts
// =============================================================================

const PERSONA_SYSTEM_PROMPTS: Record<Person, string> = {
  'Zac': `You are writing content for Zac, Owner of Huge Capital and a Trusted Business Financing Advisor with 7+ years of experience specializing in SBA loans.

## VOICE & PERSONALITY
- Professional but approachable
- Confident without being arrogant
- Consultative and advisory
- Occasionally humorous but focused on value
- Trustworthy and authentic
- Emotional tone: Warm authority - like a knowledgeable friend who happens to be an expert

## SIGNATURE PHRASES (use naturally)
- "Here's what most people don't know..."
- "After 7+ years in this industry..."
- "Let me break this down..."
- "The truth is..."
- "Your success is our success"

## KEY MESSAGING
- 7+ years saving businesses
- SBA Specialist expertise
- Creative problem solver
- Long-term relationships over quick commissions
- Not for everyone (selective positioning)

## CONTENT STRUCTURE FOR POSTS
1. Hook (first line that stops the scroll)
2. Context/Story (2-3 sentences of setup)
3. Insight/Lesson (the valuable takeaway)
4. Soft CTA or engagement question (no hard sells)

## CONTENT MIX
- 40% Client Success Stories
- 30% Educational/Legal Updates
- 20% Entrepreneur Spotlights
- 10% Personal Brand/Leadership

## STRICT PROHIBITIONS
- NO specific interest rates or rate promises
- NO client names, business names, or identifying details
- NO competitor names
- NO political topics or controversial social issues
- NO pre-approval promises or guarantees
- NO emojis overload or slang
- NO pressure tactics ("Act now!", "Limited time!")
- NO generic motivational quotes without substance

## QUALITY STANDARDS
- Write at 8th-10th grade reading level
- Be educational, not promotional
- Describe rates only as "prime rates" or "subject to analysis"
- Anonymize all client details in success stories`,

  'Luke': `You are writing content for Luke, an Investment Real Estate Advisor & Business Credit Expert at Huge Capital.

## VOICE & PERSONALITY
- Honest and trustworthy
- Relational over transactional
- Personable and down-to-earth
- "Same team" mentality with clients
- Straightforward truth-teller
- Emotional tone: Friendly collaborator - like talking to a knowledgeable friend who genuinely wants you to succeed

## SIGNATURE PHRASES (use naturally)
- "If it's not good for you, it's not good for us"
- "We're invested in your success, not a quick buck"
- "We're part of your team, not just a middle man"
- "Let me be real with you..."
- "Here's what nobody tells you..."
- "Same team, same goal"

## KEY MESSAGING
- Same team mentality
- Your success = our success
- No pressure, just honest advice
- Real estate investment expertise
- Business credit building
- Myth-busting industry misconceptions

## CONTENT STRUCTURE FOR POSTS
1. Relatable hook (acknowledge a common struggle)
2. The truth/myth-bust (what they might not know)
3. Practical advice (what to do about it)
4. Partnership invitation (we're here to help)

## CONTENT MIX
- 40% Client Success Stories
- 30% Educational/Myth-Busting
- 20% Entrepreneur Spotlights
- 10% Personal Brand/Leadership

## STRICT PROHIBITIONS
- NO specific interest rates or rate promises
- NO client names, business names, or identifying details
- NO competitor names
- NO political topics or controversial social issues
- NO pre-approval promises or guarantees
- NO emojis overload or slang
- NO pressure tactics ("Act now!", "Limited time!")
- NO overly formal corporate language

## QUALITY STANDARDS
- Write at 8th-10th grade reading level
- Be educational, not promotional
- Use everyday language, avoid jargon
- Anonymize all client details in success stories`,

  'Huge Capital': `You are writing content for Huge Capital, the company brand representing a trusted funding marketplace that has funded nearly 3,000 businesses.

## VOICE & PERSONALITY
- Combination of professionalism and approachability
- Approachable and nonchalant
- Trustworthy and reliable
- Business foundational energy
- Inclusive and welcoming
- Emotional tone: Confident helper - like a well-established company that's seen it all and is ready to help

## SIGNATURE PHRASES (use naturally)
- "Fast, clear funding built for small business"
- "No pressure, just solutions"
- "Nearly 3,000 businesses funded"
- "Real business owners deserve real solutions"
- "We've seen it all, and we've got you covered"
- "Funding that fits YOUR business"

## KEY MESSAGING
- Financial literacy for business owners
- Full spectrum of funding options
- Track record: nearly 3,000 businesses funded
- Educational mission
- Celebrates entrepreneurs at scale

## CONTENT STRUCTURE FOR POSTS
1. Attention-grabbing headline
2. Educational content or story
3. Key takeaway
4. Soft CTA or engagement question

## CONTENT MIX
- 35% Financial Literacy
- 25% Funding Success Stories
- 20% Entrepreneur Spotlights
- 10% Laws & Regulations
- 10% Company Milestones

## STRICT PROHIBITIONS
- NO specific interest rates or rate promises
- NO client names, business names, or identifying details
- NO competitor names
- NO political topics or controversial social issues
- NO pre-approval promises or guarantees
- NO emojis overload or slang
- NO pressure tactics ("Act now!", "Limited time!")
- NO individual advisor perspective (this is the company voice)

## QUALITY STANDARDS
- Write at 8th-10th grade reading level
- Be educational, not promotional
- Speak to the everyday business owner
- Anonymize all client details in success stories`
};

// =============================================================================
// PLATFORM-SPECIFIC GUIDELINES
// =============================================================================

const PLATFORM_GUIDELINES: Record<Platform, string> = {
  'LinkedIn': `
## LINKEDIN-SPECIFIC FORMATTING
- Length: 1,300-2,000 characters (optimal for engagement)
- Use line breaks for readability
- Start with a hook that stops the scroll
- 3-5 hashtags at the end
- No emojis (professional platform)
- End with a thought-provoking question, NOT a hard CTA`,

  'Instagram': `
## INSTAGRAM-SPECIFIC FORMATTING
- Caption length: 125-150 words before the fold
- Hook must be compelling before "...more"
- Save space for hashtags (will be added separately)
- More visual storytelling
- Slightly more casual than LinkedIn
- End with engagement prompt`,

  'Facebook': `
## FACEBOOK-SPECIFIC FORMATTING
- Length: 300-500 words
- Detailed, story-driven content
- More conversational tone
- Can include more personal elements
- 3-5 hashtags
- Encourage comments and discussion`,

  'Twitter': `
## TWITTER-SPECIFIC FORMATTING
- Keep under 280 characters OR format as thread
- Punchy, impactful statements
- No hashtags in main text (2-3 at end max)
- Thread format: Hook tweet + numbered follow-ups`,

  'Blog': `
## BLOG-SPECIFIC FORMATTING
- Long-form educational content
- Include subheadings for scannability
- 800-1,500 words
- SEO-friendly structure
- Include actionable takeaways`,

  'Newsletter': `
## NEWSLETTER-SPECIFIC FORMATTING
- Clear section structure
- Scannable with key takeaways
- Personal/conversational opener
- Value-focused content
- Clear call-to-action`,

  'Skool': `
## SKOOL COMMUNITY FORMATTING
- Educational and actionable
- Encourage discussion and questions
- More in-depth explanations
- Community-building tone
- Practical, implementable advice`,

  'ISO Newsletter': `
## ISO NEWSLETTER FORMATTING
- Industry-specific insights
- Professional B2B tone
- Data and trends focused
- Clear value for ISOs
- Actionable partnership insights`
};

// =============================================================================
// TOPIC EXPANSION
// =============================================================================

const TOPIC_EXPANSIONS: Record<string, string> = {
  'sba-loans': 'SBA loan programs including 7(a), 504, microloans - requirements, benefits, common misconceptions, and success factors',
  'credit-challenges': 'Business credit challenges and solutions - how to qualify with less-than-perfect credit, building business credit, separating personal and business credit',
  'business-growth': 'Business growth and expansion funding - scaling strategies, capital for growth, timing funding with growth phases',
  'startup-funding': 'Startup and new business funding options - what\'s available for new businesses, requirements, building fundability',
  'equipment-financing': 'Equipment financing options and strategies - leasing vs. buying, how to structure equipment loans',
  'real-estate': 'Commercial real estate financing - SBA 504, investment property loans, owner-occupied vs. investor',
  'working-capital': 'Working capital and cash flow solutions - lines of credit, term loans, managing cash flow gaps',
  'industry-spotlight': 'Industry-specific funding insights - restaurants, construction, healthcare, retail, and how funding differs by industry',
  'client-success': 'Client success stories - anonymized case studies of businesses that overcame funding challenges',
  'myths-debunked': 'Common funding myths debunked - what people believe vs. reality about business financing',
  'application-tips': 'Application tips and process guidance - how to prepare, what lenders look for, common mistakes',
  'lender-relationships': 'Lender relationships and how to work with funders - being prepared, communication, building long-term relationships',
  'entrepreneur-mindset': 'Entrepreneur mindset and leadership - building a fundable business, thinking like a funded entrepreneur',
  'market-trends': 'Market trends and industry updates - current lending environment, economic impacts on funding',
  'personal-brand': 'Personal brand and authenticity in business - being genuine, building trust, thought leadership',
};

// =============================================================================
// API CONFIGURATION
// =============================================================================

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

// Check if API key is available
export function isClaudeApiAvailable(): boolean {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  return !!apiKey && apiKey.length > 0 && !apiKey.includes('placeholder');
}

// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================

export async function generateWithClaude(
  request: ClaudeGenerationRequest
): Promise<ClaudeGenerationResponse> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.includes('placeholder')) {
    throw new Error('Claude API key not configured. Add VITE_ANTHROPIC_API_KEY to your .env file.');
  }

  // Build the system prompt
  const systemPrompt = buildSystemPrompt(request.persona, request.platform);

  // Build the user prompt
  const userPrompt = buildUserPrompt(request);

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Claude API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const generatedText = data.content[0]?.text || '';

    // Parse the generated content
    return parseClaudeResponse(generatedText, request, data);
  } catch (error) {
    console.error('Claude API call failed:', error);
    throw error;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function buildSystemPrompt(persona: Person, platform: Platform): string {
  const personaPrompt = PERSONA_SYSTEM_PROMPTS[persona];
  const platformPrompt = PLATFORM_GUIDELINES[platform] || '';

  return `${personaPrompt}

${platformPrompt}

## OUTPUT FORMAT
Generate your response in the following structure:

---CONTENT---
[The main post content here]

---HASHTAGS---
[Comma-separated hashtags appropriate for the platform]

---IMAGE_PROMPT---
Subject: [Brief description of the image subject]
Brief Concept: [Description for a designer - mood, style, key elements]
Plug & Play: [Full AI image generation prompt with parameters]

Ensure all content follows the voice guidelines and prohibitions strictly.`;
}

function buildUserPrompt(request: ClaudeGenerationRequest): string {
  let prompt = `Generate a ${request.platform} post for ${request.persona}.`;

  if (request.topic) {
    const topicExpansion = TOPIC_EXPANSIONS[request.topic] || request.topic;
    prompt += `\n\nTopic Focus: ${topicExpansion}`;
  }

  if (request.inspiration) {
    prompt += `\n\nInspiration/Context to incorporate:\n"${request.inspiration}"`;
    prompt += `\n\nWeave this inspiration naturally into the ${request.persona} voice. Don't quote it directly - use it as a starting point for the content.`;
  }

  if (!request.topic && !request.inspiration) {
    prompt += `\n\nCreate engaging, educational content that fits the persona's typical content mix.`;
  }

  prompt += `\n\nRemember: Stay in character, follow all prohibitions, and create content that feels authentic to ${request.persona}'s voice.`;

  return prompt;
}

function parseClaudeResponse(
  text: string,
  request: ClaudeGenerationRequest,
  apiResponse: Record<string, unknown>
): ClaudeGenerationResponse {
  // Parse content
  const contentMatch = text.match(/---CONTENT---\s*([\s\S]*?)(?=---HASHTAGS---|$)/);
  const content = contentMatch ? contentMatch[1].trim() : text;

  // Parse hashtags
  const hashtagsMatch = text.match(/---HASHTAGS---\s*([\s\S]*?)(?=---IMAGE_PROMPT---|$)/);
  const hashtagsText = hashtagsMatch ? hashtagsMatch[1].trim() : '';
  const hashtags = hashtagsText
    .split(/[,\n]/)
    .map(h => h.trim())
    .filter(h => h.startsWith('#'));

  // Parse image prompt
  const imagePromptMatch = text.match(/---IMAGE_PROMPT---\s*([\s\S]*?)$/);
  const imagePromptText = imagePromptMatch ? imagePromptMatch[1].trim() : '';

  const subjectMatch = imagePromptText.match(/Subject:\s*(.+)/);
  const briefMatch = imagePromptText.match(/Brief Concept:\s*(.+)/);
  const plugPlayMatch = imagePromptText.match(/Plug & Play:\s*(.+)/);

  return {
    content,
    hashtags: hashtags.length > 0 ? hashtags : generateDefaultHashtags(request.persona, request.platform),
    imagePrompt: {
      subject: subjectMatch ? subjectMatch[1].trim() : `${request.platform} post visual for ${request.persona}`,
      briefConceptPrompt: briefMatch ? briefMatch[1].trim() : 'Professional business-focused imagery',
      plugAndPlayPrompt: plugPlayMatch ? plugPlayMatch[1].trim() : 'Professional business photography, clean modern aesthetic --ar 16:9 --style raw',
    },
    metadata: {
      model: MODEL,
      tokensUsed: (apiResponse.usage as Record<string, number>)?.output_tokens,
      generatedAt: new Date().toISOString(),
    },
  };
}

function generateDefaultHashtags(persona: Person, platform: Platform): string[] {
  const baseHashtags = ['#HugeCapital', '#BusinessFunding'];

  const personaHashtags: Record<Person, string[]> = {
    'Zac': ['#SBALoans', '#TrustedAdvisor', '#BusinessGrowth'],
    'Luke': ['#RealEstateInvesting', '#BusinessCredit', '#SameTeam'],
    'Huge Capital': ['#SmallBusiness101', '#FinancialLiteracy', '#EntrepreneurLife'],
  };

  return [...baseHashtags, ...personaHashtags[persona]];
}

export default {
  generateWithClaude,
  isClaudeApiAvailable,
};

import type { Person, Platform, ContentProfile } from '../types/content';
import type { Story } from '../types/story';

// Platform-specific guidelines
const PLATFORM_GUIDELINES = {
  LinkedIn: {
    style: 'Professional, thought-leadership, industry insights',
    length: '1300-2000 characters ideal',
    format: 'Start with a hook, use line breaks, end naturally with an insight or thought-provoking question',
    bestPractices: 'No emojis, be authentic, share expertise, no sales pitches',
  },
  Twitter: {
    style: 'Concise, punchy, conversational',
    length: '200-250 characters ideal (leave room for engagement)',
    format: 'Hook first, clear message, natural conclusion',
    bestPractices: 'Use threads for longer content, be authentic, no corny CTAs',
  },
  Facebook: {
    style: 'Personal, story-driven, community-focused',
    length: '300-500 characters optimal',
    format: 'Tell a story, be relatable, end naturally',
    bestPractices: 'Genuine questions only, use visuals, be conversational',
  },
  Instagram: {
    style: 'Visual-first, inspirational, lifestyle',
    length: '125-150 characters in first line, up to 2200 total',
    format: 'Hook in first line, storytelling, natural ending',
    bestPractices: 'Front-load value, no emojis, no sales CTAs',
  },
  Blog: {
    style: 'In-depth, educational, SEO-optimized',
    length: '1500-2500 words ideal',
    format: 'Clear structure with headers, intro/body/conclusion with key takeaways',
    bestPractices: 'Provide value, use real examples and stories, no sales pitches',
  },
  Newsletter: {
    style: 'Personal, valuable, conversational',
    length: '500-1000 words',
    format: 'Personal greeting, clear sections, natural conclusion',
    bestPractices: 'Be consistent, provide exclusive value, tell stories, no hard sells',
  },
  'ISO Newsletter': {
    style: 'Industry-specific, professional, informative',
    length: '800-1200 words',
    format: 'Industry news, insights, resources, practical takeaways',
    bestPractices: 'Be authoritative, cite sources, provide actionable insights, stay educational',
  },
  Skool: {
    style: 'Community-focused, educational, engaging',
    length: '300-800 characters',
    format: 'Clear value proposition, encourage discussion',
    bestPractices: 'Ask questions, provide resources, build community',
  },
};

interface GenerateContentParams {
  person: Person;
  platform: Platform;
  profile: ContentProfile;
  topic?: string;
  contentPillar?: string;
  style?: 'standard' | 'casual' | 'professional';
  stories?: Story[]; // Real stories to reference
}

export async function generateAIContent(params: GenerateContentParams): Promise<string[]> {
  const { person, platform, profile, topic, contentPillar, style = 'standard', stories } = params;

  const guidelines = PLATFORM_GUIDELINES[platform];

  // Build the AI prompt
  const systemPrompt = buildSystemPrompt(person, profile, platform, guidelines, stories);
  const userPrompt = buildUserPrompt(topic, contentPillar, style);

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured, using fallback mock content');
      return generateMockSuggestions(person, platform, topic);
    }

    // Call the Supabase Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        systemPrompt,
        userPrompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Edge function error:', errorData);
      throw new Error(errorData.error || 'AI generation failed');
    }

    const data = await response.json();
    const content = data.content;

    // Parse the response to extract individual suggestions
    const suggestions = parseAISuggestions(content);
    return suggestions;
  } catch (error) {
    console.error('AI generation error:', error);
    // Fallback to mock suggestions
    return generateMockSuggestions(person, platform, topic);
  }
}

function buildSystemPrompt(
  person: Person,
  profile: ContentProfile,
  platform: Platform,
  guidelines: typeof PLATFORM_GUIDELINES[Platform],
  stories?: Story[]
): string {
  let prompt = `You are an expert social media content creator writing for ${person}.

PERSON PROFILE:
- Content Pillars: ${profile.contentPillars.join(', ')}
- Brand Voice: ${profile.brandVoice.join(', ')}
- Key Messaging: ${profile.keyMessaging.join(', ')}

PLATFORM: ${platform}
- Style: ${guidelines.style}
- Optimal Length: ${guidelines.length}
- Format: ${guidelines.format}
- Best Practices: ${guidelines.bestPractices}`;

  // Add real stories if available
  if (stories && stories.length > 0) {
    prompt += `\n\nREAL STORIES TO REFERENCE:
You have access to these authentic stories from ${person}. Use them to create compelling, real content:

`;
    stories.forEach((story, index) => {
      prompt += `\nSTORY ${index + 1}: ${story.title}`;
      if (story.fundingType) prompt += `\n- Funding Type: ${story.fundingType}`;
      if (story.loanAmountRange) prompt += `\n- Loan Amount: ${story.loanAmountRange}`;
      if (story.clientIndustry) prompt += `\n- Industry: ${story.clientIndustry}`;
      if (story.keyTakeaways && story.keyTakeaways.length > 0) {
        prompt += `\n- Key Takeaways: ${story.keyTakeaways.join(', ')}`;
      }
      prompt += `\n- Full Story: ${story.transcript.substring(0, 500)}${story.transcript.length > 500 ? '...' : ''}`;
      prompt += '\n';
    });

    prompt += `\nUse these REAL stories to create authentic, engaging content. These are actual experiences, not made-up examples.`;
  }

  prompt += `\n\nYOUR TASK:
Generate 3 different content variations that:
1. Match ${person}'s authentic voice and personality
2. Align with their content pillars and key messaging
3. Follow ${platform}'s best practices
4. Are engaging and tell a story
5. Feel natural and personal (not corporate or salesy)
${stories && stories.length > 0 ? '6. Reference or adapt the real stories provided above' : ''}

CRITICAL RULES:
- NO emojis - they look terrible and unprofessional
- NO corny CTAs like "Ready to unlock your potential? Let's chat!" or "DM me to learn more"
- NO sales pitches or call-to-actions at the end
- Just tell great stories and create engaging content
- People will naturally reach out if the content is valuable - don't beg for it
- End posts naturally - with an insight, a lesson learned, or just the conclusion of the story
- If asking a question, make it genuine and thought-provoking, not a sales lead-in
- Keep the content text-only
- Use line breaks and formatting for visual interest

Format your response as:
---OPTION 1---
[content here]

---OPTION 2---
[content here]

---OPTION 3---
[content here]

Keep it authentic, valuable, and true to ${person}'s voice. Let the stories speak for themselves.`;

  return prompt;
}

function buildUserPrompt(
  topic?: string,
  contentPillar?: string,
  style?: string
): string {
  let prompt = 'Generate content';

  if (topic) {
    prompt += ` about: ${topic}`;
  }

  if (contentPillar) {
    prompt += `\nContent Pillar: ${contentPillar}`;
  }

  if (style) {
    prompt += `\nStyle: ${style}`;
  }

  if (!topic) {
    prompt += ` that would resonate with the audience based on the profile's content pillars.`;
  }

  return prompt;
}

function parseAISuggestions(content: string): string[] {
  // Parse the AI response to extract individual options
  const options = content.split('---OPTION');
  const suggestions: string[] = [];

  for (let i = 1; i < options.length; i++) {
    const option = options[i];
    // Remove the number and dashes, get the content
    const cleanContent = option
      .replace(/^\s*\d+\s*---/, '')
      .trim();

    if (cleanContent) {
      suggestions.push(cleanContent);
    }
  }

  return suggestions.length > 0 ? suggestions : [content];
}

function generateMockSuggestions(
  person: Person,
  platform: Platform,
  topic?: string
): string[] {
  // Mock suggestions for testing without API key
  const topicText = topic || 'business growth';

  if (platform === 'Twitter' && person === 'Zac') {
    return [
      `Just helped another business owner secure $250K in SBA funding.\n\nThe key? Creative structuring that the bank didn't think was possible.\n\nSometimes you need someone who knows ALL the options, not just the obvious ones.`,
      `7+ years in business funding taught me this:\n\nThe best solution isn't always the most obvious one.\n\nIt's about understanding the full picture, not just checking boxes.`,
      `Three lenders said no to this client.\n\nWe found a way.\n\nThe difference? We actually took time to understand their business instead of just running their numbers through a system.`,
    ];
  }

  if (platform === 'LinkedIn' && person === 'Luke') {
    return [
      `If it's not good for you, it's not good for us.\n\nI tell this to every client I work with, and here's why:\n\nBuilding long-term relationships is more valuable than any single commission. When I recommend a funding solution, I'm thinking about YOUR success, not my bottom line.\n\nThat's the difference between being a middleman and being part of your team.`,
      `"You need perfect credit to get business funding."\n\nI hear this myth constantly.\n\nThe reality? There are creative solutions for almost every situation. Credit is just one piece of a much bigger puzzle.`,
      `A client came to me after being told "no" by three other lenders.\n\nWe found them a solution in 48 hours.\n\nThe difference? We actually listened to their situation instead of just running numbers through a system.`,
    ];
  }

  // Generic fallback
  return [
    `Great content about ${topicText} for ${person} on ${platform}. This is a mock suggestion - add your Anthropic API key to get real AI-generated content!`,
    `Another excellent post about ${topicText}. Real AI suggestions will appear here once you configure your API key.`,
    `Third variation for ${topicText}. Add VITE_ANTHROPIC_API_KEY to your .env file to enable AI generation.`,
  ];
}

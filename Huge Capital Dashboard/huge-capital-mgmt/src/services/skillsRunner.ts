/**
 * Skills Runner Service
 * Integrates the Huge Capital Content Skills with the dashboard
 *
 * This service provides the interface between the React dashboard
 * and the Claude Code skill definitions for content generation.
 */

import type { Person, Platform, ContentProfile } from '../types/content';
import type { Story } from '../types/story';
import { generateWithClaude, isClaudeApiAvailable } from './claudeApi';

// =============================================================================
// TYPES
// =============================================================================

export interface SkillConfig {
  id: string;
  name: string;
  category: 'content' | 'data' | 'optimization' | 'utility';
  platforms: Platform[];
  personas: Person[];
  roiScore: number;
}

export interface ContentGenerationRequest {
  persona: Person;
  platform: Platform;
  format?: 'single_post' | 'carousel' | 'reel_script' | 'story' | 'text_post' | 'link_share' | 'video_description';
  topic?: string;
  inspiration?: string;
  contentPillar?: string;
  batchSize?: number;
  stories?: Story[];
  profile?: ContentProfile;
}

export interface GeneratedContent {
  content: string;
  hashtags: string[];
  imagePrompt: {
    subject: string;
    briefConceptPrompt: string;
    plugAndPlayPrompt: string;
  };
  metadata: {
    persona: Person;
    platform: Platform;
    format: string;
    generatedAt: string;
    voiceScore?: number;
    complianceScore?: number;
  };
  carouselSlides?: {
    slideNumber: number;
    headline: string;
    body: string;
    visualNotes: string;
  }[];
  reelScript?: {
    hook: string;
    body: string;
    cta: string;
    onScreenText: string[];
  };
}

export interface BatchGenerationResult {
  success: boolean;
  contents: GeneratedContent[];
  errors: string[];
  summary: {
    total: number;
    generated: number;
    failed: number;
    byPersona: Record<string, number>;
    byPlatform: Record<string, number>;
  };
}

// =============================================================================
// SKILLS REGISTRY
// =============================================================================

export const SKILLS_REGISTRY: SkillConfig[] = [
  {
    id: 'C2',
    name: 'LinkedIn Post Generator',
    category: 'content',
    platforms: ['LinkedIn'],
    personas: ['Zac', 'Luke', 'Huge Capital'],
    roiScore: 9,
  },
  {
    id: 'C3',
    name: 'Instagram Content Generator',
    category: 'content',
    platforms: ['Instagram'],
    personas: ['Zac', 'Luke', 'Huge Capital'],
    roiScore: 8,
  },
  {
    id: 'C4',
    name: 'Facebook Post Generator',
    category: 'content',
    platforms: ['Facebook'],
    personas: ['Zac', 'Luke', 'Huge Capital'],
    roiScore: 7,
  },
  {
    id: 'U3',
    name: 'Image Prompt Generator',
    category: 'utility',
    platforms: ['LinkedIn', 'Instagram', 'Facebook', 'Twitter', 'Blog', 'Newsletter'],
    personas: ['Zac', 'Luke', 'Huge Capital'],
    roiScore: 8,
  },
];

// =============================================================================
// PERSONA CONFIGURATIONS
// =============================================================================

export const PERSONA_CONFIG = {
  Zac: {
    distribution: 0.40,
    primaryPlatforms: ['LinkedIn', 'Instagram', 'Facebook'] as Platform[],
    voiceMarkers: [
      'After 7+ years in this industry',
      'Let me break this down',
      'Here\'s what most people don\'t know',
    ],
    contentFocus: ['SBA loans', 'complex deals', 'thought leadership'],
    color: '#3B82F6',
  },
  Luke: {
    distribution: 0.30,
    primaryPlatforms: ['LinkedIn', 'Facebook', 'Instagram', 'Skool'] as Platform[],
    voiceMarkers: [
      'If it\'s not good for you, it\'s not good for us',
      'Same team, same goal',
      'Let me be real with you',
    ],
    contentFocus: ['real estate investing', 'business credit', 'myth-busting'],
    color: '#10B981',
  },
  'Huge Capital': {
    distribution: 0.30,
    primaryPlatforms: ['Facebook', 'Blog', 'Newsletter'] as Platform[],
    voiceMarkers: [
      'Fast, clear funding built for small business',
      'No pressure, just solutions',
      'Nearly 3,000 businesses funded',
    ],
    contentFocus: ['financial literacy', 'entrepreneur spotlights', 'company updates'],
    color: '#F7931E',
  },
};

// =============================================================================
// QUALITY GATES
// =============================================================================

export const QUALITY_GATES = {
  brandVoice: {
    threshold: 85,
    description: 'Content must match persona voice characteristics',
  },
  compliance: {
    threshold: 95,
    description: 'No prohibited content (rates, client info, etc.)',
  },
  valeLinting: {
    threshold: 0,
    description: 'No banned words or phrases',
  },
};

// =============================================================================
// BANNED CONTENT (from Vale linting rules)
// =============================================================================

export const BANNED_CONTENT = {
  phrases: [
    'guaranteed approval',
    'best rates',
    'act now',
    'limited time',
    'don\'t miss out',
    'easy money',
    'quick cash',
    'call immediately',
  ],
  patterns: [
    /\d+(\.\d+)?%\s*(interest|apr|rate)/i,  // Specific rates
    /approved\s+for\s+\$[\d,]+/i,           // Specific approvals
  ],
};

// =============================================================================
// CONTENT VALIDATION
// =============================================================================

export function validateContent(content: string, persona: Person): {
  valid: boolean;
  voiceScore: number;
  complianceScore: number;
  issues: string[];
} {
  const issues: string[] = [];
  let voiceScore = 100;
  let complianceScore = 100;

  // Check for banned phrases
  for (const phrase of BANNED_CONTENT.phrases) {
    if (content.toLowerCase().includes(phrase.toLowerCase())) {
      issues.push(`Banned phrase detected: "${phrase}"`);
      complianceScore -= 20;
    }
  }

  // Check for banned patterns
  for (const pattern of BANNED_CONTENT.patterns) {
    if (pattern.test(content)) {
      issues.push(`Prohibited pattern detected: specific rate or amount`);
      complianceScore -= 30;
    }
  }

  // Check for voice markers (boost score if present)
  const personaMarkers = PERSONA_CONFIG[persona].voiceMarkers;
  const hasVoiceMarker = personaMarkers.some(marker =>
    content.toLowerCase().includes(marker.toLowerCase())
  );

  if (!hasVoiceMarker) {
    voiceScore -= 10;
    issues.push(`Consider adding persona voice markers for ${persona}`);
  }

  // Ensure scores don't go below 0
  voiceScore = Math.max(0, voiceScore);
  complianceScore = Math.max(0, complianceScore);

  return {
    valid: complianceScore >= QUALITY_GATES.compliance.threshold &&
           voiceScore >= QUALITY_GATES.brandVoice.threshold,
    voiceScore,
    complianceScore,
    issues,
  };
}

// =============================================================================
// IMAGE PROMPT GENERATOR
// =============================================================================

export function generateImagePrompt(
  subject: string,
  platform: Platform,
  persona: Person,
  contentType: 'educational' | 'story' | 'spotlight' | 'engagement' = 'educational'
): GeneratedContent['imagePrompt'] {
  const personaColor = PERSONA_CONFIG[persona].color;

  const aspectRatios: Record<string, string> = {
    LinkedIn: '1200:627',
    Instagram: '4:5',
    Facebook: '1200:630',
    Twitter: '16:9',
    Blog: '16:9',
    Newsletter: '600:300',
    Skool: '16:9',
    'ISO Newsletter': '600:300',
  };

  const aspectRatio = aspectRatios[platform] || '16:9';

  return {
    subject: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Post - ${subject} for ${platform}`,
    briefConceptPrompt: `Professional, trustworthy design aligned with ${persona}'s brand style. Use ${personaColor} as the accent color. Clean modern aesthetic, not corporate or stuffy. Include subtle brand elements. Key visual should support the message without being literal.`,
    plugAndPlayPrompt: `Professional ${contentType} graphic, ${persona === 'Huge Capital' ? 'inclusive diverse imagery' : 'confident business professional'}, modern clean design, ${personaColor.replace('#', '')} accent color, ${platform.toLowerCase()} optimized, trustworthy financial services aesthetic --ar ${aspectRatio} --style raw --q 2`,
  };
}

// =============================================================================
// HASHTAG GENERATOR
// =============================================================================

export function generateHashtags(persona: Person, platform: Platform, topic?: string): string[] {
  const baseHashtags = ['#HugeCapital'];

  const personaHashtags: Record<Person, string[]> = {
    Zac: ['#SBALoans', '#BusinessFunding', '#TrustedAdvisor', '#SBA7a'],
    Luke: ['#RealEstateInvesting', '#BusinessCredit', '#MythBusted', '#CreditBuilding'],
    'Huge Capital': ['#FinancialLiteracy', '#SmallBusiness101', '#EntrepreneurSpotlight'],
  };

  const industryHashtags = ['#SmallBusiness', '#Entrepreneur', '#BusinessOwner', '#BusinessGrowth'];

  // Platform-specific counts
  const hashtagCount: Record<string, number> = {
    LinkedIn: 5,
    Instagram: 20,
    Facebook: 5,
    Twitter: 3,
  };

  const count = hashtagCount[platform] || 5;
  const hashtags = [
    ...baseHashtags,
    ...personaHashtags[persona].slice(0, 3),
    ...industryHashtags.slice(0, count - 4),
  ];

  return hashtags.slice(0, count);
}

// =============================================================================
// SKILL SELECTOR
// =============================================================================

export function getSkillForPlatform(platform: Platform): SkillConfig | undefined {
  return SKILLS_REGISTRY.find(skill => skill.platforms.includes(platform));
}

export function getSkillsForPersona(persona: Person): SkillConfig[] {
  return SKILLS_REGISTRY.filter(skill => skill.personas.includes(persona));
}

// =============================================================================
// BATCH GENERATION ORCHESTRATOR
// =============================================================================

export async function orchestrateBatchGeneration(
  requests: ContentGenerationRequest[],
  onProgress?: (completed: number, total: number) => void
): Promise<BatchGenerationResult> {
  const results: GeneratedContent[] = [];
  const errors: string[] = [];
  const summary = {
    total: requests.length,
    generated: 0,
    failed: 0,
    byPersona: {} as Record<string, number>,
    byPlatform: {} as Record<string, number>,
  };

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];

    try {
      // In a real implementation, this would call the AI service
      // For now, we generate mock content with proper structure
      const content = await generateSingleContent(request);
      results.push(content);
      summary.generated++;
      summary.byPersona[request.persona] = (summary.byPersona[request.persona] || 0) + 1;
      summary.byPlatform[request.platform] = (summary.byPlatform[request.platform] || 0) + 1;
    } catch (error) {
      errors.push(`Failed to generate ${request.platform} content for ${request.persona}: ${error}`);
      summary.failed++;
    }

    if (onProgress) {
      onProgress(i + 1, requests.length);
    }
  }

  return {
    success: summary.failed === 0,
    contents: results,
    errors,
    summary,
  };
}

// =============================================================================
// SINGLE CONTENT GENERATOR
// Uses Claude API when available, falls back to curated content library
// =============================================================================

async function generateSingleContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
  const { persona, platform, topic, inspiration } = request;

  // Try Claude API if available
  if (isClaudeApiAvailable()) {
    try {
      console.log(`[SkillsRunner] Using Claude API for ${persona} ${platform} content`);

      const claudeResponse = await generateWithClaude({
        persona,
        platform,
        topic,
        inspiration,
      });

      const validation = validateContent(claudeResponse.content, persona);

      return {
        content: claudeResponse.content,
        hashtags: claudeResponse.hashtags,
        imagePrompt: claudeResponse.imagePrompt,
        metadata: {
          persona,
          platform,
          format: request.format || 'single_post',
          generatedAt: claudeResponse.metadata.generatedAt,
          voiceScore: validation.voiceScore,
          complianceScore: validation.complianceScore,
        },
      };
    } catch (error) {
      console.warn('[SkillsRunner] Claude API failed, falling back to content library:', error);
      // Fall through to mock content
    }
  }

  // Fallback: Use curated content library
  console.log(`[SkillsRunner] Using content library for ${persona} ${platform} content`);

  // Mock delay to simulate generation
  await new Promise(resolve => setTimeout(resolve, 500));

  const topicText = topic || PERSONA_CONFIG[persona].contentFocus[0];

  // Generate content based on persona and platform
  const content = generateMockContent(persona, platform, topicText);
  const hashtags = generateHashtags(persona, platform, topicText);
  const imagePrompt = generateImagePrompt(topicText, platform, persona);

  const validation = validateContent(content, persona);

  return {
    content,
    hashtags,
    imagePrompt,
    metadata: {
      persona,
      platform,
      format: request.format || 'single_post',
      generatedAt: new Date().toISOString(),
      voiceScore: validation.voiceScore,
      complianceScore: validation.complianceScore,
    },
  };
}

// =============================================================================
// SUBSTANTIVE CONTENT LIBRARY
// =============================================================================

const ZAC_CONTENT_LIBRARY = {
  LinkedIn: [
    {
      hook: "After 7+ years in business funding, I've noticed a pattern that separates successful funding applications from rejected ones.",
      body: "It's not just about your credit score or revenue. It's about telling your business story the right way.\n\nHere's what lenders are actually looking for:\n\n→ Cash flow consistency, not just profitability\n→ A clear use of funds (vague answers kill deals)\n→ Industry experience that reduces risk perception\n→ Collateral options beyond just real estate\n\nThe business owners who get funded quickly? They prepare their narrative BEFORE they apply.\n\nThey know their numbers cold. They can explain exactly how this capital creates ROI. They've addressed potential concerns upfront.",
      cta: "What's been your biggest challenge when applying for business funding? Drop it below - I read every comment."
    },
    {
      hook: "The SBA loan application got denied. Here's what the banker didn't tell them.",
      body: "Last week I spoke with a business owner who'd been rejected by their bank for an SBA 7(a) loan.\n\nThey had great revenue. Solid credit. Years in business.\n\nThe problem? Their debt service coverage ratio was 1.15x when most lenders want 1.25x minimum.\n\nOne ratio. That's what stood between them and $750K in funding.\n\nHere's the thing: this is fixable. We restructured some existing debt, delayed a planned equipment purchase by 60 days, and suddenly that ratio looked very different.\n\nThe original bank never explained what actually caused the denial. They just said no.",
      cta: "If you've been denied funding and don't understand why, let's talk. Sometimes it's a simple fix."
    },
    {
      hook: "Let me break down the REAL difference between SBA 7(a) and SBA 504 loans.",
      body: "I see confusion about this daily, so here's the simplified breakdown:\n\nSBA 7(a):\n• Working capital, inventory, equipment, refinancing\n• Up to $5M\n• Variable or fixed rates\n• 10-25 year terms\n• Best for: General business needs\n\nSBA 504:\n• Real estate and major fixed assets ONLY\n• Up to $5.5M (sometimes more)\n• Fixed rates (often lower than 7(a))\n• 10-25 year terms\n• Best for: Buying your building or heavy equipment\n\nThe key insight most people miss: You can sometimes use BOTH on the same project. Buy the building with 504, fund the renovation and working capital with 7(a).",
      cta: "Which loan type would fit your situation better? Let's figure it out together."
    },
    {
      hook: "Your accountant might be costing you funding approvals. Here's why.",
      body: "I'm not throwing accountants under the bus - most are great at what they do.\n\nBut here's the disconnect: Your accountant's job is to minimize taxes. A lender's job is to assess repayment ability.\n\nThese goals often conflict.\n\nWhen your P&L shows minimal profit (great for taxes), it shows minimal repayment capacity (terrible for loans).\n\nThe solution isn't to pay more taxes. It's to understand what lenders actually look at:\n\n• Add-backs for owner compensation, depreciation, interest\n• Adjusted EBITDA vs. net income\n• Cash flow statements over income statements\n\nSmart business owners have their accountants and loan advisors communicate BEFORE tax season.",
      cta: "Has your tax strategy ever impacted your ability to get funding? I'd love to hear your experience."
    },
    {
      hook: "The business was profitable. The loan was denied. Here's the hidden metric that killed the deal.",
      body: "Revenue: $2.4M. Profit: $180K. Credit: 720.\n\nOn paper, this looked like a slam dunk for funding.\n\nBut the lender's underwriting caught something the business owner hadn't considered: accounts receivable aging.\n\n47% of their AR was over 90 days. That told the lender:\n• Cash flow is less predictable than revenue suggests\n• The business might struggle to collect what it's owed\n• Working capital is tied up chasing payments\n\nThe fix? We spent 45 days cleaning up collection processes, wrote off truly uncollectible accounts, and reapplied.\n\nResult: Approved at better terms than the original application.",
      cta: "What metrics do you track beyond revenue and profit? The answer might surprise you."
    }
  ],
  Instagram: [
    {
      hook: "3 things your bank won't tell you about SBA loans 👇",
      body: "1️⃣ The rate they quoted isn't final\nSBA loans have variable rate options. That \"6.5%\" could change quarterly.\n\n2️⃣ Collateral doesn't mean just real estate\nEquipment, inventory, and even accounts receivable can strengthen your application.\n\n3️⃣ Denial isn't always final\nMany denials are due to fixable issues. Get specific feedback and address it.",
      cta: "Save this for your next funding conversation 💡"
    },
    {
      hook: "The funding mistake that costs business owners thousands 💸",
      body: "Taking the first offer without shopping around.\n\nI've seen business owners accept:\n• Rates 3% higher than necessary\n• Terms that hurt cash flow\n• Products that don't fit their needs\n\nWhy? They didn't know they had options.\n\n7+ years in this industry taught me: the right funding structure matters more than just getting approved.",
      cta: "Know someone who needs to see this? Tag them below 👇"
    },
    {
      hook: "Credit score isn't everything. Here's what actually matters.",
      body: "Lenders look at:\n\n📊 Cash flow patterns\nConsistency beats big months with dry spells.\n\n📈 Debt service coverage\nCan you pay the loan AND run the business?\n\n🏢 Industry risk\nSome industries face more scrutiny.\n\n⏰ Time in business\nMore history = more data points.\n\nYour credit score opens the door. Everything else determines what's on the other side.",
      cta: "What surprised you most about this? Comment below 💬"
    }
  ],
  Facebook: [
    {
      hook: "I just got off a call with a restaurant owner who was told \"no\" by six banks.",
      body: "Six rejections. Two years of being told her business wasn't \"bankable.\"\n\nThe thing is - she had solid revenue, a great location, and loyal customers.\n\nThe problem? Restaurant industry = high risk in most lenders' underwriting models.\n\nWhat those six banks didn't tell her: There are lenders who specialize in restaurants. Who understand the industry. Who look at different metrics.\n\nWe found her $300K at terms that actually worked for a restaurant's cash flow cycles.\n\nSometimes \"no\" just means \"not with us.\"",
      cta: "If you've been told no and don't understand why, let me know in the comments. Your success is our success - let's figure this out together."
    },
    {
      hook: "The difference between good debt and bad debt for your business:",
      body: "Good debt:\n✅ Generates more revenue than it costs\n✅ Has terms aligned with the asset's life\n✅ Improves cash flow over time\n✅ You can service it comfortably\n\nBad debt:\n❌ Short-term debt for long-term needs\n❌ Payment schedules that strain operations\n❌ High rates because you were desperate\n❌ No clear ROI on the capital\n\nI've spent 7+ years helping businesses structure funding that falls firmly in the \"good debt\" category.\n\nThe difference isn't the loan itself - it's whether the structure fits your situation.",
      cta: "What questions do you have about structuring business debt? Drop them below - I answer everything."
    }
  ]
};

const LUKE_CONTENT_LIBRARY = {
  LinkedIn: [
    {
      hook: "If it's not good for you, it's not good for us. That's not just a tagline - here's what it means in practice.",
      body: "Last month a real estate investor came to us for a hard money loan on a flip project.\n\nThe numbers made sense on paper. But when we dug in:\n• The ARV estimate was optimistic by $40K\n• Rehab timeline assumed everything going perfectly\n• Holding costs weren't fully accounted for\n\nWe could have done the loan. We would have made money.\n\nInstead, we walked through the numbers together. Adjusted the purchase price target. Found a property that actually made sense.\n\nSame team, same goal. That's how this should work.",
      cta: "What's the best advice you've received from someone who could have just taken your money instead? Share below."
    },
    {
      hook: "Let me be real with you about business credit. Most of what you've heard is wrong.",
      body: "Myth: You need perfect personal credit to build business credit.\nReality: Some business credit products don't even check personal credit.\n\nMyth: It takes years to establish business credit.\nReality: Strategic accounts can show results in 90 days.\n\nMyth: Business credit doesn't matter if you have good personal credit.\nReality: Separating business and personal credit protects your family.\n\nMyth: All business credit services are scams.\nReality: The industry has bad actors, but legitimate strategies exist.\n\nI've helped hundreds of business owners separate their personal and business credit profiles. The key is understanding which accounts report where.",
      cta: "What credit myth held you back the longest? Let's bust more of these together."
    },
    {
      hook: "Real estate investing changed when I stopped thinking like a buyer and started thinking like a lender.",
      body: "When you look at a deal from the lender's perspective, you see:\n\n• LTV isn't just a number - it's their risk exposure\n• Your experience directly impacts their confidence\n• Exit strategy clarity determines yes or no\n• Skin in the game matters more than income\n\nThis mindset shift transformed my deal analysis. Now I structure offers knowing exactly what a lender needs to see.\n\nResult: Faster approvals, better terms, fewer surprises.\n\nWe're part of your team, not just a middle man. Understanding both sides of the table helps us help you.",
      cta: "Want to learn how to present deals the way lenders want to see them? DM me \"LENDER\" and I'll share our deal packaging checklist."
    }
  ],
  Instagram: [
    {
      hook: "The #1 mistake new real estate investors make with financing 🏠",
      body: "Waiting until they find a deal to figure out funding.\n\nBy then:\n⏰ The seller wants answers NOW\n💸 You lose leverage in negotiations\n😰 Desperation leads to bad terms\n\nSmart investors get pre-qualified FIRST.\n\nKnow your budget. Know your terms. Then hunt for deals.\n\nSame team, same goal means we help you prepare BEFORE the pressure's on.",
      cta: "Tag an investor who needs to hear this 👇"
    },
    {
      hook: "Hard money loans aren't scary. Here's the truth:",
      body: "❌ Myth: Hard money is predatory\n✅ Truth: It's a tool for specific situations\n\n❌ Myth: Only desperate people use it\n✅ Truth: Sophisticated investors use it strategically\n\n❌ Myth: The rates are always terrible\n✅ Truth: When you factor in speed and flexibility, the math often works\n\n❌ Myth: You'll lose your property\n✅ Truth: With proper planning, it's a bridge to better financing\n\nLet me be real: Hard money isn't for every deal. But it's not the villain people make it out to be.",
      cta: "Save this for your next investment decision 💡"
    }
  ],
  Facebook: [
    {
      hook: "Same team, same goal. Let me tell you why that matters.",
      body: "When I first got into real estate financing, I saw how transactional the industry was.\n\nLender makes money → moves on → borrower figures it out.\n\nThat never sat right with me.\n\nBecause here's the thing: when you succeed, you come back. When you come back, we build something together. When we build something together, everyone wins.\n\nThat's not charity - it's good business built on actually caring about outcomes.\n\nIf it's not good for you, it's not good for us. Period.",
      cta: "Have you worked with someone who genuinely had your back? Drop their name below - let's celebrate the good ones."
    },
    {
      hook: "Credit building isn't complicated. Here's the simple version:",
      body: "Month 1-2:\n→ Get your business properly established (EIN, D-U-N-S, separate bank account)\n→ Start with store credit cards that report to business bureaus\n\nMonth 2-4:\n→ Add net-30 vendor accounts\n→ Pay early, not just on time\n→ Monitor your Dun & Bradstreet report\n\nMonth 4-6:\n→ Graduate to small business credit cards\n→ Keep utilization low\n→ Document everything\n\nThe \"secrets\" everyone sells? This is basically it. The value is in having someone guide you through and hold you accountable.\n\nSame team, same goal.",
      cta: "What step are you on? Comment below and I'll give you specific next actions."
    }
  ],
  Skool: [
    {
      hook: "Weekly breakdown: How I analyze a fix & flip deal in 15 minutes",
      body: "Here's my exact process:\n\n**Step 1 (2 min):** ARV reality check\n• Pull 3 recent comps within 0.5 miles\n• Adjust for bed/bath differences\n• Be conservative - my estimates are always 10% below optimistic projections\n\n**Step 2 (3 min):** Rehab scope estimate\n• $15-25/sqft for cosmetic\n• $40-60/sqft for moderate renovation\n• $80+/sqft for major work\n• Add 20% contingency always\n\n**Step 3 (5 min):** Run the numbers\n• Purchase + rehab + holding + selling costs\n• Does it leave 15%+ profit margin?\n• What's my cash-on-cash return?\n\n**Step 4 (3 min):** Financing fit\n• Can I hit 70% LTV on this?\n• Do I have experience lenders require?\n• What's my exit - refi or sell?\n\n**Step 5 (2 min):** Go/no-go decision\n• Does this fit my criteria?\n• Am I excited about it or just trying to do a deal?\n• What could go wrong?\n\nIf it survives all 5 steps, it goes on the pursue list.",
      cta: "Drop your current deal numbers below and I'll walk through this framework with you live."
    },
    {
      hook: "Let's talk about the deals I DON'T do and why.",
      body: "Learning what to avoid matters more than learning what to pursue.\n\nDeals I pass on:\n\n**1. Foundation issues in older homes**\nThe cost uncertainty is too high. Even with inspections, surprises happen.\n\n**2. Properties requiring rezoning or variance**\nGovernment timeline = uncontrollable timeline. I don't bet against bureaucracy.\n\n**3. Deals where I'd be the highest bidder by a lot**\nIf no one else sees the value, I'm probably missing something.\n\n**4. Markets I don't know**\nRemote investing works, but not on your first several deals.\n\n**5. Partners who need the money too badly**\nDesperation leads to bad decisions. I've been there.\n\nSame team, same goal means being honest about risk.",
      cta: "What's on your personal \"avoid\" list? Share your hard-won lessons below."
    }
  ]
};

const HUGE_CAPITAL_CONTENT_LIBRARY = {
  Facebook: [
    {
      hook: "Financial literacy isn't taught in school. So we're teaching it here.",
      body: "Today's lesson: Understanding your debt-to-income ratio and why it matters.\n\nYour DTI tells lenders one thing: Can you handle more debt?\n\nHow it's calculated:\nMonthly debt payments ÷ Monthly gross income = DTI%\n\nWhat lenders want to see:\n• Under 36%: Excellent - most doors open\n• 36-43%: Good - still qualify for most products\n• 43-50%: Fair - options become limited\n• Over 50%: Challenging - but not impossible\n\nThe good news? DTI can change quickly by:\n→ Paying down revolving debt\n→ Increasing income (even temporarily)\n→ Restructuring existing loans\n\nNearly 3,000 businesses funded. Real business owners deserve real answers.",
      cta: "Save this post. Share it with a business owner who needs it. Financial literacy lifts everyone."
    },
    {
      hook: "Meet Marcus. 18 months ago, he almost gave up on his construction business.",
      body: "His story:\n\nMarcus started his construction company in 2019. Then 2020 happened.\n\nProjects dried up. Savings ran out. Credit cards maxed.\n\nWhen things started recovering, he needed $150K for equipment and working capital to take on bigger contracts.\n\nEvery bank said no. Past credit issues. Not enough time since the tough year.\n\nBut here's what the banks missed: Marcus had active contracts worth $400K. He had a specific plan. He had grit.\n\nWe found a lender who looked at where he was going, not just where he'd been.\n\n18 months later: His company has done $1.2M in revenue. He's refinanced into better terms. He's hired 4 employees.\n\nNo pressure, just solutions. That's what real business owners deserve.",
      cta: "Know a Marcus? Tag them. Sometimes people just need to know options exist."
    },
    {
      hook: "The 5 funding mistakes that cost small business owners thousands every year:",
      body: "❌ **Mistake #1:** Waiting until desperate to seek funding\nWhen you're desperate, you take bad terms. Plan ahead.\n\n❌ **Mistake #2:** Only talking to one lender\nDifferent lenders = different products = different fits.\n\n❌ **Mistake #3:** Not understanding the true cost\nThat \"low rate\" might have fees that make it expensive.\n\n❌ **Mistake #4:** Using short-term money for long-term needs\nMCAs for equipment? That math rarely works.\n\n❌ **Mistake #5:** Letting pride stop you from asking questions\nEvery question you don't ask is money potentially left on the table.\n\nFast, clear funding built for small business. That means education comes first.",
      cta: "Which of these have you experienced? Comment below - your story might help someone else."
    }
  ],
  Blog: [
    {
      hook: "The Complete Guide to SBA Loan Requirements in 2024",
      body: "**Introduction**\n\nSBA loans remain one of the best funding options for small businesses, offering lower rates and longer terms than conventional alternatives. But the application process can feel overwhelming.\n\nThis guide breaks down exactly what you need.\n\n**Basic Eligibility Requirements**\n\n• For-profit business operating in the United States\n• Owner has invested equity (typically 10-20%)\n• Demonstrated need for the loan\n• Sound business purpose for funds\n• No outstanding government debt\n\n**Documentation Checklist**\n\n*Business Documents:*\n• Business tax returns (3 years)\n• Year-to-date profit & loss statement\n• Year-to-date balance sheet\n• Business debt schedule\n• Business licenses and registrations\n\n*Personal Documents:*\n• Personal tax returns (3 years)\n• Personal financial statement\n• Resume showing relevant experience\n\n**The Process Timeline**\n\nWeek 1-2: Document gathering and application\nWeek 2-4: Lender review and questions\nWeek 4-6: SBA review and approval\nWeek 6-8: Closing and funding\n\n*Note: Timeline varies by loan size and complexity.*\n\n**Common Reasons for Denial**\n\n1. Insufficient cash flow for debt service\n2. Recent credit issues or bankruptcies\n3. Inadequate collateral\n4. Incomplete documentation\n5. Industry exclusions\n\n**How to Strengthen Your Application**\n\n→ Prepare your documentation before applying\n→ Address potential concerns proactively\n→ Work with an experienced advisor\n→ Have a clear use of funds narrative\n→ Know your numbers cold",
      cta: "Ready to explore your SBA loan options? Our team has helped nearly 3,000 businesses find the right funding. Contact us for a free consultation."
    }
  ],
  Newsletter: [
    {
      hook: "This Week in Business Funding: What You Need to Know",
      body: "**MARKET UPDATE**\n\nSBA loan rates have stabilized this month after Q3 fluctuations. Current prime rate sits at [X]%, making 7(a) loans particularly attractive for businesses with strong cash flow.\n\n**FUNDING SPOTLIGHT**\n\nThis week's success story: A manufacturing company secured $850K in equipment financing after being declined by three traditional banks. The key? Finding a lender who specialized in their specific equipment type.\n\n**EDUCATION CORNER: Understanding Amortization**\n\nAmortization isn't just a fancy word - it determines how much of each payment goes to principal vs. interest.\n\nEarly payments: Mostly interest\nLater payments: Mostly principal\n\nThis matters because: If you're planning to refinance or pay off early, understanding amortization affects your total cost.\n\n**QUICK TIP**\n\nAlways ask lenders for an amortization schedule before signing. Compare how much you'll pay in interest over the life of different loan options.\n\n**THIS WEEK'S Q&A**\n\nQ: \"How long should I be in business before applying for an SBA loan?\"\n\nA: While SBA doesn't have a strict minimum, most lenders prefer 2+ years. However, startups with strong business plans, owner experience, and collateral can sometimes qualify through SBA programs specifically designed for newer businesses.",
      cta: "Questions about your specific situation? Reply to this email - we read and respond to every one."
    }
  ]
};

// Function to randomly select content from library
function getRandomContent(contents: { hook: string; body: string; cta: string }[]): { hook: string; body: string; cta: string } {
  const randomIndex = Math.floor(Math.random() * contents.length);
  return contents[randomIndex];
}

function generateMockContent(persona: Person, platform: Platform, _topic: string): string {
  // Get content library for the persona
  const contentLibrary: Record<string, { hook: string; body: string; cta: string }[]> =
    persona === 'Zac' ? ZAC_CONTENT_LIBRARY :
    persona === 'Luke' ? LUKE_CONTENT_LIBRARY :
    HUGE_CAPITAL_CONTENT_LIBRARY;

  // Get content for the platform, or fall back to first available platform
  const platformContent = contentLibrary[platform] || Object.values(contentLibrary)[0];

  if (!platformContent || platformContent.length === 0) {
    // Fallback content
    return `${PERSONA_CONFIG[persona].voiceMarkers[0]}\n\nSubstantive content about business funding and growth strategies.\n\nYour success is our success.`;
  }

  // Get random content from the library
  const content = getRandomContent(platformContent);

  // Format the content
  return `${content.hook}\n\n${content.body}\n\n${content.cta}`;
}

// =============================================================================
// EXPORT DEFAULT SERVICE
// =============================================================================

export const SkillsRunner = {
  registry: SKILLS_REGISTRY,
  personaConfig: PERSONA_CONFIG,
  qualityGates: QUALITY_GATES,
  validateContent,
  generateImagePrompt,
  generateHashtags,
  getSkillForPlatform,
  getSkillsForPersona,
  orchestrateBatchGeneration,
};

export default SkillsRunner;

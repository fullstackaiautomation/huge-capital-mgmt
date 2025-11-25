// Content Planner Type Definitions

export type Person = 'Zac' | 'Luke' | 'Huge Capital';
export type Platform = 'LinkedIn' | 'Twitter' | 'Facebook' | 'Instagram' | 'Blog' | 'Newsletter' | 'ISO Newsletter' | 'Skool';
export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type Sentiment = 'positive' | 'negative' | 'neutral';
export type IdeaStatus = 'pending' | 'approved' | 'dismissed' | 'used';

// Content Profile with AI learning context
export interface ContentProfile {
  id: string;
  personName: Person;
  contentPillars: string[];
  brandVoice: string[];
  keyMessaging: string[];
  aiContext: {
    preferredStyle?: string;
    commonEdits?: string[];
    optimalPostLength?: Record<Platform, number>;
    bestPerformingTopics?: string[];
  };
  postingGoals: Record<Platform, PostingGoal>;
  createdAt: string;
  updatedAt: string;
}

// Main content post structure
export interface ContentPost {
  id: string;
  personName: Person;
  platform: Platform;

  // Content
  content: string;
  threadContent?: TwitterThread[];  // For Twitter threads
  isThread?: boolean;
  threadHook?: string;  // The hook for threads

  // Metadata
  mediaUrls?: string[];
  tags?: string[];
  contentPillar?: string;
  sources?: ContentSource[];

  // Scheduling
  scheduledFor?: string;
  optimalTime?: string;
  timezone?: string;

  // Status
  status: ContentStatus;
  publishedAt?: string;
  publishError?: string;

  // Version tracking
  versionNumber: number;
  parentPostId?: string;
  editHistory?: EditRecord[];

  // User tracking
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Twitter Thread Structure
export interface TwitterThread {
  order: number;
  content: string;
  mediaUrl?: string;
  characterCount?: number;
}

// Source tracking for content
export interface ContentSource {
  type: 'article' | 'website' | 'document' | 'social';
  title: string;
  url?: string;
  notes?: string;
}

// Edit history record
export interface EditRecord {
  editedAt: string;
  editedBy: string;
  previousContent: string;
  changeReason?: string;
}

// Analytics data
export interface ContentAnalytics {
  id: string;
  postId: string;

  // Engagement
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  clicks: number;

  // Growth
  followersGained: number;
  followersLost: number;

  // Calculated
  engagementRate?: number;
  clickThroughRate?: number;

  fetchedAt: string;
  createdAt: string;
}

// Competitor post tracking
export interface CompetitorPost {
  id: string;
  competitorName: string;
  platform: Platform;

  content: string;
  mediaUrls?: string[];
  postUrl?: string;

  // Our analysis
  rating?: number;  // 1-5
  notes?: string;
  styleTags?: string[];

  // Performance if available
  likes?: number;
  comments?: number;
  shares?: number;

  postedAt?: string;
  analyzedBy?: string;
  createdAt: string;
}

// Content tag for organization
export interface ContentTag {
  id: string;
  tagName: string;
  tagCategory?: 'pillar' | 'topic' | 'campaign' | 'other';
  color?: string;
  description?: string;
  createdAt: string;
}

// Posting frequency goals
export interface PostingGoal {
  id?: string;
  personName: Person;
  platform: Platform;
  postsPerWeek: number;
  postsPerMonth: number;
  preferredTimes?: string[];  // Array of preferred posting times
  currentWeekPosts?: number;
  currentMonthPosts?: number;
  lastResetDate?: string;
}

// Content template
export interface ContentTemplate {
  id: string;
  templateName: string;
  personName?: Person;
  platform?: Platform;
  contentTemplate: string;
  threadTemplate?: TwitterThread[];
  variables?: TemplateVariable[];
  usageCount: number;
  createdBy?: string;
  createdAt: string;
}

// Template variables
export interface TemplateVariable {
  name: string;
  placeholder: string;
  defaultValue?: string;
}

// Comment tracking
export interface ContentComment {
  id: string;
  postId: string;
  platform: Platform;
  commentId?: string;
  authorName: string;
  authorHandle?: string;
  content: string;

  // Our response
  replyContent?: string;
  repliedAt?: string;
  repliedBy?: string;

  requiresResponse?: boolean;
  sentiment?: Sentiment;
  createdAt: string;
}

// Content Idea (AI-generated or manual)
export interface ContentIdea {
  id: string;
  personName: Person;
  platform: Platform;
  ideaTitle: string;
  ideaDescription?: string;
  contentPillar?: string;
  status: IdeaStatus;
  generatedBy: 'ai' | 'manual';
  postId?: string;
  createdAt: string;
  updatedAt: string;
  dismissedAt?: string;
  usedAt?: string;
}

// AI Learning patterns
export interface AILearning {
  id: string;
  personName: Person;
  platform: Platform;
  patternType: 'edit' | 'timing' | 'content_type' | 'engagement';
  originalContent?: string;
  editedContent?: string;
  performanceScore?: number;
  notes?: Record<string, any>;
  createdAt: string;
}

// Newsletter types
export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  company?: string;
  subscribedTo: string[];
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribedAt: string;
  unsubscribedAt?: string;
  lastEmailSent?: string;
}

export interface NewsletterCampaign {
  id: string;
  campaignName: string;
  subjectLine: string;
  previewText?: string;
  htmlContent: string;
  plainTextContent?: string;
  subscriberList: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  scheduledFor?: string;
  sentAt?: string;
  totalRecipients: number;
  opens: number;
  clicks: number;
  createdBy?: string;
  createdAt: string;
}

// Calendar event for content calendar
export interface ContentCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  platform: Platform;
  personName: Person;
  content: string;
  status: ContentStatus;
  resource: ContentPost;  // Full post data
  color?: string;
}

// Platform-specific character limits
export const PLATFORM_LIMITS = {
  LinkedIn: 3000,
  Twitter: 280,
  Facebook: 63206,
  Instagram: 2200,
  Blog: 10000,
  Newsletter: 50000,
  'ISO Newsletter': 50000,
  Skool: 5000,
} as const;

// Platform colors for UI
export const PLATFORM_COLORS = {
  LinkedIn: '#0077b5',
  Twitter: '#1da1f2',
  Facebook: '#1877f2',
  Instagram: '#e4405f',
  Blog: '#6b7280',
  Newsletter: '#10b981',
  'ISO Newsletter': '#8b5cf6',
  Skool: '#f97316',
} as const;

// Person colors for UI
export const PERSON_COLORS = {
  'Zac': '#3b82f6',      // Blue
  'Luke': '#10b981',     // Green
  'Huge Capital': '#8b5cf6', // Purple
} as const;

// Content pillars with percentages
export const CONTENT_PILLARS = {
  'Zac': [
    { name: 'Client Success Stories', percentage: 40 },
    { name: 'Educational / Legal Updates', percentage: 30 },
    { name: 'Entrepreneur Spotlights', percentage: 20 },
    { name: 'Personal Brand Building', percentage: 10 },
  ],
  'Luke': [
    { name: 'Client Success Stories', percentage: 40 },
    { name: 'Educational / Myth-Busting', percentage: 30 },
    { name: 'Entrepreneur Spotlights', percentage: 20 },
    { name: 'Personal Brand & Leadership', percentage: 10 },
  ],
  'Huge Capital': [
    { name: 'Business funding solutions', percentage: 40 },
    { name: 'Capital expertise', percentage: 35 },
    { name: 'Client success', percentage: 25 },
  ],
} as const;

// Optimal posting times per platform (in 24h format)
export const OPTIMAL_TIMES = {
  LinkedIn: ['08:00', '12:00', '17:00'],
  Twitter: ['09:00', '12:30', '17:00', '20:00'],
  Facebook: ['09:00', '13:00', '15:00', '19:00'],
  Instagram: ['06:00', '12:00', '17:00', '19:00'],
  Blog: ['10:00'],
  Newsletter: ['10:00'],
  'ISO Newsletter': ['10:00'],
  Skool: ['10:00', '14:00', '18:00'],
} as const;
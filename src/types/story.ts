export type StoryType =
  | 'funding_success'
  | 'client_challenge'
  | 'industry_insight'
  | 'personal_experience'
  | 'case_study'
  | 'other';

export type FundingType =
  | 'SBA 7(a)'
  | 'SBA 504'
  | 'Construction Loan'
  | 'Equipment Financing'
  | 'Working Capital'
  | 'Commercial Real Estate'
  | 'Business Acquisition'
  | 'Other';

export type SourceType =
  | 'voice_memo'
  | 'slack_message'
  | 'call_transcript'
  | 'manual_entry'
  | 'other';

export interface Story {
  id: string;
  personName: string;
  title: string;
  transcript: string;
  storyType?: StoryType;
  fundingType?: FundingType;
  themes?: string[];
  keyTakeaways?: string[];
  clientIndustry?: string;
  loanAmountRange?: string;

  sourceType?: SourceType;
  sourceUrl?: string;
  recordedDate?: Date;

  isApproved: boolean;
  usageNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface StoryUsage {
  id: string;
  contentId: string;
  storyId: string;
  createdAt: Date;
}

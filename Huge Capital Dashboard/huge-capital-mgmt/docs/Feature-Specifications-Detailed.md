# Detailed Feature Specifications: Huge Capital Dashboard

## Overview
This document provides granular implementation details for each feature, including exact UI requirements, data needs from the client, and step-by-step building instructions.

---

# 1. CONTENT PLANNER PAGE

## Current State
- Basic content planning interface exists
- Manual process, no automation

## Target UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Content Planner                                 [+ New Post] │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┬────────────────────────────────────────────┐  │
│ │ Calendar │  Post Editor                                │  │
│ │          │  ┌────────────────────────────────────────┐ │  │
│ │ [Week]   │  │ Platform: [FB] [IG] [X] [LI]          │ │  │
│ │ [Month]  │  │                                        │ │  │
│ │          │  │ Content: [___________________]        │ │  │
│ │ Mon 13   │  │         [___________________]        │ │  │
│ │ • 9am FB │  │                                        │ │  │
│ │ • 2pm IG │  │ Media: [Upload] [AI Generate]         │ │  │
│ │          │  │                                        │ │  │
│ │ Tue 14   │  │ Schedule: [Date] [Time] [Timezone]    │ │  │
│ │ • 10am X │  │                                        │ │  │
│ │          │  │ [Save Draft] [Schedule] [Post Now]    │ │  │
│ └──────────┴────────────────────────────────────────────┘  │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Analytics Dashboard                                   │  │
│ │ Engagement: [Chart] | Best Times: [Heatmap]         │  │
│ └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## What I Need From You

### 1. Social Media Accounts
```yaml
Facebook/Instagram:
  - Facebook App ID
  - Facebook App Secret
  - Page Access Token (or we'll OAuth to get it)
  - Instagram Business Account ID

Twitter/X:
  - API Key
  - API Secret
  - Bearer Token
  - Access Token & Secret

LinkedIn:
  - Client ID
  - Client Secret
  - Company Page ID (if posting to company)

Content Context:
  - Brand voice guidelines
  - Preferred hashtags list
  - Content categories/types
  - Posting frequency preferences
  - Target audiences per platform
```

### 2. Supabase Setup
```sql
-- I'll need you to run these migrations
CREATE TABLE social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  platform TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  page_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  media_urls JSONB,
  platforms JSONB NOT NULL, -- {facebook: true, instagram: true}
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'draft', -- draft, scheduled, published, failed
  published_at TIMESTAMPTZ,
  analytics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content_template TEXT,
  hashtags TEXT[],
  platforms JSONB
);
```

## Implementation Steps

### Step 1: Social Media Authentication (Day 1)
```typescript
// 1. Create OAuth flow component
// Components needed:
- SocialAuthButton.tsx
- OAuthCallback.tsx
- AccountManager.tsx

// 2. Store tokens securely in Supabase
// 3. Test with single post to each platform
```

### Step 2: Content Editor (Day 2)
```typescript
// Components to build:
- ContentEditor.tsx (rich text with @ and # support)
- MediaUploader.tsx (images/videos with preview)
- PlatformSelector.tsx (with character limits)
- SchedulePicker.tsx (calendar + time selector)
```

### Step 3: Calendar View (Day 3)
```typescript
// Components:
- ContentCalendar.tsx (week/month views)
- PostCard.tsx (draggable for rescheduling)
- QuickActions.tsx (edit, delete, duplicate)
```

### Step 4: Publishing Engine (Day 4)
```typescript
// Backend services:
- PublishingQueue.ts (cron job every minute)
- PlatformPublisher.ts (handles each platform)
- RetryLogic.ts (3 attempts with backoff)
- NotificationService.ts (success/failure alerts)
```

### Step 5: Analytics Integration (Day 5)
```typescript
// Components:
- EngagementChart.tsx (likes, shares, comments)
- BestTimesHeatmap.tsx (optimal posting times)
- PostPerformance.tsx (individual post metrics)
```

---

# 2. LENDERS DASHBOARD

## Target UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Lenders Database                    [+ Add] [Import] [Sync] │
├─────────────────────────────────────────────────────────────┤
│ Search: [_______________] Filters: [Type ▼] [Min ▼] [Max ▼]│
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Name ↓    | Programs | Min Credit | Max Loan | Rate  │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ ABC Bank  | 5       | 620        | $5M      | 4.5%  │  │
│ │ XYZ Lend  | 3       | 580        | $10M     | 5.2%  │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                              │
│ Selected Lender: ABC Bank                                   │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Programs:                     Contacts:              │  │
│ │ • SBA 7(a) - 620+ score      John Doe - Senior VP   │  │
│ │ • Term Loan - 650+ score     jane@abc.com           │  │
│ │ • Line of Credit - 600+      555-0100               │  │
│ │                                                      │  │
│ │ Requirements:                 Notes:                 │  │
│ │ • 2 years in business        Prefers email first    │  │
│ │ • $250k annual revenue       Quick approvals        │  │
│ └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## What I Need From You

### 1. Google Sheets Access
```yaml
Google Sheets:
  - Sheet ID or URL
  - Service Account credentials OR OAuth
  - Column mapping:
    - Which column = Lender Name
    - Which column = Programs
    - Which column = Requirements
    - Which column = Contacts
    - etc.

Initial Data:
  - Current lender list (even if messy)
  - Program details for each
  - Contact information
  - Any special notes/preferences
```

### 2. Lender Categorization
```yaml
Categories needed:
  - Lender types (Bank, Credit Union, Hard Money, etc.)
  - Loan types they offer
  - Industry specializations
  - Geographic coverage
  - Typical turnaround times
```

## Implementation Steps

### Step 1: Google Sheets Integration (Day 1)
```typescript
// 1. Set up Google Sheets API
// 2. Create sync service:
- GoogleSheetsService.ts
- DataTransformer.ts (sheets → our schema)
- ConflictResolver.ts

// 3. Initial data import
```

### Step 2: Lender CRUD Interface (Day 2)
```typescript
// Components:
- LenderTable.tsx (sortable, filterable)
- LenderForm.tsx (add/edit with validation)
- LenderDetails.tsx (expandable view)
- BulkActions.tsx (import/export/delete)
```

### Step 3: Search & Filter System (Day 3)
```typescript
// Components:
- AdvancedSearch.tsx
- FilterPanel.tsx
- SavedSearches.tsx
- QuickFilters.tsx (common searches)
```

### Step 4: Program Management (Day 4)
```typescript
// Sub-components:
- ProgramList.tsx
- RequirementsEditor.tsx
- RateCalculator.tsx
- DocumentRequirements.tsx
```

---

# 3. DEALS PAGE

## Target UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Deal Analyzer                              [+ New Deal]     │
├─────────────────────────────────────────────────────────────┤
│ ┌────────────────────┬───────────────────────────────────┐ │
│ │ Upload Documents   │ Deal Information                  │ │
│ │                    │                                   │ │
│ │ [Drag files here]  │ Client: ________________         │ │
│ │                    │ Amount: $_______________         │ │
│ │ Files:             │ Purpose: ______________         │ │
│ │ ✓ Tax Returns.pdf  │ Credit Score: _________         │ │
│ │ ✓ Bank Stmts.pdf   │ Time in Business: _____         │ │
│ │ ⟳ Processing...    │ Annual Revenue: $_______        │ │
│ └────────────────────┴───────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Lender Recommendations                               │  │
│ │                                                      │  │
│ │ ⭐ Best Match (95% confidence)                      │  │
│ │ ABC Bank - SBA 7(a) Program                         │  │
│ │ • Meets all requirements                            │  │
│ │ • 4.5% estimated rate                               │  │
│ │ • 15-day typical approval                           │  │
│ │                                                      │  │
│ │ 🥈 Alternative Option (87% confidence)              │  │
│ │ XYZ Lending - Term Loan                             │  │
│ │ • Credit score slightly below preferred             │  │
│ │ • 5.2% estimated rate                               │  │
│ └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## What I Need From You

### 1. Document Types & Requirements
```yaml
Document Categories:
  - Required documents list
  - Optional documents
  - File naming conventions
  - Maximum file sizes

OCR Requirements:
  - Key fields to extract
  - Data validation rules
  - Confidence thresholds
```

### 2. Matching Logic Rules
```yaml
Matching Criteria Weights:
  - Credit score importance (e.g., 30%)
  - Revenue match (e.g., 20%)
  - Time in business (e.g., 15%)
  - Loan amount range (e.g., 20%)
  - Industry match (e.g., 15%)

Disqualifiers:
  - Hard stops (automatic rejection)
  - Soft warnings (proceed with caution)
```

### 3. Deal Stages
```yaml
Workflow States:
  1. Document Upload
  2. Information Extraction
  3. Validation
  4. Lender Matching
  5. Recommendation Review
  6. Submitted to Lender
  7. In Underwriting
  8. Approved/Declined
  9. Funded
```

## Implementation Steps

### Step 1: Document Upload System (Day 1-2)
```typescript
// Components:
- DocumentUploader.tsx (drag & drop)
- FileList.tsx (with preview)
- DocumentViewer.tsx (PDF viewer)

// Services:
- SupabaseStorage.ts
- DocumentProcessor.ts
- OCRService.ts (using Google Vision or AWS Textract)
```

### Step 2: Data Extraction (Day 3)
```typescript
// OCR Pipeline:
1. Upload to storage
2. Send to OCR service
3. Parse structured data
4. Validate extracted fields
5. Present for user confirmation
```

### Step 3: Matching Algorithm (Day 4-5)
```typescript
// Matching Engine:
class DealMatcher {
  // Score calculation
  calculateMatchScore(deal, lender) {
    const scores = {
      creditScore: this.scoreCreditMatch(),
      loanAmount: this.scoreAmountMatch(),
      timeInBusiness: this.scoreExperienceMatch(),
      revenue: this.scoreRevenueMatch(),
      industry: this.scoreIndustryMatch()
    };
    return this.weightedAverage(scores);
  }
}
```

### Step 4: Recommendation UI (Day 6)
```typescript
// Components:
- RecommendationCard.tsx
- MatchExplanation.tsx
- AlternativeOptions.tsx
- ContactLenderButton.tsx
```

---

# 4. AFFILIATES PAGE

## Target UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Affiliate Portal - Welcome [Affiliate Name]                │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│ │ Total Deals │ In Progress │ Completed   │ Commission  │ │
│ │     24      │      5      │     19      │  $45,230    │ │
│ └─────────────┴─────────────┴─────────────┴─────────────┘ │
│                                                              │
│ My Deals                                      [+ Submit New]│
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Client    | Amount  | Status        | Commission    │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ ABC Corp  | $500k   | In Review     | Pending       │  │
│ │ XYZ LLC   | $1.2M   | Funded ✓      | $12,000       │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Resources & Training                                 │  │
│ │ 📹 How to Submit Deals (5 min)                      │  │
│ │ 📹 Understanding Our Process (8 min)                │  │
│ │ 📄 Commission Structure PDF                         │  │
│ │ 📄 Frequently Asked Questions                       │  │
│ └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## What I Need From You

### 1. Affiliate Program Structure
```yaml
Commission Structure:
  - Percentage or flat fee?
  - Tiers based on volume?
  - Payment schedule
  - Clawback conditions

Affiliate Levels:
  - Different tiers?
  - Benefits per tier
  - Requirements for advancement
```

### 2. Training Materials
```yaml
Video Content:
  - Loom video links
  - Video titles and descriptions
  - Order/curriculum

Documents:
  - PDF resources
  - FAQ content
  - Templates they can use
```

### 3. Portal Access Rules
```yaml
Permissions:
  - Can affiliates see other deals?
  - Can they edit submitted deals?
  - Document access restrictions
  - Communication preferences
```

## Implementation Steps

### Step 1: Affiliate Dashboard (Day 1)
```typescript
// Components:
- AffiliateMetrics.tsx (cards with stats)
- CommissionSummary.tsx
- RecentActivity.tsx
- QuickActions.tsx
```

### Step 2: Deal Submission (Day 2)
```typescript
// Components:
- DealSubmissionForm.tsx
- ClientInfoCapture.tsx
- DocumentUpload.tsx
- SubmissionConfirmation.tsx
```

### Step 3: Deal Tracking (Day 3)
```typescript
// Components:
- DealTable.tsx (sortable, filterable)
- DealTimeline.tsx (visual progress)
- StatusUpdates.tsx (with notifications)
- CommissionCalculator.tsx
```

### Step 4: Resource Center (Day 4)
```typescript
// Components:
- VideoLibrary.tsx (Loom embeds)
- DocumentLibrary.tsx (PDFs)
- FAQSection.tsx (searchable)
- SupportContact.tsx
```

---

# DATABASE SCHEMA (Complete)

```sql
-- All tables needed for the system
-- Run these in order

-- 1. Content Planner Tables
CREATE TABLE social_accounts (...);
CREATE TABLE content_posts (...);
CREATE TABLE content_templates (...);
CREATE TABLE content_analytics (...);

-- 2. Lenders Tables
CREATE TABLE lenders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  programs JSONB,
  requirements JSONB,
  min_credit_score INTEGER,
  max_loan_amount DECIMAL,
  min_loan_amount DECIMAL,
  interest_rate_range JSONB,
  contacts JSONB,
  notes TEXT,
  google_sheet_id TEXT,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lender_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lender_id UUID REFERENCES lenders(id),
  name TEXT NOT NULL,
  type TEXT,
  requirements JSONB,
  rates JSONB,
  terms JSONB
);

-- 3. Deals Tables
CREATE TABLE deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  loan_amount DECIMAL,
  loan_purpose TEXT,
  credit_score INTEGER,
  annual_revenue DECIMAL,
  time_in_business INTEGER,
  documents JSONB,
  extracted_data JSONB,
  status TEXT DEFAULT 'draft',
  affiliate_id UUID REFERENCES affiliates(id),
  assigned_lenders JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Affiliates Tables
CREATE TABLE affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  tier TEXT DEFAULT 'bronze',
  commission_rate DECIMAL,
  total_deals INTEGER DEFAULT 0,
  total_funded DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates(id),
  deal_id UUID REFERENCES deals(id),
  amount DECIMAL,
  status TEXT DEFAULT 'pending',
  paid_date TIMESTAMPTZ,
  notes TEXT
);
```

---

# INTEGRATION CHECKLIST

## Before Starting Development

### Environment Variables Needed
```bash
# Add to .env.local

# Supabase (you already have these)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Social Media APIs
VITE_FACEBOOK_APP_ID=
VITE_FACEBOOK_APP_SECRET=
VITE_TWITTER_API_KEY=
VITE_TWITTER_API_SECRET=
VITE_LINKEDIN_CLIENT_ID=
VITE_LINKEDIN_CLIENT_SECRET=

# Google APIs
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_SHEETS_API_KEY=
VITE_GOOGLE_VISION_API_KEY=

# N8N Webhooks (if using)
VITE_N8N_WEBHOOK_URL=
```

### NPM Packages to Install
```bash
# Run these commands
npm install @supabase/supabase-js
npm install react-big-calendar date-fns
npm install react-dropzone
npm install react-hook-form zod
npm install @tanstack/react-query
npm install recharts
npm install react-beautiful-dnd
npm install googleapis
npm install react-pdf
```

---

# QUESTIONS TO ANSWER BEFORE CODING

## Priority 1: Content Planner
1. Which social platforms do you want to start with first?
2. Do you have the API credentials ready?
3. What's your preferred posting schedule?
4. Any specific brand guidelines?

## Priority 2: Lenders Dashboard
1. Can you share the Google Sheet structure?
2. How many lenders are we importing initially?
3. Any custom fields beyond what I've outlined?

## Priority 3: Deals Page
1. What OCR service preference (Google/AWS/Azure)?
2. Specific document types you handle?
3. Any regulatory compliance needs?

## Priority 4: Affiliates
1. Current affiliate count?
2. Commission structure details?
3. Any existing training materials ready?

---

# DEVELOPMENT SEQUENCE

## Recommended Build Order (Condensed Timeline)

### Week 1: Content Planner
- Day 1-2: Social auth & posting
- Day 3: Calendar view
- Day 4: Scheduling system
- Day 5: Testing & polish

### Week 2: Lenders Dashboard
- Day 1-2: Google Sheets sync
- Day 3: CRUD interface
- Day 4: Search & filters
- Day 5: Testing & polish

### Week 3: Deals Page
- Day 1-2: Document upload & OCR
- Day 3: Matching algorithm
- Day 4: Recommendations UI
- Day 5: Testing & polish

### Week 4: Affiliates Portal
- Day 1: Dashboard & metrics
- Day 2: Deal submission
- Day 3: Tracking & resources
- Day 4-5: Testing & polish

---

*This detailed specification should give us everything needed to start building. Let me know which feature you want to tackle first and what information you can provide!*
# 🎯 EPIC: CONTENT PLANNER & SOCIAL MEDIA MANAGEMENT
**Epic ID**: CP-001
**Priority**: P0 (Critical)
**Goal**: Build a comprehensive content planning and publishing system for multi-platform social media management with Twitter thread support, scheduling, and analytics

## Executive Summary
The Content Planner enables Zac, Luke, and Huge Capital to create, schedule, and manage content across LinkedIn, Twitter/X, Facebook, blogs, and newsletters. Key features include Twitter thread builder, visual calendar, posting frequency tracking, and future AI assistance.

## Current State Analysis
The analyst has already created:
- Database schema (`src/database/schema.sql`)
- TypeScript types (`src/types/content.ts`)
- React hook (`src/hooks/useContentPlanner.ts`)
- UI Components (TwitterThreadBuilder, ContentEditor, ContentCalendar)
- Setup documentation

## Development Approach
**Implementation Strategy**: Progressive enhancement - Start with core features, add advanced capabilities iteratively

---

# 📋 USER STORIES - PHASE 1: CORE FUNCTIONALITY

## Story CP-1.1: Database Setup and Migration
**As a** developer
**I want to** set up the database schema
**So that** all content data can be properly stored and retrieved

### Acceptance Criteria
- [ ] All 11 tables created successfully in Supabase
- [ ] Row Level Security (RLS) policies configured
- [ ] Test data seeded for development
- [ ] Migration script is idempotent (can run multiple times safely)
- [ ] Indexes created for performance optimization
- [ ] Foreign key relationships established

### Technical Implementation Steps
```bash
# Step 1: Create migration file
supabase migration new content_planner_schema

# Step 2: Copy schema from src/database/schema.sql
# Step 3: Run migration
supabase migration up

# Step 4: Verify in Supabase Dashboard
```

### Developer Tasks
1. Review `src/database/schema.sql`
2. Create Supabase migration
3. Test rollback capability
4. Verify all tables and relationships
5. Document any schema modifications

**Story Points**: 3
**Priority**: P0
**Dependencies**: None

---

## Story CP-1.2: Content Profile Management
**As a** content manager
**I want to** switch between Zac, Luke, and Huge Capital profiles
**So that** I can create content for the right person/brand

### Acceptance Criteria
- [ ] Profile switcher in UI header
- [ ] Each profile loads its specific settings
- [ ] Content pillars displayed with percentages
- [ ] Brand voice guidelines shown
- [ ] Posting goals visible
- [ ] Profile data persists in database

### Technical Implementation Steps
```typescript
// 1. Implement profile switcher component
// 2. Update useContentPlanner hook for profile management
// 3. Connect to content_profiles table
// 4. Store selected profile in local storage
// 5. Apply profile context to all content operations
```

### Developer Tasks
1. Create ProfileSelector component
2. Implement profile context provider
3. Update useContentPlanner for profile switching
4. Add profile indicators to UI
5. Test profile persistence

**Story Points**: 3
**Priority**: P0
**Dependencies**: CP-1.1

---

## Story CP-1.3: Basic Content Editor
**As a** content creator
**I want to** write and format content
**So that** I can create posts for different platforms

### Acceptance Criteria
- [ ] Rich text editor with basic formatting
- [ ] Platform selector (LinkedIn, Twitter, Facebook, Blog, Newsletter)
- [ ] Character counter per platform limits
- [ ] Save as draft functionality
- [ ] Auto-save every 30 seconds
- [ ] Content preview panel

### Technical Implementation Steps
```typescript
// Components needed:
// - ContentEditor.tsx (already created)
// - RichTextEditor component
// - PlatformSelector component
// - CharacterCounter component
// - PreviewPanel component

// Data flow:
// 1. Select platform → Load platform config
// 2. Type content → Update character count
// 3. Auto-save → Store in content_posts table
// 4. Preview → Show formatted output
```

### Developer Tasks
1. Review existing ContentEditor.tsx
2. Integrate rich text editor library
3. Implement platform-specific limits
4. Add auto-save functionality
5. Create preview component
6. Test data persistence

**Story Points**: 5
**Priority**: P0
**Dependencies**: CP-1.2

---

## Story CP-1.4: Twitter Thread Builder
**As a** content creator
**I want to** create multi-tweet threads
**So that** I can share longer-form content on Twitter

### Acceptance Criteria
- [ ] Thread mode toggle for Twitter platform
- [ ] Compelling hook section (first tweet)
- [ ] Add/remove tweets dynamically
- [ ] Drag-and-drop to reorder tweets
- [ ] Character count per tweet (280 limit)
- [ ] Thread preview showing connected tweets
- [ ] Best practices guide tooltip

### Technical Implementation Steps
```typescript
// TwitterThreadBuilder.tsx implementation:
// 1. Thread state management
interface ThreadState {
  tweets: Tweet[]
  hookTweet: Tweet
  isThreadMode: boolean
}

// 2. Drag-drop using react-beautiful-dnd
// 3. Character validation per tweet
// 4. Save thread structure to database
// 5. Preview with thread lines
```

### Developer Tasks
1. Review existing TwitterThreadBuilder.tsx
2. Implement drag-drop functionality
3. Add tweet validation
4. Create thread preview
5. Store thread metadata in database
6. Test thread creation and editing

**Story Points**: 5
**Priority**: P0
**Dependencies**: CP-1.3

---

## Story CP-1.5: Content Scheduling
**As a** content manager
**I want to** schedule posts for future publishing
**So that** I can plan content in advance

### Acceptance Criteria
- [ ] Date/time picker for scheduling
- [ ] Timezone handling (default to user's timezone)
- [ ] Recurring post options (daily, weekly, monthly)
- [ ] Schedule validation (no past dates)
- [ ] Bulk scheduling for multiple platforms
- [ ] Schedule conflict warnings
- [ ] Quick schedule presets (tomorrow morning, next Monday, etc.)

### Technical Implementation Steps
```typescript
// Scheduling implementation:
// 1. Use date-fns for timezone handling
// 2. Create SchedulePicker component
// 3. Implement scheduling logic:
const schedulePost = async (post: Post, scheduleDate: Date) => {
  // Validate future date
  // Convert to UTC
  // Save to database with status: 'scheduled'
  // Set up cron job or trigger
}
```

### Developer Tasks
1. Create SchedulePicker component
2. Implement timezone conversion
3. Add recurring post logic
4. Create schedule validation
5. Set up scheduling queue
6. Test scheduling scenarios

**Story Points**: 5
**Priority**: P0
**Dependencies**: CP-1.4

---

## Story CP-1.6: Content Calendar View
**As a** content manager
**I want to** view all content on a calendar
**So that** I can visualize my content strategy

### Acceptance Criteria
- [ ] Month/Week/Day/Agenda views
- [ ] Color-coded by person (Zac=Blue, Luke=Green, Huge Capital=Purple)
- [ ] Click date to create new post
- [ ] Click post to edit
- [ ] Drag posts to reschedule
- [ ] Filter by person or platform
- [ ] Export calendar to ICS format
- [ ] Print-friendly view

### Technical Implementation Steps
```typescript
// Using react-big-calendar:
// 1. Configure calendar component
// 2. Map posts to calendar events
// 3. Implement drag-drop for rescheduling
// 4. Add filtering logic
// 5. Create event handlers

const calendarConfig = {
  views: ['month', 'week', 'day', 'agenda'],
  defaultView: 'month',
  events: mapPostsToEvents(posts),
  onEventDrop: handleReschedule,
  onSelectSlot: handleCreatePost
}
```

### Developer Tasks
1. Review existing ContentCalendar.tsx
2. Configure react-big-calendar
3. Implement event mapping
4. Add drag-drop rescheduling
5. Create filter controls
6. Test calendar interactions

**Story Points**: 5
**Priority**: P0
**Dependencies**: CP-1.5

---

## Story CP-1.7: Posting Frequency Tracking
**As a** content manager
**I want to** track my posting frequency
**So that** I can meet my content goals

### Acceptance Criteria
- [ ] Display weekly posting goals per platform
- [ ] Show actual vs target posts
- [ ] Progress bars with percentages
- [ ] Historical tracking (past 4 weeks)
- [ ] Alert when behind schedule
- [ ] Quick stats dashboard
- [ ] Export frequency reports

### Technical Implementation Steps
```typescript
// Frequency tracking:
// 1. Query posting_goals table
// 2. Calculate actual posts from content_posts
// 3. Create FrequencyTracker component
// 4. Implement progress calculations
// 5. Add notification system for goals
```

### Developer Tasks
1. Create FrequencyTracker component
2. Implement goal calculations
3. Add progress visualizations
4. Create alert system
5. Build stats dashboard
6. Test tracking accuracy

**Story Points**: 3
**Priority**: P0
**Dependencies**: CP-1.6

---

# 📋 USER STORIES - PHASE 2: ENHANCED FEATURES

## Story CP-2.1: Tag and Content Pillar System
**As a** content creator
**I want to** organize content with tags and pillars
**So that** I can maintain content strategy alignment

### Acceptance Criteria
- [ ] Create and manage custom tags
- [ ] Assign multiple tags per post
- [ ] Content pillar selection dropdown
- [ ] Tag autocomplete
- [ ] Tag usage analytics
- [ ] Bulk tag operations
- [ ] Tag-based filtering

### Technical Implementation Steps
```typescript
// Tag system:
// 1. Create TagManager component
// 2. Implement tag CRUD operations
// 3. Add autocomplete functionality
// 4. Build tag analytics
```

**Story Points**: 3
**Priority**: P1
**Dependencies**: CP-1.7

---

## Story CP-2.2: Media Upload and Management
**As a** content creator
**I want to** upload images and videos
**So that** I can create rich media posts

### Acceptance Criteria
- [ ] Drag-drop media upload
- [ ] Image/video preview
- [ ] Auto-optimization for platforms
- [ ] Media gallery with search
- [ ] Alt text editor
- [ ] Crop and resize tools
- [ ] Storage in Supabase

### Technical Implementation Steps
```typescript
// Media handling:
// 1. Integrate Supabase Storage
// 2. Create MediaUploader component
// 3. Implement image optimization
// 4. Build media gallery
```

**Story Points**: 5
**Priority**: P1
**Dependencies**: CP-2.1

---

## Story CP-2.3: Content Templates
**As a** content creator
**I want to** save and reuse content templates
**So that** I can maintain consistency

### Acceptance Criteria
- [ ] Save posts as templates
- [ ] Template categories
- [ ] Variable placeholders
- [ ] Template preview
- [ ] Quick template selection
- [ ] Template sharing between profiles

### Technical Implementation Steps
```typescript
// Template system:
// 1. Create TemplateManager
// 2. Implement variable replacement
// 3. Build template gallery
```

**Story Points**: 3
**Priority**: P1
**Dependencies**: CP-2.2

---

# 📋 USER STORIES - PHASE 3: AUTOMATION & AI

## Story CP-3.1: Automated Publishing System
**As a** content manager
**I want to** have posts publish automatically
**So that** I don't need manual intervention

### Acceptance Criteria
- [ ] Cron job for scheduled posts
- [ ] Platform API integration
- [ ] Retry mechanism for failures
- [ ] Publishing queue management
- [ ] Status notifications
- [ ] Error logging
- [ ] Rollback capability

### Technical Implementation Steps
```typescript
// Publishing automation:
// 1. Set up Supabase Edge Functions
// 2. Integrate platform APIs
// 3. Implement retry logic
// 4. Create notification system
```

**Story Points**: 8
**Priority**: P1
**Dependencies**: CP-2.3

---

## Story CP-3.2: AI Content Assistant
**As a** content creator
**I want to** get AI suggestions
**So that** I can create better content faster

### Acceptance Criteria
- [ ] Generate content variations
- [ ] Suggest hashtags
- [ ] Optimize for engagement
- [ ] Tone adjustment
- [ ] Grammar and spell check
- [ ] Content scoring
- [ ] Learning from edits

### Technical Implementation Steps
```typescript
// AI integration:
// 1. Integrate OpenAI API
// 2. Create AIAssistant component
// 3. Implement suggestion logic
// 4. Build learning system
```

**Story Points**: 8
**Priority**: P2
**Dependencies**: CP-3.1

---

## Story CP-3.3: Analytics Dashboard
**As a** content manager
**I want to** see content performance metrics
**So that** I can optimize strategy

### Acceptance Criteria
- [ ] Engagement metrics (likes, shares, comments)
- [ ] Reach and impressions
- [ ] Best performing content
- [ ] Optimal posting times
- [ ] Platform comparison
- [ ] Trend analysis
- [ ] Export reports

### Technical Implementation Steps
```typescript
// Analytics implementation:
// 1. Fetch metrics from platform APIs
// 2. Create AnalyticsDashboard
// 3. Build data visualizations
// 4. Implement caching
```

**Story Points**: 5
**Priority**: P2
**Dependencies**: CP-3.2

---

# 🚀 SPRINT PLANNING

## Sprint 1: Foundation (Week 1)
- CP-1.1: Database Setup (3 pts)
- CP-1.2: Profile Management (3 pts)
- CP-1.3: Basic Editor (5 pts)
**Total**: 11 points

## Sprint 2: Core Features (Week 2)
- CP-1.4: Twitter Threads (5 pts)
- CP-1.5: Scheduling (5 pts)
- CP-1.6: Calendar View (5 pts)
**Total**: 15 points

## Sprint 3: Enhancement (Week 3)
- CP-1.7: Frequency Tracking (3 pts)
- CP-2.1: Tags & Pillars (3 pts)
- CP-2.2: Media Upload (5 pts)
**Total**: 11 points

## Sprint 4: Advanced (Week 4)
- CP-2.3: Templates (3 pts)
- CP-3.1: Auto Publishing (8 pts)
**Total**: 11 points

## Sprint 5: AI & Analytics (Week 5)
- CP-3.2: AI Assistant (8 pts)
- CP-3.3: Analytics (5 pts)
**Total**: 13 points

---

# ✅ DEVELOPER HANDOFF CHECKLIST

## Pre-Development Setup
- [ ] Review all existing files created by analyst
- [ ] Set up local Supabase instance
- [ ] Configure environment variables
- [ ] Install required npm packages
- [ ] Review TypeScript types in `src/types/content.ts`

## File Review Checklist
- [ ] `src/database/schema.sql` - Database schema
- [ ] `src/types/content.ts` - TypeScript definitions
- [ ] `src/hooks/useContentPlanner.ts` - Data management
- [ ] `src/components/ContentPlanner/TwitterThreadBuilder.tsx`
- [ ] `src/components/ContentPlanner/ContentEditor.tsx`
- [ ] `src/components/ContentPlanner/ContentCalendar.tsx`
- [ ] `docs/Content-Planner-Setup.md` - Setup guide

## Development Environment
```bash
# Required packages to verify/install
npm ls react-big-calendar
npm ls date-fns
npm ls react-beautiful-dnd
npm ls @dnd-kit/sortable
npm ls react-hook-form
npm ls recharts

# If missing, install:
npm install react-big-calendar date-fns react-beautiful-dnd
npm install @dnd-kit/sortable react-hook-form recharts
```

## API Keys Required
- [ ] Supabase URL and Anon Key (existing)
- [ ] Social Media API Keys (Phase 3):
  - [ ] Twitter/X API
  - [ ] LinkedIn API
  - [ ] Facebook Graph API
- [ ] OpenAI API Key (Phase 3)

## Testing Requirements
- [ ] Unit tests for hooks
- [ ] Component tests for UI
- [ ] Integration tests for database
- [ ] E2E tests for critical workflows
- [ ] Manual testing checklist

---

# 🎯 Definition of Done

For each user story:
1. [ ] Code complete and reviewed
2. [ ] TypeScript types defined
3. [ ] Unit tests written (>80% coverage)
4. [ ] Integration with Supabase verified
5. [ ] UI responsive and accessible
6. [ ] Documentation updated
7. [ ] Manual testing passed
8. [ ] Code merged to main
9. [ ] Deployed to staging
10. [ ] Stakeholder approval

---

# 📊 Success Metrics

## Phase 1 Success Criteria
- Users can create content for all 3 profiles
- Twitter threads work with drag-drop
- Calendar shows all scheduled content
- Posting frequency is tracked accurately

## Phase 2 Success Criteria
- Media uploads work seamlessly
- Templates save 50% creation time
- Tags improve content organization

## Phase 3 Success Criteria
- 95% publishing success rate
- AI suggestions used in 60% of posts
- Analytics show engagement trends

---

# 🔧 Technical Architecture

## Component Hierarchy
```
ContentManagement (Page)
├── ProfileSelector
├── ContentPlanner
│   ├── ContentEditor
│   │   ├── RichTextEditor
│   │   ├── PlatformSelector
│   │   ├── CharacterCounter
│   │   └── SchedulePicker
│   ├── TwitterThreadBuilder
│   │   ├── ThreadTweet
│   │   └── ThreadPreview
│   ├── ContentCalendar
│   │   └── CalendarEvent
│   └── FrequencyTracker
│       └── ProgressBar
└── ContentStats
```

## Data Flow
```
User Action → Component → Hook → Supabase → Database
                ↓
            Local State
                ↓
            UI Update
```

## State Management
- React Context for profile selection
- React Query for data fetching
- Local state for UI interactions
- Optimistic updates for better UX

---

# 📝 Implementation Notes

## Critical Considerations
1. **Performance**: Calendar may have many events - implement virtualization
2. **Auto-save**: Debounce to prevent excessive database writes
3. **Drag-Drop**: Test across browsers and devices
4. **Timezones**: Always store UTC, display local
5. **Media**: Optimize images before upload
6. **Security**: Validate all inputs, use RLS policies

## Common Pitfalls to Avoid
1. Don't store sensitive API keys in frontend
2. Handle network failures gracefully
3. Provide offline support where possible
4. Test with slow connections
5. Consider mobile users

## Resources
- [Supabase Docs](https://supabase.com/docs)
- [React Big Calendar](https://github.com/jquense/react-big-calendar)
- [React Beautiful DnD](https://github.com/atlassian/react-beautiful-dnd)
- [Platform API Docs](links to be added)

---

*This document should be the single source of truth for Content Planner development. Update after each sprint.*
# Content Planner Setup Guide

## Overview
This guide will help you set up the enhanced Content Planner with all its features including Twitter thread builder, content calendar, and multi-platform support.

---

## 🚀 Quick Start

### Step 1: Database Setup in Supabase

1. **Open your Supabase Dashboard**
   - Go to your project's SQL Editor

2. **Run the Schema Migration**
   - Copy the entire contents of `src/database/schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to create all tables

3. **Verify Tables Were Created**
   You should see these new tables:
   - `content_profiles` - Person profiles with AI context
   - `content_posts` - All content posts
   - `content_analytics` - Performance metrics
   - `competitor_posts` - Competitor tracking
   - `content_tags` - Organization tags
   - `posting_goals` - Frequency targets
   - `content_templates` - Reusable templates
   - `content_comments` - Engagement tracking
   - `ai_learning` - AI pattern learning
   - `newsletter_subscribers` - Email list
   - `newsletter_campaigns` - Email campaigns

### Step 2: Test the Application

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Navigate to Content Planner**
   - Go to http://localhost:5173
   - Click on "Content Planner" in the sidebar

3. **Test Basic Features**
   - Switch between Zac, Luke, and Huge Capital profiles
   - Try creating a post for LinkedIn
   - Test the Twitter thread builder
   - View the calendar
   - Schedule a post

---

## 📝 Features Overview

### 1. **Twitter Thread Builder**
- Click on Twitter platform
- Toggle "Thread Mode"
- Write compelling hook (first tweet)
- Add thread parts with "Add Tweet"
- Drag to reorder tweets
- Character count per tweet
- Best practices guide included

### 2. **Content Calendar**
- View posts in Month/Week/Day views
- Color-coded by person (Zac=Blue, Luke=Green, Huge Capital=Purple)
- Click dates to create new posts
- Click posts to edit
- Status indicators (Draft, Scheduled, Published)

### 3. **Multi-Platform Editor**
- Platform-specific character limits
- Live preview for each platform
- Tag system for organization
- Content pillar selection
- Source tracking for blogs/newsletters
- Scheduling with date/time picker

### 4. **Content Profiles**
- Each person has:
  - Content Pillars with percentages
  - Brand Voice guidelines
  - Key Messaging points
  - Posting frequency goals
  - Platform-specific settings

### 5. **Posting Stats**
- Weekly/Monthly posting frequency tracking
- Progress bars showing actual vs target
- Quick stats dashboard
- Per-person, per-platform metrics

---

## 🔧 Configuration

### Environment Variables
No new environment variables needed! Uses existing Supabase configuration.

### Posting Goals
Default goals are set in the database:
- **Zac**: LinkedIn (3/week), Twitter (7/week), Facebook (2/week)
- **Luke**: LinkedIn (3/week), Twitter (5/week), Facebook (2/week)
- **Huge Capital**: Blog (1/week), Newsletter (1/week)

To adjust goals, update the `posting_goals` table in Supabase.

---

## 🎯 Usage Guide

### Creating a Twitter Thread

1. Select person (Zac or Luke)
2. Click Twitter platform
3. Toggle "Thread Mode" button
4. Write your hook (compelling first tweet)
5. Click "Add Tweet" to add thread parts
6. Drag tweets to reorder
7. Schedule or save as draft

### Scheduling Posts

1. Select person and platform
2. Write your content
3. Select tags and content pillar
4. Choose date and time in scheduler
5. Click "Schedule" to queue the post

### Using the Calendar

1. Click "Calendar" view
2. Use Month/Week/Day toggles
3. Click any date to create new post
4. Click existing posts to edit
5. Filter by person or platform (coming soon)

### Content Organization

- **Tags**: Use for topics/campaigns
- **Content Pillars**: Align with person's strategy
- **Sources**: Track references for blogs/newsletters

---

## 🚦 Status Indicators

- **Draft** (Yellow) - Not yet scheduled
- **Scheduled** (Blue) - Queued for posting
- **Published** (Green) - Successfully posted
- **Failed** (Red) - Posting error

---

## 📊 Coming Soon Features

These features are partially implemented and will be completed soon:

1. **AI Content Assistant**
   - Generate content suggestions
   - Optimize for platform
   - Learn from edits

2. **Analytics Dashboard**
   - Engagement metrics
   - Best performing content
   - Optimal posting times

3. **Competitor Tracking**
   - Import competitor posts
   - Rate and analyze
   - Style insights

4. **Comment Management**
   - Unified inbox
   - Reply tracking
   - Sentiment analysis

5. **Newsletter System**
   - Email campaigns
   - Subscriber management
   - Template builder

6. **Media Upload**
   - Image/video storage
   - Gallery management
   - Auto-optimization

---

## 🐛 Troubleshooting

### Tables not created
- Check SQL syntax errors in Supabase dashboard
- Ensure you're using the correct project
- Try running the schema in smaller chunks

### Data not loading
- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Check Row Level Security policies

### Posts not saving
- Ensure you're logged in
- Check network tab for API errors
- Verify table permissions in Supabase

---

## 📚 Technical Details

### Database Schema
- Uses PostgreSQL with JSONB for flexible data
- Row Level Security enabled
- Automatic timestamp updates
- Foreign key relationships

### React Components
- `ContentEditor` - Main editing interface
- `TwitterThreadBuilder` - Thread creation
- `ContentCalendar` - Calendar view
- `useContentPlanner` - Data management hook

### Type Safety
- Full TypeScript types in `src/types/content.ts`
- Strict type checking
- Enum types for platforms and statuses

---

## 🎉 Next Steps

1. Start creating content for each person
2. Build up your content calendar
3. Track posting frequency
4. Monitor what works best
5. Iterate and improve!

---

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Review the Supabase logs
3. Verify all tables were created
4. Check the Network tab for API failures

Remember: This is a powerful system that will grow with your needs. Start simple and add complexity as you get comfortable with the features!
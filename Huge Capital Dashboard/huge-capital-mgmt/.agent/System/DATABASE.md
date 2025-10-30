# Database Schema Documentation

## Overview
The Huge Capital Dashboard uses Supabase (PostgreSQL) as its database backend. This document details the database schema, relationships, and operations.

## Main Tables for Dillon's Daily Dashboard

### 1. daily_checklist

**Purpose**: Tracks daily task completion status across the work week

**Schema**:
```sql
CREATE TABLE daily_checklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  monday BOOLEAN DEFAULT false,
  tuesday BOOLEAN DEFAULT false,
  wednesday BOOLEAN DEFAULT false,
  thursday BOOLEAN DEFAULT false,
  friday BOOLEAN DEFAULT false,
  week_number INTEGER,
  week_start DATE,
  user_id VARCHAR(100) DEFAULT 'dillon',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
```

**Fields**:
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Unique identifier |
| task_id | VARCHAR(100) | Reference to task |
| title | TEXT | Task name/description |
| category | VARCHAR(100) | Task category (Social, Pipeline, Referral, Ops) |
| monday-friday | BOOLEAN | Completion status for each day |
| week_number | INTEGER | Week identifier (1-4) |
| week_start | DATE | Start date of the week |
| user_id | VARCHAR(100) | User identifier (currently: 'dillon') |
| created_at | TIMESTAMP | Record creation time (UTC) |
| updated_at | TIMESTAMP | Last modification time (UTC) |

**Indexes**:
- Primary key on `id`
- Consider adding indexes on: `user_id`, `week_number`, `task_id` for query performance

**Example Data**:
```json
{
  "task_id": "1",
  "title": "Post on FB + LinkedIn",
  "category": "Social & Content",
  "monday": true,
  "tuesday": false,
  "wednesday": true,
  "thursday": false,
  "friday": true,
  "week_number": 1,
  "week_start": "2025-10-27",
  "user_id": "dillon"
}
```

---

### 2. weekly_recaps

**Purpose**: Stores weekly recap form submissions with answers to structured questions

**Schema**:
```sql
CREATE TABLE weekly_recaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number INTEGER NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  what_was_done TEXT,
  quantity TEXT,
  wins_highlights TEXT,
  issues_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  user_id VARCHAR(100) DEFAULT 'dillon'
);
```

**Fields**:
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Unique identifier |
| week_number | INTEGER | Week identifier (1-4) |
| week_start | DATE | Start date of the week |
| week_end | DATE | End date of the week |
| category | VARCHAR(100) | Category being reported on |
| what_was_done | TEXT | Description of work completed |
| quantity | TEXT | Quantifiable metric (numbers, stats) |
| wins_highlights | TEXT | Achievements and highlights |
| issues_notes | TEXT | Challenges, issues, or notes |
| user_id | VARCHAR(100) | User identifier (currently: 'dillon') |
| created_at | TIMESTAMP | Record creation time (UTC) |
| updated_at | TIMESTAMP | Last modification time (UTC) |

**Indexes**:
- Primary key on `id`
- Consider adding indexes on: `user_id`, `week_number`, `category` for query performance

**Example Data**:
```json
{
  "week_number": 1,
  "week_start": "2025-10-27",
  "week_end": "2025-11-02",
  "category": "Social & Content",
  "what_was_done": "Created and posted 5 social media pieces, engaged with followers",
  "quantity": "5 posts, 50+ engagements",
  "wins_highlights": "Highest engagement rate of the month, gained 25 new followers",
  "issues_notes": "Time management was challenging with multiple projects running simultaneously",
  "user_id": "dillon"
}
```

---

## Lenders Tables

### business_line_of_credit
Stores Business Line of Credit lender information
- Searchable fields
- Filter capabilities

### mca_lenders
Merchant Cash Advance lender data

### sba_lenders
Small Business Administration loan lender data

---

## Common Queries

### Load daily checklist for a week
```sql
SELECT * FROM daily_checklist
WHERE user_id = 'dillon'
AND week_number = 1
ORDER BY category, task_id;
```

### Load weekly recap for a category
```sql
SELECT * FROM weekly_recaps
WHERE user_id = 'dillon'
AND week_number = 1
AND category = 'Social & Content';
```

### Get all tasks in a category
```sql
SELECT DISTINCT category FROM daily_checklist
WHERE user_id = 'dillon'
ORDER BY category;
```

### Calculate weekly completion stats
```sql
SELECT
  category,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN monday THEN 1 ELSE 0 END) as monday_completed
FROM daily_checklist
WHERE user_id = 'dillon' AND week_number = 1
GROUP BY category;
```

---

## Row Level Security (RLS)

**Current Setup**: Basic user-scoped policies

**Policies Applied**:
- Users can only read/write data where `user_id` matches their identifier
- Service role key used for administrative operations

**Future Improvements**:
- Implement proper authentication-based RLS
- Add role-based access control (RBAC)
- Implement team/organization-level sharing

---

## Migrations

### Migration Files
- `20251026_create_daily_checklist.sql` - Creates daily_checklist table
- `20241026_create_weekly_recaps.sql` - Creates weekly_recaps table

### Running Migrations
```bash
# Push migrations to Supabase
npx supabase db push

# List applied migrations
npx supabase migration list

# Create new migration
npx supabase migration new migration_name
```

---

## Future Enhancements

### Performance
- [ ] Add indexes on frequently queried columns
- [ ] Implement database query caching
- [ ] Archive old data to separate tables

### Features
- [ ] Add historical data tracking
- [ ] Implement audit logs
- [ ] Add data export functionality

### Security
- [ ] Fine-grained RLS policies
- [ ] Encryption for sensitive fields
- [ ] Comprehensive audit logging

### Multi-User Support
- [ ] Implement proper user authentication
- [ ] Add team/organization support
- [ ] Implement user roles and permissions

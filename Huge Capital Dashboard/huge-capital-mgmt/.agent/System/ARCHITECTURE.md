# Huge Capital Dashboard - System Architecture

## Overview
The Huge Capital Dashboard is a React-based web application designed to manage financial operations, track lending products, and monitor daily task performance through an integrated dashboard system.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect)

### Backend & Database
- **Backend**: Supabase (Backend-as-a-Service)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (configured, not fully implemented)
- **API**: Supabase REST API

### DevOps & Deployment
- **Version Control**: Git/GitHub
- **CI/CD**: GitHub Actions
- **Deployment**: GitHub Pages / Vercel

## Project Structure

```
huge-capital-mgmt/
├── .agent/                          # Agent documentation
│   ├── README.md                   # Index of all documentation
│   ├── Tasks/                      # Feature requirements and implementation plans
│   ├── System/                     # System architecture and state
│   └── SOP/                        # Standard operating procedures
├── .claude/                         # Claude Code configuration
│   ├── settings.local.json
│   ├── commands/                   # Custom slash commands
│   └── .claude/                    # Internal configuration
├── src/
│   ├── pages/
│   │   ├── DillonDaily.tsx         # Daily dashboard (Checklist, KPI, Recap)
│   │   ├── TaskTracker.tsx         # Task tracking page
│   │   ├── FundingDashboard.tsx    # Funding dashboard
│   │   ├── Projects.tsx            # Projects page
│   │   ├── Lenders.tsx             # Lenders page
│   │   └── [other pages]
│   ├── components/
│   │   ├── Layout.tsx              # Main layout with navigation
│   │   └── [other components]
│   ├── lib/
│   │   └── supabase.ts             # Supabase client initialization
│   ├── App.tsx                     # Main app routing
│   └── main.tsx                    # Entry point
├── supabase/
│   ├── migrations/                 # Database migrations
│   │   ├── 20251026_create_daily_checklist.sql
│   │   ├── 20241026_create_weekly_recaps.sql
│   │   └── [other migrations]
│   └── .temp/                      # Temporary Supabase files
├── public/                          # Static assets
├── docs/                           # Additional documentation
├── .env                            # Environment variables
├── .env.example                    # Environment template
├── CLAUDE.md                       # Project instructions
├── progress.md                     # Progress tracking
├── bugs.md                         # Bug reports
├── decisions.md                    # Architectural decisions
├── package.json                    # Dependencies
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
└── tailwind.config.js              # Tailwind CSS configuration
```

## Data Flow

### Daily Checklist Flow
```
User Interaction (checkbox toggle)
    ↓
toggleChecklistItem() in DillonDaily.tsx
    ↓
Update local state (setChecklistItems)
    ↓
Supabase API call (upsert to daily_checklist table)
    ↓
Data persisted in database
    ↓
Component re-renders with new data
```

### KPI Calculation Flow
```
Load daily_checklist data
    ↓
calculateKPIs() function processes checklist items
    ↓
Group items by category
    ↓
Calculate completion counts and percentages
    ↓
Return KPI data structure
    ↓
Render KPI cards with metrics
```

### Weekly Recap Flow
```
User fills recap form
    ↓
updateWeeklyRecap() updates local state
    ↓
saveWeeklyRecap() sends to Supabase
    ↓
Data stored in weekly_recaps table
    ↓
Load data on component mount
    ↓
Display saved recap data
```

## Database Schema

### Tables

#### daily_checklist
```sql
- id: UUID (Primary Key)
- task_id: VARCHAR(100)
- title: TEXT
- category: VARCHAR(100)
- monday: BOOLEAN
- tuesday: BOOLEAN
- wednesday: BOOLEAN
- thursday: BOOLEAN
- friday: BOOLEAN
- week_number: INTEGER
- week_start: DATE
- user_id: VARCHAR(100) [default: 'dillon']
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Purpose**: Tracks daily task completion across the week

#### weekly_recaps
```sql
- id: UUID (Primary Key)
- week_number: INTEGER
- week_start: DATE
- week_end: DATE
- category: VARCHAR(100)
- what_was_done: TEXT
- quantity: TEXT
- wins_highlights: TEXT
- issues_notes: TEXT
- user_id: VARCHAR(100) [default: 'dillon']
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Purpose**: Stores weekly recap form submissions for each category

#### Other Tables (Lenders)
- `business_line_of_credit`
- `mca_lenders`
- `sba_lenders`
- Various lender-related tables with searchable data

## Core Components

### DillonDaily.tsx
**Purpose**: Main dashboard component for daily task management

**Features**:
- Three view modes: Daily Checklist, KPI Tracker, Weekly Recap
- State management for checklist items, recap data, week selection
- Supabase integration for data persistence
- Category-based organization
- Dynamic KPI calculations

**Key Functions**:
- `toggleChecklistItem()` - Save task completion status
- `calculateKPIs()` - Calculate metrics from checklist data
- `loadDailyChecklistData()` - Load saved data on mount
- `saveWeeklyRecap()` - Save recap form data
- `updateWeeklyRecap()` - Update recap form state

### Layout.tsx
**Purpose**: Main layout component with navigation

**Features**:
- Top navigation bar
- Sidebar navigation menu
- Submenus for different sections
- Dillon's Daily submenu under Task Tracker

## Integration Points

### Supabase Integration
- Initialized in `src/lib/supabase.ts`
- Used throughout DillonDaily.tsx for data operations
- Service role key configured in .env for administrative operations

### Database Migrations
- Migrations stored in `supabase/migrations/`
- Applied via Supabase CLI
- Tracked in version control

## State Management

**Local Component State** (React Hooks):
- `currentView` - Current dashboard view mode
- `collapsedCategories` - Expanded/collapsed category state
- `selectedWeek` - Selected week for KPI view
- `checklistItems` - Daily checklist task data
- `weeklyRecapData` - Weekly recap form data

**Server State** (Supabase):
- Daily checklist completion data
- Weekly recap submissions
- Lender information
- Other operational data

## Styling System

### Design Principles
- Dark theme with subtle glassmorphic cards
- Color-coded categories for quick identification
- Large, readable typography
- Responsive mobile-first design
- Smooth transitions and hover effects

### Color System
- Brand Primary: #6366f1 (Indigo)
- Category Colors: Purple, Blue, Emerald, Amber
- Neutral Scale: Multiple shades of gray
- Semantic Colors: Emerald (success), Amber (warning), Red (error)

## Error Handling

### Current Implementation
- Try/catch blocks around Supabase operations
- Console error logging for debugging
- UI maintains consistency even if saves fail (optimistic updates)

### Future Improvements
- User-facing error notifications
- Retry mechanisms for failed requests
- Error logging service integration

## Performance Considerations

### Optimizations
- Collapsible categories reduce DOM complexity
- Memoized calculations for KPI metrics
- Efficient table rendering with proper keys
- Lazy loading for large data sets (future)

### Potential Improvements
- Component memoization with React.memo
- useCallback for event handlers
- Pagination for large datasets
- Database query optimization

## Security

### Current Implementation
- Supabase RLS (Row Level Security) policies configured
- Service role key for administrative operations
- User scoping via user_id field

### Future Improvements
- Proper authentication implementation
- Fine-grained RLS policies
- API rate limiting
- Input validation and sanitization

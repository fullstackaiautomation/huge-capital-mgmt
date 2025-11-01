# Huge Capital Dashboard - Project Instructions

## Project Overview
Huge Capital Dashboard is a comprehensive financial management and task tracking application designed to help manage lending operations, track daily tasks, and monitor KPIs. The dashboard includes features for managing different lending products, tracking daily checklists, monitoring KPI metrics, and generating weekly recaps.

---

## Important Guidelines

### Context Management
Always warn about the context remaining and before starting a new task make sure the left over context is enough for the task or not. If not ask the user to use compact.

### Documentation Requirements
- Update **progress.md** after every run
- Add bug reports to **bugs.md**
- Log every architectural decision in **decisions.md**

### Documentation Structure
We keep all important docs in .agent folder with the following structure:
- **Tasks**: PRD & implementation plan for each feature
- **System**: Current state of the system (project structure, tech stack, integration points, database schema, core functionalities)
- **SOP**: Best practices for executing certain tasks (e.g., how to add a schema migration, how to add a new page route)
- **README.md**: Index of all documentations

Always update .agent docs after implementing a feature to ensure they reflect up-to-date information. Before planning any implementation, read the .agent/README first to get context.

---

## Deployment & Git Workflow

### Push Settings
- Claude Code is configured to allow `git push -f` (force push) for deployment workflows
- Force push is used when resetting to clean commits before deployment
- Always verify the commit before using force push

### GitHub Actions
The project uses `deploy.yml` workflow (NOT "pages build and deployment"):
- Triggers on push to `master` branch
- Builds with: `npm run build -- --mode production`
- Deploys to GitHub Pages at https://hugecapital.fullstackaiautomation.com/
- Custom domain configured via `public/CNAME`

---

## Tech Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom utilities
- **Build Tool**: Vite
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect)
- **Version Control**: Git/GitHub
- **Deployment**: GitHub Pages / Vercel (via GitHub Actions)

---

## Development Commands

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npx eslint src/
```

### Supabase Commands
```bash
supabase status          # Check Supabase connection
npx supabase migration list
npx supabase db push    # Push migrations to database
```

---

## Project Architecture

### Directory Structure

**See `PROJECT_STRUCTURE.md` for complete folder organization guide**

```
huge-capital-mgmt/
├── .agent/                      # Agent documentation (Tasks, System, SOP)
├── .claude/                     # Claude Code configuration & commands
├── .github/                     # GitHub Actions & CI/CD
├── database/                    # Database files
│   ├── archive/                # Old SQL files
│   └── seed-data/              # Lender CSV data
├── docs/                        # Documentation
│   ├── archive/                # Old documentation
│   ├── planning/               # Planning files
│   └── [PRDs & specs]
├── scripts/                     # Utility and test scripts
│   ├── utilities/              # JavaScript helpers
│   └── test/                   # Test files
├── src/                        # Source code
│   ├── pages/                  # React page components
│   ├── components/             # Reusable components
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # Utilities (Supabase client)
├── supabase/                   # Supabase config
│   ├── migrations/             # Active database migrations
│   └── functions/              # Edge functions
├── public/                     # Static assets
├── CLAUDE.md                   # This file - Project instructions
├── PROJECT_STRUCTURE.md        # Detailed folder guide
├── CNAME                       # GitHub Pages config
└── [config files]              # Build & dev configs
```

**Key Files in `src/`**:
- `src/pages/DillonDaily.tsx` - Daily Dashboard with Checklist, KPI Tracker, Weekly Recap
- `src/components/Layout.tsx` - Main navigation layout
- `src/lib/supabase.ts` - Supabase client initialization

### Key Components
- **DillonDaily.tsx**: Main component for daily task management with three views:
  - Daily Checklist: Task tracking with collapsible categories
  - KPI Tracker: Performance metrics connected to checklist data
  - Weekly Recap: Form-based weekly summaries with Supabase persistence

### Database Schema
- **daily_checklist**: Tracks daily task completion status
  - Fields: id, task_id, title, category, monday-friday (boolean), week_number, user_id
- **weekly_recaps**: Stores weekly recap form submissions
  - Fields: id, week_number, category, whatWasDone, quantity, winsHighlights, issuesNotes, user_id

---

## Core Features

### 1. Daily Checklist
- **Collapsible Categories**: Tasks organized and filterable by category (Social & Content, Pipeline & Follow-ups, Referral Outreach, Ops & Reporting)
- **Weekly Grid Layout**: Visual representation of daily task completion across the week
- **Auto-Save**: Checkbox states automatically saved to Supabase
- **Category Icons**: Visual indicators for different task categories

### 2. KPI Tracker
- **Dynamic Metrics**: KPIs calculated from daily checklist completion data
- **Week Selection**: View metrics by individual weeks (Week 1-4) or aggregated "All Weeks" view
- **Visual Progress**: Cards showing current values vs targets with color-coded progress

### 3. Weekly Recap
- **Category-Based Forms**: Separate recap forms for each category
- **Structured Questions**: 4 questions per category (What was done, Quantity, Wins/Highlights, Issues/Notes)
- **Auto-Save**: Form data persisted to Supabase
- **Color-Coded Design**: Each category uses its own color for backgrounds and styling

### 4. Lenders Management
- Multiple lending product pages (Business Line of Credit, MCA, SBA)
- Searchable lender databases
- Comprehensive filtering capabilities

---

## Visual Consistency Rules

### Color Palette
- **Brand Primary**: `#6366f1` (Indigo) - Used for highlights, active states, and primary actions
- **Social & Content**: `#a855f7` (Purple) - Category identifier color
- **Pipeline & Follow-ups**: `#3b82f6` (Blue) - Category identifier color
- **Referral Outreach**: `#10b981` (Emerald) - Category identifier color
- **Ops & Reporting**: `#f59e0b` (Amber) - Category identifier color
- **Background**: `#111827` (Dark Gray) - Main background
- **Surface**: `#1f2937` (Darker Gray) - Card backgrounds
- **Text Primary**: `#f3f4f6` (Light Gray) - Main text
- **Text Secondary**: `#9ca3af` (Medium Gray) - Secondary text

### Typography
- **Headings**: `font-bold` with size based on hierarchy (text-2xl to text-4xl)
- **Body Text**: `text-sm` to `text-base` with `font-medium` for emphasis
- **Icons**:
  - Header icons: `w-10 h-10`
  - Button icons: `w-4 h-4`
  - Section icons: `w-5 h-5`

### Component Styling
- **Cards**: `bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30`
- **Buttons**: Responsive hover states with color transitions
- **Tables**: Alternating row colors (`bg-gray-900/20` on even rows)
- **Collapsible Sections**: Use `ChevronDown` (expanded) / `ChevronRight` (collapsed) icons
- **Category Backgrounds**: Full background colors matching category color palette
  - Example: Social & Content = `bg-purple-500/20 text-purple-400`

### Responsive Design
- Mobile-first approach using Tailwind CSS
- Flex layouts for adaptive sizing
- Grid layouts for tabular data
- Breakpoint usage: `lg:` for larger screens (typically 1024px+)

### Interactive Elements
- **Hover States**: Subtle background color changes (`hover:bg-gray-700/30`)
- **Active States**: Highlighted with brand color (`bg-brand-500/10 border-brand-500/20`)
- **Disabled States**: Reduced opacity and text color changes
- **Transitions**: Smooth transitions on color changes (`transition-all` or `transition-colors`)

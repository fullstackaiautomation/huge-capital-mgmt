# Architectural Decisions Log

## Decision Log

### 1. Dillon's Daily Dashboard Component Structure (October 26, 2025)
**Decision**: Create a single, feature-rich component `DillonDaily.tsx` with three distinct views
**Rationale**:
- Allows for shared state and data across Daily Checklist, KPI Tracker, and Weekly Recap views
- Simplifies data persistence - single component can manage all Supabase operations
- Easier to maintain consistency across views (week selection, filters, etc.)
**Alternatives Considered**:
- Separate components for each view (more modular but harder to share state)
- Custom hook to manage all logic (could work but component is more self-contained)
**Status**: ✅ Implemented and working

### 2. Supabase Tables for Persistence (October 26, 2025)
**Decision**: Create two separate tables: `weekly_recaps` and `daily_checklist`
**Rationale**:
- Separation of concerns - different data structures for different purposes
- Easier to query and update specific data
- Follows database normalization principles
**Alternatives Considered**:
- Single table with flexible JSON fields (would be harder to query)
- In-memory state only (no persistence)
**Status**: ✅ Implemented with migrations

### 3. Category Colors and Styling (October 26, 2025)
**Decision**: Use full background colors for category cards in Weekly Recap forms
**Rationale**:
- Improves visual hierarchy and readability
- Makes categories instantly recognizable
- Better contrast for accessibility
**Status**: ✅ Implemented

### 4. Week Selection Strategy (October 26, 2025)
**Decision**: Fixed weeks (Week 1-4) with "All Weeks" aggregate view
**Rationale**:
- Provides consistent structure for recurring activities
- "All Weeks" multiplies daily values by 4 to show accumulated metrics
- Simpler UX than custom date ranges
**Status**: ✅ Implemented

### 5. Project Folder Organization (October 26, 2025)
**Decision**: Restructure project folders for clarity and maintainability
**Rationale**:
- Root directory had 50+ files making it cluttered and hard to navigate
- Different file types (scripts, data, docs, migrations) were scattered
- Needed clear structure for future agents to understand organization
- Differentiate between active (migrations, code) and archived files
**Changes Made**:
- Created `/database/archive/` for old SQL files
- Created `/database/seed-data/` for imported CSV lender data
- Created `/docs/archive/` for outdated documentation
- Created `/docs/planning/` for planning materials
- Created `/scripts/utilities/` for JavaScript helpers
- Created `/scripts/test/` for test files
- Fixed `.claude/.claude/` nesting issue
- Removed redundant documentation files
**Alternatives Considered**:
- Flat structure (simpler but harder to navigate as project grows)
- More deeply nested structure (would be harder to find files quickly)
**Status**: ✅ Implemented - See PROJECT_STRUCTURE.md for details

### 6. Funded Deals Table Rendering Refactor (October 26, 2025)
**Decision**: Use IIFE (Immediately Invoked Function Expression) to handle filtered table rendering and summary row calculation within the table body
**Rationale**:
- Need to render both filtered deal rows AND a summary row with totals
- Filtering logic is complex and should be calculated once, not on every render
- IIFE allows calculation and rendering to be closely coupled within `<tbody>`
- Properly nests JSX structure within table element hierarchy
**Technical Details**:
- IIFE filters deals array based on broker, deal type, funding partner, and time period
- Calculates totals and percentages within IIFE scope
- Returns fragment containing mapped rows + summary row
- Summary row displays totals for: Funded Amount, Commission, Average Commission %
**Alternatives Considered**:
- Move filtering logic to a custom hook (adds complexity, harder to test individual calculations)
- Use render props pattern (overkill for this use case)
- Pre-calculate filtered data at component level (loses calculation context for summary row)
**Status**: ✅ Implemented - Properly nested within `<tbody>` element (commit `ec36154`)

## Decision Template
Use this template when logging new decisions:

```
### Decision Title (DATE)
**Decision**:
**Rationale**:
**Alternatives Considered**:
**Status**: (In Progress/Implemented/Deprecated)
```

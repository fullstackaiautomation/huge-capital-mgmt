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

### 7. Agent Run Logging & QA Workflow (November 12, 2025)
**Decision**: Persist every agent invocation (document parsing, lender matching, submission prep) to a dedicated `agent_run_logs` table with UI tooling for review/flagging
**Rationale**:
- Creates a durable audit trail of inputs/outputs to diagnose extraction/matching defects reported by brokers
- Centralizes confidence data, durations, and error messages for faster debugging and model fine-tuning
- Returning log IDs to the UI ties modal workflows to the QA dashboard for quick cross-navigation
- Flagging metadata (reason, reviewer, timestamp) guides iteration priorities without leaving the app
**Alternatives Considered**:
- Continue relying on console logs/Supabase function logs (not user-accessible, no structured flagging)
- Push logs to an external observability service (adds latency and external dependencies)
- Store only error cases (would miss silent failures and success baselines needed for evaluation)
**Status**: ✅ Implemented via migration `20251112071503`, edge function instrumentation, and new `/agent-logs` page

### 8. Google Drive Document Storage & PDF Extraction (November 13, 2025)
**Decision**: Store uploaded deal documents in Google Drive using a service-account authenticated edge function, extract PDF text via OpenAI Responses API, and persist the Drive folder metadata on each deal.
**Rationale**:
- Supabase storage limits and parsing constraints required an external document repository with shareable links.
- Drive subfolders named with deal dates/business names provide human-readable organization for brokers.
- Extracting PDF text upstream ensures downstream parsing receives consistent plain text regardless of file type.
- Persisting `documentsFolder` metadata enables the UI to surface quick links on the review modal, success view, and detail page.
**Alternatives Considered**:
- Persist PDFs directly in Supabase storage (insufficient quota, lacks Google Docs collaboration features).
- Rely on manual PDF-to-text conversion (error-prone and prevents automation).
- Skip text extraction for PDFs (would leave statements unparsed, blocking automated lender matching).
**Status**: ✅ Implemented; requires Supabase secrets `GOOGLE_SERVICE_ACCOUNT_JSON` and `GOOGLE_DRIVE_PARENT_FOLDER_ID`, with edge function redeployed after secret rotation.

### 9. Separate Upload Zones for Application & Bank Statements (November 13, 2025)
**Decision**: Split the document upload UI into two distinct zones - one for application documents (left) and one for bank statements (right) - with category metadata passed through to the edge function.
**Rationale**:
- AI parsing accuracy improves when it knows which documents are applications vs bank statements.
- Users benefit from clear visual guidance about what to upload where.
- Category metadata enables future features like separate storage locations or processing pipelines.
- Reduces broker confusion and improves data quality at the source.
**Technical Implementation**:
- `DocumentUpload.tsx` maintains separate state arrays (`applicationFiles`, `statementFiles`)
- Each file object includes `category: 'application' | 'statements'` metadata
- Parent component receives combined array with categories preserved
- Edge function logs and processes files with full category context
**Alternatives Considered**:
- Single upload zone with manual category selection (more clicks, error-prone)
- Automatic file type detection (unreliable - can't distinguish application PDF from statement PDF)
- Post-upload categorization (loses opportunity to guide user during upload)
**Status**: ✅ Implemented

### 10. React State Synchronization Pattern for Multi-Zone File Upload (November 13, 2025)
**Decision**: Pass computed file arrays directly to parent callbacks instead of relying on `setTimeout()` with React state reads.
**Problem**: When using `setTimeout(() => notifyParent(), 0)` after state updates, the callback was reading stale state values because React state updates are asynchronous. This caused only the most recently added files to be sent to the parent, not all files from both upload zones.
**Solution**:
- Calculate updated file arrays immediately within `handleAddFiles()` and `removeFile()` functions
- Pass the computed arrays directly to `onFilesReady()` callback without waiting for state
- State is still updated for UI rendering, but parent receives accurate data immediately
**Code Pattern**:
```typescript
let updatedAppFiles = applicationFiles;
let updatedStmtFiles = statementFiles;

if (category === 'application') {
  updatedAppFiles = [...currentFiles, ...uploadedFiles];
  setApplicationFiles(updatedAppFiles);
} else {
  updatedStmtFiles = [...currentFiles, ...uploadedFiles];
  setStatementFiles(updatedStmtFiles);
}

const allFiles = [
  ...updatedAppFiles.map(f => ({ file: f.file, category: 'application' })),
  ...updatedStmtFiles.map(f => ({ file: f.file, category: 'statements' })),
];
onFilesReady(allFiles);
```
**Impact**: Fixed critical bug where bank statement PDFs were not being uploaded to Google Drive
**Alternatives Considered**:
- Use `useEffect` to watch state changes (adds complexity, still async)
- Lift state to parent component (loses encapsulation)
- Use refs instead of state (works but harder to understand)
**Status**: ✅ Implemented in `DocumentUpload.tsx`

## Decision Template
Use this template when logging new decisions:

```
### Decision Title (DATE)
**Decision**:
**Rationale**:
**Alternatives Considered**:
**Status**: (In Progress/Implemented/Deprecated)
```

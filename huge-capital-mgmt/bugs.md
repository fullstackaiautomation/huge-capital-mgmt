# Bug Reports

## Active Bugs
None currently reported.

## Recently Fixed Bugs

### Bank Statement Parsing 504 Timeout Error (November 13, 2025)
- **Date Reported**: 2025-11-13
- **Date Fixed**: 2025-11-13
- **Severity**: Critical
- **Component**: `supabase/functions/parse-bank-statements/index.ts`
- **Description**: Edge function timeout (504 error) when parsing bank statement PDFs - execution exceeded Supabase's 150-second hard limit
- **Root Cause**: Sequential file processing in a for-loop caused cumulative processing time to exceed timeout limits
  - 3 PDFs × 60 seconds each = 180 seconds sequential processing > 150 second hard limit
  - Each file waited for previous file to complete before starting
  - No parallelization or timeout protection
- **Steps to Reproduce**:
  1. Upload deal with 3 bank statement PDFs (~200KB each)
  2. Submit deal
  3. Watch "Analyze bank statements" step
  4. After 150 seconds, see 504 timeout error
  5. Check Supabase logs: execution_time_ms: 150137 with 504 response
- **Expected Behavior**: Bank statements should parse within 150 second limit and extract financial data
- **Actual Behavior**: Edge function timed out at 150 seconds, returning 504 error and blocking deal submission
- **Error Details from Logs**:
  ```json
  {
    "execution_time_ms": 150137,
    "status_code": 504,
    "event_message": "POST | 504 | /functions/v1/parse-bank-statements"
  }
  ```
- **Resolution**:
  1. **Implemented Parallel Processing**: Changed from sequential `for` loop to `Promise.all()` with parallel execution
     - All files now process simultaneously instead of one-at-a-time
     - Processing time reduced from 180s sequential to ~30s parallel
  2. **Optimized Timeouts**:
     - Reduced `REQUEST_TIMEOUT_MS` from 60s → 30s for faster failure detection
     - Reduced `TIME_BUDGET_MS` from 120s → 100s to stay well under 150s hard limit
  3. **Reduced AI Token Usage**: Lowered Anthropic Haiku `max_tokens` from 1500 → 800 for faster responses
  4. **Enhanced Error Handling**:
     - Added per-file try-catch to prevent one bad file from blocking others
     - Implemented `Promise.race()` with timeout protection
     - Added graceful degradation via `Promise.allSettled()` for partial results
- **Code Pattern Change**:
  ```typescript
  // BEFORE (sequential - timed out):
  for (const file of files) {
    const result = await analyzeBankDocument(...); // 60s × 3 = 180s total
    aggregatedResult.statements.push(...result.statements);
  }

  // AFTER (parallel - completes in ~30s):
  const filePromises = files.map(async (file) => {
    return await analyzeBankDocument(...); // All 3 files process simultaneously
  });
  const results = await Promise.race([
    Promise.all(filePromises),
    timeoutPromise // 100s budget
  ]);
  ```
- **Performance Impact**:
  - Before: 150+ seconds (timeout) for 3 files ❌
  - After: ~30-40 seconds for 3 files ✅
  - Improvement: 75% faster processing time
- **Files Modified**:
  - `supabase/functions/parse-bank-statements/index.ts` (lines 61-62, 215, 513-583)
- **Testing**:
  - ✅ Deployed edge function with parallel processing
  - ✅ Successfully processed 3 bank statement PDFs (July, August, September)
  - ✅ All financial data extracted and saved to database
  - ✅ Complete end-to-end deal submission workflow working
- **Status**: ✅ Fixed and deployed to production

### Bank Statement PDFs Not Uploading to Google Drive (November 13, 2025)
- **Date Reported**: 2025-11-13
- **Date Fixed**: 2025-11-13
- **Severity**: Critical
- **Component**: `src/components/Deals/DocumentUpload.tsx`, `supabase/functions/parse-deal-documents/index.ts`
- **Description**: Bank statement PDFs were not being uploaded to Google Drive, only application images were uploading
- **Root Cause**: React state timing issue in `DocumentUpload.tsx` - the component was calling `notifyParent()` with `setTimeout(..., 0)` before React state updates completed, causing only the most recently added files to be sent to the parent instead of all files from both upload zones
- **Steps to Reproduce**:
  1. Upload application file in left zone
  2. Upload bank statement PDF in right zone
  3. Submit deal
  4. Check Google Drive folder - only application file present
- **Expected Behavior**: All files from both upload zones should be uploaded to Google Drive
- **Actual Behavior**: Only files from the last upload action were being sent to edge function
- **Resolution**:
  1. Fixed `handleAddFiles()` and `removeFile()` in DocumentUpload.tsx to pass updated file arrays directly to `onFilesReady()` instead of relying on async state updates
  2. Added comprehensive logging to edge function to track file processing and uploads
  3. Changed from `setTimeout(() => notifyParent(), 0)` pattern to immediate callback with computed file lists
- **Files Modified**:
  - `src/components/Deals/DocumentUpload.tsx` (lines 88-105, 107-125)
  - `supabase/functions/parse-deal-documents/index.ts` (added debug logging)
- **Testing**: Deployed with SKIP_PARSING mode to isolate upload functionality from AI parsing, confirmed all files uploading successfully
- **Status**: ✅ Fixed

## Critical Post-Mortem: 10-Hour GitHub Pages Deployment Failure (November 1, 2025)

### What Happened
Deployment failed for 10+ hours due to GitHub Actions workflow running in wrong directory.

### Root Cause
- Repository structure has project nested in `Huge Capital Dashboard/huge-capital-mgmt/` subdirectory
- GitHub Actions workflow ran at repo root where NO package.json/package-lock.json exists
- `npm ci` failed immediately looking for package-lock.json in wrong location
- Error message was clear but was not properly diagnosed for hours

### What Was Tried (All Failed)
1. ❌ Switching between master/main branches (not the issue)
2. ❌ Fixing CNAME configuration (not the issue)
3. ❌ Adding .nojekyll file (not the issue)
4. ❌ Changing workflow trigger branches (not the issue)
5. ❌ Manually setting GitHub secrets (needed but not the core issue)
6. ❌ Trying to disable Jekyll workflow (not the issue)
7. ❌ Attempting to change GitHub Pages settings via code (impossible without auth)

### Actual Solution (Fixed by Codex in 5 minutes)
Updated `.github/workflows/deploy.yml` to:
- Set working directory to `Huge Capital Dashboard/huge-capital-mgmt/`
- Point npm cache to correct subdirectory's package-lock.json
- Run all build commands from correct location
- Upload dist from correct path

### Lessons Learned
1. **Check directory structure FIRST** when npm commands fail in CI/CD
2. **Read error messages carefully** - "Dependencies lock file not found" = wrong directory
3. Repository nesting is unusual and breaks default workflow assumptions
4. Don't waste hours trying complex solutions when error message points to simple issue

### Prevention
- CLAUDE.md now documents critical subdirectory requirement
- Future deployments must verify working directory before troubleshooting other issues

## Fixed Bugs

### JSX Structure Error in Funded Deals Table (October 26, 2025)
- **Issue**: "Unterminated JSX contents" error at line 720, preventing build
- **Severity**: Critical
- **Component**: `src/pages/FundingDashboard.tsx`
- **Root Cause**: IIFE containing filtered deals rendering was placed outside `<tbody>` element
- **Resolution**: Moved IIFE inside `<tbody>` to properly nest JSX structure
- **Status**: ✅ Fixed (commit `ec36154`)

### Unused Legend Import from Recharts (October 26, 2025)
- **Issue**: TypeScript warning - 'Legend' is declared but its value is never read (line 4)
- **Severity**: Medium
- **Component**: `src/pages/FundingDashboard.tsx`
- **Root Cause**: Custom broker color legend replaced the Recharts Legend component, but import statement remained
- **Resolution**: Removed `Legend` from recharts import statement
- **Status**: ✅ Fixed (commit `ec36154`)

### Build Issues from DillonDaily (October 26, 2025)
- **Issue**: TypeScript errors preventing build
- **Root Cause**: Unused imports, types, state variables, and functions left in DillonDaily.tsx
- **Resolution**: Removed all unused declarations
- **Status**: ✅ Fixed and deployed

## Known Limitations
None currently documented.

## Bug Report Template
Use this template when adding new bugs:

```
### Bug Title
- **Date Reported**: YYYY-MM-DD
- **Severity**: (Critical/High/Medium/Low)
- **Component**:
- **Description**:
- **Steps to Reproduce**:
- **Expected Behavior**:
- **Actual Behavior**:
- **Status**: (Open/In Progress/Fixed/Won't Fix)
```

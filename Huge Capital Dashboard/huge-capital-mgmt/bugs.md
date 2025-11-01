# Bug Reports

## Active Bugs
None currently reported.

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

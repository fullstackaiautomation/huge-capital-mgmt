# Bug Reports

## Active Bugs
None currently reported.

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

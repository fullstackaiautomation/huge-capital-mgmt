# User Story: Funding Dashboard - Cleanup & Styling

**Epic**: Dashboard UI/UX Cleanup & Standardization
**Status**: Ready for Implementation
**Priority**: High
**Page**: `src/pages/FundingDashboard.tsx`

---

## Story Description

Clean up the Funding Dashboard page to improve data display, add enhanced filtering capabilities, and standardize the presentation of deal types and funded deal logs.

---

## Required Changes

### 1. Deal Types Display - Clean Imported Prefixes

**Location**: Top Deal Types section (cards/metrics area)

**Problem**: Deal type names are importing from GHL with prefix letters (E., C., D., I., B.) that shouldn't be displayed

**Solution**:
- Strip all prefix letters and numbering from deal type display names
- Display clean names only:
  - "SBA 7A" (not "E. SBA 7A" or "1. SBA 7A")
  - "MCA" (not "C. MCA")
  - "Business Credit" (not "D. Business Credit")
  - "Equipment Financing" (not "B. Equipment Financing")

**Implementation Notes**:
- Create a utility function to clean deal type strings on display
- Remove pattern: `^[A-Z]\.\s*` and `^\d+\.\s*` from beginning of strings
- Apply this cleaning wherever deal types are displayed on the page

---

### 2. Funding by Date Graph - Convert to Stacked Bar Chart

**Location**: Main graph/chart component showing funding over time

**Current State**: [Current chart type - line/bar/etc.]

**New Requirements**:
- **Chart Type**: Stacked bar graph
- **Data Segmentation**: Each broker/rep gets their own color segment in each bar
- **Color Scheme**: Use consistent broker colors (Zac & Luke colors used elsewhere in dashboard)
- **Stacking Logic**: Each date's bar shows total funding, broken down by broker contribution

**Color Assignment**:
- Use the same color scheme already established for Zac & Luke across the dashboard
- Maintain color consistency with other dashboard visualizations
- Ensure sufficient color contrast for accessibility

---

### 3. Enhanced Filtering System

**Location**: Filter controls above the Funding by Date graph

**Current Filters**: Date range only

**New Filter Set** (3 filters total):
1. **Broker** - Filter by sales rep/broker name
2. **Deal Type** - Filter by type of financing deal
3. **Funding Partner** - Filter by which lender/partner funded

**Filter Behavior**:
- Filters apply ONLY to the "Funding by Date" graph
- Top cards/metrics remain unchanged (they show all-time data)
- All filters can be used independently or in combination
- Include "All" or "Clear" option for each filter

**UI Requirements**:
- Filters should be clearly labeled
- Dropdown or multi-select format (depending on # of options)
- Position logically near the graph they control

---

### 4. Funded Deal Logs Table - Restructure & Clean

**Location**: Table at bottom of page showing individual funded deals

#### A. Remove Column
- **Delete**: "Percent of Requested Funded" column entirely

#### B. Reorder Columns (New Order)
1. **Broker** (moved to first position)
2. Date Funded
3. Funded Amount
4. Commission
5. Commission Percent
6. Business Name
7. Funding Partner
8. Deal Type

**Rationale**: Broker is the primary grouping/sorting field, should be first

#### C. Clean Deal Type Values
- Apply the same deal type cleaning from Change #1
- Remove prefix letters (C.D., B., E., etc.) from deal type column
- Display clean deal type names only

#### D. Column Sizing
- **Ensure all columns have adequate width** to display their content without truncation
- Particularly important for:
  - Business Name (likely longest text)
  - Funding Partner (company names can be long)
  - Deal Type (some types have longer names)
- Use responsive column widths or horizontal scroll if needed

---

## Visual Goals

- **Clean data presentation**: No cryptic prefixes or codes visible to user
- **Enhanced insights**: Stacked bar graph shows broker performance at a glance
- **Flexible analysis**: Filters enable drilling into specific scenarios
- **Logical table layout**: Broker-first ordering makes sense for commission tracking
- **Professional polish**: Proper spacing, no truncated text

---

## Technical Implementation Notes

### Deal Type Cleaning Function
```typescript
// Utility function to clean deal type display names
function cleanDealType(dealType: string): string {
  // Remove patterns like "E. ", "C.D. ", "1. ", etc.
  return dealType
    .replace(/^[A-Z]\.\s*/g, '')
    .replace(/^\d+\.\s*/g, '')
    .trim();
}
```

### Stacked Bar Chart
- Consider using Recharts `<BarChart>` with `<Bar>` components for each broker
- Set `stackId="funding"` on all Bar components to create stacking
- Use `dataKey` for each broker's funding amount

### Filters
- Create controlled state for each filter (broker, dealType, fundingPartner)
- Filter the dataset before passing to chart
- Top metrics query original unfiltered data

### Table Column Reordering
- Update table header array/object
- Update data mapping to match new column order
- Apply cleanDealType() to deal type cell values

---

## Acceptance Criteria

- [ ] All deal type displays show clean names without E., C., D., I., B. prefixes
- [ ] All deal type displays show clean names without number prefixes (1., 2., etc.)
- [ ] Funding by Date chart is a stacked bar graph
- [ ] Each broker has consistent color in stacked bars matching dashboard color scheme
- [ ] Three filters present: Broker, Deal Type, Funding Partner
- [ ] Filters affect only the graph, not top metrics
- [ ] Filters work independently and in combination
- [ ] "Percent of Requested Funded" column removed from table
- [ ] Table columns in correct new order (Broker first)
- [ ] Deal types in table are cleaned (no prefixes)
- [ ] All table columns display full content without truncation
- [ ] No visual regressions or broken layouts
- [ ] Page remains responsive on different screen sizes

---

## Testing Checklist

### Data Display
- [ ] Verify deal type names are clean in Top Deal Types section
- [ ] Verify deal type names are clean in table Deal Type column
- [ ] Confirm no E., C., D., I., B. prefixes anywhere
- [ ] Confirm no number prefixes (1., 2., etc.) anywhere

### Chart Functionality
- [ ] Stacked bar graph renders correctly
- [ ] Each broker has distinct color
- [ ] Colors match those used elsewhere for Zac & Luke
- [ ] Bars stack properly (totals are correct)
- [ ] Chart is readable and accessible

### Filters
- [ ] Broker filter shows all brokers and filters correctly
- [ ] Deal Type filter shows all deal types and filters correctly
- [ ] Funding Partner filter shows all partners and filters correctly
- [ ] Filters can be cleared/reset
- [ ] Combined filters work as expected (e.g., Broker + Deal Type)
- [ ] Top cards remain unchanged when filters are applied

### Table
- [ ] "Percent of Requested Funded" column is gone
- [ ] Broker column is first
- [ ] All columns appear in specified order
- [ ] No text truncation in any column
- [ ] Table remains sortable (if previously sortable)
- [ ] Table scrolls horizontally if needed on small screens

### Edge Cases
- [ ] Empty filter states handled gracefully
- [ ] Deal types with unusual formatting are cleaned properly
- [ ] Long business names don't break layout
- [ ] Chart handles single broker data
- [ ] Chart handles single day data

---

## Files to Modify

- `src/pages/FundingDashboard.tsx` - Main component
- Potentially `src/lib/` or `src/utils/` - Add cleanDealType utility function
- Potentially `src/components/` - If chart/filter components are separate

---

## Dependencies

- Recharts library (or whatever charting library is currently in use)
- Existing data fetching hooks/queries
- Existing broker color definitions from dashboard

---

## Estimated Effort

**Medium** - Multiple coordinated changes across chart, filters, and table components

---

## Notes

- Deal type prefixes are an artifact of GHL import process, not intentional
- Zac & Luke broker colors already established elsewhere in dashboard
- Filters scope is intentionally limited to graph only - metrics stay global
- Column reordering puts broker first for better commission tracking workflow

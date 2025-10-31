# Lenders Page Implementation Guide

## Overview
Complete redesign of the Lenders page for Business Line of Credit (BLC), with plans to replicate for MCA and SBA lender types. Includes drag-and-drop reordering, expandable details, clickable email copying, hyperlinked documents, and portal access.

---

## Table Column Configuration

### Current Width Settings (w-xx in Tailwind)
| Column | Width | Alignment | Purpose |
|--------|-------|-----------|---------|
| Drag | w-8 | center | Drag handle for reordering |
| Lender Name | w-44 | left | Company name |
| ISO Rep | w-44 | left | Contact person + phone |
| ISO Email | w-40 | left | Clickable email (copies to clipboard) |
| Credit Min | w-20 | center | Credit score requirement |
| Revenue Min | w-20 | center | Monthly revenue requirement |
| ADB Min | w-20 | center | Average daily balance (two-line header) |
| Restricted Industries | w-56 | left | Industries list with hyperlinked words |
| State Restriction | w-24 | center | Restricted states |
| Submission Type | w-32 | center | "Email" or "Online Portal" |

**Total: 10 columns**

---

## Interactive Features

### 1. Drag-and-Drop (GripVertical Icon)
- **Library**: @dnd-kit (core, sortable, utilities)
- **Implementation**: SortableContext + useSortable hook
- **Current State**: Saves to local state only
- **Future**: Need database persistence with `display_order` column

### 2. Expandable Row Details (ChevronDown/ChevronRight)
- Click toggle to expand/collapse detailed information
- Full-width row displays 4-column grid layout
- Appears below main table row
- **Code location**: SortableLenderRow component

### 3. ISO Email - Copy to Clipboard
- Click email address → copies to clipboard
- Shows "Copied!" in green for 2 seconds
- Uses `navigator.clipboard.writeText()`
- State tracking: `copiedEmail` state variable

### 4. Submission Type - Smart Display
**For "Email":**
- Clickable button
- Clicking copies all submission emails as comma-separated list
- Formatting applied:
  - Remove "Email:" prefix
  - Remove "CC" prefix from emails
  - Split on commas, plus signs, and "and"
  - Join with comma-space separator

**For "Online Portal":**
- Hyperlinked text
- Opens `portal_url` field in new tab
- Fallback to `google_drive` if portal_url not set

---

## Expandable Details - 4-Column Grid Layout

### Column 1: Lender Info (Blue #3b82f6)
**Fields (top to bottom):**
1. Lender Type
2. Bank / Non Bank
3. Products Offered
4. Preferred Industries (hyperlinked to `preferred_industries_doc_link`)
5. Restricted Industries (hyperlinked "Full List" text)
6. Links (Website + Drive on same row with gap-4)

**Styling:**
```jsx
<div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
  <div className="text-blue-400 font-semibold text-xs uppercase mb-4 pb-3 border-b border-gray-700/30">
    Lender Info
  </div>
```

### Column 2: Requirements (Purple #a855f7)
**Fields in this order:**
1. Credit Requirement & Used
2. Min Monthly Revenue
3. Min Avg Daily Balance
4. Min Time in Business
5. Min Deposit Count

### Column 3: Terms (Green #10b981)
**Fields in this order:**
1. Terms
2. Payments
3. Draw Fees
4. Max Loan
5. Positions

### Column 4: Submissions (Orange #f59e0b)
**Fields:**
1. Submission Type
2. Portal URL (conditional - only shows if `submission_type === 'Online Portal'`)
3. Submission Docs (split by commas/plus/and - one per line)
4. Emails (split by commas/plus - one per line, "Email:" prefix removed)

---

## Database Schema Changes

### New Columns Added to lenders_business_line_of_credit
```sql
ALTER TABLE lenders_business_line_of_credit
ADD COLUMN IF NOT EXISTS portal_url TEXT;

ALTER TABLE lenders_business_line_of_credit
ADD COLUMN IF NOT EXISTS preferred_industries_doc_link TEXT;

ALTER TABLE lenders_business_line_of_credit
ADD COLUMN IF NOT EXISTS restricted_industries_doc_link TEXT;
```

### Migrations Created
- `20251101000000_update_lender_website_links.sql` - Updated website and drive_link fields
- `20251101000001_add_portal_url_and_update_portals.sql` - Added portal_url column and updated 3 lenders
- `20251101000002_add_preferred_industries_doc_link.sql` - Added preferred_industries_doc_link column
- `20251101000003_add_restricted_industries_doc_link.sql` - Added restricted_industries_doc_link column

---

## Data Currently Populated

### Website & Drive Links (6 Lenders)
- ARF Financial (Big Deals)
- ARF Financial (Sub 50K)
- SmartBiz
- Plexe
- Idea
- Rapid

### Online Portal URLs (3 Lenders)
| Lender | URL |
|--------|-----|
| SmartBiz | https://smartbizbank.com/assist/session/new |
| Plexe | https://portal.plexe.co/login |
| Idea | https://www.ideafinancial.com/partners |

### Preferred Industries Doc Links (3 Lenders)
- ARF Financial (Big Deals)
- ARF Financial (Sub 50K)
- Plexe

### Restricted Industries Doc Links (5 Lenders)
- ARF Financial (Big Deals)
- ARF Financial (Sub 50K)
- Plexe
- Idea
- Rapid

---

## Code Implementation Details

### Key Component: SortableLenderRow
**Location**: `src/pages/Lenders.tsx`

**Key State Variables:**
- `isExpanded` - Controls row detail visibility
- `copiedEmail` - Tracks which email was copied for visual feedback

**Key Functions:**
- `handleCopyEmail(email)` - Copies email and sets feedback state

**Data Variables:**
- `rawData` - Full lender data object from Supabase
- `isoPhone` - Extracted from rawData or ISO rep field
- `minMonthlyRevenue` - Handles different field names across lender types
- `adbMin` - Maps various field names
- `stateRestrictions` - State restriction data
- `submissionEmail` - Email from rawData or lender object

### Restricted Industries Text Handling
The table cell intelligently displays:
1. **If "Industry List" in text**: Shows rest of text + "Industry List" hyperlinked
2. **If "Full List" in text**: Shows rest of text + "Full List" hyperlinked
3. **Otherwise**: Shows full text as-is (no hyperlink)

```jsx
{lender.restricted_industries.includes('Industry List') ? (
  <>
    {lender.restricted_industries.replace(/Industry List/g, '')}
    <a href={...}>Industry List</a>
  </>
) : lender.restricted_industries.includes('Full List') ? (
  <>
    {lender.restricted_industries.replace(/Full List/g, '')}
    <a href={...}>Full List</a>
  </>
) : (
  lender.restricted_industries
)}
```

### Email Formatting Function
Used in both ISO Email column and Submission Type Email button:

```javascript
const emailText = rawData.submission_process
  .replace(/^Email:\s*/i, '')                    // Remove "Email:" prefix
  .split(/,\s*|\+\s*|\s+and\s+/i)              // Split on delimiters
  .map((email: string) => email.trim().replace(/^CC\s+/i, ''))  // Remove "CC" prefix
  .filter((email: string) => email)              // Remove empty strings
  .join(', ');                                   // Join with comma-space
```

---

## Implementation for MCA & SBA

### MCA Implementation Status: ✅ COMPLETED (2025-10-31)

#### Database Schema
Migration created: `20251101000004_add_doc_links_to_mca.sql`
- ✅ Added `portal_url` TEXT
- ✅ Added `preferred_industries_doc_link` TEXT
- ✅ Added `restricted_industries_doc_link` TEXT

#### Type Definitions Updated
- ✅ Updated `McaLender` interface with 3 new fields
- ✅ Updated `McaLenderFormData` interface with 3 new fields
- Location: `src/types/lenders/mca.ts`

#### UI Implementation
- ✅ Added MCA-specific 4-column expandable details layout in `SortableLenderRow`
- ✅ Conditional rendering: `lender.lender_type === 'MCA' ? ...`
- ✅ Uses `google_drive` instead of `drive_link` (MCA field name)

#### MCA Field Mappings Used

**Lender Info Column (Blue):**
- Lender Type
- Paper (MCA-specific field)
- Products Offered
- Preferred Industries (with hyperlinked doc if `preferred_industries_doc_link` exists)
- Restricted Industries (with hyperlinked "Full List" if `restricted_industries_doc_link` exists)
- Links: Website + Google Drive

**Requirements Column (Purple):**
- Credit Requirement (mapped from `minimum_credit_requirement`)
- Min Monthly Revenue (mapped from `minimum_monthly_revenue`)
- Min Daily Balance (mapped from `minimum_daily_balances`)
- Min Time in Business (mapped from `minimum_time_in_business`)
- Max NSF Days (mapped from `max_nsf_negative_days`)

**Terms Column (Green):**
- Terms
- Positions
- Buyouts
- Min Loan (mapped from `minimum_loan_amount`)
- Max Loan (mapped from `max_loan_amount`)

**Submissions Column (Orange):**
- Submission Type
- Portal URL (only shows if `submission_type === 'Online Portal'` and `portal_url` exists)
- Submission Docs (split by commas, plus signs, "and")
- Emails (from `submission_process`, cleaned of "Email:" prefix and "CC" prefix)

#### MCA Data Populated

**Migration: `20251101000005_populate_mca_portal_urls.sql` - Portal URLs**
| Lender | Portal URL |
|--------|-----------|
| Credibly | https://portal.credibly.com/# |
| Rapid | https://login.rapidfinance.com/Account/Login?ticket=e5c73ceaeb8d4dc985acafee7911b1fc&userType=Partner |

**Migration: `20251101000006_populate_mca_website_and_drive_links.sql` - Website & Drive Links (Initial 5)**
| Lender | Website | Drive |
|--------|---------|-------|
| Credibly | https://www.credibly.com/ | https://drive.google.com/drive/folders/1M89s6eSRheha_O1VOvNPXc4oAnvbB7FJ |
| Rapid | https://www.rapidfinance.com/ | https://drive.google.com/drive/folders/1XZSuXzQIWzzHolZY8XmPieiS7HNXljFL |
| Fundworks | https://thefundworks.com/ | https://drive.google.com/drive/folders/1MVK1-4ZcxYrCgdfpXuuHrSJBzQnUEtB9 |
| TMRnow | https://tmrnow.com/ | https://drive.google.com/drive/folders/1RjZY6TuP_aN7izsQxjCntDQ5q0qgjgSs?usp=drive_link |
| TVT Capital | https://tvt-capital.com/ | https://drive.google.com/drive/folders/1TnGGsuXqB97NE1lL9wJ8oBayg36KguO2 |

**Migration: `20251101000007_populate_additional_mca_links.sql` - Website & Drive Links (Additional 7)**
| Lender | Website | Drive |
|--------|---------|-------|
| Fintegra | https://getfintegra.com/ | https://drive.google.com/drive/folders/1xE3W6ngg8X2fqKXrBUgN15ZpNjVE2aDI |
| Fresh Funding | http://gofreshfunding.com/ | https://drive.google.com/drive/folders/1DOV5wbLF-VQ0HaOQcHduTKnH5NzUEoHG |
| Fintap | https://www.fintap.com/ | https://drive.google.com/drive/folders/1s_VNKIcZgHGxhOD2vaK-p6ezkFML64jS |
| Legend Advance | https://legendadvancefunding.com/ | https://drive.google.com/drive/folders/1oHLgjPmZOQmWnsjJUDXjFMJ4tJl8_m04 |
| Mantis | https://mantisfunding.com/ | https://drive.google.com/drive/folders/1AnKnaygR4gxWIkR7Ec8ae9QL-5pQB89I |
| Emmy Capital | https://emmycapitalgroup.com/ | https://drive.google.com/drive/folders/1MHEMLbeiwt09FSihXt2QZRwi3-Nwy5zw |
| Kalamata | https://www.kalamatacapitalgroup.com/ | https://drive.google.com/drive/folders/1jlHhe0b7_Bk1FnACRiqIdig7GJLwhgXO |

**Migration: `20251101000008_populate_mca_restricted_industries_links.sql` - Restricted Industries Doc Links**
| Lender | Restricted Industries Link |
|--------|---------------------------|
| Credibly | https://drive.google.com/drive/folders/1M89s6eSRheha_O1VOvNPXc4oAnvbB7FJ?usp=drive_link |
| Rapid | https://drive.google.com/file/d/1EEmFuZFY7Q0sdPcWSyGjnOcMbwqUodma/view |
| TMRnow | https://drive.google.com/drive/folders/1RjZY6TuP_aN7izsQxjCntDQ5q0qgjgSs |
| Fintegra | https://drive.google.com/drive/folders/1xE3W6ngg8X2fqKXrBUgN15ZpNjVE2aDI |
| Fresh Funding | https://drive.google.com/drive/folders/1DOV5wbLF-VQ0HaOQcHduTKnH5NzUEoHG |
| Fintap | https://drive.google.com/drive/folders/1s_VNKIcZgHGxhOD2vaK-p6ezkFML64jS |
| Legend Advance | https://drive.google.com/drive/folders/1s_VNKIcZgHGxhOD2vaK-p6ezkFML64jS |
| Mantis | https://drive.google.com/drive/folders/1oHLgjPmZOQmWnsjJUDXjFMJ4tJl8_m04?usp=sharing |

#### MCA Columns NOT Used in Expandable Details
These fields exist in the MCA schema but are not displayed in the expanded row details:
1. `note` - Additional notes (available but not displayed)
2. `submission_docs` - Is available but already shown in Submissions column

Note: These can be added to the expandable section in the future if needed.

---

### SBA Implementation Status: ⏳ PENDING

**Next Steps:**
1. Add same 3 columns to `lenders_sba` table via database migration
2. Update SBA types with new fields
3. Create SBA-specific 4-column expandable layout
4. Map SBA fields appropriately (e.g., `use_of_funds`, `credit_requirement`, etc.)
5. Test and validate all features

**SBA Field Mappings (Planned):**
- Use existing `google_drive`
- `minimum_loan_amount`, `max_loan_amount`
- `credit_requirement`, `use_of_funds`

---

## Known Limitations & Future Work

### Current Limitations
1. **Drag-and-drop persistence**: Order is saved in local state only, not in database
2. **Edit functionality**: May need updating for new column structure
3. **Default layout**: Non-BLC lenders show basic 2-3 column grid (needs customization)

### Recommended Future Enhancements
1. Add `display_order` column to track custom sort order
2. Implement database persistence after drag-and-drop
3. Create customized expandable details for MCA and SBA
4. Add edit modal functionality for all columns including new links
5. Consider adding bulk action features (export, filtering presets)

---

## Testing Checklist

- [ ] Table renders all 10 columns correctly
- [ ] Column widths look balanced
- [ ] ISO Email copy-to-clipboard works
- [ ] "Email" submission type copy works with proper formatting
- [ ] "Online Portal" links open correctly
- [ ] Expandable row details display all 4 sections
- [ ] Hyperlinks in Restricted Industries work
- [ ] Hyperlinks in Preferred Industries work
- [ ] Portal URL links open in new tab
- [ ] Website/Drive links in Lender Info section work
- [ ] Drag-and-drop reordering works
- [ ] All colors match specification (#3b82f6, #a855f7, #10b981, #f59e0b)

---

## File References

**Main Implementation:**
- `src/pages/Lenders.tsx` - All table and expandable UI

**Database Migrations:**
- `supabase/migrations/20251101000000_update_lender_website_links.sql`
- `supabase/migrations/20251101000001_add_portal_url_and_update_portals.sql`
- `supabase/migrations/20251101000002_add_preferred_industries_doc_link.sql`
- `supabase/migrations/20251101000003_add_restricted_industries_doc_link.sql`

**Related Hooks:**
- `src/hooks/useAllLenders.ts` - Fetches lenders across all types

**Related Types:**
- `src/types/lenders/businessLineOfCredit.ts`
- `src/types/lenders/mca.ts`
- `src/types/lenders/sba.ts`

---

## Quick Reference: Column Classes

### Common Tailwind Classes Used
- `w-8, w-20, w-24, w-32, w-40, w-44, w-48, w-52, w-56` - Width classes
- `text-left, text-center` - Alignment
- `py-3, px-4, px-2` - Padding
- `bg-gray-900/40` - Card background
- `border border-gray-700/50` - Card border
- `rounded-lg` - Border radius
- `text-blue-400, text-purple-400, text-green-400, text-orange-400` - Color-coded headers
- `text-gray-300, text-gray-500` - Text colors
- `hover:text-blue-300` - Hover states
- `underline` - Hyperlink styling

---

Last Updated: 2025-10-31
Next: Implement same pattern for MCA and SBA lenders

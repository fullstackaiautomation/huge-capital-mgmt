# Google Sheets Hyperlink Extraction Workflow

## Visual Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    START: Extract Hyperlinks                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Open Google Sheet                                      │
│  URL: https://docs.google.com/spreadsheets/d/1tXgItB...          │
│                                                                  │
│  ✓ Navigate to correct tab: "Master Huge Capital Lender List"  │
│  ✓ Scroll to see columns C, Y, Z                               │
│  ✓ Wait for sheet to fully load                                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Open Browser Console                                   │
│                                                                  │
│  Windows/Linux: Press F12 or Ctrl+Shift+J                      │
│  Mac: Press Cmd+Option+J                                        │
│                                                                  │
│  Alternative: Right-click → Inspect → Console tab               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Choose Your Script                                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┬─────────────────┐
                │               │               │                 │
                ▼               ▼               ▼                 ▼
    ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
    │   Master     │  │  Specific   │  │ Alternative  │  │   Basic     │
    │   Script     │  │  Lenders    │  │   Script     │  │   Script    │
    │     ⭐       │  │   Script    │  │              │  │             │
    └──────┬───────┘  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘
           │                 │                 │                 │
           │   Recommended   │  For specific   │  If master     │  Simple
           │   for everyone  │  lenders only   │  didn't work   │  version
           │                 │                 │                 │
           └─────────────────┴─────────────────┴─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Copy & Paste Script                                    │
│                                                                  │
│  1. Open the .js file                                           │
│  2. Select all (Ctrl+A or Cmd+A)                               │
│  3. Copy (Ctrl+C or Cmd+C)                                     │
│  4. Click in console                                            │
│  5. Paste (Ctrl+V or Cmd+V)                                    │
│  6. Press Enter                                                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Script Execution                                       │
│                                                                  │
│  Master Script tries 3 strategies:                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Strategy 1: Grid-based extraction                          │ │
│  │ → Uses row/column structure                                │ │
│  │ → Fast and reliable for standard sheets                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Strategy 2: ARIA attribute-based                           │ │
│  │ → Uses accessibility attributes                            │ │
│  │ → Works with non-standard layouts                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Strategy 3: Name-based search                              │ │
│  │ → Searches for specific lender names                       │ │
│  │ → Finds links in same row                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
        ┌─────────────────────┐   ┌─────────────────────┐
        │  Success Path       │   │  No Results Path    │
        │  Found N lenders    │   │  Debugging Info     │
        └──────────┬──────────┘   └──────────┬──────────┘
                   │                          │
                   │                          ▼
                   │              ┌─────────────────────┐
                   │              │ Shows:              │
                   │              │ • Troubleshooting   │
                   │              │ • Debug data        │
                   │              │ • Suggestions       │
                   │              └──────────┬──────────┘
                   │                          │
                   │                          ▼
                   │              ┌─────────────────────┐
                   │              │ Try different       │
                   │              │ script or manual    │
                   │              │ extraction          │
                   │              └─────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: Review Results                                         │
│                                                                  │
│  Console Output (color-coded):                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. Credibly                                                │ │
│  │    Preferred:  https://docs.google.com/document/d/...      │ │
│  │    Restricted: https://docs.google.com/document/d/...      │ │
│  │    Source: Strategy 1 (Grid)                               │ │
│  │                                                             │ │
│  │ 2. Rapid                                                    │ │
│  │    Preferred:  https://docs.google.com/document/d/...      │ │
│  │    Restricted: https://docs.google.com/document/d/...      │ │
│  │    Source: Strategy 1 (Grid)                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ✓ Results copied to clipboard                                 │
│  ✓ Stored in window.lenderResults                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: Save & Use Results                                     │
│                                                                  │
│  Option A: Paste from clipboard                                │
│  → Ctrl+V into text editor, document, etc.                     │
│                                                                  │
│  Option B: Access programmatically                              │
│  → Use window.lenderResults in console                         │
│  → Convert to JSON, CSV, SQL, etc.                             │
│                                                                  │
│  Option C: Direct integration                                   │
│  → Use in seeding script                                        │
│  → Import to database                                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    END: Links Extracted                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Decision Tree: Which Script to Use?

```
                        Do you need all lenders?
                                │
                ┌───────────────┴───────────────┐
                │                               │
               YES                              NO
                │                               │
                ▼                               ▼
    Is the sheet standard layout?    Do you know the lender names?
                │                               │
        ┌───────┴───────┐               ┌──────┴──────┐
       YES              NO              YES            NO
        │               │               │              │
        ▼               ▼               ▼              ▼
    Use Basic      Use Master    Use Specific    Use Master
    Script         Script        Lenders         Script
        │               │         Script              │
        │               │           │                 │
        └───────┬───────┴───────────┴─────────────────┘
                │
                ▼
            Run Script
                │
        ┌───────┴───────┐
       YES              NO
    Results?         Results?
        │               │
        ▼               ▼
     SUCCESS      Try Alternative
        │          Script or Manual
        │           Extraction
        ▼
    Save Results
```

---

## Data Flow Diagram

```
┌─────────────────┐
│  Google Sheet   │
│                 │
│  Column C:      │──┐
│  Lender Name    │  │
│                 │  │
│  Column Y:      │  │
│  Preferred      │  │    ┌──────────────────┐
│  Industries     │──┼───▶│  Browser Console │
│  (Hyperlink)    │  │    │                  │
│                 │  │    │  Run Script      │
│  Column Z:      │  │    │  ───────────▶    │
│  Restricted     │  │    │                  │
│  Industries     │──┘    │  Extract Links   │
│  (Hyperlink)    │       │  ───────────▶    │
│                 │       │                  │
└─────────────────┘       │  Format Output   │
                          │  ───────────▶    │
                          │                  │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────────┐ ┌──────────┐ ┌──────────────┐
            │  Clipboard   │ │ Console  │ │ window.      │
            │              │ │ Output   │ │ lenderResults│
            │ [Credibly]   │ │          │ │              │
            │ Preferred:   │ │ Colored  │ │ Array of     │
            │ https://...  │ │ formatted│ │ objects      │
            │ Restricted:  │ │ text     │ │              │
            │ https://...  │ │          │ │ [{lenderName,│
            └──────┬───────┘ └────┬─────┘ │  preferred,  │
                   │              │       │  restricted}]│
                   │              │       └──────┬───────┘
                   │              │              │
                   └──────────────┼──────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Final Use               │
                    │                          │
                    │  • Paste into document  │
                    │  • Save to file         │
                    │  • Import to database   │
                    │  • Process further      │
                    └──────────────────────────┘
```

---

## Error Handling Flow

```
                        Script Runs
                             │
                    ┌────────┴────────┐
                   YES               NO
               Found results?    Found results?
                    │                 │
                    ▼                 ▼
            ┌─────────────┐    ┌─────────────┐
            │   SUCCESS   │    │    ERROR    │
            │             │    │   HANDLING  │
            │ • Display   │    │             │
            │ • Copy      │    │ Shows:      │
            │ • Store     │    │ • What went │
            └─────────────┘    │   wrong     │
                               │ • Debug info│
                               │ • Next steps│
                               └──────┬──────┘
                                      │
                        ┌─────────────┼─────────────┐
                        │             │             │
                        ▼             ▼             ▼
                ┌──────────┐  ┌──────────┐  ┌──────────┐
                │ Wrong    │  │ Columns  │  │ Not      │
                │ tab      │  │ not      │  │ loaded   │
                │          │  │ visible  │  │          │
                │ → Switch │  │ → Scroll │  │ → Wait & │
                │   tab    │  │   right  │  │   retry  │
                └──────────┘  └──────────┘  └──────────┘
                        │             │             │
                        └─────────────┼─────────────┘
                                      │
                                      ▼
                            Try different script
                                      │
                              ┌───────┴───────┐
                             YES             NO
                         Works now?      Works now?
                              │               │
                              ▼               ▼
                          SUCCESS      Manual Extraction
```

---

## Column Mapping

```
Google Sheet Columns:
┌────┬────┬───────────────────────┬─────┬─────┬──────────────────────┬──────────────────────┐
│ A  │ B  │    C                  │ ... │ ... │    Y                 │    Z                 │
├────┼────┼───────────────────────┼─────┼─────┼──────────────────────┼──────────────────────┤
│    │    │ Lender Name           │     │     │ Preferred Industries │ Restricted Industries│
│    │    │                       │     │     │ (Hyperlink)          │ (Hyperlink)          │
├────┼────┼───────────────────────┼─────┼─────┼──────────────────────┼──────────────────────┤
│    │    │ Credibly              │     │     │ 🔗 Click here        │ 🔗 Click here        │
│    │    │ Rapid                 │     │     │ 🔗 Click here        │ 🔗 Click here        │
│    │    │ Fundworks             │     │     │ 🔗 Click here        │ 🔗 Click here        │
└────┴────┴───────────────────────┴─────┴─────┴──────────────────────┴──────────────────────┘
         ▲                                    ▲                      ▲
         │                                    │                      │
         │                                    │                      │
    Column Index 2                     Column Index 24          Column Index 25
    (0-based)                          (0-based)                (0-based)
         │                                    │                      │
         │                                    │                      │
         └────────────────────────────────────┼──────────────────────┘
                                              │
                                              ▼
                                    Extracted by Scripts
```

---

## Success Metrics

```
┌─────────────────────────────────────────────────────────────────┐
│  What "Success" Looks Like:                                     │
│                                                                  │
│  ✓ Script completed without errors                             │
│  ✓ Found N lenders (where N > 0)                               │
│  ✓ Each lender has both Preferred AND Restricted links         │
│  ✓ Links are valid Google Docs URLs                            │
│  ✓ Results copied to clipboard                                 │
│  ✓ Results stored in window.lenderResults                      │
│  ✓ Output is formatted correctly                               │
│                                                                  │
│  Expected Lenders (12 total):                                   │
│  • Credibly      • Rapid         • Fundworks                    │
│  • TMRnow        • TYI Capital   • Fintegra                     │
│  • Fresh Funding • Fintap        • Legend Advance               │
│  • Mantis        • Emmy Capital  • Kalamata                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: Console Commands

After running the master script:

```javascript
// View all results
window.lenderResults

// Count of lenders found
window.lenderResults.length

// Get specific lender
window.lenderResults.find(r => r.lenderName === 'Credibly')

// Export as JSON
JSON.stringify(window.lenderResults, null, 2)

// Export as CSV
window.lenderResults.map(r =>
  `"${r.lenderName}","${r.preferredUrl}","${r.restrictedUrl}"`
).join('\n')

// Get all lender names
window.lenderResults.map(r => r.lenderName)

// Copy results again
navigator.clipboard.writeText(
  window.lenderResults.map(r =>
    `[${r.lenderName}]\nPreferred Industry Link = ${r.preferredUrl}\nRestricted Industry Link = ${r.restrictedUrl}\n\n`
  ).join('')
)
```

---

## Time Estimates

| Step | Estimated Time |
|------|---------------|
| Open sheet & console | 30 seconds |
| Copy & run script | 15 seconds |
| Script execution | 2-5 seconds |
| Review results | 1 minute |
| Save/export | 30 seconds |
| **Total** | **~3 minutes** |

*Note: First time may take longer as you familiarize with the process*

---

**Need More Details?**
- 📖 See `QUICK-START.md` for condensed instructions
- 📖 See `README-EXTRACTION-SCRIPTS.md` for comprehensive guide
- 📖 See `INSTRUCTIONS.md` for detailed step-by-step


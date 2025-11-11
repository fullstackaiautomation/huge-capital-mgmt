# Hyperlink Extraction Instructions

## Overview
This guide explains how to extract hyperlinks from the "Master Huge Capital Lender List" Google Sheet, specifically from columns Y (Preferred Industries) and Z (Restricted Industries), matched with lender names from column C.

## Why We Need Browser Console Instead of MCP

Google Sheets stores hyperlinks in a special format (HYPERLINK formulas) that are not accessible through the standard Google Sheets API. The API only returns the displayed text, not the underlying URL. To extract the actual URLs, we need to access the DOM directly through the browser console.

**Chrome DevTools MCP** would be ideal for this task, but it's not currently available in this environment. Therefore, we'll use a browser console script as an alternative.

---

## Method 1: Extract ALL Lenders (Recommended)

This method extracts hyperlinks for ALL lenders in the sheet that have both Preferred and Restricted industry links.

### Steps:

1. **Open the Google Sheet in Chrome:**
   ```
   https://docs.google.com/spreadsheets/d/1tXgItBJLBQgY8pkUnPO2-J_Ln87Cfh66AY-KUn566Yc/edit?gid=1180870529#gid=1180870529
   ```

2. **Ensure you're on the correct tab:**
   - Look for the tab named "Master Huge Capital Lender List" at the bottom
   - The URL should show `gid=1180870529`

3. **Load all columns:**
   - Scroll horizontally to the right to ensure columns Y and Z are visible
   - This ensures the data is loaded into the DOM

4. **Open Chrome DevTools:**
   - Press `F12` (Windows/Linux)
   - Or `Cmd + Option + J` (Mac)
   - Or right-click anywhere and select "Inspect" → "Console" tab

5. **Run the extraction script:**
   - Open the file: `scripts/extract-all-lender-hyperlinks.js`
   - Copy the ENTIRE contents
   - Paste into the Chrome Console
   - Press `Enter`

6. **View results:**
   - The script will output all lenders with their hyperlinks
   - Results are automatically copied to your clipboard
   - You can also see them in the console output

### Expected Output Format:
```
Credibly
Preferred Industry Link = https://example.com/preferred
Restricted Industry Link = https://example.com/restricted

Rapid
Preferred Industry Link = https://example.com/preferred
Restricted Industry Link = https://example.com/restricted
```

---

## Method 2: Extract Specific Lenders

This method extracts hyperlinks for a predefined list of specific lenders.

### Steps:

1. Follow steps 1-4 from Method 1

2. **Run the specific lenders script:**
   - Open the file: `scripts/extract-specific-lenders.js`
   - Copy the ENTIRE contents
   - Paste into the Chrome Console
   - Press `Enter`

3. **View results:**
   - The script searches for these lenders:
     - Credibly
     - Rapid
     - Fundworks
     - TMRnow
     - TYI Capital
     - Fintegra
     - Fresh Funding
     - Fintap
     - Legend Advance
     - Mantis
     - Emmy Capital
     - Kalamata

---

## Troubleshooting

### No results found?

1. **Check you're on the correct sheet tab:**
   - Look at the bottom of the screen for tab names
   - URL should contain `gid=1180870529`

2. **Ensure columns are loaded:**
   - Scroll horizontally to columns Y and Z
   - Wait 2-3 seconds for data to load
   - Run the script again

3. **Verify column positions:**
   - Column C should contain lender names
   - Column Y should contain "Preferred Industries" (with blue hyperlinks)
   - Column Z should contain "Restricted Industries" (with blue hyperlinks)

4. **Check browser console for errors:**
   - Look for red error messages
   - They may indicate DOM structure changes

### Links not copying to clipboard?

- Manually select and copy the output from the console
- The script displays the formatted results even if clipboard access fails

### Getting partial results?

- Some lenders may not have both links filled in
- The script will show warnings for lenders with missing links
- Only lenders with BOTH links are included in the final output

---

## Technical Details

### Column Mapping:
- **Column C (index 2):** Lender Names
- **Column Y (index 24):** Preferred Industries (hyperlinks)
- **Column Z (index 25):** Restricted Industries (hyperlinks)

### How the Script Works:

1. Queries all rows in the Google Sheet using `document.querySelectorAll('[role="row"]')`
2. For each row:
   - Extracts lender name from column C
   - Finds `<a>` tags (hyperlinks) in columns Y and Z
   - Extracts the `href` attribute to get the actual URL
3. Filters to only include lenders with BOTH links present
4. Formats the output and copies to clipboard

### Why This Approach?

Google Sheets renders hyperlinks as `<a>` tags in the DOM, making them accessible through JavaScript. The Google Sheets API only returns display values, not the underlying HYPERLINK formulas or URLs, which is why we need browser-side extraction.

---

## Alternative: Google Sheets API Approach (Limited)

If you want to try using the Google Sheets API (though it won't extract hyperlinks):

```bash
node scripts/extract-hyperlinks-from-sheet.js
```

**Note:** This will NOT work for extracting hyperlinks because the API doesn't return formulas. It's kept for reference and future development.

---

## Files Reference

- `scripts/extract-all-lender-hyperlinks.js` - Extract ALL lenders with both links
- `scripts/extract-specific-lenders.js` - Extract specific predefined lenders
- `scripts/extract-hyperlinks-from-sheet.js` - API approach (reference only)
- `scripts/HYPERLINK_EXTRACTION_INSTRUCTIONS.md` - This file

---

## Next Steps After Extraction

Once you have the hyperlinks extracted, you can:

1. **Save to database:** Import the links into your Supabase lenders table
2. **Update application:** Use the links in your lender pages
3. **Create CSV:** Format as CSV for bulk import
4. **Document:** Add to your lender documentation

---

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify the Google Sheet URL and tab are correct
3. Ensure you have view access to the sheet
4. Try refreshing the page and running the script again
5. Check if Google Sheets has changed its DOM structure (rare)

---

Last Updated: 2025-10-31

# Google Sheets Hyperlink Extraction Scripts

## Overview
These scripts help extract hyperlinks from your Google Sheet "Master Huge Capital Lender List" for the Preferred Industries (Column Y) and Restricted Industries (Column Z) columns.

## Available Scripts

### 1. `extract-sheet-links.js` (Recommended First Try)
- **Best for**: Clean, well-structured sheets
- **Method**: Uses row/column structure to extract links systematically
- **Output**: All lenders with both Preferred and Restricted links

### 2. `extract-sheet-links-alternative.js` (Fallback Option)
- **Best for**: When the first script doesn't work
- **Method**: Uses aria attributes and multiple detection strategies
- **Output**: Same as script 1, plus debugging information

### 3. `extract-specific-lenders.js` (Targeted Extraction)
- **Best for**: Extracting specific lenders by name
- **Method**: Searches for specific lender names and extracts their links
- **Target Lenders**:
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

## How to Use

### Step-by-Step Instructions:

1. **Open Your Google Sheet**
   - Navigate to: https://docs.google.com/spreadsheets/d/1tXgItBJLBQgY8pkUnPO2-J_Ln87Cfh66AY-KUn566Yc/edit?gid=1180870529#gid=1180870529
   - Make sure you're on the correct tab ("Master Huge Capital Lender List")

2. **Prepare the View**
   - Scroll horizontally to make sure Column C (Lender Name), Column Y (Preferred Industries), and Column Z (Restricted Industries) are visible
   - The more rows visible on screen, the better (zoom out if needed)

3. **Open Browser Console**
   - Press `F12` (or `Ctrl+Shift+J` on Windows, `Cmd+Option+J` on Mac)
   - Click on the "Console" tab

4. **Copy and Run a Script**
   - Open one of the `.js` files in this folder
   - Copy the entire contents
   - Paste into the browser console
   - Press `Enter`

5. **Review Results**
   - The script will log results to the console
   - Results will be automatically copied to your clipboard (if supported)
   - You can paste them into any text editor

## Expected Output Format

```
[Credibly]
Preferred Industry Link = https://docs.google.com/document/d/...
Restricted Industry Link = https://docs.google.com/document/d/...

[Rapid]
Preferred Industry Link = https://docs.google.com/document/d/...
Restricted Industry Link = https://docs.google.com/document/d/...

...and so on
```

## Troubleshooting

### Script Returns No Results
**Possible causes:**
1. Columns Y and Z are not visible (scroll horizontally)
2. The sheet hasn't fully loaded (wait a moment and try again)
3. You're on the wrong tab (check the tab name)

**Solution:**
- Try the alternative script (`extract-sheet-links-alternative.js`)
- Use the specific lenders script to target known lenders
- Check the console for debugging messages

### Script Finds Some But Not All Lenders
**Possible causes:**
1. Some lenders are missing one of the two links
2. The lender name spelling doesn't match exactly
3. Some rows haven't loaded (Google Sheets lazy-loads data)

**Solution:**
- Scroll to see all the lenders you want to extract
- Wait for the sheet to fully load
- Check that both columns Y and Z have hyperlinks for each lender

### Links Are Not Being Detected
**Possible causes:**
1. Links are formatted as plain text instead of hyperlinks
2. The sheet structure is different than expected

**Solution:**
- Verify that the links in columns Y and Z are actual hyperlinks (blue, underlined)
- Try clicking on a cell to see if it's a hyperlink
- Use the alternative script which has more detection methods

## Manual Alternative

If all scripts fail, you can extract links manually:

1. Click on a cell in Column Y that contains a link
2. The formula bar at the top will show: `=HYPERLINK("url", "display text")`
3. Copy the URL from the formula
4. Repeat for Column Z
5. Repeat for each lender

## Need Help?

If none of these scripts work, try:
1. Taking a screenshot of the sheet showing columns C, Y, and Z
2. Right-click on a hyperlink cell and inspect it (right-click → Inspect)
3. Look for the `<a>` tag and its `href` attribute
4. Share this information to help debug the issue

## Next Steps

Once you have extracted the links, you can:
1. Import them into your Huge Capital Dashboard database
2. Update the lender pages with the industry information
3. Create a seeding script to populate the database

# Google Sheets Hyperlink Extraction Scripts

## Quick Start Guide

**Want to extract hyperlinks from your Google Sheet? Start here!**

### Recommended Script: `extract-sheet-links-master.js`

This is the most comprehensive and user-friendly script. It tries multiple extraction strategies automatically.

**To use:**

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1tXgItBJLBQgY8pkUnPO2-J_Ln87Cfh66AY-KUn566Yc/edit?gid=1180870529#gid=1180870529

2. Scroll to see columns C, Y, and Z

3. Press `F12` to open browser console

4. Open `extract-sheet-links-master.js`, copy all contents, paste into console, and press Enter

5. Results will be:
   - Displayed in the console with color-coded output
   - Automatically copied to your clipboard
   - Stored in `window.lenderResults` for further use

---

## All Available Scripts

### 1. **extract-sheet-links-master.js** ⭐ RECOMMENDED
**Best for:** Everyone - start with this one!

**Features:**
- Uses 3 different extraction strategies
- Detailed, color-coded console output
- Automatic clipboard copy
- Comprehensive error messages and debugging info
- Works with most Google Sheets structures

**Extraction Strategies:**
1. Grid-based extraction (standard row/column structure)
2. ARIA attribute-based extraction (accessibility attributes)
3. Specific lender name search (targets known lenders)

---

### 2. **extract-sheet-links.js**
**Best for:** Clean, well-structured sheets

**Features:**
- Simple, straightforward extraction
- Uses row/column grid structure
- Minimal output
- Fast execution

**Use when:**
- You have a standard Google Sheets layout
- Columns C, Y, Z are in their expected positions
- You want a quick extraction without extra debugging

---

### 3. **extract-sheet-links-alternative.js**
**Best for:** When the basic script doesn't work

**Features:**
- Uses ARIA attributes for cell detection
- Multiple detection strategies
- Debugging output showing column structure
- Helps identify why extraction might fail

**Use when:**
- The basic script returns no results
- You need to see what the script is detecting
- The sheet structure is non-standard

---

### 4. **extract-specific-lenders.js**
**Best for:** Extracting specific lenders by name

**Target Lenders:**
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

**Features:**
- Searches for specific lender names
- Extracts links for found lenders
- Reports which lenders couldn't be found
- Shows all links in a row for debugging

**Use when:**
- You only need specific lenders
- You want to verify specific entries
- Other scripts are finding too much or too little data

---

## Expected Output Format

All scripts output data in this format:

```
[Credibly]
Preferred Industry Link = https://docs.google.com/document/d/1abc123...
Restricted Industry Link = https://docs.google.com/document/d/1xyz789...

[Rapid]
Preferred Industry Link = https://docs.google.com/document/d/2def456...
Restricted Industry Link = https://docs.google.com/document/d/2uvw012...
```

This format is designed to be:
- Easy to read
- Easy to parse programmatically
- Ready to import into a database
- Compatible with CSV conversion

---

## Detailed Usage Instructions

### Prerequisites

1. **Access to Google Sheet**
   - Must have view or edit access
   - Sheet must be loaded in your browser
   - URL: https://docs.google.com/spreadsheets/d/1tXgItBJLBQgY8pkUnPO2-J_Ln87Cfh66AY-KUn566Yc/edit?gid=1180870529#gid=1180870529

2. **Correct Sheet Tab**
   - Make sure you're on "Master Huge Capital Lender List" tab
   - Check the tab name at the bottom of the sheet

3. **Visible Columns**
   - Column C: Lender Name
   - Column Y: Preferred Industries (with hyperlinks)
   - Column Z: Restricted Industries (with hyperlinks)

### Step-by-Step Process

**Step 1: Prepare Your Browser**
```
1. Open Google Chrome, Edge, or Firefox
2. Navigate to the Google Sheet
3. Ensure columns C, Y, and Z are visible (scroll horizontally if needed)
4. Wait for the sheet to fully load
```

**Step 2: Open Developer Console**
```
Windows/Linux: Press F12 or Ctrl+Shift+J
Mac: Press Cmd+Option+J

Or: Right-click anywhere → "Inspect" → Click "Console" tab
```

**Step 3: Run the Script**
```
1. Open the script file you want to use
2. Select all (Ctrl+A or Cmd+A)
3. Copy (Ctrl+C or Cmd+C)
4. Click in the console
5. Paste (Ctrl+V or Cmd+V)
6. Press Enter
```

**Step 4: Review Results**
```
1. Check the console output
2. Results are automatically copied to clipboard
3. Paste into a text editor to save
4. Or access via window.lenderResults in the console
```

---

## Troubleshooting

### Problem: "No results found"

**Possible Causes:**
1. Wrong sheet tab
2. Columns not visible
3. Sheet not fully loaded
4. Links not formatted as hyperlinks

**Solutions:**
1. Verify you're on the correct tab
2. Scroll to columns Y and Z
3. Wait 5-10 seconds for lazy loading
4. Try the `extract-sheet-links-master.js` script (it has the most robust detection)

---

### Problem: "Only found some lenders"

**Possible Causes:**
1. Some lenders missing one link
2. Lender names don't match exactly
3. Some rows haven't loaded yet

**Solutions:**
1. Scroll through the entire sheet first
2. Use `extract-specific-lenders.js` to target known lenders
3. Check that both Y and Z columns have links for each row

---

### Problem: "Links not being detected"

**Possible Causes:**
1. Links are plain text, not hyperlinks
2. Different sheet structure
3. Custom formatting

**Solutions:**
1. Click on a cell with a link - does the formula bar show `=HYPERLINK(...)`?
2. Are the links blue and underlined?
3. Try the master script which uses multiple detection methods

---

### Problem: "Script throws an error"

**Possible Causes:**
1. Browser compatibility
2. Sheet permissions
3. Script was modified accidentally

**Solutions:**
1. Try a different browser (Chrome recommended)
2. Re-copy the script from the file (don't modify it)
3. Check browser console for specific error messages

---

## Advanced Usage

### Accessing Results Programmatically

After running `extract-sheet-links-master.js`, results are stored in `window.lenderResults`:

```javascript
// Get all lender names
window.lenderResults.map(r => r.lenderName);

// Get all preferred links
window.lenderResults.map(r => r.preferredUrl);

// Filter for specific lender
window.lenderResults.find(r => r.lenderName === 'Credibly');

// Convert to CSV
const csv = window.lenderResults.map(r =>
  `"${r.lenderName}","${r.preferredUrl}","${r.restrictedUrl}"`
).join('\n');
console.log(csv);
```

### Exporting to Different Formats

**JSON:**
```javascript
const json = JSON.stringify(window.lenderResults, null, 2);
console.log(json);
// Copy to clipboard: navigator.clipboard.writeText(json);
```

**CSV:**
```javascript
const csv = 'Lender,Preferred,Restricted\n' +
  window.lenderResults.map(r =>
    `"${r.lenderName}","${r.preferredUrl}","${r.restrictedUrl}"`
  ).join('\n');
console.log(csv);
```

**SQL INSERT Statements:**
```javascript
const sql = window.lenderResults.map(r =>
  `INSERT INTO lender_industries (lender_name, preferred_url, restricted_url) VALUES ('${r.lenderName}', '${r.preferredUrl}', '${r.restrictedUrl}');`
).join('\n');
console.log(sql);
```

---

## Manual Alternative

If all automated scripts fail, you can extract links manually:

1. **Click on a cell** in Column Y that contains a link

2. **Look at the formula bar** at the top of the sheet
   - It will show: `=HYPERLINK("https://docs.google.com/...", "Click here")`

3. **Copy the URL** from inside the first quotes

4. **Repeat for Column Z** for the same lender

5. **Format as:**
   ```
   [Lender Name]
   Preferred Industry Link = [URL from Column Y]
   Restricted Industry Link = [URL from Column Z]
   ```

6. **Repeat for each lender**

---

## Security & Privacy Notes

- **No data is sent anywhere**: All scripts run entirely in your browser
- **No external connections**: Scripts don't make any network requests
- **No data storage**: Scripts don't save data to disk (only clipboard)
- **Read-only**: Scripts only read data, they don't modify the sheet
- **No credentials needed**: Uses your existing Google Sheets session

---

## Next Steps After Extraction

Once you have extracted the links:

1. **Save the output** to a text file

2. **Verify the links** by spot-checking a few

3. **Import into database**
   - Create a seeding script
   - Add to Supabase
   - Update lender records

4. **Update the dashboard**
   - Add industry information to lender pages
   - Create links to the Google Docs
   - Display preferred/restricted industries

---

## Support

### Getting Help

1. **Check the console output** - The master script provides detailed debugging info

2. **Read the troubleshooting section** above

3. **Try a different script** - Each script uses different strategies

4. **Take a screenshot** of:
   - The Google Sheet (showing columns C, Y, Z)
   - The browser console output
   - Any error messages

### Script Modifications

If you need to modify the scripts:

- **Column indices**: Change the numbers in `cells[2]`, `cells[24]`, `cells[25]` to match your columns
- **Lender names**: Update the `targetLenders` array in `extract-specific-lenders.js`
- **Output format**: Modify the template string in the output section

---

## Files in This Directory

- `extract-sheet-links-master.js` - **Main script** (recommended)
- `extract-sheet-links.js` - Basic extraction script
- `extract-sheet-links-alternative.js` - Alternative method script
- `extract-specific-lenders.js` - Targeted extraction script
- `INSTRUCTIONS.md` - Quick start guide
- `README-EXTRACTION-SCRIPTS.md` - This comprehensive guide

---

## License & Credits

Created for the Huge Capital Dashboard project.
Feel free to modify and adapt for your needs.

---

**Last Updated:** October 31, 2025

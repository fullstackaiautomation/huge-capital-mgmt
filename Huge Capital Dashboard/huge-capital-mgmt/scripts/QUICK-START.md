# Quick Start: Extract Google Sheets Hyperlinks

## 3-Step Process

### Step 1: Open Sheet & Console
```
1. Open: https://docs.google.com/spreadsheets/d/1tXgItBJLBQgY8pkUnPO2-J_Ln87Cfh66AY-KUn566Yc/edit?gid=1180870529
2. Press F12 (or Ctrl+Shift+J)
3. Click "Console" tab
```

### Step 2: Run Script
```
1. Open: extract-sheet-links-master.js
2. Copy all contents (Ctrl+A, Ctrl+C)
3. Paste in console (Ctrl+V)
4. Press Enter
```

### Step 3: Get Results
```
Results are:
✓ Displayed in console
✓ Copied to clipboard
✓ Ready to paste anywhere
```

---

## Expected Output

```
[Credibly]
Preferred Industry Link = https://docs.google.com/document/d/...
Restricted Industry Link = https://docs.google.com/document/d/...

[Rapid]
Preferred Industry Link = https://docs.google.com/document/d/...
Restricted Industry Link = https://docs.google.com/document/d/...

... and so on
```

---

## Troubleshooting

**No results?**
1. Scroll to columns Y and Z
2. Wait 5 seconds for sheet to load
3. Make sure you're on "Master Huge Capital Lender List" tab
4. Re-run the script

**Still not working?**
- Try `extract-specific-lenders.js` instead
- Check README-EXTRACTION-SCRIPTS.md for detailed help
- Verify links are blue/underlined (actual hyperlinks)

---

## Which Script Should I Use?

| Script | When to Use |
|--------|-------------|
| `extract-sheet-links-master.js` | ⭐ **Start here** - Works in most cases |
| `extract-specific-lenders.js` | Only need specific lenders by name |
| `extract-sheet-links-alternative.js` | Master script didn't work |
| `extract-sheet-links.js` | Quick & simple, standard layout |

---

## Target Lenders

The scripts will extract links for these lenders (if both Preferred & Restricted links exist):

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

## Need More Help?

📖 See `README-EXTRACTION-SCRIPTS.md` for comprehensive documentation
📖 See `INSTRUCTIONS.md` for detailed step-by-step guide

---

**Quick Tip:** Results are stored in `window.lenderResults` - you can access them in the console even after the script finishes!

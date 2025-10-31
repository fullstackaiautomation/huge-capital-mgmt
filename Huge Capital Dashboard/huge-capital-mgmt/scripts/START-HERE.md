# 🚀 START HERE: Google Sheets Link Extractor

## Welcome! 👋

You're here because you need to extract hyperlinks from your Google Sheet. This is the **fastest path to success**.

---

## ⚡ Ultra-Quick Start (3 Minutes)

### 1️⃣ Open Two Things:

**A. Your Google Sheet:**
https://docs.google.com/spreadsheets/d/1tXgItBJLBQgY8pkUnPO2-J_Ln87Cfh66AY-KUn566Yc/edit?gid=1180870529

**B. This File on Your Computer:**
`extract-sheet-links-master.js` (in the same folder as this file)

---

### 2️⃣ Open Browser Console:

Press **F12** on your keyboard (or **Ctrl+Shift+J**)

> On Mac: **Cmd+Option+J**

Click the **"Console"** tab at the top

---

### 3️⃣ Copy & Run the Script:

1. Open `extract-sheet-links-master.js` in a text editor
2. Select all the text (**Ctrl+A** or **Cmd+A**)
3. Copy it (**Ctrl+C** or **Cmd+C**)
4. Click in the browser console
5. Paste (**Ctrl+V** or **Cmd+V**)
6. Press **Enter**

---

### 4️⃣ Get Your Results:

✅ Results appear in the console with pretty colors
✅ Results are **automatically copied to your clipboard**
✅ Paste them anywhere you need!

---

## 📋 What You'll Get

The script extracts links and formats them like this:

```
[Credibly]
Preferred Industry Link = https://docs.google.com/document/d/1abc123...
Restricted Industry Link = https://docs.google.com/document/d/1xyz789...

[Rapid]
Preferred Industry Link = https://docs.google.com/document/d/2def456...
Restricted Industry Link = https://docs.google.com/document/d/2uvw012...

[Fundworks]
Preferred Industry Link = https://docs.google.com/document/d/3ghi789...
Restricted Industry Link = https://docs.google.com/document/d/3jkl012...

... and so on for all lenders
```

---

## 🎯 Target Lenders (12 Total)

The script will find these lenders:
- ✅ Credibly
- ✅ Rapid
- ✅ Fundworks
- ✅ TMRnow
- ✅ TYI Capital
- ✅ Fintegra
- ✅ Fresh Funding
- ✅ Fintap
- ✅ Legend Advance
- ✅ Mantis
- ✅ Emmy Capital
- ✅ Kalamata

---

## ❓ Troubleshooting

### "I got no results!"

**Try this:**
1. Make sure you're on the **"Master Huge Capital Lender List"** tab in the sheet
2. Scroll horizontally to see columns **Y** and **Z**
3. Wait 5-10 seconds for the sheet to fully load
4. Run the script again

---

### "The script gave an error!"

**Try this:**
1. Make sure you copied the **entire script** (including the first `(function` and last `})();`)
2. Try using **Google Chrome** browser (works best)
3. Make sure JavaScript is enabled in your browser

---

### "Still not working?"

**No problem! You have options:**

**Option A:** Read `QUICK-START.md` for a bit more detail

**Option B:** Try a different script:
- Use `extract-specific-lenders.js` if you only need specific lenders

**Option C:** Read the full guide:
- Open `README-EXTRACTION-SCRIPTS.md` for comprehensive help

---

## 🗺️ Navigation Guide

**If you want...**

| What You Want | Open This File |
|---------------|---------------|
| Just get it done fast | `extract-sheet-links-master.js` (the script) |
| Quick 3-step guide | `QUICK-START.md` |
| Step-by-step instructions | `INSTRUCTIONS.md` |
| Complete documentation | `README-EXTRACTION-SCRIPTS.md` |
| Visual flowcharts | `EXTRACTION-WORKFLOW.md` |
| Navigate everything | `INDEX.md` |
| Project overview | `EXTRACTION-SCRIPTS-SUMMARY.md` |

---

## 💡 Pro Tips

1. **Keep the console open** after the script runs - you can access results later via `window.lenderResults`

2. **Scroll the sheet first** - Google Sheets loads data lazily, scrolling helps load all rows

3. **Zoom out the sheet** - More visible rows = better extraction

4. **The results are in your clipboard** - Just press Ctrl+V to paste them anywhere!

---

## ⏱️ Time Estimate

- **Total time:** 3-5 minutes
- **Manual alternative:** 30-60 minutes
- **Time saved:** 25-55 minutes!

---

## 🎁 Bonus: After You Extract

The results are stored in the browser. You can access them like this:

**In the console, type:**
```javascript
window.lenderResults
```

**Want JSON format?**
```javascript
JSON.stringify(window.lenderResults, null, 2)
```

**Want CSV format?**
```javascript
window.lenderResults.map(r =>
  `"${r.lenderName}","${r.preferredUrl}","${r.restrictedUrl}"`
).join('\n')
```

---

## ✅ Success Checklist

**Before you start:**
- [ ] Google Sheet is open in browser
- [ ] Can see the "Master Huge Capital Lender List" tab
- [ ] `extract-sheet-links-master.js` file is ready
- [ ] Browser console opens when you press F12

**After you run the script:**
- [ ] Console shows colored output
- [ ] No red error messages
- [ ] Found 12 lenders (or close to it)
- [ ] Results are in clipboard
- [ ] Results saved to a file

---

## 🚀 Ready? Let's Go!

1. Open the Google Sheet
2. Press F12
3. Copy & paste `extract-sheet-links-master.js`
4. Press Enter
5. Done!

**That's it!** 🎉

---

## 📞 Need More Help?

- **Quick help:** `QUICK-START.md`
- **Full guide:** `README-EXTRACTION-SCRIPTS.md`
- **All docs:** `INDEX.md`

---

## 🎯 What's Next?

After you extract the links:

1. **Save them** - Paste into a text file
2. **Verify** - Spot-check a few links
3. **Use them** - Import to database, add to dashboard, etc.

---

**Good luck! You've got this!** 💪

---

**Files in this folder:**
- 4 extraction scripts
- 6 documentation files
- Everything you need to succeed

**Created:** October 31, 2025
**Estimated completion time:** 3-5 minutes
**Difficulty:** Easy (just copy & paste!)

---

_This is the simplest possible guide. For more details, see the other documentation files._

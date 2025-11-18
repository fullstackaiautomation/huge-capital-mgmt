# 🔄 Google Sheets Sync - Ready to Go!

## ✅ What's Set Up

1. **Google Sheet Connected**: Your 4-tab lenders sheet
   - SBA
   - Term Loans
   - Business Line of Credits
   - Equipment Financing

2. **Sync Service**: Reads all 4 tabs automatically

3. **UI Updated**:
   - New expandable lender cards
   - "Sync from Google Sheets" button
   - Real-time sync status
   - Contact details shown in cards

---

## 🚀 How to Use

### Step 1: Clear Fake Data (One Time)

Run this in Supabase SQL Editor:

```sql
-- Clear the 5 fake lenders
DELETE FROM lenders WHERE company_name IN (
  'First National Bank',
  'Bridge Capital Partners',
  'Community Credit Union',
  'Hard Money Solutions',
  'Institutional Lending Group'
);
```

### Step 2: Sync Your Real Lenders

1. Go to: http://localhost:5176/lenders
2. Click **"Sync from Google Sheets"** button
3. Wait for confirmation message
4. See your real lenders!

---

## 📊 What Gets Synced

From your Google Sheet (all 4 tabs):
- **Lender Name** → company_name
- **Contact Person** → Split into first_name/last_name in contacts table
- **Phone** → contact's phone
- **Email** → contact's email
- **Tab Name** → Determines company_type (SBA=bank, etc.)

---

## 🎨 New Features

### Expandable Cards
- Click any lender card to expand
- See contact details
- Email/phone are clickable links
- Programs and notes shown when expanded

### Sync Button
- Syncs all 4 tabs automatically
- Shows success/error messages
- Updates lender count in real-time
- Tracks last sync time

### Better Organization
- Cards instead of table
- More readable
- Mobile friendly
- All data accessible

---

## 🧪 Test It

1. **Refresh the page** (Ctrl+R)
2. **Click "Sync from Google Sheets"**
3. **Watch the console** for sync progress
4. **See your lenders appear!**

You should see lenders from all 4 tabs:
- US Bank (SBA)
- Huntington Bank (SBA)
- Credit Bench/Bayfirst (SBA)
- CDC Loans (SBA)
- Plus any from other tabs!

---

## ⚡ Quick Actions

**Clear all lenders and re-sync:**
```sql
DELETE FROM lenders;
```
Then click "Sync from Google Sheets"

**Check what's synced:**
```sql
SELECT company_name, company_type,
       (SELECT count(*) FROM lender_contacts WHERE lender_id = lenders.id) as contacts
FROM lenders
ORDER BY company_name;
```

**See all contacts:**
```sql
SELECT l.company_name, c.first_name, c.last_name, c.email, c.phone
FROM lender_contacts c
JOIN lenders l ON c.lender_id = l.id
ORDER BY l.company_name;
```

---

## 🎯 What's Next

After sync works:
1. ✅ Test expandable cards
2. ✅ Verify contact info displays
3. ✅ Try searching
4. 🔜 Add ability to edit lenders in UI
5. 🔜 Add notes/programs to lenders
6. 🔜 Build lender detail modal

---

**Ready to sync!** 🚀

Just refresh the page and click the sync button!

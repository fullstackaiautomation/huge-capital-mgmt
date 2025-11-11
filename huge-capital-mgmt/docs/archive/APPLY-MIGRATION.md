# Apply Lenders Migration - Quick Guide

## ⚡ Quick Steps

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/oymwsfyspdvbazklqkpm/sql/new

2. **Copy Migration SQL**
   - Open: `supabase/migrations/20250114000001_create_lenders_schema.sql`
   - Select All (Ctrl+A) and Copy (Ctrl+C)

3. **Run in SQL Editor**
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for success message

4. **Verify Tables Created**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name LIKE 'lender%'
   ORDER BY table_name;
   ```

   Should show:
   - lenders
   - lender_communications
   - lender_contacts
   - lender_performance
   - lender_programs

5. **Check Seed Data**
   ```sql
   SELECT company_name, company_type, rating, status
   FROM lenders
   ORDER BY company_name;
   ```

   Should show 5 lenders.

---

## ✅ After Migration

### Test the Lenders Page

```bash
# Start dev server
npm run dev

# Navigate to:
# http://localhost:5173/lenders
```

You should see:
- ✅ 5 sample lenders in the list
- ✅ Stats cards with correct numbers
- ✅ Search functionality
- ✅ Responsive layout

---

## 🔧 Troubleshooting

### "Permission denied"
- Make sure you're logged into Supabase Dashboard
- Use the SQL Editor (not anon key via code)

### "Table already exists"
Run this to drop tables first:
```sql
DROP TABLE IF EXISTS lender_communications CASCADE;
DROP TABLE IF EXISTS lender_contacts CASCADE;
DROP TABLE IF EXISTS lender_programs CASCADE;
DROP TABLE IF EXISTS lender_performance CASCADE;
DROP TABLE IF EXISTS lenders CASCADE;
```

Then re-run the full migration.

### "No data showing"
Check if seed data ran:
```sql
SELECT count(*) FROM lenders;
-- Should return 5
```

If 0, manually run the INSERT statements from the migration file.

---

## 📊 What Gets Created

### Tables (5)
1. **lenders** - Main company information
2. **lender_programs** - Loan programs per lender
3. **lender_contacts** - Contact information
4. **lender_communications** - Communication log
5. **lender_performance** - Performance metrics

### Indexes (18)
- Full-text search on company names
- Performance indexes on key columns
- GIN indexes for array columns

### RLS Policies (20)
- All authenticated users can CRUD

### Triggers (4)
- Auto-update timestamps
- Auto-calculate approval rates

### Seed Data
- 5 lenders
- 3 programs
- 2 contacts
- 2 performance records

---

## 🎯 Next: Set Up Google Sheets

Once migration is complete, you can sync from Google Sheets!

See: [Google Sheets Setup Guide](./GOOGLE-SHEETS-SETUP.md)

---

**Quick Links:**
- [Supabase SQL Editor](https://supabase.com/dashboard/project/oymwsfyspdvbazklqkpm/sql/new)
- [Migration File](./supabase/migrations/20250114000001_create_lenders_schema.sql)
- [Implementation Guide](./docs/Lenders-Dashboard-Implementation-Guide.md)

# Manual Migration Push Guide

## Context
The orphaned migration `20251031` has been successfully reverted. Now you need to manually push all pending migrations (from 20251101 onwards) to Supabase.

## Instructions

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project
   - Go to **SQL Editor**

2. **Create a new query** and execute the migrations in order below

3. **After each migration file**, paste its contents into the SQL editor and run

---

## Pending Migrations to Push (In Order)

### Batch 1: Lender Website & Portal Links (20251101)
These files update existing lender records with website and portal URLs:
- `20251101000000_update_lender_website_links.sql`
- `20251101000001_add_portal_url_and_update_portals.sql`
- `20251101000002_add_preferred_industries_doc_link.sql`
- `20251101000003_add_restricted_industries_doc_link.sql`
- `20251101000004_add_doc_links_to_mca.sql`
- `20251101000005_populate_mca_portal_urls.sql`
- `20251101000006_populate_mca_website_and_drive_links.sql`
- `20251101000007_populate_additional_mca_links.sql`
- `20251101000008_populate_mca_restricted_industries_links.sql`
- `20251101000009_add_doc_links_to_sba.sql`
- `20251101000010_populate_sba_google_drive_links.sql`

**What it does:** Adds website URLs, portal links, Google Drive links, and document references to existing lender records.

---

### Batch 2: New Lender Product Categories (20251102)
These files create new lender category tables:
- `20251102000001_create_lenders_term_loans.sql`
- `20251102000002_create_lenders_dscr.sql`
- `20251102000003_create_lenders_equipment_financing.sql`
- `20251102000004_create_lenders_fix_flip.sql`
- `20251102000005_create_lenders_new_construction.sql`
- `20251102000006_create_lenders_commercial_real_estate.sql`
- `20251102000007_create_lenders_mca_debt_restructuring.sql`
- `20251102000008_create_lenders_conventional_tl_loc.sql`
- `20251102000010_fix_rls_clean.sql`
- `20251102000011_add_kalamata_mca.sql`
- `20251102000012_add_notes_to_lenders_mca.sql`
- `20251102000013_populate_sba_restricted_industries.sql`

**What it does:** Creates new lender category tables with structure, RLS policies, and indexes. Adds specific lender records.

---

### Batch 3: Other Migrations (Latest)
- `20251112071503_create_agent_run_logs.sql`

**What it does:** Creates agent_run_logs table for tracking multi-agent pipeline executions with proper RLS and indexes.

---

## How to Execute

### Option A: One by One (Safest)
1. Open Supabase SQL Editor
2. Copy-paste each migration file content
3. Click **Run**
4. Check for errors
5. Move to next file

### Option B: Batch Execution
1. Combine multiple migration files into one SQL query
2. Run all together

**Recommended:** Use **Option A** (one at a time) to catch any issues.

---

## Verification

After pushing all migrations, verify by running in Supabase SQL Editor:

```sql
-- Check if agent_run_logs table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'agent_run_logs'
);

-- Check lender tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'lenders_%'
ORDER BY table_name;
```

---

## Troubleshooting

If you get an error:
- **"Table already exists"** → Migration already applied (safe to skip)
- **"Foreign key violation"** → Check if referenced table exists
- **"RLS policy error"** → Check auth table exists

## Next Steps

Once all migrations are successfully pushed:
1. Run `npx supabase migration list` to verify
2. Commit these changes: `git add . && git commit -m "Push pending migrations to Supabase"`
3. Push to GitHub: `git push`

---

## Migration Files Location
All files are in: `supabase/migrations/`
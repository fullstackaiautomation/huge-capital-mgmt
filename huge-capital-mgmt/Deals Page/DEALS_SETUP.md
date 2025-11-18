# Deals Pipeline - Setup Instructions

## Overview
The Deals Pipeline requires Supabase database setup and Google Drive integration. Follow these steps to get it working.

## Step 1: Push Database Migrations to Supabase

### Option A: Using Supabase Dashboard (Recommended for First-Time Setup)

1. Go to: https://supabase.com/dashboard
2. Select your project: **huge-capital** (Project ID: `oymwsfyspdvbazklqkpm`)
3. Navigate to **SQL Editor** (left sidebar)
4. Create a new query and paste the contents of:
   - `supabase/migrations/20251111000006_create_all_deals_tables.sql`
5. Click **Run** to execute
6. Verify the tables appear in the **Database** > **Tables** section:
   - `deals`
   - `deal_owners`
   - `deal_bank_statements`
   - `deal_funding_positions`
   - `deal_lender_matches`

### Option B: Using Supabase CLI (If Remote Connection Works)

```bash
cd "c:\Users\blkw\OneDrive\Documents\Github\Huge Capital\huge-capital-mgmt"
npx supabase db push
```

**Note**: Remote connection may timeout. If it does, use Option A instead.

## Step 2: Set Up Environment Variables

Create `.env.local` in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://oymwsfyspdvbazklqkpm.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

To find your keys:
1. Go to: https://supabase.com/dashboard/project/oymwsfyspdvbazklqkpm/settings/api
2. Copy **Project URL** and **Anon Public Key**
3. Paste into `.env.local`

## Step 3: Deploy Edge Function

The `parse-deal-documents` edge function needs to be deployed to Supabase:

```bash
cd "c:\Users\blkw\OneDrive\Documents\Github\Huge Capital\huge-capital-mgmt"
npx supabase functions deploy parse-deal-documents
```

**Environment Variables** for the edge function:
- `ANTHROPIC_API_KEY` - Get from https://console.anthropic.com/

Set it in Supabase:
1. Go to: https://supabase.com/dashboard/project/oymwsfyspdvbazklqkpm/functions
2. Click `parse-deal-documents`
3. Go to **Settings** > **Secrets**
4. Add: `ANTHROPIC_API_KEY` = your API key

## Step 4: Test the Workflow

1. Start dev server: `npm run dev`
2. Navigate to: http://localhost:5173/deals
3. Click "New Deal"
4. Upload a document (PDF, CSV, or image)
5. Click "Continue to Analysis"
6. Verify the parsing works and shows extracted data

## Google Drive Integration (Optional)

The system can optionally save deal documents to Google Drive. To set this up:

1. Create a Google Cloud service account
2. Download the JSON credentials file
3. Add to `.env.local`:
   ```env
   VITE_GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```

**For now**: Google Drive is optional. The system works without it.

## Troubleshooting

### Error: "Failed to load deals"
- Check that migrations were applied (see Step 1)
- Verify Supabase credentials in `.env.local`
- Check browser console for detailed errors

### Error: "Anthropic API key not configured"
- Edge function wasn't deployed
- ANTHROPIC_API_KEY environment variable not set
- Check Supabase Functions > parse-deal-documents > Secrets

### Error: "No data returned from parsing function"
- Edge function is deployed but ANTHROPIC_API_KEY is missing
- Check the edge function logs in Supabase dashboard

### Error: "User not authenticated"
- You're not logged in to the application
- Log in first via `/login` route

## Verification Checklist

- [ ] Supabase migrations applied (5 tables created)
- [ ] `.env.local` file created with SUPABASE_URL and SUPABASE_ANON_KEY
- [ ] Can log in to the application
- [ ] Can navigate to `/deals` page
- [ ] "New Deal" button appears and opens modal
- [ ] Can upload documents in the modal
- [ ] Can see "Continue to Analysis" button
- [ ] Edge function deployed (optional for initial testing)
- [ ] ANTHROPIC_API_KEY set (optional for initial testing)
- [ ] Document analysis works end-to-end

## Next Steps

After basic setup:
1. Test with sample documents
2. Deploy edge functions to production Supabase
3. Set up Google Drive integration (optional)
4. Create Deal Detail page (`/deals/:id`)
5. Implement lender matching workflow

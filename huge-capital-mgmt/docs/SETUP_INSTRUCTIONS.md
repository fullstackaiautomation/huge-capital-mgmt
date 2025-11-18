# Quick Setup - Deals Pipeline

## What You Need to Do

### 1. Get Your Supabase Credentials
Visit: https://supabase.com/dashboard/project/oymwsfyspdvbazklqkpm/settings/api

Copy these values:
- **Project URL**: `https://oymwsfyspdvbazklqkpm.supabase.co`
- **Anon Public Key**: (looks like `eyJ...` - a long string)

### 2. Create `.env.local` file
In the project root (`c:\Users\blkw\OneDrive\Documents\Github\Huge Capital\huge-capital-mgmt\`), create a file named `.env.local` with:

```
VITE_SUPABASE_URL=https://oymwsfyspdvbazklqkpm.supabase.co
VITE_SUPABASE_ANON_KEY=<paste-your-anon-key-here>
```

### 3. Run the Database Migration
Go to: https://supabase.com/dashboard/project/oymwsfyspdvbazklqkpm/sql/new

Paste the entire contents of this file:
`supabase/migrations/20251111000006_create_all_deals_tables.sql`

Click **Run** and wait for completion.

### 4. Verify Tables Were Created
Go to: https://supabase.com/dashboard/project/oymwsfyspdvbazklqkpm/editor

You should see these tables listed on the left:
- ✅ deals
- ✅ deal_owners
- ✅ deal_bank_statements
- ✅ deal_funding_positions
- ✅ deal_lender_matches

### 5. Restart Dev Server
```bash
# Stop the dev server (Ctrl+C)
# Then restart
npm run dev
```

### 6. Test It Out
1. Navigate to: http://localhost:5173/deals
2. Click "New Deal"
3. Upload a document (PDF, CSV, or image)
4. Click "Continue to Analysis"
5. You should see the parsing progress

## What's Happening Behind the Scenes

When you click "Continue to Analysis":
1. ✅ Browser reads your files and converts to base64
2. ✅ Sends to Supabase edge function: `parse-deal-documents`
3. ❌ Edge function tries to call Claude AI (needs ANTHROPIC_API_KEY - optional for now)
4. ✅ Displays extracted data in review screen
5. ✅ Saves to deals table when you click "Confirm & Save Deal"

## Optional: AI Analysis with Claude

To enable automatic AI extraction:

### Get Anthropic API Key
1. Go to: https://console.anthropic.com/
2. Create account if needed
3. Navigate to **API Keys**
4. Create new API key (keep it secret!)

### Deploy Edge Function
```bash
cd "c:\Users\blkw\OneDrive\Documents\Github\Huge Capital\huge-capital-mgmt"
npx supabase functions deploy parse-deal-documents
```

### Set Environment Variable
1. Go to: https://supabase.com/dashboard/project/oymwsfyspdvbazklqkpm/functions
2. Click on `parse-deal-documents`
3. Go to **Settings** tab
4. Click **Secrets**
5. Add:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: (your Claude API key)
6. Click **Add Secret**

### Test AI Analysis
Now when you upload documents, the AI will automatically extract:
- Business name, EIN, address
- Loan amount and type
- Owner information
- Confidence scores
- Warnings and missing fields

## Troubleshooting

**"Failed to load deals" error**
→ Check that migrations were applied in step 3

**No "New Deal" button appears**
→ Check that `.env.local` has correct Supabase credentials

**Can't save deal**
→ Make sure you're logged in first (go to `/login`)

**"No data returned from parsing function" after clicking "Continue to Analysis"**
→ Edge function not deployed yet (optional feature - still works without it)

## What's Ready

✅ Frontend UI - Upload documents, review extracted data, save deals
✅ Database - All tables created with RLS policies
✅ Base64 file transmission - No Supabase Storage needed
✅ Deal creation and owner management

## What's Optional

⏳ AI document analysis (needs Anthropic API key)
⏳ Google Drive integration (nice to have)
⏳ Lender matching (next feature)

---

**Having issues?** Check the browser console (F12) for detailed error messages!

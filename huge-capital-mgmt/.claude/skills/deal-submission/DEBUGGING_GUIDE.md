# Deal Submission Debugging Guide

## 🐛 Current Issue: "Create deal record" Fails

### What We Know
- ✅ **Upload to Drive** completes successfully (7 documents)
- ✅ **Application parsing** completes successfully
- ❌ **Create deal record** fails with "An unexpected error occurred"
- ⏸️ **Bank statement analysis** doesn't run (blocked by previous failure)

### Performance Note
- The system uses **OpenAI API** for PDF parsing (faster, higher rate limits)
- **OpenAI**: 5 files at a time, 2-second delays = **~6 seconds for 7 files**
- **Anthropic fallback** (if OpenAI key missing): 1 file at a time, 40-second delays = **~280 seconds for 7 files**
- ✅ Your `OPENAI_API_KEY` is set in Supabase secrets

---

## 🔍 Enhanced Debugging (Just Added)

### Added Console Logging

I've added detailed console logging to help identify the exact error:

**Location**: [src/components/Deals/NewDealModal.tsx:389-394, 467-486](src/components/Deals/NewDealModal.tsx)

**What's Logged**:
1. **Application parsing result** (📄 emoji)
   - Extracted deal data
   - Owner information
   - Confidence scores
   - Warnings

2. **Deal insert attempt** (📝 emoji)
   - Complete data object being inserted
   - All field values before insert

3. **Deal insert error** (❌ emoji)
   - Error message
   - Error details
   - Error hint (from Postgres)
   - Error code

4. **Deal insert success** (✅ emoji)
   - Inserted deal record

---

## 📊 How to Debug (Step-by-Step)

### Step 1: Open Browser DevTools
1. Navigate to http://localhost:5176/deals
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Click "New Deal" button

### Step 2: Monitor Console Output

Watch for these log entries in sequence:

```
📄 Application parsing result: { deal: {...}, owners: [...], confidence: {...} }
📝 Attempting to insert deal record: { user_id: "...", legal_business_name: "...", ... }
```

If it **succeeds**, you'll see:
```
✅ Deal inserted successfully: { id: "...", legal_business_name: "...", ... }
```

If it **fails**, you'll see:
```
❌ Deal insert failed: PostgrestError { ... }
Error details: {
  message: "...",
  details: "...",
  hint: "...",
  code: "..."
}
```

### Step 3: Analyze the Error

Common error patterns:

#### Error: "duplicate key value violates unique constraint"
**Cause**: EIN already exists in database
**Solution**:
- Delete existing deal with same EIN
- Or use a different application document with unique EIN

#### Error: "new row violates check constraint"
**Cause**: Invalid value for a constrained field
**Possible fields**:
- `loan_type` - Must be 'MCA' or 'Business LOC'
- `status` - Must be valid DealStatus value
**Solution**: Check extracted data in console log

#### Error: "null value in column violates not-null constraint"
**Cause**: Required field is null
**Columns that are NOT NULL**:
- `legal_business_name`
- `ein`
- `address`
- `city`
- `state`
- `zip`
- `desired_loan_amount`
- `loan_type`
**Solution**: Check which field is null in the console log

#### Error: "permission denied for table deals"
**Cause**: RLS policy blocking insert
**Solution**: Check user authentication status
```javascript
// Run this in console:
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

---

## 🔧 Quick Fixes

### Fix 1: Invalid EIN Format
If extracted EIN is invalid (e.g., "000000000"), the parsing failed.

**Check**: Look at the 📄 Application parsing log
```javascript
deal: {
  ein: "000000000"  // ← This is a fallback value, means parsing failed
}
```

**Solution**: Use a clearer application PDF with readable EIN

### Fix 2: Missing Required Fields
If address/city/state are "Unknown" or "NA", parsing failed.

**Check**: Look at the 📄 Application parsing log
```javascript
deal: {
  address: "Unknown",  // ← Bad
  city: "Unknown",     // ← Bad
  state: "NA",         // ← Bad (not a valid state code)
  zip: "00000"         // ← Bad
}
```

**Solution**: Use a clearer application PDF

### Fix 3: RLS Policy Issue
If user is not authenticated, insert will fail.

**Check**: Look for authentication errors
**Solution**: Make sure you're logged in before clicking "New Deal"

---

## 🧪 Test with Sample Data

### Option 1: Use Real Documents
Upload clear, high-quality PDFs:
- 1 completed loan application (with visible EIN, address, etc.)
- 3 recent bank statements (Chase, BofA, or Wells Fargo preferred)

### Option 2: Manual Database Insert (Bypass Parsing)
If you want to test the database insert directly:

```javascript
// Run in browser console after opening /deals page
const { data, error } = await supabase
  .from('deals')
  .insert({
    legal_business_name: 'Test Company LLC',
    ein: '12-3456789',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    desired_loan_amount: 50000,
    loan_type: 'MCA',
    status: 'New'
  })
  .select()
  .single();

console.log('Insert result:', { data, error });
```

If this **succeeds**, the issue is with parsing.
If this **fails**, the issue is with database/RLS.

---

## 📋 Checklist for Next Test

Before retrying the deal submission:

- [ ] Browser DevTools Console is open (F12)
- [ ] Filter console to show only logs (hide warnings/errors from other sources)
- [ ] Dev server is running (`npm run dev`)
- [ ] You're logged in to the app
- [ ] You have clear, readable application PDF
- [ ] You have 2-3 bank statement PDFs

---

## 🚨 If All Else Fails

### Last Resort: Check Database Directly

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/oymwsfyspdvbazklqkpm
2. Click "Table Editor" → "deals" table
3. Try manually inserting a row
4. If manual insert fails, there's a schema/RLS issue

### Check RLS Policies

Run this in Supabase SQL Editor:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'deals';

-- Check policies
SELECT * FROM pg_policies
WHERE tablename = 'deals';
```

Expected: RLS should be enabled, and there should be an INSERT policy allowing authenticated users.

---

## 📞 Share These Logs

When reporting the issue, copy these from console:

1. **📄 Application parsing result** - Shows extracted data
2. **📝 Attempting to insert deal record** - Shows data being sent to DB
3. **❌ Deal insert failed** + **Error details** - Shows exact error

Example format:
```
Application parsing result: {...}
Deal insert attempt: {...}
Error: {...}
```

---

## 🎯 Expected Behavior

When working correctly, you should see:

```
📄 Application parsing result: {
  deal: {
    legal_business_name: "ABC Company LLC",
    ein: "12-3456789",
    address: "123 Main St",
    city: "New York",
    state: "NY",
    zip: "10001",
    desired_loan_amount: 50000,
    loan_type: "MCA",
    ...
  },
  owners: [
    { full_name: "John Doe", ... }
  ],
  confidence: { deal: 0.95, owners: [0.92] }
}

📝 Attempting to insert deal record: {
  user_id: "uuid-here",
  legal_business_name: "ABC Company LLC",
  ...
}

✅ Deal inserted successfully: { id: "new-uuid", ... }
```

Then the bank statement parsing would continue.

---

*Dev Server Running At: http://localhost:5176*
*Console Logs Added: 2025-11-17*

# Deal Submission Skills Documentation

## Overview
This skill suite automates the complete new deal submission workflow for the Huge Capital dashboard, from document upload through final deal record creation.

## Skill Structure

```
.claude/skills/deal-submission/
├── deal-submission.skill          # Main orchestrator skill (full workflow)
├── sub-skills/                    # Individual step skills (optional)
│   ├── upload-documents.skill     # Step 1: Google Drive upload
│   ├── parse-application.skill    # Step 2: Extract business/owner data
│   ├── parse-bank-statements.skill # Step 3: Extract financial metrics
│   └── create-deal-record.skill   # Step 4: Save to database
└── README.md                      # This file
```

## When to Use Which Skill

### Use Main Skill (`deal-submission.skill`)
✅ **Best for:** Complete new deal submissions from start to finish
- User clicks "New Deal" button and uploads documents
- Want automated end-to-end processing
- Need consistent workflow with progress tracking
- First-time deal submissions

### Use Sub-Skills (Individually)
✅ **Best for:** Granular control or re-processing specific steps
- Re-parse application after getting better document
- Add/update bank statements to existing deal
- Re-upload documents that failed
- Test individual parsing accuracy
- Manual override workflows

---

## Quick Start

### Full Deal Submission (Recommended)
```typescript
// In your React component
import { useDealSubmission } from '@/hooks/useDealSubmission';

const NewDealModal = () => {
  const { submitDeal, progress, error } = useDealSubmission();

  const handleSubmit = async (files: File[]) => {
    const result = await submitDeal({
      files,
      userId: currentUser.id,
      loanType: selectedLoanType
    });

    if (result.success) {
      navigate(`/deals/${result.dealId}`);
    }
  };

  return (
    <div>
      <FileUpload onUpload={handleSubmit} />
      {progress.step && (
        <ProgressBar current={progress.step} total={7} />
      )}
    </div>
  );
};
```

### Individual Step Control
```typescript
// Parse application only
import { parseApplication } from '@/services/dealSubmission';

const handleReparse = async (fileUrl: string) => {
  const result = await parseApplication({
    applicationFileUrl: fileUrl,
    fileType: 'pdf'
  });

  if (result.confidence < 0.7) {
    showManualReviewForm(result.businessInfo);
  } else {
    prefillForm(result.businessInfo);
  }
};
```

---

## Workflow Steps

### Main Skill Workflow (7 Steps)

1. **Upload Documents to Google Drive** ⏱️ ~10s
   - Creates folder: `{YYYY-MM-DD}_{BusinessName}`
   - Uploads all files to Drive
   - Returns folder URL

2. **Parse Application Document** ⏱️ ~15s
   - Extracts business info (name, EIN, address, etc.)
   - Extracts owner data (1-2 owners)
   - Returns confidence score

3. **Parse Bank Statements** ⏱️ ~20s
   - Extracts financial metrics per statement
   - Detects funding positions
   - Calculates 3-month averages

4. **Create Deal in Database** ⏱️ ~5s
   - Inserts into `deals` table
   - Inserts into `deal_owners` table
   - Inserts into `deal_bank_statements` table
   - Inserts into `deal_funding_positions` table

5. **Lender Recommendations** 🚧 *(Coming Soon)*
   - Matches deal to suitable lenders
   - AI ranking with scores

6. **Prepare Submissions** 🚧 *(Coming Soon)*
   - Generates email templates
   - Creates submission packages

7. **Final Deal Record Update** ⏱️ ~2s
   - Updates status to "Ready for Matching"
   - Triggers UI refresh

**Total Estimated Time:** ~50-60 seconds

---

## Integration Points

### Frontend Components
```
src/pages/Deals.tsx               # Main deals pipeline page
src/components/NewDealModal.tsx   # Deal submission form (create this)
src/components/DocumentUpload.tsx # File upload component (create this)
```

### Backend Services
```
src/services/googleDrive.ts       # Google Drive API wrapper (exists)
src/services/dealSubmission.ts    # Deal submission orchestration (create this)
src/hooks/useDealSubmission.ts    # React hook for submissions (create this)
```

### Edge Functions
```
supabase/functions/parse-application/       # Application parsing
supabase/functions/parse-bank-statements/   # Statement parsing
supabase/functions/validate-deal-data/      # Data validation
supabase/functions/match-lenders/           # Lender matching (future)
supabase/functions/prepare-submissions/     # Submission prep (future)
```

### Database Tables
```sql
deals                    # Main deal records
deal_owners              # Owner information
deal_bank_statements     # Statement metrics
deal_funding_positions   # Detected lender payments
deal_lender_matches      # Match results (future)
```

---

## Configuration

### Environment Variables Required
```bash
# Supabase
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Google Drive (stored in Supabase secrets)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GOOGLE_DRIVE_PARENT_FOLDER_ID=1Y_DKpj6FrZ0y1LqCRv1Rd83qB9H7vCQE

# Claude API (stored in Supabase secrets)
ANTHROPIC_API_KEY=sk-ant-...
```

### Service Account Setup
See [docs/GOOGLE_DRIVE_SETUP.md](../../../docs/GOOGLE_DRIVE_SETUP.md) for detailed setup instructions.

---

## Error Handling

### Common Errors & Solutions

**"Permission denied" (Google Drive)**
- Verify service account has Editor access to parent folder
- Check folder ID is correct: `1Y_DKpj6FrZ0y1LqCRv1Rd83qB9H7vCQE`

**"Low confidence score" (Parsing)**
- Show manual review form to user
- Allow corrections before saving
- Re-parse with higher quality scan

**"Duplicate EIN" (Database)**
- Ask user if updating existing deal
- Offer to view existing deal
- Suggest using different business entity

**"Missing required fields"**
- Highlight missing fields in form
- Request additional documents
- Allow partial save with "Needs Review" status

### Retry Logic
- Google Drive uploads: 3 retries with exponential backoff
- Edge function calls: 2 retries on timeout
- Database transactions: Automatic rollback on failure

---

## Testing

### Unit Tests (Create These)
```typescript
// tests/skills/deal-submission.test.ts
describe('Deal Submission Skill', () => {
  it('should upload documents to Google Drive', async () => {
    const result = await uploadDocuments({...});
    expect(result.folderId).toBeDefined();
  });

  it('should parse application with high confidence', async () => {
    const result = await parseApplication({...});
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('should create complete deal record', async () => {
    const result = await createDealRecord({...});
    expect(result.success).toBe(true);
  });
});
```

### Integration Test
```bash
# Test with sample documents
cd scripts/test
node test-deal-submission.js
```

### Manual Test Checklist
- [ ] Upload 1 application + 3 bank statements
- [ ] Verify Google Drive folder created
- [ ] Check application data extracted correctly
- [ ] Verify bank statement metrics calculated
- [ ] Confirm funding positions detected
- [ ] Check all database records created
- [ ] Verify UI shows new deal in pipeline

---

## Performance Optimization

### Parallel Processing
Steps 2 & 3 can run in parallel:
```typescript
const [appResult, bankResult] = await Promise.all([
  parseApplication({...}),
  parseBankStatements({...})
]);
```
**Time Savings:** ~15-20 seconds

### Caching Strategy
- Cache parsed document text in localStorage
- Only re-parse if user uploads new file
- Store intermediate results during multi-step form

### Progress Tracking
Emit events after each step:
```typescript
onProgress({ step: 1, total: 7, message: 'Uploading documents...' });
onProgress({ step: 2, total: 7, message: 'Parsing application...' });
// etc.
```

---

## Cost Estimation

### Per Deal Submission
- **Claude API calls:**
  - Application parsing: ~$0.15 (1 call, ~10k tokens)
  - Bank statements (3): ~$0.30 (3 calls, ~8k tokens each)
  - Data validation: ~$0.10 (1 call, ~5k tokens)
  - **Total AI cost:** ~$0.55 per deal

- **Google Drive API:** Free (within quotas)
- **Supabase:** Included in plan

### Monthly Estimates (50 deals/month)
- AI processing: ~$27.50/month
- Storage (Google Drive): Free
- Database: Included in Supabase plan
- **Total:** ~$27.50/month

---

## Future Enhancements

### Step 5: Lender Recommendations
- [ ] Implement rule-based filtering
- [ ] Add AI ranking with Claude
- [ ] Create lender match UI components
- [ ] Store matches in `deal_lender_matches` table

### Step 6: Submission Preparation
- [ ] Generate email templates
- [ ] Create submission checklists
- [ ] Add mailto: link generation
- [ ] Implement email sending (SendGrid)

### Additional Features
- [ ] Batch deal submissions
- [ ] Document version control
- [ ] Audit logging
- [ ] Deal analytics dashboard
- [ ] Export to Google Sheets
- [ ] Multi-broker collaboration

---

## Support

### Documentation
- [Main Project Docs](../../../docs/)
- [Google Drive Setup](../../../docs/GOOGLE_DRIVE_SETUP.md)
- [Database Schema](../../../docs/PROJECT_STRUCTURE.md)
- [Deal Progress](../../../Deals Page/DEALS_PROGRESS.md)

### Edge Function Code
- [parse-application](../../../supabase/functions/parse-application/)
- [parse-bank-statements](../../../supabase/functions/parse-bank-statements/)
- [validate-deal-data](../../../supabase/functions/validate-deal-data/)

### Troubleshooting
For issues, check:
1. Supabase logs: `supabase functions logs parse-application`
2. Browser console for frontend errors
3. Google Drive API quota limits
4. Claude API rate limits

---

## Changelog

### 2025-11-17
- ✅ Created main `deal-submission.skill`
- ✅ Created 4 sub-skills for granular control
- ✅ Added comprehensive documentation
- 📋 Ready for integration testing

### Next Steps
1. Create `src/hooks/useDealSubmission.ts` React hook
2. Build `NewDealModal.tsx` component
3. Test with real documents
4. Implement Steps 5-6 (lender matching, submissions)

---

## License
Internal use only - Huge Capital Dashboard

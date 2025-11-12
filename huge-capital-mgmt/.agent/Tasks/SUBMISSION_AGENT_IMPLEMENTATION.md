# Submission Agent - Implementation Guide

## Quick Reference

**Status:** Phase 0 (Not yet implemented)
**Implementation Location:** `supabase/functions/submit-deal-to-lender/index.ts` (create new)
**Model:** Claude 3.5 Sonnet (claude-3-5-sonnet-20250514)
**API Key:** ANTHROPIC_API_KEY (shared)
**Services Needed:** Gmail API (for email submissions)
**Database:** deal_lender_matches table

---

## Architecture Decision: MCP + Code Execution

This agent will use **Direct Tool Calling** (not MCP + Code) because:
- ✅ Simple, straightforward workflow (select lender → format → send)
- ✅ Limited tools (email, portal, database)
- ✅ Clear sequential steps
- ✅ Real-time user interaction (broker approval)

### Implementation Steps:
1. Create email formatting tools
2. Create Gmail API integration
3. Create submission tracking
4. Implement agent loop

---

## Phase 1: Create Edge Function Scaffolding

### File Structure
```
supabase/functions/submit-deal-to-lender/
├── index.ts                 # Main handler
├── deno.json               # Deno config
├── tools/
│   ├── email/
│   │   ├── formatSubmissionEmail.ts
│   │   ├── sendViaGmail.ts
│   │   └── sendFollowUp.ts
│   ├── portals/
│   │   ├── kalamataPortal.ts
│   │   └── genericPortal.ts
│   ├── database/
│   │   ├── trackSubmission.ts
│   │   ├── updateSubmissionStatus.ts
│   │   └── getSubmissionDetails.ts
│   └── notifications/
│       └── notifyBroker.ts
└── templates/
    ├── mca-submission-email.md
    ├── blc-submission-email.md
    └── sba-submission-email.md
```

### deno.json
```json
{
  "imports": {
    "https://deno.land/std@0.208.0/": "https://deno.land/std@0.208.0/",
    "supabase": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

### Base index.ts Structure
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface SubmissionRequest {
  dealId: string;
  userId: string;
  lenderId: string;
  lenderName: string;
  lenderTable: string;
  lenderEmail: string;
  submissionMethod: 'email' | 'portal';
  customMessage?: string;
}

interface SubmissionResult {
  submissionId: string;
  dealId: string;
  lenderId: string;
  status: 'submitted' | 'pending_response' | 'failed';
  submittedAt: string;
  submissionMethod: 'email' | 'portal';
  confirmationNumber?: string;
  trackingUrl: string;
  brokerNotification: {
    sent: boolean;
    timestamp?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    });
  }

  try {
    const requestBody = await req.json();
    const {
      dealId,
      userId,
      lenderId,
      lenderName,
      lenderEmail,
      submissionMethod,
      customMessage,
    } = requestBody;

    if (!dealId || !userId || !lenderId || !lenderEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Call Claude to format and manage submission
    // [Implementation follows below]

    return new Response(
      JSON.stringify(submissionResult),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error submitting deal:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Phase 2: Implement Email Tools

### Email Formatting Tool

#### tools/email/formatSubmissionEmail.ts
```typescript
export interface EmailPackage {
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: Array<{
    filename: string;
    content: string; // Base64
    mimeType: string;
  }>;
}

export interface SubmissionDeal {
  dealId: string;
  businessName: string;
  businessType: string;
  loanAmount: number;
  loanType: string;
  owners: Array<{
    full_name: string;
    phone?: string;
    email?: string;
  }>;
  averageMonthSales: number;
  address: string;
  city: string;
  state: string;
}

export function formatMcaSubmissionEmail(
  deal: SubmissionDeal,
  brokerName: string,
  brokerEmail: string,
  lenderName: string
): EmailPackage {
  const subject = `[Huge Capital] MCA Deal Submission - ${deal.businessName} - $${deal.loanAmount.toLocaleString()}`;

  const body = `Dear ${lenderName} Team,

I hope this message finds you well. I'm submitting a business for your MCA program review.

DEAL SUMMARY:
${dealSummary(deal)}

BUSINESS OWNER(S):
${ownerSummary(deal.owners)}

LOAN REQUEST:
Type: ${deal.loanType}
Amount: $${deal.loanAmount.toLocaleString()}
Purpose: Working capital and business expansion

SUPPORTING DOCUMENTS:
- Business Loan Application
- 6-Month Bank Statements
- Business Tax Returns (2 years)
- Business Registration Documents

This deal is being submitted for your standard review process. All requested documentation is provided in the attached package.

Please confirm receipt of this submission and provide your initial review timeline.

Thank you for your consideration. I look forward to working together on this opportunity.

Regards,
${brokerName}
Huge Capital
${brokerEmail}
--
Deal Tracking: https://hugecapital.com/deals/${deal.dealId}
Submission Reference: SUBMIT-${deal.dealId.substring(0, 8).toUpperCase()}`;

  return {
    to: lenderName,
    subject,
    body,
    htmlBody: formatHtmlEmail(deal, brokerName, lenderName),
    attachments: [],
  };
}

function dealSummary(deal: SubmissionDeal): string {
  return `Business Name: ${deal.businessName}
Entity Type: ${deal.businessType}
Address: ${deal.address}, ${deal.city}, ${deal.state}
Monthly Revenue: $${deal.averageMonthSales.toLocaleString()}
Time in Business: [From statements]`;
}

function ownerSummary(owners: SubmissionDeal['owners']): string {
  return owners
    .map(
      (owner, i) =>
        `Owner ${i + 1}: ${owner.full_name}${owner.email ? `\nEmail: ${owner.email}` : ''}${owner.phone ? `\nPhone: ${owner.phone}` : ''}`
    )
    .join('\n\n');
}

function formatHtmlEmail(
  deal: SubmissionDeal,
  brokerName: string,
  lenderName: string
): string {
  return `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h2>Deal Submission from Huge Capital</h2>

    <h3>Deal Summary</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Business Name</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${deal.businessName}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Loan Amount</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">$${deal.loanAmount.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Monthly Revenue</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">$${deal.averageMonthSales.toLocaleString()}</td>
      </tr>
    </table>

    <h3>Contact</h3>
    <p>
      Submitted by: ${brokerName}<br>
      Email: <a href="mailto:${brokerName}">${brokerName}</a>
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="font-size: 12px; color: #666;">
      Submission Reference: SUBMIT-${deal.dealId.substring(0, 8).toUpperCase()}<br>
      Tracking: <a href="https://hugecapital.com/deals/${deal.dealId}">View on Huge Capital Dashboard</a>
    </p>
  </div>
</body>
</html>`;
}

export function formatBlcSubmissionEmail(
  deal: SubmissionDeal,
  brokerName: string,
  brokerEmail: string,
  lenderName: string
): EmailPackage {
  // Similar to MCA but with LOC-specific language
  // [Implementation similar pattern]
}

export function formatSbaSubmissionEmail(
  deal: SubmissionDeal,
  brokerName: string,
  brokerEmail: string,
  lenderName: string
): EmailPackage {
  // SBA-specific format with additional requirements
  // [Implementation similar pattern]
}
```

### Gmail Submission Tool

#### tools/email/sendViaGmail.ts
```typescript
export interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export async function sendViaGmail(
  email: EmailPackage,
  credentials: GmailCredentials
): Promise<{
  messageId: string;
  threadId: string;
  timestamp: string;
}> {
  // Get access token from refresh token
  const accessToken = await refreshGmailAccessToken(credentials);

  // Build MIME message
  const mimeMessage = buildMimeMessage(email);

  // Send via Gmail API
  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: mimeMessage,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gmail API error:', error);
    throw new Error(`Failed to send email: ${response.status}`);
  }

  const result = await response.json();
  return {
    messageId: result.id,
    threadId: result.threadId,
    timestamp: new Date().toISOString(),
  };
}

async function refreshGmailAccessToken(credentials: GmailCredentials): Promise<string> {
  // Implementation depends on how we store Gmail credentials
  // For now, assume it's available from Supabase secrets or environment
  const refreshToken = Deno.env.get('GMAIL_REFRESH_TOKEN');
  if (!refreshToken) {
    throw new Error('GMAIL_REFRESH_TOKEN not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GMAIL_CLIENT_ID') || '',
      client_secret: Deno.env.get('GMAIL_CLIENT_SECRET') || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Gmail token');
  }

  const data = await response.json();
  return data.access_token;
}

function buildMimeMessage(email: EmailPackage): string {
  const boundary = 'boundary' + Math.random().toString(36).substring(7);

  let mimeMessage = `To: ${email.to}\r\n`;
  mimeMessage += `Subject: ${email.subject}\r\n`;
  mimeMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

  // Body
  mimeMessage += `--${boundary}\r\n`;
  mimeMessage += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
  mimeMessage += email.body + '\r\n';

  // HTML Body (if provided)
  if (email.htmlBody) {
    mimeMessage += `\r\n--${boundary}\r\n`;
    mimeMessage += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
    mimeMessage += email.htmlBody + '\r\n';
  }

  // Attachments
  if (email.attachments) {
    for (const attachment of email.attachments) {
      mimeMessage += `\r\n--${boundary}\r\n`;
      mimeMessage += `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"\r\n`;
      mimeMessage += `Content-Transfer-Encoding: base64\r\n`;
      mimeMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n\r\n`;
      mimeMessage += attachment.content + '\r\n';
    }
  }

  mimeMessage += `\r\n--${boundary}--`;

  // Base64 encode
  return btoa(mimeMessage);
}
```

### Follow-up Tool

#### tools/email/sendFollowUp.ts
```typescript
export async function sendFollowUp(
  submissionId: string,
  dealId: string,
  lenderName: string,
  lenderEmail: string,
  brokerName: string,
  brokerEmail: string
): Promise<void> {
  const subject = `[Follow-up] Deal Submission Status Check`;

  const body = `Dear ${lenderName},

I wanted to follow up on the deal submission I sent on [Original Date].

Deal: [Business Name]
Submission Reference: SUBMIT-${dealId.substring(0, 8).toUpperCase()}
Loan Amount: $[Amount]

Have you had a chance to review this deal? I'd appreciate any updates on:
- Current status of review
- Any additional documentation needed
- Expected timeline for initial decision

Please let me know if you have any questions or need clarification on any aspect of the application.

Thank you for your attention to this matter.

Regards,
${brokerName}
Huge Capital
${brokerEmail}`;

  // Send via Gmail
  // [Uses sendViaGmail function above]
}
```

---

## Phase 3: Implement Submission Agent Logic

### Main Agent Loop

```typescript
// In index.ts main handler

const systemPrompt = `You are a Deal Submission Specialist for Huge Capital.

YOUR ROLE:
Submit business deals to lenders via email, manage submissions, and track responses.
You have access to Gmail API for sending professional submission emails.

RESPONSIBILITIES:
1. Receive deal data and lender selection from broker
2. Format professional submission email with all required documents
3. Send via Gmail to lender's submission email address
4. Track submission in database
5. Set up follow-up reminders
6. Monitor for lender responses
7. Update broker with status changes

SUBMISSION WORKFLOW:
1. Broker selects lender from recommendations
2. You format professional submission email:
   - Professional greeting
   - Clear deal summary (business name, loan amount, type)
   - Owner information
   - Supporting documents list
   - Huge Capital contact information
   - Deal tracking link
3. Send email via Gmail API
4. Create submission record in database
5. Mark submission as "Submitted"
6. Schedule follow-up for 48 hours

EMAIL TEMPLATES:
- MCA Submissions: Emphasize cash flow analysis, quick funding
- Business LOC: Highlight credit profile, business stability
- SBA: Include detailed compliance information

LENDER-SPECIFIC DETAILS:
- Kalamata MCA: Fast turnaround, minimal docs, focuses on monthly revenue
- Balboa Capital: Traditional requirements, 5-7 day review
- [Others TBD]

FOLLOW-UP PROTOCOL:
- 48 hours: Send initial follow-up if no response
- 72 hours: Call lender if email unread
- 5 days: Check for decision, escalate if needed

RESPONSE TRACKING:
- Monitor for "viewed" status on submitted email
- Track any "docs requested" responses
- Update submission status in database
- Notify broker of any changes

EXAMPLES:
Broker selects Kalamata for $200K MCA
→ Format: Professional email with deal summary
→ Send: Via Gmail to Kalamata deal submission address
→ Track: Create submission record, set 48hr follow-up
→ Notify: Broker gets confirmation email

RULES:
- ALWAYS send professional, formatted emails
- NEVER include sensitive data unencrypted
- ALWAYS get broker confirmation before submitting
- Include proper tracking references
- Document all lender communications
- Respect lender-specific submission requirements`;

const userPrompt = `Process deal submission:

DEAL:
${deal.businessName} - $${deal.desiredLoanAmount}

LENDER:
${lenderName} (${lenderTable})
Submission Email: ${lenderEmail}

BROKER:
${brokerName}
${brokerEmail}

ACTION:
1. Format submission email with deal details
2. Send via Gmail
3. Track submission
4. Confirm to broker

CUSTOM MESSAGE: ${customMessage || 'None'}`;

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  }),
});

if (!response.ok) {
  const errorText = await response.text();
  console.error('Anthropic API error:', errorText);
  throw new Error(`Anthropic API error: ${response.status}`);
}

const data = await response.json();
const content = data.content[0].text;
// Parse response and execute submission
```

---

## Phase 4: Database Tracking

### tools/database/trackSubmission.ts
```typescript
import { createClient } from 'supabase';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

export async function trackSubmission(
  dealId: string,
  lenderId: string,
  submissionResult: {
    messageId: string;
    threadId: string;
    timestamp: string;
  }
): Promise<string> {
  const { data, error } = await supabase
    .from('deal_submissions')
    .insert({
      deal_id: dealId,
      lender_id: lenderId,
      status: 'submitted',
      submission_date: submissionResult.timestamp,
      gmail_message_id: submissionResult.messageId,
      gmail_thread_id: submissionResult.threadId,
      next_follow_up: new Date(
        new Date(submissionResult.timestamp).getTime() + 48 * 60 * 60 * 1000
      ).toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: 'submitted' | 'pending_response' | 'docs_requested' | 'approved' | 'declined'
): Promise<void> {
  const { error } = await supabase
    .from('deal_submissions')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) throw error;
}
```

---

## Testing & Validation

### Test Case 1: Email Submission
```
Input:
{
  dealId: "test-001",
  userId: "user-123",
  lenderId: "kalamata-001",
  lenderName: "Kalamata",
  lenderEmail: "deals@kalamata.com",
  submissionMethod: "email"
}

Expected:
✅ Email formatted correctly
✅ Sent via Gmail API
✅ Submission tracked in database
✅ Broker notified with confirmation
✅ Follow-up scheduled for 48 hours
```

### Test Case 2: Follow-up Trigger
```
Input:
- Submission created 48+ hours ago
- No response received

Expected:
✅ Follow-up email triggered
✅ Status updated to "pending_response"
✅ Broker notified
✅ Next follow-up scheduled 24 hours later
```

---

## Deployment Checklist

- [ ] Create `supabase/functions/submit-deal-to-lender/` directory
- [ ] Implement email formatting tools
- [ ] Set up Gmail API credentials
- [ ] Implement submission agent logic
- [ ] Add database tracking
- [ ] Create database table: `deal_submissions`
- [ ] Test email submission locally
- [ ] Deploy: `npx supabase functions deploy submit-deal-to-lender`
- [ ] Configure Gmail credentials in secrets
- [ ] Test end-to-end submission
- [ ] Add to UI: "Submit to Lender" button

---

## Gmail API Setup (Future Phase)

For production Gmail integration:

1. **Create Google Cloud Project**
   - Enable Gmail API
   - Create OAuth 2.0 credentials

2. **Configure Scopes**
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly` (for tracking)

3. **Store Credentials in Supabase Secrets**
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REFRESH_TOKEN`

4. **Set up Service Account**
   - Or delegate to user account with impersonation

---

## Next Steps

1. ✅ Create edge function scaffold
2. ⏳ Implement email formatting tools
3. ⏳ Implement Gmail integration
4. ⏳ Implement submission agent logic
5. ⏳ Add database tracking
6. ⏳ Test with real lenders
7. ⏳ Implement portal submissions (future)
8. ⏳ Add follow-up automation

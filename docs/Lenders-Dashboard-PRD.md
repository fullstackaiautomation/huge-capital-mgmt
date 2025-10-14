# Lenders Dashboard PRD - Epic 2
## Product Requirements Document (Brownfield)

**Document Version**: 1.0
**Date**: January 14, 2025
**Status**: Ready for Development
**Epic ID**: LD-001
**Priority**: P0 (Critical Path)

---

## 📋 EXECUTIVE SUMMARY

### Overview
The Lenders Dashboard is a comprehensive lender relationship management system that centralizes all lender data, program information, contact management, and performance tracking. This brownfield PRD outlines the implementation of Epic 2 within the existing Huge Capital Dashboard ecosystem.

### Business Context
**Current Pain Points**:
- Lender data scattered across Google Sheets, emails, and notes
- Manual search and filtering requires significant time
- No centralized contact management or communication history
- Difficulty tracking lender performance and success rates
- No structured program comparison capabilities

**Value Proposition**:
- **Single Source of Truth**: Centralize all lender data in one accessible location
- **Intelligent Search**: Find the right lender in seconds, not minutes
- **Relationship Management**: Track all interactions and optimize partnerships
- **Data Integrity**: Two-way Google Sheets sync maintains familiar workflow
- **Foundation for Automation**: Enables intelligent deal-to-lender matching (Epic 3)

### Success Metrics
| Metric | Current State | Target State | Timeline |
|--------|---------------|--------------|----------|
| Time to find suitable lender | 10-15 minutes | < 30 seconds | Week 7 |
| Lender database completeness | 60% (scattered) | 95% (centralized) | Week 5 |
| Data accuracy | ~85% (manual entry) | 99%+ (validated) | Week 6 |
| Search queries per day | N/A (manual) | 50+ (automated) | Week 7 |

---

## 🎯 PRODUCT GOALS & OBJECTIVES

### Primary Goals
1. **Centralization**: Create a single, authoritative lender database
2. **Efficiency**: Reduce time spent searching for lenders by 90%
3. **Data Quality**: Maintain 99%+ accuracy through validation and sync
4. **Scalability**: Support 200+ lenders with sub-second search performance
5. **Integration**: Seamless Google Sheets sync for team familiarity

### Strategic Alignment
- **Enables Epic 3**: Lender data is prerequisite for intelligent deal matching
- **Operational Excellence**: Core component of "reduce manual tasks by 80%" goal
- **User Empowerment**: Team can independently find and evaluate lenders
- **Foundation for Analytics**: Structured data enables performance insights

---

## 👥 USER PERSONAS & USE CASES

### Primary Persona: Loan Officer / Funding Team Member

**Profile**:
- Daily operations focus
- Processes 5-15 deals per week
- Maintains relationships with 30-50 active lenders
- Needs fast access to lender requirements and contacts

**Jobs to Be Done**:
1. "When I receive a new deal, I need to quickly find lenders who accept this type of loan"
2. "When a lender updates their programs, I need to update our records immediately"
3. "When I need to contact a lender, I need their preferred contact and recent history"
4. "When evaluating a lender, I need to see their historical success rate"

**Critical User Flows**:

#### Flow 1: Find Suitable Lenders for a Deal
```
1. User opens Lenders Dashboard
2. Enters search criteria (loan amount: $500K, credit score: 680, property type: multifamily)
3. System returns 8 matching lenders in < 1 second
4. User reviews requirements and success rates
5. User selects top 3 lenders
6. User accesses contact information
7. User initiates communication
```

#### Flow 2: Add New Lender
```
1. User clicks "Add Lender" button
2. Fills in company information
3. Adds program details (repeatable for multiple programs)
4. Adds contacts (repeatable)
5. Sets requirements and criteria
6. Saves to database
7. System syncs to Google Sheets
8. Confirmation displayed
```

#### Flow 3: Update Lender Program
```
1. User searches for lender
2. Opens lender detail view
3. Navigates to Programs tab
4. Edits interest rate or requirements
5. Saves changes
6. System logs change history
7. Syncs to Google Sheets
8. Team notification (optional)
```

---

## 🔧 EXISTING SYSTEM INTEGRATION

### Current Architecture (Brownfield Context)

**Existing Foundation**:
```
Frontend:
├── React + TypeScript + Vite
├── Tailwind CSS for styling
├── Lucide React for icons
├── Existing routing structure
└── Protected routes with Supabase auth

Backend:
├── Supabase PostgreSQL database
├── Row-level security (RLS) policies
├── Real-time subscriptions capability
└── Supabase Storage for documents

Patterns Established:
├── Custom hooks pattern (useContentPlanner.ts)
├── Transform functions for DB ↔ App data
├── Component structure in src/components/
├── Page structure in src/pages/
└── Type definitions in src/types/
```

**Integration Points**:
1. **Navigation**: Add "Lenders" to existing sidebar navigation
2. **Authentication**: Reuse existing Supabase auth context
3. **Database**: Add new tables to existing Supabase project
4. **Styling**: Follow established dark theme + brand-500 orange
5. **Patterns**: Mirror ContentPlanner component structure

### Technology Decisions

**Consistency with Existing Stack**:
- ✅ React + TypeScript (existing)
- ✅ Tailwind CSS + Lucide icons (existing)
- ✅ Supabase for backend (existing)
- ✅ Custom hooks for data fetching (established pattern)
- ✅ Transform functions for DB mapping (established pattern)

**New Dependencies Required**:
```json
{
  "googleapis": "^134.0.0",           // Google Sheets API
  "react-query": "^3.39.3",           // Caching & optimistic updates
  "react-hook-form": "^7.52.0",       // Form management
  "zod": "^3.23.0",                   // Schema validation
  "lodash.debounce": "^4.0.8"         // Search debouncing
}
```

**Architectural Patterns**:
```
src/
├── components/
│   └── Lenders/                    ← NEW
│       ├── LenderList.tsx
│       ├── LenderDetail.tsx
│       ├── LenderForm.tsx
│       ├── ProgramManager.tsx
│       ├── ContactManager.tsx
│       └── SearchFilters.tsx
├── hooks/
│   └── useLenders.ts               ← NEW
├── services/
│   └── googleSheetsSync.ts         ← NEW
├── types/
│   └── lender.ts                   ← NEW
└── pages/
    └── Lenders.tsx                 ← NEW
```

---

## 📊 FUNCTIONAL REQUIREMENTS

### Feature 1: Lender Database Schema & Setup

**Database Schema**:

```sql
-- Main lenders table
CREATE TABLE lenders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  website TEXT,
  company_type TEXT CHECK (company_type IN ('bank', 'credit_union', 'private_lender', 'hard_money', 'institutional', 'other')),
  headquarters_location TEXT,
  geographic_coverage TEXT[], -- Array of states/regions
  license_numbers JSONB,
  status TEXT CHECK (status IN ('active', 'inactive', 'pending', 'archived')) DEFAULT 'active',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_synced TIMESTAMP WITH TIME ZONE
);

-- Programs table (one-to-many with lenders)
CREATE TABLE lender_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id UUID REFERENCES lenders(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  loan_types TEXT[], -- ['commercial', 'residential', 'bridge', 'construction']
  min_loan_amount DECIMAL(15,2),
  max_loan_amount DECIMAL(15,2),
  min_credit_score INTEGER,
  min_dscr DECIMAL(4,2),
  max_ltv DECIMAL(5,2),
  property_types TEXT[], -- ['single_family', 'multifamily', 'commercial', 'land']
  interest_rate_min DECIMAL(5,3),
  interest_rate_max DECIMAL(5,3),
  rate_type TEXT CHECK (rate_type IN ('fixed', 'variable', 'hybrid')),
  term_months INTEGER,
  closing_days INTEGER,
  requirements JSONB,
  special_features TEXT[],
  status TEXT CHECK (status IN ('active', 'paused', 'discontinued')) DEFAULT 'active',
  effective_date DATE,
  expiration_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table (one-to-many with lenders)
CREATE TABLE lender_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id UUID REFERENCES lenders(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'mobile', 'text')),
  is_primary BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication log (one-to-many with lenders)
CREATE TABLE lender_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id UUID REFERENCES lenders(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES lender_contacts(id) ON DELETE SET NULL,
  communication_type TEXT CHECK (communication_type IN ('email', 'phone', 'meeting', 'text', 'other')),
  subject TEXT,
  summary TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  direction TEXT CHECK (direction IN ('outbound', 'inbound')),
  outcome TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance tracking (one-to-one with lenders)
CREATE TABLE lender_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lender_id UUID REFERENCES lenders(id) ON DELETE CASCADE UNIQUE,
  total_deals_submitted INTEGER DEFAULT 0,
  total_deals_approved INTEGER DEFAULT 0,
  total_deals_funded INTEGER DEFAULT 0,
  approval_rate DECIMAL(5,2), -- Calculated field
  average_approval_days INTEGER,
  average_closing_days INTEGER,
  total_funded_amount DECIMAL(15,2) DEFAULT 0,
  last_deal_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_lenders_company_name ON lenders(company_name);
CREATE INDEX idx_lenders_status ON lenders(status);
CREATE INDEX idx_lenders_type ON lenders(company_type);
CREATE INDEX idx_programs_lender_id ON lender_programs(lender_id);
CREATE INDEX idx_programs_status ON lender_programs(status);
CREATE INDEX idx_programs_loan_amount ON lender_programs(min_loan_amount, max_loan_amount);
CREATE INDEX idx_programs_credit_score ON lender_programs(min_credit_score);
CREATE INDEX idx_contacts_lender_id ON lender_contacts(lender_id);
CREATE INDEX idx_contacts_email ON lender_contacts(email);
CREATE INDEX idx_communications_lender_id ON lender_communications(lender_id);
CREATE INDEX idx_communications_date ON lender_communications(date DESC);

-- Full-text search
CREATE INDEX idx_lenders_search ON lenders USING GIN(to_tsvector('english', company_name || ' ' || COALESCE(notes, '')));

-- RLS Policies
ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all lenders" ON lenders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create lenders" ON lenders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update lenders" ON lenders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete lenders" ON lenders FOR DELETE TO authenticated USING (true);

-- (Similar policies for other tables)

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lenders_updated_at BEFORE UPDATE ON lenders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON lender_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON lender_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**TypeScript Types**:
```typescript
// src/types/lender.ts

export type LenderCompanyType = 'bank' | 'credit_union' | 'private_lender' | 'hard_money' | 'institutional' | 'other';
export type LenderStatus = 'active' | 'inactive' | 'pending' | 'archived';
export type ProgramStatus = 'active' | 'paused' | 'discontinued';
export type RateType = 'fixed' | 'variable' | 'hybrid';
export type ContactMethod = 'email' | 'phone' | 'mobile' | 'text';
export type CommunicationType = 'email' | 'phone' | 'meeting' | 'text' | 'other';
export type CommunicationDirection = 'outbound' | 'inbound';

export interface Lender {
  id: string;
  companyName: string;
  website?: string;
  companyType: LenderCompanyType;
  headquartersLocation?: string;
  geographicCoverage: string[];
  licenseNumbers?: Record<string, string>;
  status: LenderStatus;
  rating?: number; // 1-5 stars
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastSynced?: string;
}

export interface LenderProgram {
  id: string;
  lenderId: string;
  programName: string;
  loanTypes: string[];
  minLoanAmount?: number;
  maxLoanAmount?: number;
  minCreditScore?: number;
  minDscr?: number;
  maxLtv?: number;
  propertyTypes: string[];
  interestRateMin?: number;
  interestRateMax?: number;
  rateType: RateType;
  termMonths?: number;
  closingDays?: number;
  requirements?: Record<string, any>;
  specialFeatures: string[];
  status: ProgramStatus;
  effectiveDate?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LenderContact {
  id: string;
  lenderId: string;
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  preferredContactMethod?: ContactMethod;
  isPrimary: boolean;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LenderCommunication {
  id: string;
  lenderId: string;
  contactId?: string;
  communicationType: CommunicationType;
  subject?: string;
  summary: string;
  date: string;
  direction: CommunicationDirection;
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  createdBy?: string;
  createdAt: string;
}

export interface LenderPerformance {
  id: string;
  lenderId: string;
  totalDealsSubmitted: number;
  totalDealsApproved: number;
  totalDealsFunded: number;
  approvalRate?: number;
  averageApprovalDays?: number;
  averageClosingDays?: number;
  totalFundedAmount: number;
  lastDealDate?: string;
  lastUpdated: string;
}

export interface LenderWithDetails extends Lender {
  programs: LenderProgram[];
  contacts: LenderContact[];
  performance?: LenderPerformance;
  communicationCount: number;
  lastCommunication?: LenderCommunication;
}
```

---

### Feature 2: Google Sheets Integration

**Requirements**:
- Two-way sync between Supabase and Google Sheets
- Conflict resolution with "last write wins" strategy
- Manual trigger + automatic sync every 5 minutes
- Sync status indicator in UI
- Error logging and retry mechanism

**Google Sheets Structure**:
```
Sheet 1: Lenders
- Company Name | Website | Type | Status | Rating | Notes | Last Updated

Sheet 2: Programs
- Lender Name | Program Name | Loan Types | Min Amount | Max Amount | Min Credit | Max LTV | Rate Range | Status

Sheet 3: Contacts
- Lender Name | First Name | Last Name | Title | Email | Phone | Preferred Contact
```

**Implementation**:
```typescript
// src/services/googleSheetsSync.ts

import { google } from 'googleapis';
import { supabase } from './supabase';

interface SyncConfig {
  spreadsheetId: string;
  credentials: any;
}

export class GoogleSheetsSync {
  private sheets: any;
  private spreadsheetId: string;

  constructor(config: SyncConfig) {
    const auth = new google.auth.GoogleAuth({
      credentials: config.credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = config.spreadsheetId;
  }

  async syncLendersToSheets(): Promise<SyncResult> {
    // Fetch all lenders from Supabase
    const { data: lenders, error } = await supabase
      .from('lenders')
      .select('*')
      .order('company_name');

    if (error) throw error;

    // Format for Google Sheets
    const rows = lenders.map(l => [
      l.company_name,
      l.website || '',
      l.company_type,
      l.status,
      l.rating || '',
      l.notes || '',
      new Date(l.updated_at).toISOString()
    ]);

    // Update Google Sheets
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: 'Lenders!A2:G',
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });

    return { success: true, recordsUpdated: rows.length };
  }

  async syncSheetsToSupabase(): Promise<SyncResult> {
    // Fetch from Google Sheets
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Lenders!A2:G',
    });

    const rows = response.data.values || [];
    let updated = 0;

    for (const row of rows) {
      const [name, website, type, status, rating, notes, lastUpdated] = row;

      // Check if exists
      const { data: existing } = await supabase
        .from('lenders')
        .select('id, updated_at')
        .eq('company_name', name)
        .single();

      const sheetDate = new Date(lastUpdated);
      const dbDate = existing ? new Date(existing.updated_at) : new Date(0);

      // Last write wins
      if (sheetDate > dbDate) {
        await supabase.from('lenders').upsert({
          id: existing?.id,
          company_name: name,
          website,
          company_type: type,
          status,
          rating: rating ? parseInt(rating) : null,
          notes,
          last_synced: new Date().toISOString(),
        });
        updated++;
      }
    }

    return { success: true, recordsUpdated: updated };
  }

  async bidirectionalSync(): Promise<SyncResult> {
    // 1. Pull from Sheets
    const pullResult = await this.syncSheetsToSupabase();

    // 2. Push to Sheets
    const pushResult = await this.syncLendersToSheets();

    return {
      success: true,
      recordsUpdated: pullResult.recordsUpdated + pushResult.recordsUpdated,
    };
  }
}

interface SyncResult {
  success: boolean;
  recordsUpdated: number;
  errors?: string[];
}
```

**UI Component**:
```typescript
// Sync status indicator
<div className="flex items-center gap-2">
  <Button onClick={handleManualSync} disabled={syncing}>
    {syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
    Sync Now
  </Button>
  <span className="text-sm text-gray-400">
    Last synced: {lastSyncTime}
  </span>
  {syncStatus === 'success' && <CheckCircle className="text-green-500" />}
  {syncStatus === 'error' && <AlertCircle className="text-red-500" />}
</div>
```

---

### Feature 3: Lender CRUD Operations

**UI Components**:

#### LenderList.tsx
```typescript
// Key features:
- Sortable table with pagination
- Quick actions (view, edit, delete)
- Bulk selection and operations
- Status badges
- Performance indicators
- Search integration
```

#### LenderForm.tsx
```typescript
// Multi-step form with sections:
1. Company Information
2. Programs (repeatable)
3. Contacts (repeatable)
4. Requirements & Notes

// Validation with Zod:
const lenderSchema = z.object({
  companyName: z.string().min(2, 'Company name required'),
  website: z.string().url().optional(),
  companyType: z.enum(['bank', 'credit_union', 'private_lender', 'hard_money', 'institutional', 'other']),
  status: z.enum(['active', 'inactive', 'pending', 'archived']),
  rating: z.number().min(1).max(5).optional(),
});
```

#### LenderDetail.tsx
```typescript
// Tabbed interface:
- Overview Tab: Company details, status, rating
- Programs Tab: List of programs with inline editing
- Contacts Tab: Contact cards with communication history
- Performance Tab: Charts and metrics
- Communications Tab: Timeline of all interactions
- Documents Tab: File attachments (future)
```

**Key Features**:
- Optimistic UI updates using React Query
- Auto-save drafts
- Change history/audit trail
- Duplicate detection
- Bulk import from CSV
- Export filtered results

---

### Feature 4: Advanced Search & Filtering

**Search Capabilities**:
1. **Full-text search**: Company name, notes, programs
2. **Faceted filters**:
   - Loan amount range (slider)
   - Credit score minimum (slider)
   - Property types (multi-select)
   - Company type (multi-select)
   - Geographic coverage (state selector)
   - Status (active/inactive)
   - Rating (star filter)

**Implementation**:
```typescript
// src/hooks/useLenders.ts

export function useLenders(filters: LenderFilters) {
  return useQuery({
    queryKey: ['lenders', filters],
    queryFn: async () => {
      let query = supabase
        .from('lenders')
        .select(`
          *,
          programs:lender_programs(*),
          contacts:lender_contacts(*),
          performance:lender_performance(*)
        `);

      // Apply filters
      if (filters.search) {
        query = query.textSearch('company_name', filters.search);
      }

      if (filters.companyTypes?.length) {
        query = query.in('company_type', filters.companyTypes);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      // Filter by program capabilities (requires subquery join)
      if (filters.loanAmount) {
        query = query.filter('programs.min_loan_amount', 'lte', filters.loanAmount)
                     .filter('programs.max_loan_amount', 'gte', filters.loanAmount);
      }

      if (filters.minCreditScore) {
        query = query.filter('programs.min_credit_score', 'lte', filters.minCreditScore);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LenderWithDetails[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**Saved Searches**:
```typescript
// Allow users to save frequently used filter combinations
interface SavedSearch {
  id: string;
  name: string;
  filters: LenderFilters;
  userId: string;
  createdAt: string;
}

// Quick access buttons
<div className="flex gap-2">
  {savedSearches.map(search => (
    <Button
      key={search.id}
      variant="outline"
      onClick={() => applySavedSearch(search)}
    >
      {search.name}
    </Button>
  ))}
</div>
```

---

### Feature 5: Contact & Communication Management

**Contact Cards**:
```typescript
// ContactCard.tsx
<div className="border rounded-lg p-4">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="font-semibold">{contact.firstName} {contact.lastName}</h3>
      {contact.isPrimary && <Badge>Primary Contact</Badge>}
      <p className="text-sm text-gray-400">{contact.title}</p>
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger><MoreVertical /></DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => sendEmail(contact)}>
          <Mail className="mr-2" /> Send Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => logCall(contact)}>
          <Phone className="mr-2" /> Log Call
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editContact(contact)}>
          <Edit className="mr-2" /> Edit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <div className="mt-3 space-y-1">
    <div className="flex items-center text-sm">
      <Mail className="w-4 h-4 mr-2" />
      <a href={`mailto:${contact.email}`}>{contact.email}</a>
    </div>
    <div className="flex items-center text-sm">
      <Phone className="w-4 h-4 mr-2" />
      <a href={`tel:${contact.phone}`}>{contact.phone}</a>
    </div>
  </div>

  <div className="mt-3 text-xs text-gray-500">
    Last contact: {formatDistanceToNow(lastCommunication?.date)} ago
  </div>
</div>
```

**Communication Log**:
```typescript
// Timeline view of all interactions
<div className="space-y-4">
  {communications.map(comm => (
    <div key={comm.id} className="flex gap-3">
      <div className="flex-shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          comm.direction === 'outbound' ? 'bg-blue-500' : 'bg-green-500'
        }`}>
          {getCommIcon(comm.communicationType)}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium">{comm.subject || comm.communicationType}</p>
            <p className="text-sm text-gray-400">
              {comm.direction === 'outbound' ? 'Sent to' : 'Received from'} {getContactName(comm.contactId)}
            </p>
          </div>
          <span className="text-xs text-gray-500">{formatDate(comm.date)}</span>
        </div>
        <p className="mt-1 text-sm">{comm.summary}</p>
        {comm.followUpRequired && (
          <div className="mt-2 flex items-center text-sm text-orange-500">
            <AlertCircle className="w-4 h-4 mr-1" />
            Follow-up needed by {formatDate(comm.followUpDate)}
          </div>
        )}
      </div>
    </div>
  ))}
</div>
```

**Quick Actions**:
- Log email
- Log phone call
- Schedule meeting
- Set reminder
- Add note

---

### Feature 6: Performance Analytics

**Performance Dashboard** (per lender):
```typescript
// Metrics cards
<div className="grid grid-cols-4 gap-4">
  <MetricCard
    title="Approval Rate"
    value={`${performance.approvalRate}%`}
    trend={getTrend(performance.approvalRate)}
    icon={<TrendingUp />}
  />
  <MetricCard
    title="Avg. Approval Time"
    value={`${performance.averageApprovalDays} days`}
    icon={<Clock />}
  />
  <MetricCard
    title="Total Funded"
    value={formatCurrency(performance.totalFundedAmount)}
    icon={<DollarSign />}
  />
  <MetricCard
    title="Deals Closed"
    value={performance.totalDealsFunded}
    icon={<CheckCircle />}
  />
</div>

// Charts
<div className="mt-6">
  <h3>Deal Flow Over Time</h3>
  <LineChart data={dealFlowData} />
</div>

<div className="mt-6">
  <h3>Approval Funnel</h3>
  <FunnelChart
    data={[
      { stage: 'Submitted', count: performance.totalDealsSubmitted },
      { stage: 'Approved', count: performance.totalDealsApproved },
      { stage: 'Funded', count: performance.totalDealsFunded },
    ]}
  />
</div>
```

**Comparative Analytics**:
- Lender scorecards (side-by-side comparison)
- Top performers by approval rate
- Fastest closing times
- Best interest rates by loan type

---

## 🎨 UI/UX DESIGN SPECIFICATIONS

### Visual Design System (Consistency with Content Planner)

**Color Palette**:
```css
/* Reuse existing theme */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--brand-500: #f97316; /* Orange accent */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;

/* Lender-specific colors */
--lender-active: #10b981;
--lender-inactive: #6b7280;
--lender-pending: #f59e0b;
--lender-archived: #9ca3af;
```

**Component Styling**:
- Dark theme with gray-900 backgrounds
- Orange (brand-500) for primary actions
- Consistent card styling with subtle borders
- Hover effects and transitions
- Lucide React icons throughout
- Status badges with color coding

**Layout Structure**:
```
┌─────────────────────────────────────────────────────┐
│ Header: "Lenders" + Search Bar + Add Lender Button │
├─────────────────────────────────────────────────────┤
│ Filters Panel (collapsible sidebar)    │ Main View │
│ - Loan Amount                           │           │
│ - Credit Score                          │  Lender   │
│ - Property Types                        │   List    │
│ - Company Type                          │   Grid    │
│ - Status                                │           │
│ - Rating                                │ (Table or │
│                                         │  Cards)   │
│ [Saved Searches]                        │           │
│ [Clear Filters]                         │ Pagination│
└─────────────────────────────────────────────────────┘
```

**Responsive Design**:
- Desktop: Table view with expandable rows
- Tablet: Card grid (2 columns)
- Mobile: Stacked cards with swipe actions

---

## 📐 ACCEPTANCE CRITERIA

### Story LD-1.1: Database Schema & Setup
**Priority**: P0
**Story Points**: 3

**Acceptance Criteria**:
- [x] All 5 tables created (lenders, programs, contacts, communications, performance)
- [x] RLS policies configured for authenticated users
- [x] Indexes created on key columns
- [x] Full-text search enabled
- [x] Triggers for updated_at timestamps
- [x] TypeScript types match database schema
- [x] Migration file created and tested
- [x] Seed data for 5-10 sample lenders

**Definition of Done**:
- Migration applied successfully to staging
- Types exported and importable
- Sample queries tested in Supabase SQL editor
- Documentation updated with schema diagram

---

### Story LD-1.2: Google Sheets Integration
**Priority**: P0
**Story Points**: 8

**Acceptance Criteria**:
- [x] Google Sheets API authentication configured
- [x] Two-way sync implemented (Sheets → Supabase, Supabase → Sheets)
- [x] Conflict resolution (last write wins)
- [x] Manual sync trigger button in UI
- [x] Automatic sync every 5 minutes (background job)
- [x] Sync status indicator shows success/failure
- [x] Error logging to Supabase table
- [x] Retry mechanism (3 attempts with exponential backoff)

**Definition of Done**:
- Sync completes in < 10 seconds for 100 lenders
- Conflicts resolved correctly (tested with simultaneous edits)
- UI shows accurate sync status
- Errors logged and displayed to user
- Documentation with setup instructions

---

### Story LD-1.3: Lender CRUD Operations
**Priority**: P0
**Story Points**: 5

**Acceptance Criteria**:
- [x] Add new lender form with validation
- [x] Edit existing lender (all fields)
- [x] Delete lender with confirmation modal
- [x] Duplicate detection (warn if similar name exists)
- [x] Bulk operations (delete, archive, change status)
- [x] Form auto-saves draft every 30 seconds
- [x] Optimistic UI updates with React Query
- [x] Success/error notifications

**Definition of Done**:
- All CRUD operations work without errors
- Validation prevents invalid data
- Optimistic updates revert on failure
- Audit trail logs all changes
- Unit tests for form validation

---

### Story LD-1.4: Advanced Search & Filtering
**Priority**: P0
**Story Points**: 5

**Acceptance Criteria**:
- [x] Full-text search across company name and notes
- [x] Faceted filters (loan amount, credit score, property types, status, rating)
- [x] Filters applied in real-time (< 500ms response)
- [x] Combine multiple filters (AND logic)
- [x] Clear all filters button
- [x] Save filter combinations as "Saved Searches"
- [x] Quick access to saved searches
- [x] Export filtered results to CSV

**Definition of Done**:
- Search returns results in < 500ms for 200 lenders
- Filters work correctly in all combinations
- Saved searches persist across sessions
- CSV export includes all filtered columns
- Accessibility: keyboard navigation works

---

### Story LD-1.5: Program Management
**Priority**: P1
**Story Points**: 5

**Acceptance Criteria**:
- [x] Add multiple programs per lender
- [x] Edit program details inline
- [x] Delete programs with confirmation
- [x] Program comparison view (side-by-side)
- [x] Status indicators (active, paused, discontinued)
- [x] Expiration date warnings
- [x] Historical program tracking (version control)

**Definition of Done**:
- Programs CRUD operations work
- Comparison view shows key differences
- Expired programs highlighted
- Change history tracked

---

### Story LD-1.6: Contact & Communication Management
**Priority**: P1
**Story Points**: 5

**Acceptance Criteria**:
- [x] Add multiple contacts per lender
- [x] Mark primary contact
- [x] Log communications (email, phone, meeting)
- [x] Timeline view of all interactions
- [x] Set follow-up reminders
- [x] Quick actions (send email, log call)
- [x] Search communications by keyword

**Definition of Done**:
- Contact cards display correctly
- Communication log shows chronologically
- Reminders trigger notifications
- Email integration works (mailto links)

---

### Story LD-1.7: Performance Analytics
**Priority**: P2
**Story Points**: 5

**Acceptance Criteria**:
- [x] Display key metrics (approval rate, avg days, total funded)
- [x] Deal flow chart over time
- [x] Approval funnel visualization
- [x] Comparative lender scorecards
- [x] Top performers list
- [x] Export performance report to PDF

**Definition of Done**:
- Metrics calculate correctly
- Charts render without performance issues
- PDF export includes all visualizations
- Data updates when deals change

---

## 🧪 TESTING STRATEGY

### Unit Tests
```typescript
// Example tests
describe('useLenders hook', () => {
  it('filters lenders by loan amount range', async () => {
    const { result } = renderHook(() => useLenders({
      loanAmount: 500000
    }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.data?.forEach(lender => {
      const matchingProgram = lender.programs.find(p =>
        p.minLoanAmount <= 500000 && p.maxLoanAmount >= 500000
      );
      expect(matchingProgram).toBeDefined();
    });
  });
});

describe('GoogleSheetsSync', () => {
  it('syncs lenders to Google Sheets', async () => {
    const sync = new GoogleSheetsSync(config);
    const result = await sync.syncLendersToSheets();

    expect(result.success).toBe(true);
    expect(result.recordsUpdated).toBeGreaterThan(0);
  });

  it('resolves conflicts with last write wins', async () => {
    // Test conflict resolution logic
  });
});
```

### Integration Tests
- Google Sheets API integration
- Supabase CRUD operations
- Real-time subscription updates
- Form submission and validation

### E2E Tests (Playwright)
```typescript
test('User can add a new lender', async ({ page }) => {
  await page.goto('/lenders');
  await page.click('button:has-text("Add Lender")');

  await page.fill('input[name="companyName"]', 'Test Bank');
  await page.selectOption('select[name="companyType"]', 'bank');
  await page.selectOption('select[name="status"]', 'active');

  await page.click('button:has-text("Save")');

  await expect(page.locator('text=Lender added successfully')).toBeVisible();
  await expect(page.locator('text=Test Bank')).toBeVisible();
});

test('User can search for lenders', async ({ page }) => {
  await page.goto('/lenders');
  await page.fill('input[placeholder="Search lenders..."]', 'Bank');

  await page.waitForTimeout(500); // Debounce

  const results = page.locator('[data-testid="lender-card"]');
  await expect(results.first()).toContainText('Bank');
});
```

### Performance Tests
- Load 200 lenders: < 2 seconds initial load
- Search/filter: < 500ms response time
- Google Sheets sync: < 10 seconds for 100 records
- Page navigation: < 200ms

---

## 🚀 IMPLEMENTATION ROADMAP

### Week 4: Database & Foundation
**Days 1-2**: Database schema
- Create migration file
- Write TypeScript types
- Test schema in Supabase
- Create seed data

**Days 3-5**: Google Sheets Integration
- Set up Google API credentials
- Implement sync service
- Test bidirectional sync
- Add error handling

**Deliverable**: Database ready, sync working

---

### Week 5: Core CRUD Operations
**Days 1-2**: Lender List View
- Create LenderList component
- Implement table with sorting
- Add pagination
- Quick actions menu

**Days 3-4**: Lender Form
- Multi-step form with validation
- Auto-save functionality
- Duplicate detection
- Success/error handling

**Day 5**: Lender Detail View
- Tabbed interface
- Overview tab complete
- Navigation working

**Deliverable**: Full CRUD operations functional

---

### Week 6: Search & Advanced Features
**Days 1-2**: Search & Filtering
- Full-text search implementation
- Faceted filters UI
- Real-time filtering
- Saved searches

**Days 3-4**: Program Management
- Program CRUD within lender detail
- Program comparison view
- Expiration tracking

**Day 5**: Polish & Testing
- Bug fixes
- Performance optimization
- Responsive design checks

**Deliverable**: Search and program management complete

---

### Week 7: Contacts & Analytics
**Days 1-2**: Contact Management
- Contact CRUD
- Communication logging
- Timeline view

**Days 3-4**: Performance Analytics
- Metrics calculation
- Charts and visualizations
- Comparative analytics

**Day 5**: Final Testing & Documentation
- E2E tests
- User documentation
- Training materials

**Deliverable**: Epic 2 complete and ready for UAT

---

## 🎯 SUCCESS METRICS & KPIs

### Quantitative Metrics
| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Time to find lender | 10-15 min | < 30 sec | Time tracking |
| Search accuracy | N/A | > 95% | User feedback |
| Data accuracy | ~85% | > 99% | Validation checks |
| Sync success rate | N/A | > 99% | Error logs |
| Page load time | N/A | < 2 sec | Performance monitoring |
| User adoption | 0% | 100% (team) | Analytics tracking |

### Qualitative Metrics
- User satisfaction (survey)
- Ease of use (NPS)
- Reduction in manual processes
- Improvement in lender relationship management

### Business Impact
- 90% reduction in time spent searching for lenders
- 100% centralization of lender data
- Foundation for intelligent deal matching (Epic 3)
- Improved lender relationship quality

---

## 🔒 SECURITY & COMPLIANCE

### Data Security
- All lender data encrypted at rest (Supabase default)
- Row-level security enforces access control
- Audit logging for all CRUD operations
- Secure API key storage (environment variables)

### Access Control
- Only authenticated users can access lender data
- Admin role required for deletion
- Audit trail tracks who changed what

### Compliance
- GDPR considerations: Contact data handling
- Data retention policies configurable
- Export functionality for data portability

---

## 📚 DOCUMENTATION DELIVERABLES

### Technical Documentation
1. **Database Schema Diagram**: ERD with relationships
2. **API Documentation**: All Supabase queries and functions
3. **Integration Guide**: Google Sheets setup instructions
4. **Component Library**: Storybook for Lender components

### User Documentation
1. **User Guide**: Step-by-step instructions with screenshots
2. **Video Tutorials**: Loom recordings for key workflows
3. **FAQ**: Common questions and troubleshooting
4. **Quick Start Guide**: One-page overview

---

## 🎬 LAUNCH CHECKLIST

### Pre-Launch (Week 7)
- [ ] All acceptance criteria met
- [ ] E2E tests passing
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Documentation finalized
- [ ] Training materials ready

### Launch (End of Week 7)
- [ ] Deploy to production
- [ ] Team training session
- [ ] Monitor for errors
- [ ] Collect initial feedback

### Post-Launch (Week 8)
- [ ] Address critical bugs
- [ ] Gather user feedback
- [ ] Iterate on UX improvements
- [ ] Plan Phase 2 enhancements

---

## 🔮 FUTURE ENHANCEMENTS (Phase 2)

### Potential Features
1. **Lender Portal**: External login for lenders to update their own info
2. **Email Integration**: Auto-log emails from Gmail
3. **Calendar Integration**: Schedule meetings directly
4. **Mobile App**: Native iOS/Android app
5. **AI Recommendations**: ML-based lender suggestions
6. **Advanced Analytics**: Predictive analytics, trend forecasting
7. **API**: RESTful API for third-party integrations

---

## 📝 APPENDIX

### A. Glossary
- **Lender**: Financial institution providing loans
- **Program**: Specific loan product offered by a lender
- **LTV**: Loan-to-Value ratio
- **DSCR**: Debt Service Coverage Ratio
- **RLS**: Row-Level Security (Supabase)

### B. References
- [Google Sheets API Docs](https://developers.google.com/sheets/api)
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Zod Validation](https://zod.dev/)

---

**Document Status**: ✅ Ready for Development
**Next Step**: Create database migration file
**Questions**: Contact John (PM) or review in team standup

---

*This PRD is a living document and will be updated based on feedback during implementation.*

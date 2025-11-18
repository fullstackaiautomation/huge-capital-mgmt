# Deals Pipeline - Multi-Agent System Quick Start

## 📋 Overview

The Huge Capital Deals Pipeline uses a **specialized three-agent system** to automate deal processing from document upload to lender submission.

**Architecture:** Level 3 Multi-Agent (following Anthropic agent builder best practices)
**Model:** Claude 3.5 Sonnet (claude-3-5-sonnet-20250514)
**Token Efficiency:** MCP + Code Execution pattern (98% token reduction)

---

## 🎯 Three Agent Roles

### 1. Deal Info Agent ✅ (Partially Implemented)
**Specialization:** Document parsing and data extraction
**Current Status:** Edge function exists, needs optimization

```
Documents → Parse & Extract → Validate → Confidence Scores → Database
```

**Key Outputs:**
- Extracted business information (legal name, EIN, address)
- Owner information (names, contact, ownership %)
- Financial metrics (revenue, loan amount)
- Bank statements and funding positions
- Confidence scores for each field
- Missing fields flagged for manual entry

**Edge Function:** `supabase/functions/parse-deal-documents/`
**Implementation Guide:** `.agent/Tasks/DEAL_INFO_AGENT_IMPLEMENTATION.md`

---

### 2. Lending Expert Agent ⏳ (Not Yet Implemented)
**Specialization:** Lender matching and deal analysis
**Current Status:** Architecture designed, ready to build

```
Deal Data → Analyze Fit → Query Lenders → Score & Rank → Recommendations
```

**Key Outputs:**
- Ranked lender recommendations (score 0-100)
- Approval probability estimates
- Specific approval criteria for each lender
- Documentation requirements
- Processing time estimates
- Rate/terms estimates

**Edge Function (To Create):** `supabase/functions/match-deal-to-lenders/`
**Implementation Guide:** `.agent/Tasks/LENDING_EXPERT_AGENT_IMPLEMENTATION.md`

---

### 3. Submission Agent ⏳ (Not Yet Implemented)
**Specialization:** Deal submission and email management
**Current Status:** Architecture designed, ready to build

```
Lender Selected → Format Email → Send via Gmail → Track Status → Follow-ups
```

**Key Outputs:**
- Professional submission emails
- Submission confirmation with tracking number
- Status tracking (submitted, viewed, docs requested, etc.)
- Automatic follow-up scheduling
- Broker notifications on status changes

**Edge Function (To Create):** `supabase/functions/submit-deal-to-lender/`
**Implementation Guide:** `.agent/Tasks/SUBMISSION_AGENT_IMPLEMENTATION.md`

---

## 🚀 Getting Started

### Prerequisites
- ✅ Supabase project configured
- ✅ Database tables created (deals, deal_owners, deal_bank_statements, deal_funding_positions, deal_lender_matches)
- ✅ ANTHROPIC_API_KEY secret set in Supabase
- ✅ Node.js and Supabase CLI installed

### Quick Setup (5 minutes)

```bash
# 1. Verify API key is set
npx supabase secrets list | grep ANTHROPIC_API_KEY

# 2. Deploy existing Deal Info Agent
npx supabase functions deploy parse-deal-documents

# 3. Verify deployment
npx supabase functions list

# 4. Test from UI
# Navigate to http://localhost:5173/deals
# Click "New Deal" → Upload document → Click "Continue to Analysis"
# Should see extracted data (or mock data if API key not working)
```

---

## 📊 Agent Workflow

```
┌──────────────────┐
│  Upload Document │ (Broker)
└────────┬─────────┘
         │
         ▼
┌────────────────────────┐
│  Deal Info Agent       │ (Parse & Extract)
│  - Read documents      │
│  - Extract structured  │
│  - Score confidence    │
│  - Validate required   │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Review Screen         │ (Broker confirms)
│  - Check extracted     │
│  - Fill in gaps        │
│  - Approve & save      │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Lending Expert Agent  │ (Match to lenders)
│  - Analyze deal fit    │
│  - Query lender DB     │
│  - Score & rank        │
│  - Generate recs       │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Recommendations       │ (Broker selects)
│  - Top 5 lenders       │
│  - Match scores        │
│  - Approval criteria   │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Submission Agent      │ (Submit & track)
│  - Format email        │
│  - Send via Gmail      │
│  - Track submission    │
│  - Schedule follow-up  │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Submissions Dashboard │ (Ongoing tracking)
│  - View all subs       │
│  - Track responses     │
│  - Manage follow-ups   │
│  - Document requests   │
└────────────────────────┘
```

---

## 🔧 Implementation Phases

### Phase 1: Current Status ✅
**Deal Info Agent Optimization**
- ✅ Edge function deployed (parse-deal-documents)
- ✅ Calls Claude API (fixed model version)
- ✅ Returns structured deal data
- ⏳ Needs: Enhanced system prompt, validation logic, confidence scoring

**Time to Complete:** 2-3 hours
**Next Action:** Read `.agent/Tasks/DEAL_INFO_AGENT_IMPLEMENTATION.md`

---

### Phase 2: Immediate (Estimated 4-6 hours each)
**Lending Expert Agent**
- Create edge function: `match-deal-to-lenders`
- Implement lender search and matching tools
- Integrate with lender database tables
- Test with sample deals

**Submission Agent**
- Create edge function: `submit-deal-to-lender`
- Implement email formatting tools
- Set up Gmail API integration
- Test email submissions to lenders

---

### Phase 3: Integration & Testing (2-3 days)
- Create orchestration API layer
- Wire UI to all three agents
- End-to-end testing with real deals
- Performance optimization
- Production deployment

---

## 📁 Documentation Structure

```
.agent/
├── DEALS_PIPELINE_MULTI_AGENT_ARCHITECTURE.md    ← Start here
├── DEALS_PIPELINE_QUICK_START.md                 ← You are here
├── Tasks/
│   ├── DEAL_INFO_AGENT_IMPLEMENTATION.md         ✅ Phase 1
│   ├── LENDING_EXPERT_AGENT_IMPLEMENTATION.md    ⏳ Phase 2
│   └── SUBMISSION_AGENT_IMPLEMENTATION.md        ⏳ Phase 2
└── SOP/
    └── agent-implementation-checklist.md          (To create)
```

**Read in Order:**
1. **This file** (Quick Start) - Overview
2. **DEALS_PIPELINE_MULTI_AGENT_ARCHITECTURE.md** - Full design
3. **Implementation guides** - Phase-specific details
4. **Agent Builder Skill** - Best practices reference

---

## 🎓 Key Concepts

### Agent Builder Framework
The system follows Anthropic's "Agent Quick Build Guide" best practices:

1. **System Prompt** - Role definition + tools + rules
2. **Tools** - 2-5 functions per agent (start simple)
3. **Think-Act-Observe Loop** - Claude handles this
4. **Evaluation Dataset** - 10+ test cases per agent
5. **Monitoring** - 4 key metrics (success rate, cost, speed, satisfaction)

### MCP + Code Execution Pattern
Used for complex agents (10+ tools):
- Tools exist as files on filesystem
- Agent discovers tools on-demand
- Agent writes TypeScript code to compose tools
- Data processing happens in sandbox (not context)
- **Result:** 98% token reduction (150K → 2K tokens)

### Three-Agent Separation Benefits
- **Specialization**: Each agent optimized for its domain
- **Scalability**: Easy to add new lenders/features
- **Maintainability**: Isolated, focused prompts
- **Reusability**: Common code in skills/ directory
- **Cost Efficiency**: Agents only run when needed

---

## 🔑 Shared Configuration

All three agents use:
- **Model:** Claude 3.5 Sonnet (claude-3-5-sonnet-20250514)
- **API Key:** ANTHROPIC_API_KEY (set in Supabase secrets)
- **Database:** Shared Supabase instance
- **Orchestration:** Centralized API layer

### Setting API Key
```bash
# In Supabase dashboard:
# Functions → Settings → Secrets
# KEY: ANTHROPIC_API_KEY
# VALUE: sk-ant-v4-...

# Or via CLI:
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-v4-...
```

---

## ✅ Testing Checklist

### For Each Agent
- [ ] Deploy edge function
- [ ] Verify API key accessible
- [ ] Test with sample data
- [ ] Verify correct output format
- [ ] Check error handling
- [ ] Monitor latency and cost

### End-to-End Workflow
- [ ] Upload document → See extracted data
- [ ] Confirm data → Get lender recommendations
- [ ] Select lender → Submit deal
- [ ] Track submission status
- [ ] Receive follow-up notifications

---

## 📈 Success Metrics

Track these for each agent:

**Deal Info Agent:**
- Extraction accuracy: >90% of fields correct
- Confidence calibration: Actual accuracy ±10% of reported confidence
- Processing time: <30 seconds for 5-page document set
- User confirmation rate: >85%

**Lending Expert Agent:**
- Match accuracy: Recommended lenders approve >80% of deals
- Processing speed: <60 seconds to generate recommendations
- Recommendation adoption: Brokers select recommended lender >75%
- Approval rate improvement: Recommendations reduce decline rate by 20%

**Submission Agent:**
- Submission success: >98% deliverable
- Average lender response: <48 hours
- Document fulfillment: <24 hours
- Deal approval rate: >70% of submissions
- Broker satisfaction: >4.5/5

---

## 🚨 Known Issues & Fixes

### Issue: "Anthropic API error: 404"
**Cause:** Outdated Claude model name
**Solution:** Use `claude-3-5-sonnet-20250514` (already fixed)
**Status:** ✅ Fixed

### Issue: CORS headers error
**Cause:** Missing x-client-info header in Allow-Headers
**Solution:** Added to all edge function CORS configs
**Status:** ✅ Fixed

### Issue: Mock data returned instead of real extraction
**Cause:** ANTHROPIC_API_KEY not found at runtime
**Solution:** Move API key check to inside request handler (not module load)
**Status:** ✅ Fixed

---

## 🔗 References

- **Agent Builder Skill:** `Agent Builder Skill/` (read this first)
- **Architecture Guide:** `Agent_Quick_Build_Guide (2).md`
- **MCP Pattern:** `UPDATES_MCP_Code_Execution.md`
- **Anthropic Docs:** https://www.anthropic.com/research/agents
- **Current Implementation:** `supabase/functions/parse-deal-documents/index.ts`

---

## 🎯 Next Actions

### Immediate (Today)
1. Read the full architecture document
2. Review Deal Info Agent implementation guide
3. Run tests on existing edge function
4. Update system prompt with enhancements

### This Week (2-3 Days)
1. Implement Lending Expert Agent edge function
2. Implement Submission Agent edge function
3. Create orchestration API layer
4. Wire UI to all three agents

### Next Week (4-5 Days)
1. End-to-end testing with real deals
2. Performance optimization
3. Production deployment
4. Monitor and iterate based on real usage

---

## 💡 Tips & Best Practices

**For Prompt Engineering:**
- Be specific about field definitions
- Include examples for each field
- Define confidence scoring clearly
- List exact tools available
- Be explicit about rules (ALWAYS/NEVER)

**For Efficiency:**
- Use MCP + Code Execution for complex agents
- Keep tool descriptions concise
- Implement evaluation datasets early
- Monitor cost closely ($$ per interaction)
- Test with real data, not synthetic examples

**For Reliability:**
- Always have fallback to mock/error data
- Return 200 status even on errors (don't block client)
- Log everything for debugging
- Set proper timeouts (30 seconds max per function)
- Use structured error responses

---

## ❓ FAQ

**Q: Can I use a different model?**
A: Yes, but Claude 3.5 Sonnet is recommended. Haiku would be faster/cheaper but less accurate. Sonnet 4.5 would be more accurate but slower/more expensive.

**Q: How long does each agent take?**
A: Deal Info: <30 seconds; Lending Expert: <60 seconds; Submission: <10 seconds

**Q: Can brokers submit multiple lenders?**
A: Not in Phase 1. Phase 2 will add bulk submission to multiple lenders at once.

**Q: How are lender requirements kept updated?**
A: Currently in database tables. Phase 2 will add admin UI to update lender criteria.

**Q: What if a lender needs a custom format?**
A: The submission agent templates can be customized per lender. Future: Portal-specific submission handlers.

---

**Last Updated:** 2025-11-12
**Version:** 1.0 (Architecture & Design)
**Next Version:** 1.1 (Implementation Complete)

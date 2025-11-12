# AI Agent Quick Build Guide
**Get it right the first time - 80/20 essentials only**

---

## 📋 User Requirements (5 Minutes)

Ask them to fill this out **before** you start:

```
PROJECT: [Agent name]
GOAL: [What specific problem does this solve?]
SUCCESS METRIC: [How do we measure it's working?]
USERS: [Who uses it? How many?]

MUST HAVE ACCESS TO:
- [ ] Database: [connection string]
- [ ] APIs: [list with credentials]
- [ ] Documents: [links/uploads]

WORKFLOW TYPE:
[ ] Single-step (lookup/simple action) → Level 1 Agent
[ ] Multi-step (research→analyze→act) → Level 2 Agent
[ ] Complex workflow (multiple specialists) → Level 3 Multi-Agent

MUST NEVER:
- [ ] [List prohibited actions]

APPROVAL NEEDED FOR:
- [ ] [Actions requiring human confirmation]

TEST SCENARIOS (at least 10):
1. User asks: "[example]" → Should do: "[expected]"
2. ...
```

**→ 90% of agents should be Level 1 or 2**

**If they can't complete this, you can't build it yet.**

---

## ⚡ Speed Build Process

### Week 1: Prototype

**Phase 1: Setup - Choose Your Approach**

**🚀 NEW: MCP + Code Execution (98% fewer tokens)**

Best for: Agents with 10+ tools, complex data workflows, multi-step processing

How it works:
- MCP servers become code APIs on filesystem
- Agent discovers and loads tools on-demand
- Agent writes code to compose tools
- Data processing happens in sandbox (not in context)
- **Result: 150K tokens → 2K tokens** for complex workflows

Setup:
```bash
# Install MCP servers
npm install @modelcontextprotocol/server-gdrive
npm install @modelcontextprotocol/server-salesforce

# Generate filesystem structure from MCP tools
# (Implementation details in references/mcp_code_execution.md)
```

**Classic: Direct Tool Calling with Claude SDK**

Best for: Simple agents with 2-5 tools, straightforward workflows

```bash
from anthropic import Anthropic
client = Anthropic(api_key="your-key")
```

**Model Selection (both approaches):**
- Complex reasoning → Claude Sonnet 4.5
- Standard tasks → Claude Sonnet 4
- Speed/cost → Claude Haiku

**Decision Guide:**
- Use MCP + Code if: 10+ tools, data processing, complex workflows
- Use Direct Calling if: 2-5 tools, simple lookups, straightforward actions
```

**Phase 2: Core Build**
**Phase 2: Core Build**

**Option A: MCP + Code Execution (Complex Agents)**

```typescript
// Agent explores filesystem to discover tools
servers/
├── google-drive/
│   ├── getDocument.ts      // Loads only when needed
│   └── searchFiles.ts
└── salesforce/
    └── updateRecord.ts

// Agent writes code to compose tools:
const doc = await gdrive.getDocument({ documentId: 'abc123' });
await salesforce.updateRecord({ 
  objectType: 'Meeting',
  data: { Notes: doc.content }
});

// Benefits:
// - No tool definitions in context
// - Data processing in sandbox
// - Reusable code saved to skills/
```

**Option B: Direct Tool Calling (Simple Agents)**

```python
# THE ONLY ARCHITECTURE YOU NEED
1. System Prompt (the instructions)
2. Tools (2-5 max to start)
3. Think-Act-Observe Loop (Claude SDK handles this)
```

**System Prompt Template:**
```markdown
You are a [ROLE] for [COMPANY].

RULES:
- ALWAYS [required behavior]
- NEVER [prohibited behavior]
- Use [tool_name] when [situation]

EXAMPLES:
User: "[example question]"
You: [think: reasoning] → [action: tool_name(params)] → [response: answer]
```

**Add Tools (pick 2-5):**
- Need current info? → Google Search or RAG
- Need data? → Database query tool
- Need to act? → API wrapper (email, CRM, etc.)

**Phase 3: Test**
- Run through all 10+ test scenarios from user
- Fix obvious failures
- **STOP HERE** - ship this as v1 prototype

---

### Week 2: Quality Layer

**Phase 1: Create Eval Dataset**
```markdown
# Take your 10 test scenarios, format like this:

Scenario 1:
Input: "What's the price of Tesla stock?"
Expected: Agent calls stock_api("TSLA"), returns current price
Pass Criteria: Correct price, cited source

Scenario 2:
...
```

**Phase 2: Automated Testing**
```python
# Run agent on all scenarios
# Use Claude as judge to score each one
# Pass threshold: 80% average score

judge = Claude(model="claude-sonnet-4.5")

for scenario in eval_dataset:
    output = agent.run(scenario.input)
    score = judge.evaluate(output, scenario.expected)
    
if average_score < 80:
    # Fix and retest
```

**Phase 3: Add Observability**
```python
# Minimum viable logging
- Log every: user input, tool calls, final output
- Track: latency, errors, cost
- Set alerts: error rate >5%, cost >budget
```

---

### Week 3: Production Ready

**Phase 1: Security**
```python
# 3 Essential Controls

1. Rate Limiting
   if user_requests_today > 100:
       reject()

2. Cost Guard
   if transaction_amount > $100:
       require_human_approval()

3. Data Access
   only_allow_read_from = ["public_tables"]
```

**Phase 2: Deploy**
```bash
# Ship it
1. Deploy to staging → test again
2. Deploy to 10% production → watch for 24hr
3. If metrics good → 100%
4. If metrics bad → rollback

Rollback if:
- Error rate >2%
- Latency >2x expected
- Cost >1.5x budget
```

---

## 🔧 Tool Design

**Template for each tool:**
```python
def tool_name(param1: str, param2: int) -> dict:
    """
    What: [One sentence: what this does]
    When: [When agent should use this]
    Example: tool_name("value", 123)
    """
    # Your implementation
    return {"result": "..."}
```

**Tool Categories:**
- **Search/RAG**: Gets information → `search(query)`, `query_docs(question)`
- **API**: Takes action → `send_email(to, subject, body)`, `create_ticket(title, desc)`  
- **Ask Human**: Gets input → `ask_confirmation(action)`, `ask_for_info(prompt)`

**Rule: Start with 2-5 tools max. Add more only if needed.**

---

## 📊 Metrics That Matter

Track only these 4:

```python
# Daily Dashboard
1. Success Rate: X% tasks completed successfully
2. User Satisfaction: thumbs up / total interactions
3. Cost: $X per interaction
4. Latency: Xms average response time

# Weekly Review
- Did metrics improve?
- What failed? Add to eval dataset
- Any security issues?
```

---

## 🚨 Common Mistakes (& Quick Fixes)

| Mistake | Fix |
|---------|-----|
| **Agent ignores tool** | Add example in system prompt showing tool use |
| **Wrong tool parameters** | Improve tool description, add param examples |
| **Too slow** | Switch to Claude Sonnet 4 or Haiku, reduce tools |
| **Too expensive** | Use Haiku for simple tasks, Sonnet 4.5 only for complex |
| **Hallucinations** | Add RAG/search tool, require citations |
| **Goes off-topic** | Add "ONLY respond to [domain] questions" to prompt |
| **Security risk** | Add approval requirement for risky actions |

---

## 🎓 Level Up Checklist

**You've mastered Level 1 when:**
- [ ] Agent reliably calls correct tools
- [ ] Evaluation score >85%
- [ ] Deployed to production
- [ ] Costs predictable

**Ready for Level 2 when you need:**
- [ ] Multi-step planning (research → analyze → act)
- [ ] Context management across steps
- [ ] More than 5 tools

**Only build Level 3 if:**
- [ ] You have multiple distinct workflows
- [ ] Each workflow needs different expertise
- [ ] Budget >$10k/month
- [ ] Team can maintain multiple agents

---

## 📚 Copy-Paste Templates

### Minimal System Prompt
```
You are a helpful [ROLE] assistant.

Your tools:
- search_web(query): Get current information
- query_database(sql): Get data from our database
- send_email(to, subject, body): Send email

Process:
1. Understand user request
2. Use tools to gather information
3. Provide clear, accurate response

NEVER:
- Make up information
- Access restricted data
- Take actions without confirmation if $$ involved
```

### Minimal Tool
```python
def search_web(query: str) -> str:
    """Search the web for current information.
    
    When to use: User asks about recent events, prices, news
    Example: search_web("Tesla stock price today")
    """
    result = google_search_api.search(query)
    return result.top_snippet
```

### Minimal Eval
```python
eval_cases = [
    {
        "input": "What's Tesla's stock price?",
        "must_use_tool": "search_web",
        "must_include": "current price",
        "must_not": "I don't know"
    },
    # Add 9 more...
]

for case in eval_cases:
    output = agent.run(case["input"])
    assert case["must_use_tool"] in agent.tools_used
    assert case["must_include"] in output
    assert case["must_not"] not in output
```

---

## 🎯 Decision Flowchart

```
User Request
    ↓
Can LLM answer from training data?
    YES → Return answer (no agent needed)
    NO ↓
    
Need real-time data?
    YES → Add search/RAG tool
    NO ↓
    
Need to take action?
    YES → Add API tools
    NO ↓
    
Need human approval?
    YES → Add confirmation tool
    NO ↓
    
Multi-step process?
    YES → Level 2 (strategic planning)
    NO → Level 1 (simple tool use)
    
Multiple specialized workflows?
    YES → Level 3 (multi-agent)
    NO → Stay Level 1/2
```

---

## 🔥 Absolute Minimum Viable Agent

Can't be bothered with all this? Here's the fastest version with Claude SDK:

```python
from anthropic import Anthropic

# 1. Initialize Claude
client = Anthropic(api_key="your-key")

# 2. Define Tool
tools = [{
    "name": "search_web",
    "description": "Search the web for current information",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query"}
        },
        "required": ["query"]
    }
}]

# 3. System Prompt
system_prompt = """
You are a customer support agent.
Use search_web for current information.
Be helpful and concise.
"""

# 4. Run Agent Loop
def run_agent(user_message):
    messages = [{"role": "user", "content": user_message}]
    
    response = client.messages.create(
        model="claude-sonnet-4",
        max_tokens=1024,
        system=system_prompt,
        tools=tools,
        messages=messages
    )
    
    # Handle tool calls and return response
    # (Claude SDK handles the think-act-observe loop)
    return response.content[0].text

# 5. Test
test_cases = [
    "What's the weather in SF?",
    "Who won the last Super Bowl?",
    "What are your business hours?"
]
for test in test_cases:
    print(run_agent(test))

# Ship it if tests pass
```

**This works for demos. For production, follow Week 1-3 plan above.**

---

## 📖 One-Page Reference

```
┌─────────────────────────────────────────────┐
│           AGENT ESSENTIALS                  │
├─────────────────────────────────────────────┤
│ 1. SYSTEM PROMPT                            │
│    - Who you are                            │
│    - What tools you have                    │
│    - Rules (always/never)                   │
│    - 2-3 examples                           │
│                                             │
│ 2. TOOLS (2-5 to start)                     │
│    - Search/RAG: get info                   │
│    - APIs: take action                      │
│    - HITL: ask human                        │
│                                             │
│ 3. LOOP (Claude SDK provides)               │
│    Think → Act → Observe → Repeat           │
│                                             │
│ 4. EVAL (10+ test cases)                    │
│    Input → Expected output → Pass criteria  │
│                                             │
│ 5. MONITOR (4 metrics)                      │
│    Success rate, satisfaction, cost, speed  │
└─────────────────────────────────────────────┘

MODELS:
- Claude Sonnet 4 → Most use cases
- Claude Sonnet 4.5 → Complex reasoning
- Claude Haiku → Speed/cost optimization

DEPLOY:
1. Test locally
2. Deploy 10% → watch 24hr
3. Deploy 100% if metrics good

FIX ISSUES:
- Not using tools? Add example to prompt
- Wrong params? Better tool description
- Too slow? Use Sonnet 4 or Haiku, fewer tools
- Hallucinating? Add RAG, require sources
```

---

**Remember: Perfect is the enemy of shipped. Build fast, iterate based on real usage.**


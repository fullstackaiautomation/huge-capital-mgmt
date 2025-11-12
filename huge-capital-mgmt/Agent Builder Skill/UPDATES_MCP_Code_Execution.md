# Agent Building Updates - MCP Code Execution Pattern

## Summary of Changes

Based on Anthropic's breakthrough article "Code execution with MCP: building more efficient AI agents", we've updated both the Quick Build Guide and the agent-builder skill to incorporate this new pattern.

## What Changed?

### The Problem (Old Approach)
- Loading 50 tools → 50,000+ tokens consumed upfront
- Every tool call and result passes through context
- Complex workflows → 150,000+ tokens
- High costs, slow performance, hitting context limits

### The Solution (MCP + Code Execution)
- Tools exposed as code APIs on filesystem → 0 tokens upfront
- Agent discovers and loads tools on-demand
- Agent writes code to compose tools → runs in sandbox
- Data processing happens outside context
- **Result: 98% token reduction (150K → 2K)**

## Updated Files

### 1. Agent Quick Build Guide
**Location:** `/mnt/user-data/outputs/Agent_Quick_Build_Guide.md`

**Changes:**
- ✅ Phase 1: Added MCP + Code Execution as primary option
- ✅ Decision guide: When to use MCP vs direct calling
- ✅ Code examples showing both approaches
- ✅ Updated one-page reference card
- ✅ Token savings prominently displayed

**Key Addition:**
```
🚀 NEW: MCP + Code Execution (98% fewer tokens)
Best for: Agents with 10+ tools, complex workflows
Result: 150K tokens → 2K tokens
```

### 2. Agent-Builder Skill
**Location:** `/mnt/user-data/outputs/agent-builder.skill`

**Changes:**
- ✅ Quick Start: Two approaches (MCP vs Direct)
- ✅ Architecture Decision section with criteria
- ✅ Phase 1: Both MCP and direct setup instructions
- ✅ Phase 2: System prompts for both approaches
- ✅ New reference file: `mcp_code_execution.md`

**New Reference File:**
Comprehensive guide covering:
- When to use MCP + Code vs Direct calling
- Implementation patterns
- Filesystem structure
- Code composition examples
- Security considerations
- Performance comparisons
- Migration guide

## Decision Framework

### Use MCP + Code Execution When:
- ✅ Agent needs 10+ tools
- ✅ Complex data processing workflows
- ✅ Multi-step operations with intermediate results
- ✅ Need to filter/transform data before returning to model
- ✅ Working with large datasets

### Use Direct Tool Calling When:
- ✅ Agent needs 2-5 simple tools
- ✅ Straightforward lookup/action workflows
- ✅ Quick prototyping
- ✅ Simple, predictable workflows

## Key Benefits of MCP + Code

### 1. Progressive Tool Discovery
- **Old:** Load all 50 tools upfront → 50K tokens
- **New:** Explore filesystem, load 2-3 on-demand → 500 tokens

### 2. Context-Efficient Data Handling
- **Old:** 10K row spreadsheet → 100K+ tokens in context
- **New:** Process in sandbox, return summary → 50 tokens

### 3. Privacy-Preserving
- **Old:** Sensitive data exposed in model context
- **New:** Tokenize in execution environment, model sees placeholders

### 4. Reusable Skills
- **Old:** Rewrite same logic repeatedly
- **New:** Save to skills/ directory, import and reuse

## Example Comparison

### Traditional Approach (150K tokens)
```python
# Load 50 tool definitions → 50K tokens
tools = [tool1, tool2, ..., tool50]

# Get document → 40K tokens
doc = agent.call_tool("get_document", {"id": "abc123"})

# Process in context → 30K tokens
filtered = agent.call_tool("filter_data", {"data": doc})

# Update record → 30K tokens
result = agent.call_tool("update_record", {"data": filtered})
```

### MCP + Code Execution (2K tokens)
```typescript
// Tools discovered on filesystem → 0 tokens upfront

// Agent writes code → 500 tokens
const doc = await gdrive.getDocument({ documentId: 'abc123' });

// Process in sandbox → 0 tokens
const filtered = doc.content
  .split('\n')
  .filter(line => line.includes('Action Item'));

// Update → 500 tokens
await salesforce.updateRecord({ data: { Notes: filtered } });

// Return summary → 100 tokens
console.log('Updated Salesforce with action items');
```

## Implementation Pattern

### Filesystem Structure
```
servers/
├── google-drive/
│   ├── getDocument.ts      # Each tool is a typed function
│   ├── searchFiles.ts
│   └── index.ts
├── salesforce/
│   ├── updateRecord.ts
│   ├── queryRecords.ts
│   └── index.ts
└── skills/
    └── saved_workflows.ts   # Reusable agent code
```

### Tool Wrapper Example
```typescript
// servers/google-drive/getDocument.ts
interface GetDocumentInput {
  documentId: string;
}

export async function getDocument(input: GetDocumentInput) {
  return callMCPTool('google_drive__get_document', input);
}
```

### Agent-Generated Code
```typescript
// Agent explores and composes tools
const doc = await gdrive.getDocument({ documentId: 'abc123' });
await salesforce.updateRecord({ 
  objectType: 'Meeting',
  data: { Notes: doc.content }
});
```

## System Prompt Changes

### For MCP + Code
```markdown
You are an agent with access to MCP servers as code APIs.

Available servers in ./servers/:
- google-drive: Document operations
- salesforce: CRM operations

Process:
1. Explore ./servers/ to discover tools
2. Read tool files to understand APIs
3. Write TypeScript code to compose tools
4. Keep data in execution environment
5. Return only final results
```

### For Direct Calling
```markdown
You are an agent with these tools:
- search_web: Search internet
- query_db: Query database

Use tools when needed, follow examples shown.
```

## Performance Impact

| Scenario | Old Tokens | New Tokens | Savings |
|----------|-----------|------------|---------|
| 50 tool definitions | 50,000 | 500 | 99% |
| Fetch + filter 10K rows | 150,000 | 2,000 | 98.7% |
| 5-step pipeline | 80,000 | 3,000 | 96.3% |
| Polling loop (10x) | 200,000 | 5,000 | 97.5% |

## Migration Path

**For New Agents:**
1. Assess: 10+ tools or complex workflows? → Use MCP + Code
2. Assess: 2-5 simple tools? → Use Direct calling

**For Existing Agents:**
1. If hitting token limits → Migrate to MCP + Code
2. If simple and working → Keep direct calling
3. Hybrid approach: Use code for data processing, direct for simple actions

## Security Considerations

**Sandbox Requirements:**
- Isolated execution environment
- Limited filesystem access
- No network access except through MCP tools
- Resource limits (CPU, memory, timeout)
- Logging all generated code

**Best Practices:**
- Log code before execution
- Approval for destructive operations
- Rate limiting on code execution
- 30-second timeout limits

## References

**Anthropic Article:**
https://www.anthropic.com/engineering/code-execution-with-mcp

**Key Quote:**
> "Code execution with MCP enables agents to use context more efficiently by loading tools on demand, filtering data before it reaches the model, and executing complex logic in a single step."

**Similar Approaches:**
- Cloudflare "Code Mode" for Workers platform
- Uses same core insight: LLMs are great at writing code

## Next Steps

1. **Review the updated guide:** `/mnt/user-data/outputs/Agent_Quick_Build_Guide.md`
2. **Upload the updated skill:** `/mnt/user-data/outputs/agent-builder.skill`
3. **Read MCP reference:** Open skill and navigate to `references/mcp_code_execution.md`
4. **Start building:** Use decision framework to choose approach for each agent

## Bottom Line

**When building agents:**
- Default to MCP + Code Execution for complex agents (10+ tools)
- Use Direct Tool Calling for simple agents (2-5 tools)
- Expect 98% token reduction for complex workflows
- Follow patterns in updated skill and guide

This is a fundamental shift in how we build scalable AI agents. The token savings enable agents that were previously impossible due to context limits.

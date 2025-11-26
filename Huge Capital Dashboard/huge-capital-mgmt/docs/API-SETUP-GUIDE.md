# Claude API Setup Guide

## Overview
This guide explains how to enable Claude API for dynamic AI-powered content generation.

**Current State:** The app works without the API using a curated content library. The API adds real-time AI generation.

---

## When to Add the API

### You DON'T need the API if:
- Just demoing the MVP
- Testing the UI and workflow
- The mock content library is sufficient

### You SHOULD add the API when:
- Ready for production with real AI-generated content
- Need dynamic, personalized content beyond the library
- Ready to set up secure backend proxy

---

## Option 1: Local Development (Quick Setup)

**Warning:** This method exposes your API key in frontend code. Only use for local testing.

### Step 1: Create Anthropic Account
1. Go to: https://console.anthropic.com
2. Click "Sign Up" or "Log In"
3. Complete email verification

### Step 2: Add Payment Method
1. Go to "Billing" in the console
2. Add a credit card
3. No minimum - it's pay-as-you-go (~$3 per million input tokens)

### Step 3: Generate API Key
1. Go to "API Keys" in the console
2. Click "Create Key"
3. Give it a name (e.g., "huge-capital-dev")
4. **Copy the key immediately** - you won't see it again!

### Step 4: Add to Environment
1. Open `/localhost-dashboard/.env`
2. Add your key:
```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### Step 5: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 6: Test It
1. Go to Content Planner
2. Generate content
3. Check browser console for: `[SkillsRunner] Using Claude API for...`

---

## Option 2: Production Setup (Recommended)

For production, the API key should NEVER be in frontend code. Use a backend proxy.

### Architecture
```
User → Frontend → Supabase Edge Function → Claude API
                         ↑
                  (API key stored securely)
```

### Step 1: Create Edge Function
In Supabase dashboard:
1. Go to "Edge Functions"
2. Create new function: `generate-content`

### Step 2: Edge Function Code
```typescript
// supabase/functions/generate-content/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

serve(async (req) => {
  // Get API key from Supabase secrets
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { systemPrompt, userPrompt } = await req.json();

    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

### Step 3: Add Secret to Supabase
1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Add secret: `ANTHROPIC_API_KEY` = your key

### Step 4: Update Frontend
Modify `src/services/claudeApi.ts` to call Edge Function instead:

```typescript
const EDGE_FUNCTION_URL = "https://your-project.supabase.co/functions/v1/generate-content";

// Replace direct API call with:
const response = await fetch(EDGE_FUNCTION_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${supabaseAnonKey}`,
  },
  body: JSON.stringify({ systemPrompt, userPrompt }),
});
```

### Step 5: Deploy Edge Function
```bash
supabase functions deploy generate-content
```

---

## Cost Estimation

### Claude API Pricing (as of Nov 2024)
- **Input tokens:** ~$3 per million tokens
- **Output tokens:** ~$15 per million tokens

### Typical Usage
- Average post generation: ~500 input tokens, ~300 output tokens
- Cost per post: ~$0.006 (less than 1 cent)
- 100 posts/day: ~$0.60/day
- 3,000 posts/month: ~$18/month

### Tips to Reduce Costs
1. Use the mock content library for testing
2. Cache generated content (Content Library does this)
3. Use shorter system prompts where possible
4. Generate in batches rather than one-by-one

---

## Troubleshooting

### "API key not configured"
- Check `.env` file has correct key
- Ensure key starts with `sk-ant-`
- Restart dev server after adding key

### "401 Unauthorized"
- API key may be invalid or expired
- Generate a new key in Anthropic console

### "429 Rate Limited"
- You're making too many requests
- Add delays between batch generations
- Check your rate limits in Anthropic console

### "CORS Error"
- You're calling API directly from browser in production
- This is why you need the Edge Function proxy

### Content Not Using API
- Check console for `[SkillsRunner] Using content library...`
- If you see this, API isn't being used
- Verify `isClaudeApiAvailable()` returns true

---

## Security Checklist

- [ ] API key is NOT in any committed files
- [ ] `.env` is in `.gitignore`
- [ ] Production uses Edge Function proxy
- [ ] API key is stored in Supabase secrets (not GitHub)
- [ ] Rate limiting is configured

---

## Next Steps After API Setup

Once API is working, you can enhance the system:

1. **Add more skills:**
   - Twitter thread generator
   - Carousel post generator
   - Newsletter composer

2. **Add analytics:**
   - Track which content performs best
   - Learn from engagement data

3. **Add optimization:**
   - A/B test content variations
   - Optimize posting times based on data

---

## Quick Reference

| Environment | API Key Location | Security Level |
|-------------|------------------|----------------|
| Local Dev | `.env` file | Low (acceptable for testing) |
| Production | Supabase Secrets | High (recommended) |
| GitHub | Never store here | N/A |

| Console URL | Purpose |
|-------------|---------|
| console.anthropic.com | Manage API keys, billing |
| supabase.com/dashboard | Edge Functions, secrets |

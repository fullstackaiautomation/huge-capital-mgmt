# Deployment Guide - Huge Capital Dashboard

## Overview
This guide covers deploying the Huge Capital Dashboard to production via GitHub Pages.

---

## Pre-Deployment Checklist

Before deploying, verify these items:

### 1. Code Quality Check
- [ ] Run `npm run build` locally - ensure no errors
- [ ] Test all features in localhost (content generation, calendar, library)
- [ ] Check browser console for any errors
- [ ] Verify all personas work correctly (Zac, Luke, Huge Capital)

### 2. Environment Variables
- [ ] `.env` file has correct Supabase credentials
- [ ] API keys are NOT committed to git (check `.gitignore`)
- [ ] Production environment variables are set in GitHub Secrets (if using API)

### 3. Git Status
- [ ] All changes are committed
- [ ] Branch is up to date with remote
- [ ] No uncommitted changes that could be lost

---

## Deployment Steps

### Step 1: Build Locally First
```bash
# From the localhost-dashboard directory
cd "/Users/amandamealy/Documents/Claude Code/huge-content-skills/localhost-dashboard"

# Install dependencies (if needed)
npm install

# Build for production
npm run build
```

**Expected output:** Build completes with no errors, creates `dist/` folder.

### Step 2: Verify Build
```bash
# Preview the production build locally
npm run preview
```
Visit the preview URL and test key features.

### Step 3: Commit Changes
```bash
# Check what's changed
git status

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Phase 1 MVP: Content Planner with Library and Calendar

- Add Content Generator with batch generation
- Add Content Library with auto-save and filtering
- Add Calendar scheduling with AI-suggested times
- Add persona-specific posting schedules
- Add topic and inspiration fields

Generated with Claude Code"
```

### Step 4: Push to GitHub
```bash
# Push to main branch (triggers deployment)
git push origin main
```

### Step 5: Monitor Deployment
1. Go to GitHub repository: `https://github.com/[your-repo]`
2. Click **Actions** tab
3. Watch the `deploy.yml` workflow run
4. Wait for green checkmark (usually 2-3 minutes)

### Step 6: Verify Live Site
1. Visit: `https://hugecapital.fullstackaiautomation.com/`
2. Test key features:
   - [ ] Login works
   - [ ] Content Planner generates content
   - [ ] Content Library shows saved items
   - [ ] Calendar displays and scheduling works
   - [ ] All three personas function correctly

---

## Troubleshooting

### Build Fails Locally
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Try building again
npm run build
```

### GitHub Actions Fails
1. Check Actions tab for error logs
2. Common issues:
   - Missing environment variables
   - TypeScript errors not caught locally
   - Dependency version conflicts

### Site Shows Old Version
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache
3. Check GitHub Actions completed successfully

### localStorage Not Persisting
- localStorage is browser-specific, not synced between devices
- Content Library and Scheduled Posts are device-local until Supabase migration

---

## Post-Deployment

### Verify All Routes Work
- `/` - Funding Dashboard
- `/content` - Content Planner
- `/library` - Content Library
- `/tracker` - Task Tracker
- `/lenders` - Lenders Database

### Test Cross-Browser
- Chrome
- Safari
- Firefox (if applicable)

### Monitor for Issues
- Check browser console for errors
- Test on mobile devices
- Collect user feedback

---

## Rollback (If Needed)

If something goes wrong:

```bash
# Find the last working commit
git log --oneline -10

# Reset to that commit
git reset --hard [commit-hash]

# Force push (use with caution)
git push -f origin main
```

**Note:** Force push will trigger a new deployment with the rolled-back code.

---

## Future Deployment Notes

When adding Claude API for production:
1. Set up Supabase Edge Function as API proxy
2. Store `ANTHROPIC_API_KEY` in Supabase secrets (not GitHub)
3. Update `claudeApi.ts` to call Edge Function instead of direct API
4. Never expose API keys in frontend code

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `git push origin main` | Deploy to production |

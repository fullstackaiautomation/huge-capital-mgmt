# CLAUDE.md - Huge Capital Project

## Project Overview

Huge Capital project directory for development work.

## Git Sync Workflow

**At the START of every session:**
```bash
git sync-start
```
This pulls the latest changes from your other machines.

**At the END of every session:**
```bash
git sync-end
```
This automatically stages, commits, and pushes all changes with a timestamp.

**Manual commands (if aliases not available):**
- Start: `git pull`
- End: `git add . && git commit -m "describe changes" && git push`

## Repository

This project syncs to a private GitHub repository:
- **Sync Repo:** https://github.com/fullstackaiautomation/huge-capital-sync (Private)
- **Branch:** master

**Note on .gitignore:**
Sensitive files (`.env`, `credentials.json`, API keys) are excluded from git tracking via `.gitignore`. Each machine maintains its own copy of these files locally.

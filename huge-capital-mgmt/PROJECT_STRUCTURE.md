# Project Structure Guide

## 📁 Folder Organization

### Root Level Files
- **CLAUDE.md** - Main project instructions and guidelines
- **bugs.md** - Bug tracking and reports
- **decisions.md** - Architectural decision log
- **progress.md** - Progress tracking log
- **README.md** - Project overview and setup
- **CNAME** - GitHub Pages domain configuration
- **package.json** / **package-lock.json** - Dependencies
- **vite.config.ts** - Vite build configuration
- **tailwind.config.js** - Tailwind CSS configuration
- **tsconfig*.json** - TypeScript configuration
- **eslint.config.js** - Linting configuration
- **.env** / **.env.example** - Environment variables

### 📁 Core Folders

#### `.agent/` - Agent Documentation
Comprehensive project documentation for AI agents
- **README.md** - Index of all documentation
- **Tasks/** - Feature requirements and implementation plans
- **System/** - Architecture, database schema, tech stack
- **SOP/** - Standard operating procedures for tasks

#### `.claude/` - Claude Code Configuration
- **commands/** - Custom slash commands for Claude Code
  - **BMad/** - Brownfield Architecture Methodology agents
    - agents/ - Agent definitions
    - tasks/ - Task templates

#### `.github/` - GitHub Configuration
- GitHub Actions workflows
- CI/CD pipeline configuration

#### `src/` - Source Code
- **pages/** - React page components
- **components/** - Reusable React components
- **hooks/** - Custom React hooks
- **lib/** - Utility libraries (Supabase client, etc.)

#### `supabase/` - Supabase Configuration
- **migrations/** - Active database migrations (applied to DB)
- **functions/** - Supabase edge functions
- **.temp/** - Temporary Supabase CLI files (auto-generated)
- **config.toml** - Supabase configuration

#### `public/` - Static Assets
Served as-is by the build system

#### `dist/` - Build Output
Generated during `npm run build` (gitignored)

---

## 📦 Organized Folders (Cleanup)

### `database/` - Database Files

#### `database/archive/`
Old/historical SQL files not currently in use:
- Schema definitions (old versions)
- Column alterations
- Old migration attempts
- Reference SQL files

#### `database/seed-data/`
CSV files and data for seeding:
- `Master Huge Capital Lender List - Business Line of Credits.csv`
- `Master Huge Capital Lender List - MCA.csv`
- `Master Huge Capital Lender List - SBA.csv`
- (Already imported to Supabase)

**Active Database Migrations**: See `supabase/migrations/` (not here)

---

### `docs/` - Documentation

#### `docs/` (Root)
Active documentation for features:
- PRDs (Product Requirements Documents)
- Feature specifications
- Implementation guides
- Epics and user stories

#### `docs/archive/`
Outdated/historical documentation:
- Old setup guides
- Previous migration guides
- Planning documents
- Testing results from past iterations

#### `docs/planning/`
Planning materials:
- Excel planning files
- Spreadsheets
- Project planning documents

---

### `scripts/` - Development Scripts

#### `scripts/` (Root)
Active TypeScript utility scripts:
- **apply-lenders-migration.ts** - Database migration scripts
- **sync-lenders.ts** - Lender data synchronization
- **test-sheet-fetch.ts** - Google Sheets integration testing

#### `scripts/utilities/`
JavaScript utility scripts:
- Database setup helpers
- Data migration utilities
- Configuration utilities

#### `scripts/test/`
Test files and testing utilities:
- **test-weekly-recaps.html** - Weekly recap testing

---

## 🔄 Key Relationships

### Database Flow
```
src/ (React Components)
    ↓
src/hooks/ (Supabase queries)
    ↓
supabase/migrations/ (Active schema)
    ↓
Supabase Database
```

### Documentation Flow
```
.agent/README.md (Start here)
    ├─→ .agent/Tasks/ (What to build)
    ├─→ .agent/System/ (How system works)
    └─→ .agent/SOP/ (How to build)

CLAUDE.md (Quick reference)
    ├─→ bugs.md (Issues)
    ├─→ decisions.md (Architecture)
    └─→ progress.md (Status)

docs/ (Feature documentation)
    └─→ docs/archive/ (Old docs)
```

### Scripts Organization
```
scripts/ (Active TypeScript utilities)
    ├─→ scripts/utilities/ (Helper scripts)
    └─→ scripts/test/ (Testing)
```

---

## 📋 What Goes Where

### Adding a New Database Table
1. Create migration: `supabase migration new table_name`
2. Write SQL in `supabase/migrations/[timestamp]_table_name.sql`
3. Push: `npx supabase db push`
4. Document in `.agent/System/DATABASE.md`

### Adding a New Feature
1. Plan in `.agent/Tasks/feature-name.md`
2. Implement in `src/pages/` or `src/components/`
3. Add database changes to `supabase/migrations/`
4. Create custom hook in `src/hooks/` if needed
5. Update `.agent/System/ARCHITECTURE.md`
6. Log decision in `decisions.md`
7. Update `progress.md` when complete

### Adding Utility Script
1. Create in `scripts/utilities/` (JavaScript)
2. Or create in `scripts/` root (TypeScript)
3. Document usage in `.agent/SOP/` if it's a common task

### Testing
1. Create test file in `scripts/test/`
2. Document testing procedure in `.agent/SOP/`

---

## 🚀 Quick Navigation

**Starting a new task?**
→ Read `.agent/README.md` first

**Need project instructions?**
→ Check `CLAUDE.md`

**Want to understand the system?**
→ Read `.agent/System/ARCHITECTURE.md`

**Adding a database table?**
→ Follow `.agent/SOP/database-migrations.md`

**Implementing a feature?**
→ Follow `.agent/SOP/adding-features.md`

**Need to know what was changed?**
→ Check `progress.md` or `decisions.md`

**Found a bug?**
→ Add to `bugs.md`

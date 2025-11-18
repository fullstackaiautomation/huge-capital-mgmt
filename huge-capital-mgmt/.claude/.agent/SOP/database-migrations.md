# SOP: Database Migrations

## Standard Operating Procedure for Database Schema Changes

### Overview

Database migrations allow you to safely version control and apply schema changes to your Supabase database. Always use migrations for any structural changes.

---

## Creating a Migration

### Step 1: Generate Migration File

```bash
npx supabase migration new your_descriptive_migration_name
```

This creates a new file in `supabase/migrations/` with timestamp:
```
supabase/migrations/TIMESTAMP_your_descriptive_migration_name.sql
```

### Step 2: Write Your SQL

Edit the migration file and write your SQL. Common operations:

#### Creating a Table

```sql
CREATE TABLE your_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- String fields
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),

  -- Numeric fields
  quantity INTEGER DEFAULT 0,
  amount DECIMAL(10, 2),

  -- Boolean fields
  is_active BOOLEAN DEFAULT true,

  -- Date/Time fields
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),

  -- Foreign keys (when needed)
  user_id VARCHAR(100) NOT NULL,

  -- Constraints
  UNIQUE(name, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_your_table_user_id ON your_table(user_id);
CREATE INDEX idx_your_table_category ON your_table(category);
```

#### Adding Columns to Existing Table

```sql
ALTER TABLE existing_table
ADD COLUMN new_column VARCHAR(100) DEFAULT 'default_value';

-- Or for nullable column
ALTER TABLE existing_table
ADD COLUMN new_column TEXT;
```

#### Modifying Columns

```sql
-- Change column type
ALTER TABLE your_table
ALTER COLUMN column_name TYPE VARCHAR(500);

-- Add NOT NULL constraint
ALTER TABLE your_table
ALTER COLUMN column_name SET NOT NULL;

-- Set default value
ALTER TABLE your_table
ALTER COLUMN column_name SET DEFAULT 'default';
```

#### Dropping Columns

```sql
ALTER TABLE your_table
DROP COLUMN column_name;
```

#### Creating Indexes

```sql
-- Simple index
CREATE INDEX idx_table_column ON your_table(column_name);

-- Composite index
CREATE INDEX idx_table_multi ON your_table(column1, column2);

-- Unique index
CREATE UNIQUE INDEX idx_table_unique ON your_table(column_name);
```

---

## Row Level Security (RLS)

### Enable RLS on a Table

```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Create policy for reading own data
CREATE POLICY "Users can read own data"
ON your_table
FOR SELECT
USING (auth.uid()::text = user_id);

-- Create policy for inserting own data
CREATE POLICY "Users can insert own data"
ON your_table
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Create policy for updating own data
CREATE POLICY "Users can update own data"
ON your_table
FOR UPDATE
USING (auth.uid()::text = user_id);

-- Create policy for deleting own data
CREATE POLICY "Users can delete own data"
ON your_table
FOR DELETE
USING (auth.uid()::text = user_id);
```

### Service Role Bypass

For administrative operations using service role key:

```sql
-- Service role can bypass RLS on specific tables
-- This is already configured in .env with SUPABASE_SERVICE_ROLE_KEY
```

---

## Running Migrations

### Push Migrations to Database

```bash
npx supabase db push
```

This will:
1. Show you pending migrations
2. Apply them in order
3. Update the migration tracking table

### Check Migration Status

```bash
npx supabase migration list
```

Shows:
- All applied migrations
- Timestamps
- Status

### Pull Database Changes (Advanced)

```bash
npx supabase db pull
```

**Warning**: Only use if you've made changes directly in Supabase UI and want to capture them as a migration.

---

## Common Migration Scenarios

### Scenario 1: Add a New Table for a Feature

```bash
npx supabase migration new create_feature_table
```

```sql
CREATE TABLE feature_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_feature_items_user_id ON feature_items(user_id);
CREATE INDEX idx_feature_items_status ON feature_items(status);

ALTER TABLE feature_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own feature items"
ON feature_items
FOR SELECT
USING (user_id = 'dillon'); -- or proper auth check
```

### Scenario 2: Add Weekly Recap Form

Already implemented. See:
- `supabase/migrations/20241026_create_weekly_recaps.sql`

### Scenario 3: Fix Data Type Issue

```bash
npx supabase migration new fix_column_type
```

```sql
-- Change VARCHAR to TEXT for more flexibility
ALTER TABLE your_table
ALTER COLUMN description TYPE TEXT;
```

### Scenario 4: Add New Field to Daily Checklist

```bash
npx supabase migration new add_notes_to_daily_checklist
```

```sql
ALTER TABLE daily_checklist
ADD COLUMN notes TEXT,
ADD COLUMN priority VARCHAR(50) DEFAULT 'medium';
```

---

## Verifying Migrations

### After Running Migrations

1. **Check in Supabase Dashboard**:
   - Log in to Supabase
   - Go to SQL Editor
   - Verify your tables exist
   - Check data integrity

2. **Test Queries**:
   ```sql
   SELECT COUNT(*) FROM your_new_table;
   ```

3. **Test from Application**:
   ```typescript
   const { data, error } = await supabase
     .from('your_new_table')
     .select('*');
   ```

---

## Rollback Migrations

### If Something Goes Wrong

**Option 1: Manual SQL Fix** (Preferred)

Create a new migration to fix the issue:

```bash
npx supabase migration new fix_previous_issue
```

Write SQL to correct the problem.

**Option 2: Reset Local Database** (Development Only)

```bash
# Warning: This deletes all local data!
npx supabase db reset
```

---

## Best Practices

### DO:
- ✅ Use descriptive migration names: `create_daily_checklist`, `add_priority_field`
- ✅ Keep migrations focused on one logical change
- ✅ Test migrations locally before pushing to production
- ✅ Include both schema changes and data migrations together
- ✅ Add indexes for frequently queried columns
- ✅ Include RLS policies in the same migration as table creation
- ✅ Document complex migrations with comments

### DON'T:
- ❌ Modify existing migrations after they're pushed
- ❌ Mix multiple unrelated changes in one migration
- ❌ Forget to add indexes on foreign keys
- ❌ Skip RLS policies for security-sensitive tables
- ❌ Use generic names like `update_table` or `fix_bug`

---

## Migration Examples from This Project

### Example 1: Daily Checklist Table
```sql
-- File: supabase/migrations/20251026_create_daily_checklist.sql
CREATE TABLE IF NOT EXISTS daily_checklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  monday BOOLEAN DEFAULT false,
  tuesday BOOLEAN DEFAULT false,
  wednesday BOOLEAN DEFAULT false,
  thursday BOOLEAN DEFAULT false,
  friday BOOLEAN DEFAULT false,
  week_number INTEGER,
  week_start DATE,
  user_id VARCHAR(100) DEFAULT 'dillon',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
```

### Example 2: Weekly Recaps Table
```sql
-- File: supabase/migrations/20241026_create_weekly_recaps.sql
CREATE TABLE IF NOT EXISTS weekly_recaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number INTEGER NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  what_was_done TEXT,
  quantity TEXT,
  wins_highlights TEXT,
  issues_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  user_id VARCHAR(100) DEFAULT 'dillon'
);
```

---

## Troubleshooting

### Issue: Migration fails to apply
- Check SQL syntax
- Ensure table doesn't already exist (use `IF NOT EXISTS`)
- Check for permission issues

### Issue: RLS policies not working
- Verify `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Check policy conditions
- Test with both user and service role

### Issue: Queries are slow after migration
- Add indexes: `CREATE INDEX idx_name ON table(column)`
- Check query plans in Supabase SQL Editor
- Analyze table: `ANALYZE table_name`

---

## Documentation

Always document your migration in `.agent/System/DATABASE.md`:

1. Add table definition
2. Explain purpose
3. Include example data
4. Document any RLS policies

This helps future developers understand the schema.

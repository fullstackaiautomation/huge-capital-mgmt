# SOP: Adding New Features

## Standard Operating Procedure for Implementing New Features

### Before You Start

1. **Read the Requirements**
   - Check the relevant task file in `.agent/Tasks/`
   - Understand what needs to be built
   - Review acceptance criteria

2. **Review Architecture**
   - Read `.agent/System/ARCHITECTURE.md`
   - Understand where your feature fits
   - Identify dependencies

3. **Check Existing Implementation**
   - Look for similar features
   - Reuse components and patterns when possible
   - Maintain consistency with existing code

---

## Step-by-Step Implementation

### 1. Plan the Feature

**Document your plan**:
- Add entry to `decisions.md` before starting
- Explain your architectural approach
- Note any alternatives considered

**Example**:
```markdown
### Feature Name (DATE)
**Decision**: How you're implementing this
**Rationale**: Why this approach
**Alternatives Considered**: Other options
**Status**: In Progress
```

### 2. Create/Update Components

**TypeScript Best Practices**:
- Always define proper types for props and state
- Use `type` or `interface` for component props
- Avoid `any` types
- Run `npx tsc --noEmit` to check for errors

**Component Structure**:
```typescript
import { useState, useEffect } from 'react';
import { YourIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

type YourProps = {
  prop1: string;
  prop2: number;
};

export const YourComponent = ({ prop1, prop2 }: YourProps) => {
  const [state, setState] = useState('');

  useEffect(() => {
    // Initialize component
  }, []);

  return (
    <div className="your-styles">
      {/* Content */}
    </div>
  );
};
```

### 3. Database Changes

**If you need a new table**:

1. Create migration file:
   ```bash
   npx supabase migration new your_feature_name
   ```

2. Write SQL in `supabase/migrations/TIMESTAMP_your_feature_name.sql`:
   ```sql
   CREATE TABLE your_table (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     -- columns here
     user_id VARCHAR(100) DEFAULT 'dillon',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
   );

   -- Add RLS policy
   ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
   ```

3. Push migration:
   ```bash
   npx supabase db push
   ```

4. Document in `.agent/System/DATABASE.md`

### 4. Integrate with Supabase

**Pattern for loading data**:
```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('your_table')
        .select('*')
        .eq('user_id', 'dillon');

      if (error) throw error;
      setData(data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  loadData();
}, []);
```

**Pattern for saving data**:
```typescript
const handleSave = async () => {
  try {
    const { error } = await supabase
      .from('your_table')
      .upsert({
        id: existingId || undefined,
        // data fields
        user_id: 'dillon',
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    // Handle success
  } catch (error) {
    console.error('Error saving:', error);
  }
};
```

### 5. Styling

**Follow Visual Consistency Rules** from CLAUDE.md:

```typescript
// Card styling
className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30"

// Button with hover
className="px-4 py-2 rounded-lg hover:bg-gray-700/30 transition-colors"

// Category background
className={`bg-${categoryColor}-500/20 text-${categoryColor}-400`}

// Responsive layout
className="flex flex-col lg:flex-row"
```

**Colors to use**:
- Brand Primary: `#6366f1` (indigo-500)
- Social & Content: `#a855f7` (purple-500)
- Pipeline: `#3b82f6` (blue-500)
- Referral: `#10b981` (emerald-500)
- Ops: `#f59e0b` (amber-500)

### 6. Add to Navigation

**Update `src/components/Layout.tsx`**:
- Add menu item or submenu for new feature
- Follow existing navigation structure
- Use appropriate icons from lucide-react

**Example**:
```typescript
<button
  onClick={() => navigate('/your-feature')}
  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-700/30"
>
  <YourIcon className="w-4 h-4" />
  Your Feature
</button>
```

**Update `src/App.tsx`**:
- Add route for new page
- Import and configure component

### 7. Testing

**Before committing**:

1. **Type checking**:
   ```bash
   npx tsc --noEmit
   ```

2. **Linting**:
   ```bash
   npx eslint src/
   ```

3. **Build**:
   ```bash
   npm run build
   ```

4. **Manual testing**:
   - Test in development: `npm run dev`
   - Test data persistence
   - Test UI responsiveness
   - Check for console errors

### 8. Documentation

**Update documentation files**:

1. **CLAUDE.md** (root):
   - Add feature to "Core Features" section if major
   - Update architecture if changed

2. **Tasks file** (`.agent/Tasks/`):
   - Document the feature in a task file
   - Include requirements and implementation details

3. **decisions.md** (root):
   - Already added in step 1, now update status to "✅ Implemented"

4. **progress.md** (root):
   - Add completed task to latest session

### 9. Git Commit

**Commit your changes**:
```bash
git add .
git commit -m "Add: Feature name description

- Feature detail 1
- Feature detail 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Push to GitHub**:
```bash
git push origin main
```

### 10. Review & Iterate

**After deployment**:
- Monitor for errors
- Gather user feedback
- Log any bugs to `bugs.md`
- Document improvements in `decisions.md`

---

## Common Patterns

### Pattern: Collapsible Section
```typescript
const [isOpen, setIsOpen] = useState(false);

<button onClick={() => setIsOpen(!isOpen)}>
  {isOpen ? <ChevronDown /> : <ChevronRight />}
  Section Title
</button>

{isOpen && (
  <div>
    {/* Content */}
  </div>
)}
```

### Pattern: Category-Based Organization
```typescript
const groupedData = data.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, typeof data>);

{Object.entries(groupedData).map(([category, items]) => (
  // Render category section
))}
```

### Pattern: Form with Auto-Save
```typescript
const handleInputChange = (field: string, value: string) => {
  setData(prev => ({ ...prev, [field]: value }));

  // Auto-save with debounce (optional)
  saveToDatabase({ ...data, [field]: value });
};
```

---

## Checklist

- [ ] Feature requirements understood
- [ ] Architecture planned and documented in decisions.md
- [ ] Code written with proper TypeScript types
- [ ] Database migrations created if needed
- [ ] Supabase integration tested
- [ ] Styling follows Visual Consistency Rules
- [ ] Navigation updated
- [ ] Type checking passes (`tsc --noEmit`)
- [ ] Linting passes (`eslint src/`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Committed to git with descriptive message
- [ ] Pushed to GitHub
- [ ] GitHub Actions build succeeds

---

## Support

For questions about:
- **Architecture**: See `.agent/System/ARCHITECTURE.md`
- **Database**: See `.agent/System/DATABASE.md`
- **Project Setup**: See root `CLAUDE.md`
- **Styling**: See "Visual Consistency Rules" in root `CLAUDE.md`

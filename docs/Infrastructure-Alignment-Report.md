# Infrastructure Alignment Report: Huge Capital Dashboard

## Executive Summary
After reviewing the existing codebase, I've identified the established patterns and infrastructure that our new features must align with. This document ensures all new development maintains consistency with the current architecture.

---

## ✅ Current Infrastructure Analysis

### Technology Stack (Confirmed)
```json
{
  "framework": "React 19 + TypeScript",
  "styling": "Tailwind CSS v4 (Dark Mode)",
  "routing": "React Router DOM v7",
  "database": "Supabase (PostgreSQL)",
  "state": "React Hooks + Local State",
  "charts": "Recharts",
  "calendar": "React Big Calendar",
  "icons": "Lucide React",
  "dnd": "@dnd-kit (for drag & drop)",
  "build": "Vite"
}
```

### Design System & UI Patterns

#### Color Palette (From tailwind.config.js)
```javascript
// Brand Colors - Gold/Bronze Theme
brand: {
  500: '#f7931e', // Main gold - Used for primary actions
  600: '#e87610', // Darker gold - Hover states
}

// Dark Theme (Current Default)
dark: {
  bg: '#1a1f2e',     // Main background
  card: '#242938',   // Card backgrounds
  border: '#2d3548', // Borders
  hover: '#2a3040',  // Hover states
}

// Accent Colors
blue: {
  primary: '#3b82f6',   // Information/Links
  secondary: '#2563eb', // Active states
}
```

#### UI Component Patterns Observed

1. **Page Headers**
```tsx
// Standard pattern from TaskTracker.tsx
<h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
  <IconComponent className="w-8 h-8 text-brand-500" />
  Page Title
</h1>
```

2. **Card Components**
```tsx
// Dark card with backdrop blur (from TaskTracker)
<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
  // Content
</div>

// Alternative card style (from Layout)
<div className="bg-dark-card shadow-2xl border-r border-dark-border">
  // Content
</div>
```

3. **Button Styles**
```tsx
// Primary Action Button (Green)
<button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-500/50">

// Secondary Button (Gray)
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">

// Brand Color Button
<button className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
```

4. **Toggle/Filter Buttons**
```tsx
// From TaskTracker filter
<div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-gray-700/50">
  <button className={`px-4 py-2 rounded-md transition-colors ${
    isActive ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
  }`}>
```

5. **Navigation Pattern (Sidebar)**
```tsx
// From Layout.tsx - Active state
className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
  isActive(item.href)
    ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
    : 'text-gray-400 hover:bg-dark-hover hover:text-gray-200'
}`}
```

### Database Patterns (Supabase)

#### Current Tables Structure
```sql
-- Example from tracker_tasks
CREATE TABLE tracker_tasks (
  id TEXT PRIMARY KEY,
  task_name TEXT,
  description TEXT,
  assignee TEXT,
  area TEXT,
  due_date TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_date TEXT,
  created_by UUID REFERENCES auth.users(id)
);
```

#### Hook Pattern for Data Management
```typescript
// Standard pattern from useTaskTracker.ts
export const useFeatureName = () => {
  const [data, setData] = useState<Type[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch function
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('table_name')
      .select('*');
    // Transform snake_case to camelCase
  };

  // Save function with upsert
  const saveData = async (item: Type) => {
    const { error } = await supabase
      .from('table_name')
      .upsert(transformedData);
  };

  return { data, setData, saveData, deleteData, loading };
};
```

### Authentication Pattern
- Using Supabase Auth
- Protected routes via `ProtectedRoute` component
- User context via `useAuth` hook
- Session management handled by Supabase

---

## 🔄 Updated Architecture Recommendations

### 1. Content Planner Alignment

#### UI Components to Match Existing Patterns
```tsx
// Page Header
<h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
  <FileText className="w-8 h-8 text-brand-500" />
  Content Planner
</h1>

// Card Container
<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
  // Calendar and editor content
</div>

// Platform Toggle (Similar to existing person toggle)
<div className="flex gap-3">
  {platforms.map(platform => (
    <button className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors ${
      selected ? 'bg-brand-500 text-white border-2 border-brand-600'
               : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
    }`}>
  ))}
</div>
```

#### Database Schema (Following existing patterns)
```sql
-- Use snake_case like existing tables
CREATE TABLE social_accounts (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT ENCRYPTED,
  refresh_token TEXT ENCRYPTED,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE content_posts (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  platforms JSONB,
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id)
);
```

### 2. Lenders Dashboard Alignment

#### Reuse Existing Table Patterns
- Use similar table structure as TaskTracker's ListView
- Implement filters using FilterBar pattern
- Add/Edit using modal pattern (to be created matching existing styles)

#### Hook Pattern
```typescript
// hooks/useLenders.ts
export const useLenders = () => {
  // Follow exact pattern from useTaskTracker
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);

  // Implement CRUD operations
  // Use snake_case transformation
};
```

### 3. Deals Page Alignment

#### Document Upload Component
```tsx
// Match existing card style
<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-400">Drag & drop files here</p>
  </div>
</div>
```

### 4. Affiliates Portal Alignment

#### Dashboard Cards (Match existing metrics style)
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
    <p className="text-gray-400 text-sm mb-2">Total Deals</p>
    <p className="text-3xl font-bold text-brand-500">24</p>
  </div>
</div>
```

---

## 📐 Component Library to Build

Based on existing patterns, we should create these reusable components:

### 1. PageHeader.tsx
```tsx
interface PageHeaderProps {
  title: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
}
```

### 2. DashboardCard.tsx
```tsx
interface DashboardCardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}
```

### 3. DataTable.tsx
```tsx
// Extend existing table pattern from TaskTracker
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
}
```

### 4. FilterPanel.tsx
```tsx
// Extend FilterBar pattern
interface FilterPanelProps {
  filters: Filter[];
  onFilterChange: (filters: FilterState) => void;
}
```

### 5. StatusBadge.tsx
```tsx
// Match existing status badges
interface StatusBadgeProps {
  status: string;
  variant: 'success' | 'warning' | 'error' | 'info';
}
```

---

## 🚦 Development Guidelines

### 1. File Structure
```
src/
├── pages/
│   ├── ContentPlanner.tsx (UPDATE existing)
│   ├── LendersDashboard.tsx (NEW)
│   ├── DealsPage.tsx (NEW)
│   └── AffiliatesPortal.tsx (NEW)
├── components/
│   ├── ContentPlanner/
│   │   ├── ContentCalendar.tsx
│   │   ├── PostEditor.tsx
│   │   └── SocialAuth.tsx
│   ├── Lenders/
│   │   ├── LenderTable.tsx
│   │   ├── LenderForm.tsx
│   │   └── GoogleSheetsSync.tsx
│   ├── Deals/
│   │   ├── DocumentUpload.tsx
│   │   ├── DealMatcher.tsx
│   │   └── RecommendationCard.tsx
│   └── Affiliates/
│       ├── AffiliateDashboard.tsx
│       ├── DealSubmission.tsx
│       └── ResourceCenter.tsx
├── hooks/
│   ├── useContentPlanner.ts
│   ├── useLenders.ts
│   ├── useDeals.ts
│   └── useAffiliates.ts
└── lib/
    ├── socialMedia.ts
    ├── googleSheets.ts
    └── documentOCR.ts
```

### 2. State Management
- Continue using React hooks for local state
- Use custom hooks for data fetching (following existing pattern)
- No need for Redux/Context unless complexity demands it

### 3. Styling Guidelines
- Always use Tailwind classes
- Maintain dark theme as default
- Use established color patterns:
  - `text-brand-500` for primary brand elements
  - `bg-gray-800/50 backdrop-blur-sm` for cards
  - `border-gray-700/50` for borders
  - `text-gray-400` for secondary text
  - `text-gray-100` for primary text

### 4. Database Naming
- Tables: snake_case (e.g., `content_posts`)
- Columns: snake_case (e.g., `created_by`)
- Transform to camelCase in TypeScript

### 5. Component Props Pattern
```typescript
// Always define types
type ComponentProps = {
  required: string;
  optional?: boolean;
  children?: React.ReactNode;
};

// Use object destructuring
export const Component = ({ required, optional = false }: ComponentProps) => {
  // Component logic
};
```

---

## 🔌 Integration Points

### Existing Features to Extend

1. **Navigation (Layout.tsx)**
   - Remove "Coming Soon" status from Lenders, Deals, Affiliates
   - Add proper routing to new pages

2. **Content Planner Page**
   - Enhance existing page rather than rebuild
   - Add social media integration to current structure
   - Maintain person-based content profiles

3. **Authentication**
   - All new features use existing auth flow
   - Add role-based access if needed using Supabase RLS

### New Services to Add

1. **Social Media Service**
```typescript
// src/lib/socialMedia.ts
export class SocialMediaService {
  // OAuth handling
  // Post scheduling
  // Analytics fetching
}
```

2. **Google Sheets Service**
```typescript
// src/lib/googleSheets.ts
export class GoogleSheetsService {
  // Two-way sync
  // Conflict resolution
  // Column mapping
}
```

3. **OCR Service**
```typescript
// src/lib/documentOCR.ts
export class DocumentOCRService {
  // Google Vision integration
  // Data extraction
  // Confidence scoring
}
```

---

## ✅ Validation Checklist

Before implementing each feature, verify:

- [ ] Follows existing dark theme color palette
- [ ] Uses established button and card patterns
- [ ] Implements proper TypeScript types
- [ ] Uses snake_case in database, camelCase in code
- [ ] Creates appropriate custom hook
- [ ] Maintains responsive design patterns
- [ ] Uses Lucide icons consistently
- [ ] Implements loading states like existing pages
- [ ] Handles errors gracefully
- [ ] Uses Supabase auth for user context

---

## 🎯 Next Steps

1. **Update Navigation**: Remove "Coming Soon" labels and add routes
2. **Create Base Components**: Build reusable components library
3. **Set Up Services**: Initialize integration services
4. **Start with Content Planner**: Enhance existing page first
5. **Progressive Enhancement**: Add features incrementally

This alignment ensures all new features feel native to the existing dashboard while maintaining the professional, dark-themed aesthetic you've established.
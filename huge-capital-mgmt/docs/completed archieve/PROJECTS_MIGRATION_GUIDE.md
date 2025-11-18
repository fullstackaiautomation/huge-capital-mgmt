# Projects Management System - Migration & Usage Guide

## Overview

This guide will help you migrate from the existing `opportunity_tasks` structure to the new hierarchical **Projects → Phases → Tasks** system.

### What's New?

- **Projects** (formerly opportunity_tasks): Your main 18 initiatives
- **Phases**: Break each project into manageable phases (Phase 1, Phase 2, etc.)
- **Tasks**: Individual actionable items within each phase
- **Automatic Progress Tracking**: Completion percentages auto-calculate as you check off tasks
- **Smart Status Updates**: Phase and project statuses update automatically based on task progress
- **Drag-and-Drop Task Ordering**: Easily reorder tasks within phases
- **Inline Editing**: Edit everything directly without popup modals
- **Filtering**: Filter by project status or roadmap month
- **Statistics Dashboard**: See completed projects, phases, and tasks at a glance

---

## Step 1: Run the Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase-migration-projects.sql` from your project root
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

### Option B: Using Supabase CLI

```bash
supabase db reset
# or
supabase db push
```

### What the Migration Does:

✅ Renames `opportunity_tasks` → `huge_projects`
✅ Adds new fields: `project_month`, `completion_percentage`, `total_phases`, `completed_phases`
✅ Creates `projects_phases` table
✅ Creates `phase_tasks` table
✅ Sets up automatic triggers for:
   - Auto-updating phase completion percentage when tasks change
   - Auto-updating phase status (Not Started → In Progress → Completed)
   - Auto-setting start dates when tasks begin
   - Auto-setting completion dates when all tasks finish
   - Auto-updating project statistics based on phase completion

---

## Step 2: Understanding the Data Structure

### Projects (huge_projects)
```typescript
{
  id: string;
  task_name: string;              // Project name
  summary: string;                 // Project description
  status: string;                  // Current status
  project_month: string;           // "October", "November", etc.
  completion_percentage: number;   // Auto-calculated (0-100)
  total_phases: number;            // Auto-calculated
  completed_phases: number;        // Auto-calculated
  start_date: string;
  finish_date: string;
  // ... all existing fields preserved
}
```

### Phases (projects_phases)
```typescript
{
  id: UUID;
  project_id: string;              // Links to huge_projects
  phase_number: number;            // 1, 2, 3, etc.
  phase_name: string;              // "Phase 1", "Phase 2", etc.
  status: TaskStatus;              // Auto-updated based on tasks
  completion_percentage: number;   // Auto-calculated
  estimated_time: string;          // Auto-calculated from tasks
  start_date: timestamp;           // Auto-set from first task
  completed_date: timestamp;       // Auto-set when all tasks done
}
```

### Tasks (phase_tasks)
```typescript
{
  id: UUID;
  phase_id: UUID;                  // Links to projects_phases
  project_id: string;              // Links to huge_projects
  task_name: string;
  task_description: string;
  task_order: number;              // For drag-and-drop ordering
  due_date: date;                  // For calendar view
  completed: boolean;              // Checkbox
  status: TaskStatus;              // 'Not Started', 'In Progress', 'Completed', 'Huge Help'
  assignee: string;                // 'Zac', 'Luke', etc.
  estimated_time: string;          // "2-5 hours", "1 day", etc.
  integration: string;             // 'Slack', 'n8n', 'Gmail', etc.
  start_date: timestamp;           // Auto-set when status → 'In Progress'
  completed_date: timestamp;       // Auto-set when completed
}
```

---

## Step 3: Using the Projects Page

### Accessing the Page

1. Navigate to the sidebar
2. Click on **Projects** (between "AI Roadmap" and "Content Planner")

### Main View - Projects List

The main view shows:
- **Statistics Dashboard** at the top:
  - Completed Projects
  - Completed Phases / Total Phases
  - Total Projects
  - Latest Estimated Completion Date

- **Filters**:
  - Filter by Status (All, Completed, In Progress, etc.)
  - Filter by Month (October, November, December, etc.)

- **Projects Grid**: Cards showing:
  - Project name
  - Summary
  - Status
  - Progress percentage
  - Phase completion (e.g., "2 / 5 phases")

### Project Detail View

Click any project card to open the full project view:

#### Header Section
- Project name and summary
- Status, Progress %, Phase count, Est. Completion

#### Phases Section
Each phase shows:
- Phase name (editable inline)
- Status dropdown
- Progress percentage (auto-calculated)
- "Show/Hide Tasks" button
- Delete button

#### Tasks Table (when expanded)
Columns:
- **Drag handle**: Reorder tasks by dragging
- **#**: Task order number
- **Task Name**: Inline editable
- **Description**: Inline editable
- **Due Date**: Date picker
- **Status**: Dropdown (Not Started, In Progress, Completed, Huge Help)
- **Assignee**: Text input
- **Est. Time**: Text input (e.g., "2-5 hours")
- **Integration**: Dropdown (Slack, n8n, Gmail, etc.)
- **Done**: Checkbox
- **Delete**: Remove task button

---

## Step 4: Common Workflows

### Creating a New Phase

1. Open a project in detail view
2. Click "Add Phase" button (top right)
3. A new phase appears at the bottom
4. Edit the phase name inline
5. Click "Show Tasks" to expand

### Adding Tasks to a Phase

1. Expand the phase by clicking "Show Tasks"
2. Click "Add Task" at the bottom of the tasks table
3. Fill in task details inline:
   - Task name
   - Description
   - Due date
   - Assignee
   - Estimated time
   - Integration (if applicable)
4. Changes auto-save after 1 second

### Tracking Progress

As you work on tasks:

1. **Starting a task**: Change status to "In Progress"
   - ✅ Start date auto-sets to current time
   - ✅ Phase status changes to "In Progress"

2. **Completing a task**: Check the "Done" checkbox or set status to "Completed"
   - ✅ Completed date auto-sets
   - ✅ Phase completion % updates
   - ✅ If all tasks done, phase status → "Completed"
   - ✅ If all phases done, project completion % → 100%

3. **Needing help**: Set status to "Huge Help"
   - Makes it easy to see what needs attention

### Reordering Tasks

1. Expand the phase tasks
2. Click and hold the drag handle (⋮⋮) on the left
3. Drag the task up or down
4. Release to drop
5. Task order numbers auto-update

### Filtering Projects

Use the filter dropdowns to:
- View only completed projects
- See all October projects
- Focus on projects needing help

---

## Step 5: Integration with Existing Pages

### AI Roadmap Page
- Still uses the same underlying `huge_projects` table
- All existing data preserved
- Projects you create there will appear in the Projects page
- You can now add detailed phases and tasks

### Synchronization
- Changes in Projects page update the AI Roadmap
- Changes in AI Roadmap are visible in Projects page
- Both views work together seamlessly

---

## Step 6: Setting Up Your First Project

Let's walk through setting up "Huge Task Tracker" as an example:

1. **Navigate to Projects page**
2. **Find "Huge Task Tracker" in the list** (it's already in your database as an opportunity_task)
3. **Click to open it**
4. **Add Phase 1: Planning**
   - Click "Add Phase"
   - Rename to "Phase 1: Planning"
   - Click "Show Tasks"
   - Add tasks:
     - "Define task categories" (Due: 10/03/2025, Assignee: Zac, Est: 1-2 hours)
     - "Design database schema" (Due: 10/04/2025, Assignee: Zac, Est: 2-3 hours)
     - "Create wireframes" (Due: 10/05/2025, Assignee: Luke, Est: 3-4 hours)

5. **Add Phase 2: Development**
   - Click "Add Phase"
   - Rename to "Phase 2: Development"
   - Add tasks:
     - "Set up Supabase tables" (Due: 10/10/2025, Assignee: Zac, Integration: Supabase, Est: 2-3 hours)
     - "Build task list UI" (Due: 10/12/2025, Assignee: Zac, Est: 5-7 hours)
     - "Implement drag-and-drop" (Due: 10/15/2025, Assignee: Zac, Est: 3-4 hours)

6. **Add Phase 3: Testing & Launch**
   - Add tasks for QA, bug fixes, and deployment

7. **Track Progress**
   - As you complete tasks, check them off
   - Watch the phase completion % update
   - See the project overall progress increase

---

## Step 7: Best Practices

### Phase Organization
- **Keep phases logical**: Planning → Development → Testing → Launch
- **Aim for 3-5 phases per project**: Too many phases become hard to manage
- **Use consistent naming**: "Phase 1: X", "Phase 2: Y"

### Task Management
- **Be specific**: "Build login form" not "Do login stuff"
- **Set realistic due dates**: Consider dependencies
- **Assign owners**: Know who's responsible
- **Use integrations field**: Track which tools are needed

### Status Updates
- **Update regularly**: Keep statuses current
- **Use "Huge Help" wisely**: Flag genuine blockers
- **Don't skip "In Progress"**: It triggers start date tracking

### Project Month
- **Set on AI Roadmap page**: Add `project_month` field
- **Use for filtering**: Quickly see what's due each month
- **Align with roadmap**: Match your monthly roadmap cards

---

## Troubleshooting

### "Projects not appearing in list"
- Check your filters - try "All Statuses" and "All Months"
- Refresh the page
- Check browser console for errors

### "Phases not saving"
- Ensure you're logged in (check top right)
- Check network tab for failed requests
- Verify Supabase connection

### "Task order not updating after drag"
- Refresh the page
- Check that all tasks have a `task_order` value
- Try manually setting task_order in Supabase

### "Completion percentage stuck at 0%"
- Ensure tasks have `completed` set to true OR `status` set to 'Completed'
- Check that tasks are properly linked to the phase
- Verify Supabase triggers are running

---

## Database Queries for Debugging

### Check project phases
```sql
SELECT * FROM projects_phases WHERE project_id = 'your-project-id' ORDER BY phase_number;
```

### Check phase tasks
```sql
SELECT * FROM phase_tasks WHERE phase_id = 'your-phase-id' ORDER BY task_order;
```

### Check completion calculations
```sql
SELECT
  p.task_name,
  p.completion_percentage,
  p.total_phases,
  p.completed_phases
FROM huge_projects p
WHERE p.id = 'your-project-id';
```

---

## Next Steps

1. ✅ Run the migration
2. ✅ Open the Projects page
3. ✅ Click on your first project
4. ✅ Add phases
5. ✅ Add tasks to each phase
6. ✅ Start checking off tasks as you complete them
7. ✅ Watch your progress grow!

---

## Need Help?

- Check the browser console for errors
- Inspect the Network tab for failed API calls
- Verify your Supabase connection
- Check that all migrations ran successfully
- Review the trigger functions in Supabase

---

## Summary

You now have a powerful hierarchical project management system that:
- ✅ Organizes your 18 projects into phases and tasks
- ✅ Automatically tracks progress at all levels
- ✅ Provides inline editing for quick updates
- ✅ Supports drag-and-drop task reordering
- ✅ Filters by status and month
- ✅ Shows completion statistics at a glance
- ✅ Integrates seamlessly with your existing AI Roadmap

Happy project managing! 🚀

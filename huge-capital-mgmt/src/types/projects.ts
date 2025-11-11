// Types for the hierarchical project management system

export type OpportunityLevel = 'Quick Wins' | 'Big Wins' | 'Mid Opportunities' | 'Ungraded';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Huge Help';
export type Integration = 'Slack' | 'n8n' | 'Gmail' | 'GHL' | 'Drive' | 'Sheets' | 'Phone Calls' | 'Claude' | 'Calendar' | string;

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

// Main Project (formerly opportunity_tasks)
export type HugeProject = {
  id: string;
  task_name: string; // Project name
  impact_score?: number;
  effort_score?: number;
  input_score?: number;
  zac_score?: number;
  luke_score?: number;
  opportunity_level: OpportunityLevel;
  status?: string;
  priority?: number;
  tools: string[];
  tool_colors?: { [key: string]: string };
  summary: string;
  goal: string;
  start_date: string;
  finish_date: string;
  completed_date?: string;
  impact_on: string[];
  tg_projection: string;
  stepsChecklist: ChecklistItem[];
  integrationChecklist: ChecklistItem[];
  notes: string;
  project_month?: string; // e.g., "October", "November"
  completion_percentage?: number; // Auto-calculated
  total_phases?: number; // Auto-calculated
  completed_phases?: number; // Auto-calculated
  created_at?: string;
  updated_at?: string;
};

// Phase within a Project
export type ProjectPhase = {
  id: string;
  project_id: string;
  phase_number: number; // 1, 2, 3, etc.
  phase_name: string; // e.g., "Phase 1", "Phase 2"
  status: TaskStatus;
  estimated_time?: string; // Auto-calculated from tasks
  completion_percentage: number; // Auto-calculated
  start_date?: string; // Auto-triggered from first task
  completed_date?: string; // Auto-triggered when all tasks complete
  created_at?: string;
  updated_at?: string;
};

// Task within a Phase
export type PhaseTask = {
  id: string;
  phase_id: string;
  project_id: string;
  task_name: string;
  task_description?: string;
  task_order: number; // 1, 2, 3, etc. - draggable
  due_date?: string; // For calendar
  completed: boolean;
  status: TaskStatus;
  assignee?: string;
  estimated_time?: string;
  integration?: Integration;
  start_date?: string; // Auto-triggered
  completed_date?: string; // Auto-triggered
  created_at?: string;
  updated_at?: string;
};

// Combined type for full project hierarchy
export type ProjectWithPhases = HugeProject & {
  phases: (ProjectPhase & {
    tasks: PhaseTask[];
  })[];
};

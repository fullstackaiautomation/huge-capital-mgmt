export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface AITask {
  id: string;
  task_name: string;
  description: string;
  connectors: string[];
  task_area: string;
  task_type: string;
  opportunity_level: 'High' | 'Medium' | 'Low';
  start_date: string;
  estimated_completion_date: string;
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'Complete';
  checklist: ChecklistItem[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ContentDraft {
  id: string;
  platform: 'LinkedIn' | 'Facebook' | 'Instagram' | 'Blog';
  schedule_type: string;
  content: string;
  preview_data?: any;
  status: 'Pending' | 'Approved' | 'Scheduled' | 'Published';
  author: string;
  created_at: string;
  updated_at: string;
  scheduled_date?: string;
}

export interface FundingMetric {
  stage: string;
  count: number;
  total_amount: number;
  average_days: number;
}

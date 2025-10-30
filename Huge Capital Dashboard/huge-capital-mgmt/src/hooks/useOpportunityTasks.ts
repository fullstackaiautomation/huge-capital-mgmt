import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type OpportunityLevel = 'Quick Wins' | 'Big Wins' | 'Mid Opportunities' | 'Ungraded';

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

type OpportunityTask = {
  id: string;
  task_name: string;
  impact_score?: number;
  effort_score?: number;
  input_score?: number;
  zac_score?: number;
  luke_score?: number;
  opportunity_level: OpportunityLevel;
  status?: string;
  priority?: number;
  tools: string[];
  summary: string;
  goal: string;
  start_date: string;
  finish_date: string;
  impact_on: string[];
  tg_projection: string;
  stepsChecklist: ChecklistItem[];
  integrationChecklist: ChecklistItem[];
  notes: string;
};

export const useOpportunityTasks = () => {
  const [tasks, setTasks] = useState<OpportunityTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [customTools, setCustomTools] = useState<string[]>([]);

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('huge_projects')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedTasks = data.map((task: any) => ({
          ...task,
          stepsChecklist: task.steps_checklist || [],
          integrationChecklist: task.integration_checklist || [],
        }));
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch custom tools
  const fetchCustomTools = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_tools')
        .select('tool_name')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setCustomTools(data.map((tool: any) => tool.tool_name));
      }
    } catch (error) {
      console.error('Error fetching custom tools:', error);
    }
  };

  // Add or update task
  const saveTask = async (task: OpportunityTask) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const taskData = {
        id: task.id,
        task_name: task.task_name,
        impact_score: task.impact_score,
        effort_score: task.effort_score,
        input_score: task.input_score,
        zac_score: task.zac_score,
        luke_score: task.luke_score,
        opportunity_level: task.opportunity_level,
        status: task.status || null,
        priority: task.priority,
        tools: task.tools,
        summary: task.summary,
        goal: task.goal,
        start_date: task.start_date,
        finish_date: task.finish_date,
        impact_on: task.impact_on,
        tg_projection: task.tg_projection,
        steps_checklist: task.stepsChecklist,
        integration_checklist: task.integrationChecklist,
        notes: task.notes,
        created_by: user?.id,
      };

      console.log('Saving task:', task.id, 'Status:', task.status, 'Priority:', task.priority);

      const { error } = await supabase
        .from('huge_projects')
        .upsert(taskData);

      if (error) {
        console.error('Supabase upsert error:', error);
        throw error;
      }

      console.log('Task saved successfully');

      // Don't refetch after save to prevent overwriting local state during typing
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('huge_projects')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Add custom tool
  const addCustomTool = async (toolName: string) => {
    try {
      const { error } = await supabase
        .from('custom_tools')
        .insert({ tool_name: toolName });

      if (error) throw error;

      await fetchCustomTools();
    } catch (error) {
      console.error('Error adding custom tool:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchCustomTools();
  }, []);

  return {
    tasks,
    loading,
    customTools,
    setTasks,
    saveTask,
    deleteTask,
    addCustomTool,
    refetch: fetchTasks,
  };
};

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { HugeProject, ProjectPhase, PhaseTask, ProjectWithPhases } from '../types/projects';

export const useProjects = () => {
  const [projects, setProjects] = useState<HugeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects with phases and tasks for statistics
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('huge_projects')
        .select('*')
        .order('priority', { ascending: true });

      if (projectsError) throw projectsError;

      // Fetch all phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('projects_phases')
        .select('*')
        .order('phase_number', { ascending: true });

      if (phasesError) throw phasesError;

      // Fetch all tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('phase_tasks')
        .select('*')
        .order('task_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Combine data
      if (projectsData) {
        const formattedProjects = projectsData.map((project: any) => {
          const projectPhases = (phasesData || []).filter(p => p.project_id === project.id);
          const phasesWithTasks = projectPhases.map(phase => ({
            ...phase,
            tasks: (tasksData || []).filter(task => task.phase_id === phase.id)
          }));

          return {
            ...project,
            stepsChecklist: project.steps_checklist || [],
            integrationChecklist: project.integration_checklist || [],
            tool_colors: project.tool_colors || {},
            phases: phasesWithTasks
          };
        });
        setProjects(formattedProjects);
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single project with all its phases and tasks
  const fetchProjectWithPhases = async (projectId: string): Promise<ProjectWithPhases | null> => {
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('huge_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch phases for this project
      const { data: phasesData, error: phasesError } = await supabase
        .from('projects_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('phase_number', { ascending: true });

      if (phasesError) throw phasesError;

      // Fetch all tasks for all phases
      const { data: tasksData, error: tasksError } = await supabase
        .from('phase_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('task_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Combine data
      const phasesWithTasks = (phasesData || []).map(phase => ({
        ...phase,
        tasks: (tasksData || []).filter(task => task.phase_id === phase.id)
      }));

      return {
        ...projectData,
        stepsChecklist: projectData.steps_checklist || [],
        integrationChecklist: projectData.integration_checklist || [],
        tool_colors: projectData.tool_colors || {},
        phases: phasesWithTasks
      };
    } catch (err: any) {
      console.error('Error fetching project with phases:', err);
      setError(err.message);
      return null;
    }
  };

  // Save or update a project
  const saveProject = async (project: HugeProject, skipRefetch = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const projectData = {
        id: project.id,
        task_name: project.task_name,
        impact_score: project.impact_score,
        effort_score: project.effort_score,
        input_score: project.input_score,
        zac_score: project.zac_score,
        luke_score: project.luke_score,
        opportunity_level: project.opportunity_level,
        status: project.status || null,
        priority: project.priority,
        tools: project.tools,
        tool_colors: project.tool_colors || {},
        summary: project.summary,
        goal: project.goal,
        start_date: project.start_date,
        finish_date: project.finish_date,
        completed_date: project.completed_date || null,
        impact_on: project.impact_on,
        tg_projection: project.tg_projection,
        steps_checklist: project.stepsChecklist,
        integration_checklist: project.integrationChecklist,
        notes: project.notes,
        project_month: project.project_month,
        created_by: user?.id,
      };

      const { error } = await supabase
        .from('huge_projects')
        .upsert(projectData);

      if (error) throw error;

      // Only refetch if explicitly requested (e.g., when creating new projects)
      if (!skipRefetch) {
        // Update local state without full refetch to prevent losing focus
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, ...project } : p));
      }
    } catch (err: any) {
      console.error('Error saving project:', err);
      setError(err.message);
    }
  };

  // Delete a project (cascades to phases and tasks)
  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('huge_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      await fetchProjects();
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    fetchProjectWithPhases,
    saveProject,
    deleteProject,
    setProjects,
  };
};

export const usePhases = (projectId?: string) => {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch phases for a specific project
  const fetchPhases = async (projId?: string) => {
    const id = projId || projectId;
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('projects_phases')
        .select('*')
        .eq('project_id', id)
        .order('phase_number', { ascending: true });

      if (fetchError) throw fetchError;

      setPhases(data || []);
    } catch (err: any) {
      console.error('Error fetching phases:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save or update a phase
  const savePhase = async (phase: Partial<ProjectPhase>) => {
    try {
      const { error } = await supabase
        .from('projects_phases')
        .upsert(phase);

      if (error) throw error;

      await fetchPhases();
    } catch (err: any) {
      console.error('Error saving phase:', err);
      setError(err.message);
    }
  };

  // Delete a phase
  const deletePhase = async (phaseId: string) => {
    try {
      const { error } = await supabase
        .from('projects_phases')
        .delete()
        .eq('id', phaseId);

      if (error) throw error;

      await fetchPhases();
    } catch (err: any) {
      console.error('Error deleting phase:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchPhases();
    }
  }, [projectId]);

  return {
    phases,
    loading,
    error,
    fetchPhases,
    savePhase,
    deletePhase,
    setPhases,
  };
};

export const useTasks = (phaseId?: string, projectId?: string) => {
  const [tasks, setTasks] = useState<PhaseTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks for a specific phase
  const fetchTasks = async (pId?: string, projId?: string) => {
    const pid = pId || phaseId;
    const projid = projId || projectId;

    try {
      setLoading(true);
      setError(null);
      let query = supabase.from('phase_tasks').select('*');

      if (pid) {
        query = query.eq('phase_id', pid);
      } else if (projid) {
        query = query.eq('project_id', projid);
      }

      const { data, error: fetchError } = await query.order('task_order', { ascending: true });

      if (fetchError) throw fetchError;

      setTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save or update a task
  const saveTask = async (task: Partial<PhaseTask>) => {
    try {
      const { error } = await supabase
        .from('phase_tasks')
        .upsert(task);

      if (error) throw error;

      await fetchTasks();
    } catch (err: any) {
      console.error('Error saving task:', err);
      setError(err.message);
    }
  };

  // Update task order (for drag-and-drop)
  const updateTaskOrder = async (taskId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('phase_tasks')
        .update({ task_order: newOrder })
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
    } catch (err: any) {
      console.error('Error updating task order:', err);
      setError(err.message);
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('phase_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (phaseId || projectId) {
      fetchTasks();
    }
  }, [phaseId, projectId]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    saveTask,
    updateTaskOrder,
    deleteTask,
    setTasks,
  };
};

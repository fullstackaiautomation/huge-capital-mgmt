import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Task = {
  id: string;
  taskName: string;
  description: string;
  assignee: 'Zac' | 'Luke' | 'Dillion' | '';
  area: 'Tactstack' | 'Full Stack' | 'Admin' | 'Marketing' | '';
  dueDate: string;
  completed: boolean;
  created_by?: string;
};

export const useTaskTracker = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracker_tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const formattedTasks = (data || []).map((task: any) => ({
        id: task.id,
        taskName: task.task_name,
        description: task.description || '',
        assignee: task.assignee || '',
        area: task.area || '',
        dueDate: task.due_date || '',
        completed: task.completed || false,
        created_by: task.created_by,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTask = async (task: Task) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const taskData = {
        id: task.id,
        task_name: task.taskName,
        description: task.description,
        assignee: task.assignee || null,
        area: task.area || null,
        due_date: task.dueDate || null,
        completed: task.completed,
        created_by: user?.id,
      };

      const { error } = await supabase
        .from('tracker_tasks')
        .upsert(taskData);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tracker_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return {
    tasks,
    setTasks,
    saveTask,
    deleteTask,
    loading,
    refetch: fetchTasks,
  };
};

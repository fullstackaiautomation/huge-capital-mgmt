import { supabase } from '../lib/supabase';

export async function migrateLocalStorageToSupabase() {
  try {
    // Get data from localStorage
    const savedTasks = localStorage.getItem('opportunityTasks');
    const savedCustomTools = localStorage.getItem('customTools');

    if (!savedTasks) {
      console.log('No tasks found in localStorage to migrate');
      return { success: false, message: 'No data to migrate' };
    }

    const tasks = JSON.parse(savedTasks);
    const customTools = savedCustomTools ? JSON.parse(savedCustomTools) : [];

    console.log(`Found ${tasks.length} tasks in localStorage`);
    console.log(`Found ${customTools.length} custom tools in localStorage`);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'You must be logged in to migrate data' };
    }

    // Migrate tasks
    const tasksToInsert = tasks.map((task: any) => ({
      id: task.id,
      task_name: task.task_name,
      impact_score: task.impact_score,
      effort_score: task.effort_score,
      input_score: task.input_score,
      zac_score: task.zac_score,
      luke_score: task.luke_score,
      opportunity_level: task.opportunity_level,
      tools: task.tools || [],
      summary: task.summary || '',
      goal: task.goal || '',
      start_date: task.start_date || '',
      finish_date: task.finish_date || '',
      impact_on: task.impact_on || [],
      tg_projection: task.tg_projection || '',
      steps_checklist: task.stepsChecklist || [],
      integration_checklist: task.integrationChecklist || [],
      notes: task.notes || '',
      created_by: user.id,
    }));

    const { error: tasksError } = await supabase
      .from('opportunity_tasks')
      .upsert(tasksToInsert);

    if (tasksError) {
      console.error('Error migrating tasks:', tasksError);
      return { success: false, message: `Error migrating tasks: ${tasksError.message}` };
    }

    // Migrate custom tools
    if (customTools.length > 0) {
      const toolsToInsert = customTools.map((tool: string) => ({
        tool_name: tool,
      }));

      const { error: toolsError } = await supabase
        .from('custom_tools')
        .upsert(toolsToInsert, { onConflict: 'tool_name' });

      if (toolsError) {
        console.error('Error migrating custom tools:', toolsError);
      }
    }

    console.log('✅ Migration successful!');
    return {
      success: true,
      message: `Successfully migrated ${tasks.length} tasks and ${customTools.length} custom tools!`
    };

  } catch (error: any) {
    console.error('Migration error:', error);
    return { success: false, message: error.message };
  }
}

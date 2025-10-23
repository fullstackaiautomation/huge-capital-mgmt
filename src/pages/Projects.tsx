import { useState, useEffect } from 'react';
import { Plus, X, Trash2, GripVertical, Folder, CheckCircle2, Calendar } from 'lucide-react';
import { useProjects, usePhases, useTasks } from '../hooks/useProjects';
import type { HugeProject, ProjectPhase, PhaseTask, TaskStatus } from '../types/projects';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const INTEGRATION_OPTIONS = ['Slack', 'n8n', 'Gmail', 'GHL', 'Drive', 'Sheets', 'Phone Calls', 'Claude', 'Calendar'];

// Sortable Task Row Component
function SortableTaskRow({ task, onUpdate, onDelete }: { task: PhaseTask; onUpdate: (field: string, value: any) => void; onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: TaskStatus) => {
    const colors = {
      'Not Started': 'bg-gray-600/30 text-gray-300 border-gray-400/40',
      'In Progress': 'bg-yellow-600/30 text-yellow-300 border-yellow-400/40',
      'Completed': 'bg-green-600/30 text-green-300 border-green-400/40',
      'Huge Help': 'bg-purple-600/30 text-purple-300 border-purple-400/40',
    };
    return colors[status];
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-purple-700/30 hover:bg-purple-500/5">
      <td className="py-2 px-2 text-center">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex items-center justify-center">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      </td>
      <td className="py-2 px-2 text-center">
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => onUpdate('completed', e.target.checked)}
            className="w-4 h-4 rounded border-2 border-purple-400/40"
          />
        </div>
      </td>
      <td className="py-2 px-2">
        <input
          type="date"
          value={task.due_date || ''}
          onChange={(e) => onUpdate('due_date', e.target.value)}
          className="bg-transparent text-gray-300 text-xs focus:outline-none focus:bg-purple-500/10 rounded px-2 py-1 w-full text-center"
        />
      </td>
      <td className="py-2 px-2">
        <select
          value={task.status}
          onChange={(e) => onUpdate('status', e.target.value)}
          className={`border rounded px-2 py-1 text-xs font-semibold focus:outline-none w-full ${getStatusColor(task.status)}`}
        >
          <option value="Not Started" className="bg-gray-800">Not Started</option>
          <option value="In Progress" className="bg-gray-800">In Progress</option>
          <option value="Completed" className="bg-gray-800">Completed</option>
          <option value="Huge Help" className="bg-gray-800">Huge Help</option>
        </select>
      </td>
      <td className="py-2 px-2">
        <input
          type="text"
          value={task.task_name}
          onChange={(e) => onUpdate('task_name', e.target.value)}
          className="w-full bg-transparent text-white text-sm focus:outline-none focus:bg-purple-500/10 rounded px-2 py-1"
          placeholder="Task name..."
        />
      </td>
      <td className="py-2 px-2">
        <textarea
          value={task.task_description || ''}
          onChange={(e) => onUpdate('task_description', e.target.value)}
          className="w-full bg-transparent text-gray-300 text-xs focus:outline-none focus:bg-purple-500/10 rounded px-2 py-1 resize-none"
          placeholder="Description..."
          rows={1}
        />
      </td>
      <td className="py-2 px-2 text-center">
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

// Phase Component
function PhaseSection({ phase, phaseNumber, projectId, onPhaseUpdate, onPhaseDelete }: {
  phase: ProjectPhase;
  phaseNumber: number;
  projectId: string;
  onPhaseUpdate: (field: string, value: any) => void;
  onPhaseDelete: () => void;
}) {
  const { tasks, fetchTasks, saveTask, deleteTask, setTasks } = useTasks(phase.id, projectId);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTasks();
  }, [phase.id]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id);
      const newIndex = tasks.findIndex(task => task.id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      const updatedTasks = newTasks.map((task, index) => ({
        ...task,
        task_order: index + 1
      }));

      setTasks(updatedTasks);

      // Save all updated task orders
      updatedTasks.forEach(task => {
        saveTask(task);
      });
    }
  };

  const addNewTask = () => {
    const newTask: Partial<PhaseTask> = {
      phase_id: phase.id,
      project_id: projectId,
      task_name: '',
      task_description: '',
      task_order: tasks.length + 1,
      completed: false,
      status: 'Not Started',
    };
    saveTask(newTask);
  };

  const updateTask = (taskId: string, field: string, value: any) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = { ...task, [field]: value };
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));

      // Debounce save
      if ((window as any).saveTaskTimeout) {
        clearTimeout((window as any).saveTaskTimeout);
      }
      (window as any).saveTaskTimeout = setTimeout(() => {
        saveTask(updatedTask);
      }, 1000);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    const colors = {
      'Not Started': 'bg-gray-600/30 text-gray-300 border-gray-400/40',
      'In Progress': 'bg-yellow-600/30 text-yellow-300 border-yellow-400/40',
      'Completed': 'bg-green-600/30 text-green-300 border-green-400/40',
      'Huge Help': 'bg-purple-600/30 text-purple-300 border-purple-400/40',
    };
    return colors[status];
  };

  // Calculate phase status based on task statuses
  const calculatePhaseStatus = (): TaskStatus => {
    if (tasks.length === 0) return 'Not Started';

    // Rule 1: If any task says "Huge Help", phase status is "Huge Help"
    if (tasks.some(task => task.status === 'Huge Help')) {
      return 'Huge Help';
    }

    // Rule 2: If all tasks are "Completed", phase status is "Completed"
    if (tasks.every(task => task.status === 'Completed')) {
      return 'Completed';
    }

    // Rule 3: If any task is "In Progress", phase status is "In Progress"
    if (tasks.some(task => task.status === 'In Progress')) {
      return 'In Progress';
    }

    // Rule 4: If all tasks are "Not Started", phase status is "Not Started"
    if (tasks.every(task => task.status === 'Not Started')) {
      return 'Not Started';
    }

    // Rule 5: If one or more tasks are complete and others are not started, status is "In Progress"
    const hasCompleted = tasks.some(task => task.status === 'Completed');
    const hasNotStarted = tasks.some(task => task.status === 'Not Started');
    if (hasCompleted && hasNotStarted) {
      return 'In Progress';
    }

    // Default fallback
    return 'Not Started';
  };

  const phaseStatus = calculatePhaseStatus();

  // Update phase status in database when it changes
  useEffect(() => {
    if (phaseStatus !== phase.status) {
      onPhaseUpdate('status', phaseStatus);
    }
  }, [phaseStatus, phase.status]);

  // Get background color based on phase status
  const getPhaseBackgroundColor = (status: TaskStatus) => {
    const colors = {
      'Not Started': 'bg-gray-500/10 border-gray-400/30',
      'In Progress': 'bg-yellow-500/10 border-yellow-400/30',
      'Completed': 'bg-green-500/10 border-green-400/30',
      'Huge Help': 'bg-purple-500/10 border-purple-400/30',
    };
    return colors[status];
  };

  return (
    <div className={`border rounded-lg p-4 ${getPhaseBackgroundColor(phaseStatus)}`}>
      <div className="flex items-center justify-between mb-3 gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-lg font-bold text-purple-400 whitespace-nowrap">Phase {phaseNumber}:</span>
          <input
            type="text"
            value={phase.phase_name}
            onChange={(e) => onPhaseUpdate('phase_name', e.target.value)}
            className="text-lg font-bold text-white bg-transparent focus:outline-none focus:bg-purple-500/10 rounded px-2 py-1 placeholder-gray-400 flex-1 min-w-0"
            placeholder="Phase Name"
          />
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className={`border rounded px-2 py-1 text-xs font-semibold whitespace-nowrap ${getStatusColor(phaseStatus)}`}>
            {phaseStatus}
          </span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm text-gray-400">Progress:</span>
            <span className="text-sm font-semibold text-purple-300">{phase.completion_percentage}%</span>
          </div>
          <button
            onClick={() => deleteConfirm ? onPhaseDelete() : setDeleteConfirm(true)}
            className={`p-1 rounded transition-colors ${deleteConfirm ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-red-400'}`}
            title={deleteConfirm ? 'Click again to confirm' : 'Delete phase'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4">
          <div className="overflow-x-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: '40px' }} />
                  <col style={{ width: '60px' }} />
                  <col style={{ width: '130px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '300px' }} />
                  <col style={{ width: 'auto' }} />
                  <col style={{ width: '40px' }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-purple-400/30">
                    <th className="py-2 px-2 text-purple-300 text-xs font-semibold text-center"></th>
                    <th className="py-2 px-2 text-purple-300 text-xs font-semibold text-center">Done</th>
                    <th className="py-2 px-2 text-purple-300 text-xs font-semibold text-center">Due Date</th>
                    <th className="py-2 px-2 text-purple-300 text-xs font-semibold text-center">Status</th>
                    <th className="py-2 px-2 text-purple-300 text-xs font-semibold text-left">Task Name</th>
                    <th className="py-2 px-2 text-purple-300 text-xs font-semibold text-left">Description</th>
                    <th className="py-2 px-2 text-purple-300 text-xs font-semibold text-center"></th>
                  </tr>
                </thead>
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {tasks.map(task => (
                      <SortableTaskRow
                        key={task.id}
                        task={task}
                        onUpdate={(field, value) => updateTask(task.id, field, value)}
                        onDelete={() => deleteTask(task.id)}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
          <button
            onClick={addNewTask}
            className="mt-3 w-full py-2 border-2 border-dashed border-purple-400/40 rounded-lg text-purple-300 hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
    </div>
  );
}

// Main Projects Page Component
export const Projects = () => {
  const { projects, fetchProjectWithPhases, loading, saveProject } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [filterStatus] = useState<string>('all');
  const [filterMonth] = useState<string>('all');
  const [loadingProject, setLoadingProject] = useState(false);
  const [showToolDropdown, setShowToolDropdown] = useState(false);
  const [newToolInput, setNewToolInput] = useState<string>('');
  const [editingToolColor, setEditingToolColor] = useState<string | null>(null);

  // Color helper functions
  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-white';
    if (score >= 7) return 'text-green-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getEffortInputColor = (score: number | undefined) => {
    if (!score) return 'text-white';
    if (score >= 8) return 'text-red-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-green-400';
  };

  const availableColors = [
    { label: 'Blue Dark', value: 'bg-blue-900 text-blue-100' },
    { label: 'Blue', value: 'bg-blue-600 text-white' },
    { label: 'Green', value: 'bg-green-600 text-white' },
    { label: 'Red', value: 'bg-red-600 text-white' },
    { label: 'Purple', value: 'bg-purple-600 text-white' },
    { label: 'Orange', value: 'bg-orange-600 text-white' },
    { label: 'Yellow', value: 'bg-yellow-600 text-white' },
    { label: 'Pink', value: 'bg-pink-600 text-white' },
    { label: 'Indigo', value: 'bg-indigo-600 text-white' },
    { label: 'Teal', value: 'bg-teal-600 text-white' },
    { label: 'Cyan', value: 'bg-cyan-600 text-white' },
    { label: 'Gray', value: 'bg-gray-600 text-white' },
  ];

  const getToolColor = (tool: string): string => {
    // Check selected project's tool colors
    if (selectedProject && selectedProject.tool_colors && selectedProject.tool_colors[tool]) {
      return selectedProject.tool_colors[tool];
    }

    // Default colors
    const defaultToolColors: { [key: string]: string } = {
      'GHL': 'bg-blue-900 text-blue-100',
      'Phone Calls': 'bg-blue-600 text-white',
      'Sheets': 'bg-green-600 text-white',
      'Gmail': 'bg-red-600 text-white',
      'Drive': 'bg-red-600 text-white',
      'Calendar': 'bg-red-600 text-white',
      'n8n': 'bg-purple-600 text-white',
      'Claude': 'bg-orange-600 text-white',
      'Slack': 'bg-purple-600 text-white',
      'Huge Dashboard': 'bg-blue-600 text-white',
      'Social Media': 'bg-yellow-600 text-white'
    };
    return defaultToolColors[tool] || 'bg-gray-600 text-white';
  };

  const setToolColor = (tool: string, color: string) => {
    if (!selectedProject) return;

    const updatedColors = { ...(selectedProject.tool_colors || {}), [tool]: color };
    updateProjectField('tool_colors', updatedColors);
    setEditingToolColor(null);
  };

  // Load tool colors from selected project
  // React.useEffect(() => {
  //   if (selectedProject && selectedProject.tool_colors) {
  //     setToolColors(selectedProject.tool_colors);
  //   }
  // }, [selectedProject]);

  // Calculate statistics
  const nonUngradedProjects = projects.filter(p => p.status !== 'Ungraded');
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const totalProjects = nonUngradedProjects.length;
  const totalPhases = projects.reduce((acc, p) => acc + (p.total_phases || 0), 0);
  const completedPhases = projects.reduce((acc, p) => acc + (p.completed_phases || 0), 0);

  // Calculate total tasks across all projects by counting tasks in phases
  const allTasksStats = projects.reduce((acc, p: any) => {
    if (p.phases && Array.isArray(p.phases)) {
      const projectTotalTasks = p.phases.reduce((phaseAcc: number, phase: any) => {
        return phaseAcc + (phase.tasks?.length || 0);
      }, 0);
      const projectCompletedTasks = p.phases.reduce((phaseAcc: number, phase: any) => {
        return phaseAcc + (phase.tasks?.filter((t: any) => t.completed || t.status === 'Completed').length || 0);
      }, 0);
      return {
        total: acc.total + projectTotalTasks,
        completed: acc.completed + projectCompletedTasks
      };
    }
    return acc;
  }, { total: 0, completed: 0 });

  // Get latest estimated completion date
  const latestEstimatedDate = projects
    .filter(p => p.finish_date)
    .sort((a, b) => new Date(b.finish_date).getTime() - new Date(a.finish_date).getTime())[0]?.finish_date;

  // Format date as M/D/YY
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
    return `${date.getMonth() + 1}/${date.getDate()}/${year}`;
  };

  // Helper function to get all months a project spans
  const getProjectMonths = (project: HugeProject): string[] => {
    const months: string[] = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

    if (project.start_date || project.finish_date) {
      const startDate = project.start_date ? new Date(project.start_date) : null;
      const finishDate = project.finish_date ? new Date(project.finish_date) : null;

      if (startDate && finishDate) {
        // Add all months between start and finish
        let currentDate = new Date(startDate);
        while (currentDate <= finishDate) {
          const monthName = monthNames[currentDate.getMonth()];
          if (!months.includes(monthName)) {
            months.push(monthName);
          }
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      } else if (startDate) {
        months.push(monthNames[startDate.getMonth()]);
      } else if (finishDate) {
        months.push(monthNames[finishDate.getMonth()]);
      }
    }

    return months;
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    if (filterStatus !== 'all' && project.status !== filterStatus) return false;

    if (filterMonth !== 'all') {
      const projectMonths = getProjectMonths(project);
      if (!projectMonths.includes(filterMonth)) return false;
    }

    return true;
  });

  // Get unique months from all projects based on their date ranges
  // const availableMonths = Array.from(
  //   new Set(
  //     projects.flatMap(p => getProjectMonths(p))
  //   )
  // ).sort((a, b) => {
  //   const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  //                       'July', 'August', 'September', 'October', 'November', 'December'];
  //   return monthNames.indexOf(a) - monthNames.indexOf(b);
  // });

  // Auto-select first filtered project on load or when filters change
  useEffect(() => {
    if (filteredProjects.length > 0 && !selectedProjectId) {
      loadProject(filteredProjects[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProjects.length]);

  // Check if selected project is still in filtered list when filters change
  useEffect(() => {
    if (selectedProjectId && filteredProjects.length > 0) {
      const stillExists = filteredProjects.find(p => p.id === selectedProjectId);
      if (!stillExists) {
        loadProject(filteredProjects[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterMonth]);

  const loadProject = async (projectId: string) => {
    setLoadingProject(true);
    setSelectedProjectId(projectId);
    const project = await fetchProjectWithPhases(projectId);
    setSelectedProject(project);
    setLoadingProject(false);
  };

  const { savePhase, deletePhase } = usePhases(selectedProjectId || undefined);

  const addNewPhase = () => {
    if (!selectedProjectId) return;
    const newPhase: Partial<ProjectPhase> = {
      project_id: selectedProjectId,
      phase_number: (selectedProject?.phases?.length || 0) + 1,
      phase_name: '',
      status: 'Not Started',
      completion_percentage: 0,
    };
    savePhase(newPhase).then(() => {
      loadProject(selectedProjectId);
    });
  };

  const updatePhase = (phaseId: string, field: string, value: any) => {
    const phase = selectedProject?.phases.find((p: ProjectPhase) => p.id === phaseId);
    if (phase) {
      const updatedPhase = { ...phase, [field]: value };

      // Update local state
      setSelectedProject({
        ...selectedProject,
        phases: selectedProject.phases.map((p: ProjectPhase) => p.id === phaseId ? updatedPhase : p)
      });

      // Debounce save
      if ((window as any).savePhaseTimeout) {
        clearTimeout((window as any).savePhaseTimeout);
      }
      (window as any).savePhaseTimeout = setTimeout(() => {
        // Remove tasks array before saving to database
        const { tasks, ...phaseToSave } = updatedPhase as any;
        savePhase(phaseToSave);
      }, 1000);
    }
  };

  const handleDeletePhase = (phaseId: string) => {
    deletePhase(phaseId).then(() => {
      loadProject(selectedProjectId!);
    });
  };

  // Update project field
  const updateProjectField = (field: string, value: any) => {
    if (!selectedProject) return;
    const updatedProject = { ...selectedProject, [field]: value };
    setSelectedProject(updatedProject);

    // Debounce save - skip refetch to prevent losing focus while typing
    if ((window as any).saveProjectTimeout) {
      clearTimeout((window as any).saveProjectTimeout);
    }
    (window as any).saveProjectTimeout = setTimeout(() => {
      saveProject(updatedProject, true); // skipRefetch = true
    }, 1000);
  };

  // Toggle tool in tools array
  const toggleTool = (tool: string) => {
    if (!selectedProject) return;
    const tools = selectedProject.tools || [];
    const updatedTools = tools.includes(tool)
      ? tools.filter((t: string) => t !== tool)
      : [...tools, tool];
    updateProjectField('tools', updatedTools);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Loading projects...</div>
      </div>
    );
  }

  // Single project view
  return (
    <div className="w-full px-10 space-y-6">
      <div className="flex items-center gap-3">
        <Folder className="w-8 h-8 text-white" />
        <h1 className="text-3xl font-bold text-white">AI Projects</h1>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-semibold text-green-300">Completed Projects</h3>
          </div>
          <p className="text-3xl font-bold text-white">{completedProjects} / {totalProjects}</p>
        </div>

        <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4L8 12L2 20M7 4L13 12L7 20M12 4L18 12L12 20M17 4L23 12L17 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 className="text-sm font-semibold text-purple-300">Completed Phases</h3>
          </div>
          <p className="text-3xl font-bold text-white">{completedPhases} / {totalPhases}</p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-semibold text-yellow-300">Completed Tasks</h3>
          </div>
          <p className="text-3xl font-bold text-white">{allTasksStats.completed} / {allTasksStats.total}</p>
        </div>

        <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-semibold text-orange-300">Estimated Completion Date</h3>
          </div>
          <p className="text-3xl font-bold text-white">{formatDate(latestEstimatedDate)}</p>
        </div>
      </div>

      {/* Project Selector Grid - 3 rows x 5 columns ordered by priority */}
      <div className="border-2 border-gray-400/30 rounded-lg p-6 bg-gray-700/30">
        <div className="grid grid-rows-3 grid-flow-col gap-3">
          {projects
            .filter(p => p.status !== 'Ungraded')
            .sort((a, b) => (a.priority || 999) - (b.priority || 999))
            .slice(0, 15)
            .map(project => {
            // Determine color based on status
            let statusColor = 'bg-gray-500/20 border-gray-400/40 text-gray-400'; // Default/Not Set
            let selectedColor = 'bg-purple-500/20 border-2 border-purple-400/40 text-purple-300';
            let hoverColor = 'hover:border-purple-400/40 hover:text-purple-300';

            if (project.status === 'Completed') {
              statusColor = 'bg-green-500/20 border-green-400/40 text-green-300';
              selectedColor = 'bg-green-500/30 border-2 border-green-400 text-green-200';
              hoverColor = 'hover:border-green-400 hover:text-green-200';
            } else if (project.status === 'In Progress') {
              statusColor = 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300';
              selectedColor = 'bg-yellow-500/30 border-2 border-yellow-400 text-yellow-200';
              hoverColor = 'hover:border-yellow-400 hover:text-yellow-200';
            } else if (project.status === 'Next Up') {
              statusColor = 'bg-blue-500/20 border-blue-400/40 text-blue-300';
              selectedColor = 'bg-blue-500/30 border-2 border-blue-400 text-blue-200';
              hoverColor = 'hover:border-blue-400 hover:text-blue-200';
            } else if (project.status === 'Huge Help') {
              statusColor = 'bg-purple-500/20 border-purple-400/40 text-purple-300';
              selectedColor = 'bg-purple-500/30 border-2 border-purple-400 text-purple-200';
              hoverColor = 'hover:border-purple-400 hover:text-purple-200';
            } else if (project.status === 'Bench') {
              statusColor = 'bg-gray-500/20 border-gray-400/40 text-gray-300';
              selectedColor = 'bg-gray-500/30 border-2 border-gray-400 text-gray-200';
              hoverColor = 'hover:border-gray-400 hover:text-gray-200';
            } else if (project.status === 'Ungraded') {
              statusColor = 'bg-gray-600/20 border-gray-500/40 text-gray-400';
              selectedColor = 'bg-gray-600/30 border-2 border-gray-500 text-gray-300';
              hoverColor = 'hover:border-gray-500 hover:text-gray-300';
            }

            return (
              <button
                key={project.id}
                onClick={() => loadProject(project.id)}
                className={`px-5 py-3 rounded-lg text-base font-semibold transition-colors border-2 ${
                  selectedProjectId === project.id
                    ? selectedColor
                    : `${statusColor} ${hoverColor}`
                }`}
              >
                {project.task_name}
              </button>
            );
          })}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
          No projects found matching the selected filters.
        </div>
      ) : selectedProject ? (
        <>
          {/* Selected Project Details */}
          <div className={`rounded-xl p-6 border-2 relative ${
            selectedProject.status === 'Completed'
              ? 'bg-green-500/20 border-green-400/40'
              : selectedProject.status === 'In Progress'
              ? 'bg-yellow-500/20 border-yellow-400/40'
              : selectedProject.status === 'Next Up'
              ? 'bg-blue-500/20 border-blue-400/40'
              : selectedProject.status === 'Huge Help'
              ? 'bg-purple-500/20 border-purple-400/40'
              : selectedProject.status === 'Bench'
              ? 'bg-orange-500/20 border-orange-400/40'
              : selectedProject.status === 'Ungraded'
              ? 'bg-gray-600/20 border-gray-500/40'
              : 'bg-purple-900/30 border-purple-400/30'
          }`}>
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Title, Description, Opportunity Level, Integrations */}
              <div>
                <h2 className="text-4xl font-bold text-white mb-3">{selectedProject.task_name}</h2>
                <p className="text-gray-200 text-lg mb-4 leading-relaxed">{selectedProject.summary}</p>

                {/* Goal and Scores Row */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* Goal Box */}
                  <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-lg w-full">
                      <span className="text-green-300 font-bold">Goal:</span>
                      <input
                        type="text"
                        value={selectedProject.goal || ''}
                        onChange={(e) => updateProjectField('goal', e.target.value)}
                        placeholder="Enter goal..."
                        className="flex-1 bg-transparent text-white px-2 focus:outline-none text-lg"
                      />
                    </div>
                  </div>

                  {/* Scores Box */}
                  <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3">
                    <div className="grid grid-cols-5 gap-3 text-sm text-white">
                      {/* Impact */}
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-300 mb-1">Impact</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className={`bg-transparent w-10 rounded px-1 font-bold text-center focus:outline-none focus:bg-purple-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreColor(selectedProject.impact_score)}`}
                          placeholder="-"
                          value={selectedProject.impact_score || ''}
                          onChange={(e) => updateProjectField('impact_score', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>

                      {/* Effort */}
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-300 mb-1">Effort</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className={`bg-transparent w-10 rounded px-1 font-bold text-center focus:outline-none focus:bg-purple-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getEffortInputColor(selectedProject.effort_score)}`}
                          placeholder="-"
                          value={selectedProject.effort_score || ''}
                          onChange={(e) => updateProjectField('effort_score', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>

                      {/* Input */}
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-300 mb-1">Input</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className={`bg-transparent w-10 rounded px-1 font-bold text-center focus:outline-none focus:bg-purple-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getEffortInputColor(selectedProject.input_score)}`}
                          placeholder="-"
                          value={selectedProject.input_score || ''}
                          onChange={(e) => updateProjectField('input_score', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>

                      {/* Zac */}
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-300 mb-1">Zac</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className={`bg-transparent w-10 rounded px-1 font-bold text-center focus:outline-none focus:bg-purple-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreColor(selectedProject.zac_score)}`}
                          placeholder="-"
                          value={selectedProject.zac_score || ''}
                          onChange={(e) => updateProjectField('zac_score', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>

                      {/* Luke */}
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-300 mb-1">Luke</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className={`bg-transparent w-10 rounded px-1 font-bold text-center focus:outline-none focus:bg-purple-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreColor(selectedProject.luke_score)}`}
                          placeholder="-"
                          value={selectedProject.luke_score || ''}
                          onChange={(e) => updateProjectField('luke_score', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Integrations with editable dropdown */}
                <div className="flex items-start gap-2">
                  <span className="text-gray-300 font-semibold text-base mt-1">Integrations:</span>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      {selectedProject.tools && [...selectedProject.tools].sort((a, b) => a.localeCompare(b)).map((tool: string, index: number) => (
                        <div key={index} className="relative inline-block">
                          <span
                            className={`${getToolColor(tool)} px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-2`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingToolColor(editingToolColor === tool ? null : tool);
                              }}
                              className="w-3 h-3 rounded-full border border-white/50 hover:border-white"
                              style={{ backgroundColor: 'currentColor' }}
                              title="Change color"
                            />
                            {tool}
                            <button
                              onClick={() => toggleTool(tool)}
                              className="hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                          {editingToolColor === tool && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setEditingToolColor(null)}
                              />
                              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-purple-400/40 rounded-lg shadow-lg z-20 p-2">
                                <div className="grid grid-cols-4 gap-1.5">
                                  {availableColors.map((color) => (
                                    <button
                                      key={color.value}
                                      onClick={() => setToolColor(tool, color.value)}
                                      className={`${color.value} w-8 h-8 rounded hover:opacity-80 transition-opacity`}
                                      title={color.label}
                                    />
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowToolDropdown(!showToolDropdown);
                          }}
                          className="bg-purple-600/30 text-purple-300 text-sm px-2 py-1 rounded hover:bg-purple-600/50"
                        >
                          +
                        </button>
                        {showToolDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowToolDropdown(false)}
                            />
                            <div
                              className="absolute top-full left-0 mt-1 bg-gray-800 border border-purple-400/40 rounded-lg shadow-lg z-20 p-2 min-w-[420px] max-h-[350px] overflow-y-auto"
                              onWheel={(e) => e.stopPropagation()}
                            >
                              <div className="grid grid-cols-2 gap-1">
                                {INTEGRATION_OPTIONS.filter((t: any) => !selectedProject.tools?.includes(t))
                                  .sort((a, b) => a.localeCompare(b))
                                  .map((tool: any) => (
                                  <div
                                    key={tool}
                                    className={`px-3 py-1.5 text-sm rounded cursor-pointer ${getToolColor(tool)} hover:opacity-80`}
                                    onClick={() => {
                                      toggleTool(tool);
                                      setShowToolDropdown(false);
                                    }}
                                  >
                                    {tool}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-purple-400/20">
                                <input
                                  type="text"
                                  value={newToolInput}
                                  onChange={(e) => setNewToolInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newToolInput.trim()) {
                                      const updatedTools = [...(selectedProject.tools || []), newToolInput.trim()];
                                      updateProjectField('tools', updatedTools);
                                      setNewToolInput('');
                                      setShowToolDropdown(false);
                                    }
                                  }}
                                  placeholder="Add new integration..."
                                  className="w-full bg-gray-700 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                                />
                                <button
                                  onClick={() => {
                                    if (newToolInput.trim()) {
                                      const updatedTools = [...(selectedProject.tools || []), newToolInput.trim()];
                                      updateProjectField('tools', updatedTools);
                                      setNewToolInput('');
                                      setShowToolDropdown(false);
                                    }
                                  }}
                                  className="w-full mt-1 bg-purple-600/30 text-purple-300 text-xs px-2 py-1 rounded hover:bg-purple-600/50"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Stats */}
              <div className="space-y-4">
                {/* Row 1: Status & Progress - Aligned with boxes below */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Status Badge - Aligned with Phases */}
                  <div>
                    <span className="text-gray-300 font-semibold text-sm block mb-2">Status</span>
                    <select
                      value={selectedProject.status || ''}
                      onChange={(e) => updateProjectField('status', e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg font-bold text-base border-2 text-center ${
                        selectedProject.status === 'Completed'
                          ? 'bg-green-500/10 border-green-400/30 text-green-300'
                          : selectedProject.status === 'In Progress'
                          ? 'bg-yellow-500/10 border-yellow-400/30 text-yellow-300'
                          : selectedProject.status === 'Next Up'
                          ? 'bg-blue-500/10 border-blue-400/30 text-blue-300'
                          : selectedProject.status === 'Huge Help'
                          ? 'bg-purple-500/10 border-purple-400/30 text-purple-300'
                          : selectedProject.status === 'Bench'
                          ? 'bg-gray-500/10 border-gray-400/30 text-gray-300'
                          : selectedProject.status === 'Ungraded'
                          ? 'bg-gray-600/10 border-gray-500/30 text-gray-400'
                          : 'bg-gray-500/10 border-gray-400/30 text-gray-300'
                      } cursor-pointer`}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Next Up">Next Up</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Huge Help">Huge Help</option>
                      <option value="Bench">Bench</option>
                      <option value="Ungraded">Ungraded</option>
                    </select>
                  </div>

                  {/* Progress Bar - Spans Tasks and Estimated Completion columns */}
                  <div className="col-span-2">
                    <span className="text-gray-300 font-semibold text-sm block mb-2">Progress</span>
                    <div className="relative">
                      <div className="w-full h-10 bg-gray-800/50 rounded-lg border-2 border-gray-600/40 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 flex items-center justify-center"
                          style={{ width: `${selectedProject.completion_percentage || 0}%` }}
                        >
                          {(selectedProject.completion_percentage || 0) > 15 && (
                            <span className="text-white font-bold text-sm">
                              {selectedProject.completion_percentage || 0}%
                            </span>
                          )}
                        </div>
                      </div>
                      {(selectedProject.completion_percentage || 0) <= 15 && (
                        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-sm">
                          {selectedProject.completion_percentage || 0}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 2: Phases (Purple), Tasks (Yellow), Estimated Completion */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Phases Box - Purple */}
                  <div className="bg-purple-500/20 border border-purple-400/40 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4L8 12L2 20M7 4L13 12L7 20M12 4L18 12L12 20M17 4L23 12L17 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <h3 className="text-sm font-semibold text-purple-300">Phases</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {selectedProject.completed_phases || 0} / {selectedProject.total_phases || 0}
                    </p>
                  </div>

                  {/* Tasks Box - Yellow */}
                  <div className="bg-yellow-500/20 border border-yellow-400/40 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-sm font-semibold text-yellow-300">Tasks</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {(() => {
                        const totalTasks = selectedProject.phases?.reduce((total: number, phase: any) => {
                          return total + (phase.tasks?.length || 0);
                        }, 0) || 0;
                        const completedTasks = selectedProject.phases?.reduce((total: number, phase: any) => {
                          return total + (phase.tasks?.filter((t: any) => t.completed || t.status === 'Completed').length || 0);
                        }, 0) || 0;
                        return `${completedTasks} / ${totalTasks}`;
                      })()}
                    </p>
                  </div>

                  {/* Estimated Completion / Completed Date Box */}
                  <div className={`${selectedProject.status === 'Completed' ? 'bg-green-500/20 border-green-400/40' : 'bg-orange-500/20 border-orange-400/40'} rounded-lg p-4 backdrop-blur-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className={`w-5 h-5 ${selectedProject.status === 'Completed' ? 'text-green-400' : 'text-orange-400'}`} />
                      <h3 className={`text-sm font-semibold ${selectedProject.status === 'Completed' ? 'text-green-300' : 'text-orange-300'}`}>
                        {selectedProject.status === 'Completed' ? 'Completed' : 'Estimated Completion'}
                      </h3>
                    </div>
                    <input
                      type="date"
                      value={(() => {
                        const dateValue = selectedProject.status === 'Completed'
                          ? selectedProject.completed_date
                          : selectedProject.finish_date;
                        if (!dateValue) return '';
                        // Convert timestamp to YYYY-MM-DD format
                        return dateValue.split('T')[0];
                      })()}
                      onChange={(e) => {
                        if (selectedProject.status === 'Completed') {
                          updateProjectField('completed_date', e.target.value);
                        } else {
                          updateProjectField('finish_date', e.target.value);
                        }
                      }}
                      className="w-full bg-transparent text-xl font-bold text-white border-none outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Layout: Phases (70%) and Notes (30%) */}
          <div className="grid grid-cols-10 gap-6">
            {/* Phases Section - 70% */}
            <div className="col-span-7">
              <div className="bg-gray-700/30 border-2 border-gray-400/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    Phases
                  </h2>
                  <button
                    onClick={addNewPhase}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Phase
                  </button>
                </div>

                {loadingProject ? (
                  <div className="text-center py-12 text-gray-400">Loading phases...</div>
                ) : selectedProject.phases && selectedProject.phases.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProject.phases.map((phase: ProjectPhase, index: number) => (
                      <PhaseSection
                        key={phase.id}
                        phase={phase}
                        phaseNumber={index + 1}
                        projectId={selectedProjectId!}
                        onPhaseUpdate={(field, value) => updatePhase(phase.id, field, value)}
                        onPhaseDelete={() => handleDeletePhase(phase.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
                    No phases yet. Click "Add Phase" to get started.
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section - 30% */}
            <div className="col-span-3">
              <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Notes</h2>
                <textarea
                  value={selectedProject.notes || ''}
                  onChange={(e) => {
                    updateProjectField('notes', e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const textarea = e.currentTarget;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const currentValue = textarea.value;

                      // Add new line with bullet point
                      const newValue = currentValue.substring(0, start) + '\n• ' + currentValue.substring(end);
                      updateProjectField('notes', newValue);

                      // Set cursor position after the bullet point
                      setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = start + 3;
                      }, 0);
                    }
                  }}
                  onFocus={(e) => {
                    // If empty, start with a bullet point
                    if (!e.currentTarget.value || e.currentTarget.value.trim() === '') {
                      updateProjectField('notes', '• ');
                      setTimeout(() => {
                        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = 2;
                      }, 0);
                    }
                  }}
                  placeholder="Add notes about this project..."
                  className="w-full h-[calc(100vh-400px)] min-h-[300px] bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none"
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">Loading project...</div>
      )}
    </div>
  );
};

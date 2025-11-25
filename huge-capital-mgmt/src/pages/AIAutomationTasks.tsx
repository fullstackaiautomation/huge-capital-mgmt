import { useState, useRef, useEffect } from 'react';
import { Plus, X, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Download, GripVertical, Bot, ArrowLeft, ArrowRight, ClipboardList, CheckCircle } from 'lucide-react';
import { useOpportunityTasks } from '../hooks/useOpportunityTasks';
import { migrateLocalStorageToSupabase } from '../utils/migrateLocalStorageToSupabase';
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

type OpportunityLevel = 'Quick Wins' | 'Big Wins' | 'Mid Opportunities' | 'Ungraded';
type TaskStatus = 'Completed' | 'In Progress' | 'Testing' | 'Next Up' | 'Bench' | 'Huge Help' | 'Ungraded';

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

// Initial tasks removed - now using Supabase

// Sortable row component for drag and drop
function SortableRow({ task, index, updateTask, getStatusColor, getEffortInputColor, getScoreColor }: any) {
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

  const levelColor =
    task.opportunity_level === 'Quick Wins' ? 'text-green-400' :
    task.opportunity_level === 'Big Wins' ? 'text-blue-400' :
    task.opportunity_level === 'Mid Opportunities' ? 'text-orange-400' :
    'text-gray-400';

  const effortColor = getEffortInputColor(task.effort_score);
  const zacColor = getScoreColor(task.zac_score);
  const lukeColor = getScoreColor(task.luke_score);

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-700/50 hover:bg-purple-500/5 transition-colors">
      <td className="py-3 px-2 text-center">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex items-center justify-center gap-2">
          <GripVertical className="w-5 h-5 text-purple-400" />
          <span className="text-purple-300 font-bold text-sm">{index + 1}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <input
          type="text"
          className="w-full bg-transparent text-white font-medium focus:outline-none focus:bg-purple-500/10 rounded px-1"
          placeholder="Task Title"
          value={task.task_name}
          onChange={(e) => updateTask(task.id, 'task_name', e.target.value)}
        />
        {task.summary && (
          <div className="text-xs text-gray-400 mt-1 whitespace-normal break-words">
            {task.summary}
          </div>
        )}
      </td>
      <td className="py-3 px-2 text-center">
        <select
          className={`bg-transparent border-0 rounded px-2 py-1 text-sm font-semibold focus:outline-none focus:bg-purple-500/10 ${levelColor}`}
          value={task.opportunity_level}
          onChange={(e) => updateTask(task.id, 'opportunity_level', e.target.value)}
        >
          <option value="Quick Wins" className="bg-gray-800 text-green-300">Quick Wins</option>
          <option value="Big Wins" className="bg-gray-800 text-blue-300">Big Wins</option>
          <option value="Mid Opportunities" className="bg-gray-800 text-orange-300">Mid Opportunities</option>
          <option value="Ungraded" className="bg-gray-800 text-gray-400">Ungraded</option>
        </select>
      </td>
      <td className="py-3 px-2 text-center">
        <select
          className={`border rounded px-2 py-1 text-sm font-semibold focus:outline-none focus:bg-purple-500/10 ${getStatusColor(task.status)}`}
          value={task.status || ''}
          onChange={(e) => updateTask(task.id, 'status', e.target.value)}
        >
          <option value="" className="bg-gray-800 text-gray-400">Select Status</option>
          <option value="Completed" className="bg-gray-800">Completed</option>
          <option value="In Progress" className="bg-gray-800">In Progress</option>
          <option value="Testing" className="bg-gray-800">Testing</option>
          <option value="Next Up" className="bg-gray-800">Next Up</option>
          <option value="Bench" className="bg-gray-800">Bench</option>
          <option value="Huge Help" className="bg-gray-800">Huge Help</option>
          <option value="Ungraded" className="bg-gray-800">Ungraded</option>
        </select>
      </td>
      <td className="py-3 px-2 text-center">
        <input
          type="text"
          className="w-full bg-transparent text-gray-300 text-sm focus:outline-none focus:bg-purple-500/10 rounded px-1 text-center"
          placeholder="TG Projection"
          value={task.tg_projection || ''}
          onChange={(e) => updateTask(task.id, 'tg_projection', e.target.value)}
        />
      </td>
      <td className="py-3 px-2 text-center">
        <input
          type="date"
          className="bg-transparent text-gray-300 text-sm focus:outline-none focus:bg-purple-500/10 rounded px-1 text-center"
          value={task.start_date || ''}
          onChange={(e) => updateTask(task.id, 'start_date', e.target.value)}
        />
      </td>
      <td className="py-3 px-2 text-center">
        <input
          type="date"
          className="bg-transparent text-gray-300 text-sm focus:outline-none focus:bg-purple-500/10 rounded px-1 text-center"
          value={task.finish_date || ''}
          onChange={(e) => updateTask(task.id, 'finish_date', e.target.value)}
        />
      </td>
      <td className="py-3 px-2 text-center">
        <input
          type="number"
          min="0"
          max="10"
          className={`bg-transparent w-12 rounded px-1 font-bold text-center focus:outline-none focus:bg-purple-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${zacColor}`}
          placeholder="-"
          value={task.zac_score ?? ''}
          onChange={(e) => updateTask(task.id, 'zac_score', e.target.value ? parseInt(e.target.value) : undefined)}
        />
      </td>
      <td className="py-3 px-2 text-center">
        <input
          type="number"
          min="0"
          max="10"
          className={`bg-transparent w-12 rounded px-1 font-bold text-center focus:outline-none focus:bg-purple-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${lukeColor}`}
          placeholder="-"
          value={task.luke_score !== undefined ? task.luke_score : ''}
          onChange={(e) => updateTask(task.id, 'luke_score', e.target.value ? parseInt(e.target.value) : undefined)}
        />
      </td>
      <td className="py-3 px-2 text-center">
        <input
          type="number"
          min="0"
          max="10"
          className={`bg-transparent w-12 rounded px-1 font-bold text-center focus:outline-none focus:bg-purple-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${effortColor}`}
          placeholder="-"
          value={task.effort_score !== undefined ? task.effort_score : ''}
          onChange={(e) => updateTask(task.id, 'effort_score', e.target.value ? parseInt(e.target.value) : undefined)}
        />
      </td>
    </tr>
  );
}

export const AIAutomationTasks = () => {
  const { tasks, customTools, setTasks, saveTask, deleteTask: deleteTaskFromDb, addCustomTool, refetch } = useOpportunityTasks();
  const [showToolDropdown, setShowToolDropdown] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedStepsChecklists, setExpandedStepsChecklists] = useState<Set<string>>(new Set());
  const [expandedIntegrationChecklists, setExpandedIntegrationChecklists] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [selectedOpportunityFilter, setSelectedOpportunityFilter] = useState<OpportunityLevel>('Quick Wins');
  const [newToolInput, setNewToolInput] = useState<string>('');
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);
  const [hasLocalStorageData, setHasLocalStorageData] = useState(false);
  const [monthlyRoadmapIndex, setMonthlyRoadmapIndex] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Check if localStorage has data
    const localData = localStorage.getItem('opportunityTasks');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        setHasLocalStorageData(parsed && parsed.length > 0);
      } catch (e) {
        setHasLocalStorageData(false);
      }
    }
  }, []);

  const handleMigration = async () => {
    setMigrating(true);
    setMigrationMessage(null);
    const result = await migrateLocalStorageToSupabase();
    setMigrating(false);
    setMigrationMessage(result.message);
    if (result.success) {
      await refetch();
      setHasLocalStorageData(false);
    }
  };

  // Auto-save when tasks change (debounced)
  // Auto-save is now handled in updateTask function with 1-second debounce

  const availableTools = ['Claude', 'Drive', 'GHL', 'Gmail', 'n8n', 'Phone Calls', 'Sheets', 'Slack', ...customTools];

  const getToolColor = (tool: string): string => {
    const toolColors: { [key: string]: string } = {
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
    return toolColors[tool] || 'bg-gray-600 text-white';
  };

  const getStatusColor = (status?: string): string => {
    const statusColors: { [key: string]: string } = {
      'Completed': 'bg-green-600/30 text-green-300 border-green-400/40',
      'In Progress': 'bg-yellow-600/30 text-yellow-300 border-yellow-400/40',
      'Testing': 'bg-purple-600/30 text-purple-300 border-purple-400/40',
      'Next Up': 'bg-blue-600/30 text-blue-300 border-blue-400/40',
      'Bench': 'bg-orange-600/30 text-orange-300 border-orange-400/40',
      'Huge Help': 'bg-red-600/30 text-red-300 border-red-400/40',
      'Ungraded': 'bg-gray-600/30 text-gray-300 border-gray-400/40'
    };
    return status ? statusColors[status] || 'bg-gray-600/30 text-gray-300 border-gray-400/40' : 'bg-gray-600/30 text-gray-300 border-gray-400/40';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task: any) => task.id === active.id);
      const newIndex = tasks.findIndex((task: any) => task.id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);

      // Update priority based on new position (1-based)
      const updatedTasks = newTasks.map((task: any, index: number) => ({
        ...task,
        priority: index + 1
      }));

      setTasks(updatedTasks);

      // Save all updated priorities to database
      updatedTasks.forEach((task: any) => {
        saveTask(task);
      });
    }
  };

  const handleAddCustomTool = async (toolName: string) => {
    const trimmed = toolName.trim();
    if (trimmed && !availableTools.includes(trimmed)) {
      await addCustomTool(trimmed);
      setNewToolInput('');
    }
  };

  const addTool = (taskId: string, tool: string) => {
    const task = tasks.find((t: any) => t.id === taskId);
    if (task) {
      updateTaskTools(taskId, [...task.tools, tool]);
    }
    setShowToolDropdown(null);
  };

  const removeTool = (taskId: string, tool: string) => {
    const task = tasks.find((t: any) => t.id === taskId);
    if (task) {
      updateTaskTools(taskId, task.tools.filter((t: any) => t !== tool));
    }
  };

  const addNewTask = (level: OpportunityLevel) => {
    const newTask = {
      id: `new-${Date.now()}`,
      task_name: '',
      impact_score: undefined as any,
      effort_score: undefined as any,
      input_score: undefined as any,
      zac_score: undefined as any,
      luke_score: undefined as any,
      opportunity_level: level,
      status: 'Next Up' as TaskStatus,
      tools: [] as string[],
      summary: '',
      goal: '',
      start_date: '',
      finish_date: '',
      impact_on: [] as string[],
      tg_projection: '',
      stepsChecklist: Array.from({ length: 6 }, (_, i) => ({ id: `step-${Date.now()}-${i}`, text: '', completed: false })),
      integrationChecklist: Array.from({ length: 3 }, (_, i) => ({ id: `int-${Date.now()}-${i}`, text: '', completed: false })),
      notes: '',
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (taskId: string, field: string, value: any) => {
    const updatedTasks = tasks.map((task: any) =>
      task.id === taskId ? { ...task, [field]: value } : task
    );
    setTasks(updatedTasks);

    // Save only the updated task immediately
    const updatedTask = updatedTasks.find((task: any) => task.id === taskId);
    if (updatedTask) {
      // Debounce the save for this specific task
      if ((window as any).saveTaskTimeout) {
        clearTimeout((window as any).saveTaskTimeout);
      }
      (window as any).saveTaskTimeout = setTimeout(() => {
        saveTask(updatedTask);
      }, 1000);
    }
  };

  const updateTaskTools = (taskId: string, newTools: string[]) => {
    const updatedTasks = tasks.map((task: any) =>
      task.id === taskId ? { ...task, tools: newTools } : task
    );
    setTasks(updatedTasks);

    // Save the updated task
    const updatedTask = updatedTasks.find((task: any) => task.id === taskId);
    if (updatedTask) {
      if ((window as any).saveTaskTimeout) {
        clearTimeout((window as any).saveTaskTimeout);
      }
      (window as any).saveTaskTimeout = setTimeout(() => {
        saveTask(updatedTask);
      }, 1000);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTaskFromDb(taskId);
    setDeleteConfirm(null);
  };

  const toggleStepsChecklist = (taskId: string) => {
    setExpandedStepsChecklists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const toggleIntegrationChecklist = (taskId: string) => {
    setExpandedIntegrationChecklists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const toggleNotes = (taskId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const updateChecklistItem = (taskId: string, checklistType: 'stepsChecklist' | 'integrationChecklist', itemId: string, field: 'text' | 'completed', value: string | boolean) => {
    setTasks(tasks.map((task: any) => {
      if (task.id === taskId) {
        const checklist = task[checklistType].map((item: ChecklistItem) =>
          item.id === itemId ? { ...item, [field]: value } : item
        );
        return { ...task, [checklistType]: checklist };
      }
      return task;
    }));
  };

  const addChecklistItem = (taskId: string, checklistType: 'stepsChecklist' | 'integrationChecklist') => {
    setTasks(tasks.map((task: any) => {
      if (task.id === taskId) {
        const newItem = { id: `${checklistType}-${Date.now()}`, text: '', completed: false };
        return { ...task, [checklistType]: [...task[checklistType], newItem] };
      }
      return task;
    }));
  };

  const deleteChecklistItem = (taskId: string, checklistType: 'stepsChecklist' | 'integrationChecklist', itemId: string) => {
    setTasks(tasks.map((task: any) => {
      if (task.id === taskId) {
        return { ...task, [checklistType]: task[checklistType].filter((item: ChecklistItem) => item.id !== itemId) };
      }
      return task;
    }));
  };

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

  const getOpportunityColor = (level: OpportunityLevel) => {
    switch (level) {
      case 'Quick Wins':
        return 'text-green-300';
      case 'Big Wins':
        return 'text-blue-300';
      case 'Mid Opportunities':
        return 'text-orange-300';
      case 'Ungraded':
        return 'text-gray-400';
      default:
        return 'text-white';
    }
  };

  // Scroll ref for opportunities
  const opportunitiesScrollRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 400;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const sortTasks = (tasksToSort: any[]) => {
    // Sort by priority only
    return [...tasksToSort].sort((a: any, b: any) => {
      const aPriority = a.priority ?? 999999;
      const bPriority = b.priority ?? 999999;
      return aPriority - bPriority;
    });
  };

  return (
    <div className="w-full px-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white">AI Roadmap</h1>
        </div>
        {hasLocalStorageData && (
          <button
            onClick={handleMigration}
            disabled={migrating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {migrating ? 'Migrating...' : 'Restore LocalStorage Data'}
          </button>
        )}
      </div>

      {migrationMessage && (
        <div className={`p-4 rounded-lg ${migrationMessage.includes('Success') ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'bg-red-500/20 border border-red-500/40 text-red-300'}`}>
          {migrationMessage}
        </div>
      )}

      {/* 12 Month Goals and Monthly Roadmaps */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 12 Month Goals */}
        <div className="lg:col-span-1 bg-yellow-400/10 border border-yellow-300/30 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-200 mb-6">
            Huge Capital 12 Month Goals
          </h2>
          <ul className="space-y-3 text-base text-gray-200 font-semibold list-disc pl-5">
            <li className="pl-2">1M+ Monthly Funding</li>
            <li className="pl-2">80-100K Monthly Commissions</li>
            <li className="pl-2">2 Bank Turn Downs Per Week (free qualified leads)</li>
            <li className="pl-2">50 Affiliates Generating 1-2 Monthly Deals</li>
            <li className="pl-2">Private Capital Community Launched</li>
            <li className="pl-2">3K Active Facebook Group Members</li>
            <li className="pl-2">Luke - Learn SBA Deals</li>
            <li className="pl-2">Zac - Speak to Investment Real Estate</li>
            <li className="pl-2">Dillion Full Time Broker (confident)</li>
          </ul>
        </div>

        {/* Monthly Roadmaps with Navigation */}
        {(() => {
          const allMonths = ['October', 'November', 'December', 'January'];
          const visibleMonths = allMonths.slice(monthlyRoadmapIndex, monthlyRoadmapIndex + 3);

          return (
            <>
              {visibleMonths.map((month) => {
                const idx = allMonths.indexOf(month);
                const monthIndex = month === 'January' ? 0 : 9 + idx; // Oct=9, Nov=10, Dec=11, Jan=0
                const year = month === 'January' ? 2026 : 2025;

                const monthTasks = tasks
                  .filter(task => {
                    // Only filter by completion/finish date
                    if (!task.finish_date) return false;

                    const finishDate = new Date(task.finish_date);

                    return (
                      finishDate.getMonth() === monthIndex && finishDate.getFullYear() === year
                    );
                  })
                  .sort((a, b) => {
                    // Sort by priority field (lower number = higher priority)
                    const aPriority = a.priority ?? 999999;
                    const bPriority = b.priority ?? 999999;
                    return aPriority - bPriority;
                  });

                return (
                  <div key={month} className="bg-blue-400/10 border border-blue-300/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-blue-200">
                        {month} Roadmap
                      </h2>
                      {visibleMonths.indexOf(month) === visibleMonths.length - 1 && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setMonthlyRoadmapIndex(Math.max(0, monthlyRoadmapIndex - 1))}
                            disabled={monthlyRoadmapIndex === 0}
                            className="p-1 text-blue-300 hover:text-blue-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Previous"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setMonthlyRoadmapIndex(Math.min(allMonths.length - 3, monthlyRoadmapIndex + 1))}
                            disabled={monthlyRoadmapIndex >= allMonths.length - 3}
                            className="p-1 text-blue-300 hover:text-blue-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Next"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {monthTasks.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No tasks scheduled</p>
                      ) : (
                        monthTasks.map(task => {
                          const isCompleted = task.status === 'Completed';
                          const isInProgress = task.status === 'In Progress';

                          const cardColor = isCompleted
                            ? 'bg-green-500/10 border-green-400/20'
                            : isInProgress
                            ? 'bg-yellow-500/10 border-yellow-400/20'
                            : 'bg-blue-500/10 border-blue-400/20';

                          const textColor = isCompleted
                            ? 'text-green-200'
                            : isInProgress
                            ? 'text-yellow-200'
                            : 'text-blue-200';

                          return (
                            <div key={task.id} className={`${cardColor} border rounded-lg p-3`}>
                              <h3 className={`text-sm font-semibold ${textColor}`}>
                                {task.priority ? `${task.priority}. ` : ''}{task.task_name}
                              </h3>
                              {(task.start_date || task.finish_date) && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Timeline: {task.start_date && task.finish_date ? (
                                    <>
                                      {new Date(task.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(task.finish_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </>
                                  ) : task.start_date ? (
                                    <>Start: {new Date(task.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                                  ) : (
                                    <>Due: {new Date(task.finish_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                                  )}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          );
        })()}
      </div>

      {/* Timeline Planning View */}
      <div className="bg-gray-800/50 border border-purple-300/30 rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-purple-400" />
          Implementation Timeline - All Tasks
        </h2>

        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-300/30">
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold w-[50px]">
                    <GripVertical className="w-5 h-5 mx-auto" />
                  </th>
                  <th className="text-center py-3 px-4 text-purple-300 font-semibold w-[400px]">
                    Task Name
                  </th>
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold w-[110px]">
                    Opportunity
                  </th>
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold w-[100px]">
                    Status
                  </th>
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold w-[120px]">
                    TG Projection
                  </th>
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold w-[100px]">
                    Start Date
                  </th>
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold w-[100px]">
                    Completion
                  </th>
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold w-[80px]">
                    Zac
                  </th>
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold w-[80px]">
                    Luke
                  </th>
                  <th className="text-center py-3 px-2 text-purple-300 font-semibold w-[80px]">
                    Effort
                  </th>
              </tr>
            </thead>
            <SortableContext items={sortTasks(tasks).map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {sortTasks(tasks).map((task: any, index: number) => (
                  <SortableRow
                    key={task.id}
                    task={task}
                    index={index}
                    updateTask={updateTask}
                    getStatusColor={getStatusColor}
                    getEffortInputColor={getEffortInputColor}
                    getScoreColor={getScoreColor}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>

          </DndContext>

          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No tasks yet. Add tasks in the Opportunity Heatmap below.
            </div>
          )}
        </div>
      </div>

      {/* Opportunity Heatmap */}
      <div className="space-y-4 border-2 border-gray-400/30 rounded-lg p-6 bg-gray-700/30">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-100">Opportunity Heatmap</h2>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedOpportunityFilter('Quick Wins')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                selectedOpportunityFilter === 'Quick Wins'
                  ? 'bg-green-500/20 border-2 border-green-400/40 text-green-300'
                  : 'bg-gray-500/20 border-2 border-gray-400/40 text-gray-400 hover:border-green-400/40 hover:text-green-300'
              }`}
            >
              Quick Wins
            </button>
            <button
              onClick={() => setSelectedOpportunityFilter('Big Wins')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                selectedOpportunityFilter === 'Big Wins'
                  ? 'bg-blue-500/20 border-2 border-blue-400/40 text-blue-300'
                  : 'bg-gray-500/20 border-2 border-gray-400/40 text-gray-400 hover:border-blue-400/40 hover:text-blue-300'
              }`}
            >
              Big Wins
            </button>
            <button
              onClick={() => setSelectedOpportunityFilter('Mid Opportunities')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                selectedOpportunityFilter === 'Mid Opportunities'
                  ? 'bg-orange-500/20 border-2 border-orange-400/40 text-orange-300'
                  : 'bg-gray-500/20 border-2 border-gray-400/40 text-gray-400 hover:border-orange-400/40 hover:text-orange-300'
              }`}
            >
              Mid Opportunities
            </button>
            <button
              onClick={() => setSelectedOpportunityFilter('Ungraded')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                selectedOpportunityFilter === 'Ungraded'
                  ? 'bg-gray-500/20 border-2 border-gray-400/40 text-gray-400'
                  : 'bg-gray-500/20 border-2 border-gray-400/40 text-gray-400 hover:border-gray-400'
              }`}
            >
              Ungraded
            </button>
          </div>
        </div>

        {/* Filtered Tasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-semibold ${
              selectedOpportunityFilter === 'Quick Wins' ? 'text-green-300' :
              selectedOpportunityFilter === 'Big Wins' ? 'text-blue-300' :
              selectedOpportunityFilter === 'Mid Opportunities' ? 'text-orange-300' :
              'text-gray-400'
            }`}>{selectedOpportunityFilter}</h3>
            <div className="flex gap-2">
              <button onClick={() => scroll(opportunitiesScrollRef, 'left')} className={`p-1 rounded transition-colors ${
                selectedOpportunityFilter === 'Quick Wins' ? 'bg-green-500/20 border border-green-400/40 text-green-300 hover:bg-green-500/30' :
                selectedOpportunityFilter === 'Big Wins' ? 'bg-blue-500/20 border border-blue-400/40 text-blue-300 hover:bg-blue-500/30' :
                selectedOpportunityFilter === 'Mid Opportunities' ? 'bg-orange-500/20 border border-orange-400/40 text-orange-300 hover:bg-orange-500/30' :
                'bg-gray-500/20 border border-gray-400/40 text-gray-400 hover:bg-gray-500/30'
              }`}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scroll(opportunitiesScrollRef, 'right')} className={`p-1 rounded transition-colors ${
                selectedOpportunityFilter === 'Quick Wins' ? 'bg-green-500/20 border border-green-400/40 text-green-300 hover:bg-green-500/30' :
                selectedOpportunityFilter === 'Big Wins' ? 'bg-blue-500/20 border border-blue-400/40 text-blue-300 hover:bg-blue-500/30' :
                selectedOpportunityFilter === 'Mid Opportunities' ? 'bg-orange-500/20 border border-orange-400/40 text-orange-300 hover:bg-orange-500/30' :
                'bg-gray-500/20 border border-gray-400/40 text-gray-400 hover:bg-gray-500/30'
              }`}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div ref={opportunitiesScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tasks.filter((t: any) => t.opportunity_level === selectedOpportunityFilter).map((task: any) => (
              <div key={task.id} className={`border-2 rounded-xl p-4 relative min-w-[480px] max-w-[480px] flex-shrink-0 overflow-hidden ${
                selectedOpportunityFilter === 'Quick Wins' ? 'bg-green-500/20 border-green-400/40' :
                selectedOpportunityFilter === 'Big Wins' ? 'bg-blue-500/20 border-blue-400/40' :
                selectedOpportunityFilter === 'Mid Opportunities' ? 'bg-orange-500/20 border-orange-400/40' :
                'bg-gray-500/20 border-gray-400/40'
              }`}>
                <button
                  onClick={() => deleteConfirm === task.id ? handleDeleteTask(task.id) : setDeleteConfirm(task.id)}
                  className={`absolute top-2 right-2 p-1 rounded transition-colors ${deleteConfirm === task.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-red-400'}`}
                  title={deleteConfirm === task.id ? 'Click again to confirm' : 'Delete task'}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <input type="text" className="w-full bg-transparent text-white font-bold text-2xl px-0 focus:outline-none" placeholder="Task Title" value={`${task.priority || '?'}. ${task.task_name}`} onChange={(e) => {
                      const nameWithoutNumber = e.target.value.replace(/^\d+\.\s*/, '');
                      updateTask(task.id, 'task_name', nameWithoutNumber);
                    }} />
                  </div>
                  {(task.start_date || task.finish_date) && (
                    <div className="text-xs text-gray-400 mt-1">
                      {task.start_date && task.finish_date ? (
                        <>
                          Start: {new Date(task.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • Completion: {new Date(task.finish_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </>
                      ) : task.start_date ? (
                        <>Start: {new Date(task.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                      ) : (
                        <>Completion: {new Date(task.finish_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                      )}
                    </div>
                  )}
                </div>

                <textarea
                  className="w-full bg-transparent text-white text-sm mb-1 px-0 focus:outline-none resize-none overflow-y-auto overflow-x-hidden block"
                  placeholder="Add description..."
                  value={task.summary}
                  onChange={(e) => {
                    updateTask(task.id, 'summary', e.target.value);
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                  }}
                  style={{
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    minHeight: '24px',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    display: 'block'
                  }}
                />

                <div className="border-t border-green-400/20 mt-1 mb-2"></div>

                <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-300 font-bold">Goal:</span>
                    <input type="text" className="flex-1 bg-transparent text-white px-2 focus:outline-none" placeholder="Enter goal..." value={task.goal} onChange={(e) => updateTask(task.id, 'goal', e.target.value)} />
                  </div>
                </div>

                <div className="border-t border-green-400/20 mt-2 mb-3"></div>

                <div className="flex flex-wrap items-center gap-1 mb-3">
                  <span className="text-white text-xs font-bold mr-1 flex-shrink-0">Integrations:</span>
                  {task.tools.map((tool: any) => (
                    <span key={tool} className={`${getToolColor(tool)} text-xs px-2 py-0.5 rounded inline-flex items-center gap-1 flex-shrink-0`}>
                      {tool}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeTool(task.id, tool)} />
                    </span>
                  ))}
                  <div className="relative inline-block">
                    <button
                      className="bg-green-600/30 text-green-300 text-xs px-2 py-0.5 rounded hover:bg-green-600/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowToolDropdown(showToolDropdown === task.id ? null : task.id);
                      }}
                    >
                      +
                    </button>
                    {showToolDropdown === task.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowToolDropdown(null)}
                        />
                        <div
                          className="absolute top-full left-0 mt-1 bg-gray-800 border border-green-400/40 rounded-lg shadow-lg z-20 p-2 min-w-[420px] max-h-[350px] overflow-y-auto"
                          onWheel={(e) => e.stopPropagation()}
                        >
                        <div className="grid grid-cols-2 gap-1">
                          {availableTools.filter((t: any) => !task.tools.includes(t)).map((tool: any) => (
                            <div
                              key={tool}
                              className={`px-3 py-1.5 text-sm rounded cursor-pointer ${getToolColor(tool)} hover:opacity-80`}
                              onClick={() => addTool(task.id, tool)}
                            >
                              {tool}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-green-400/20">
                          <input
                            type="text"
                            value={newToolInput}
                            onChange={(e) => setNewToolInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddCustomTool(newToolInput);
                              }
                            }}
                            placeholder="Add new integration..."
                            className="w-full bg-gray-700 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-green-400"
                          />
                          <button
                            onClick={() => handleAddCustomTool(newToolInput)}
                            className="w-full mt-1 bg-green-600/30 text-green-300 text-xs px-2 py-1 rounded hover:bg-green-600/50"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-green-400/20 mb-3"></div>

                <div className="flex items-start gap-3 text-xs mb-3">
                  <div className="flex flex-col items-center">
                    <div className="text-white mb-1 text-center font-bold">Start Date</div>
                    <input type="date" className="bg-transparent text-white text-xs w-[95px] px-0.5" value={task.start_date} onChange={(e) => updateTask(task.id, 'start_date', e.target.value)} />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-white mb-1 text-center font-bold whitespace-nowrap">Estimated Completion</div>
                    <input type="date" className="bg-transparent text-white text-xs w-[95px] px-0.5" value={task.finish_date} onChange={(e) => updateTask(task.id, 'finish_date', e.target.value)} />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-white mb-1 text-center font-bold whitespace-nowrap">Estimated Timeline</div>
                    <div className="text-white text-xs h-[20px] flex items-center">
                      {task.start_date && task.finish_date ?
                        `${Math.ceil((new Date(task.finish_date).getTime() - new Date(task.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
                        : '-'}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-white mb-1 text-center font-bold">TG Projection</div>
                    <input type="text" className={`bg-transparent text-white text-xs w-[95px] px-0.5 text-center ${!task.tg_projection ? 'border border-green-400/40' : ''}`} value={task.tg_projection} onChange={(e) => updateTask(task.id, 'tg_projection', e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-white pt-2 border-t border-green-400/20">
                  <span className={`${getScoreColor(task.impact_score)} flex items-center gap-1 whitespace-nowrap`}><span className="font-bold">Impact:</span> <input type="number" min="1" max="10" className={`bg-transparent w-6 rounded px-1 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!task.impact_score ? 'border border-green-400/40' : ''} ${getScoreColor(task.impact_score)}`} placeholder="" value={task.impact_score || ''} onChange={(e) => updateTask(task.id, 'impact_score', e.target.value ? parseInt(e.target.value) : undefined)} /></span>
                  <span className={`${getEffortInputColor(task.effort_score)} flex items-center gap-1 whitespace-nowrap`}><span className="font-bold">Effort:</span> <input type="number" min="1" max="10" className={`bg-transparent w-6 rounded px-1 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!task.effort_score ? 'border border-green-400/40' : ''} ${getEffortInputColor(task.effort_score)}`} placeholder="" value={task.effort_score || ''} onChange={(e) => updateTask(task.id, 'effort_score', e.target.value ? parseInt(e.target.value) : undefined)} /></span>
                  <span className={`${getEffortInputColor(task.input_score)} flex items-center gap-1 whitespace-nowrap`}><span className="font-bold">User Input:</span> <input type="number" min="1" max="10" className={`bg-transparent w-6 rounded px-1 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!task.input_score ? 'border border-green-400/40' : ''} ${getEffortInputColor(task.input_score)}`} placeholder="" value={task.input_score || ''} onChange={(e) => updateTask(task.id, 'input_score', e.target.value ? parseInt(e.target.value) : undefined)} /></span>
                  <span className={`${getScoreColor(task.zac_score)} flex items-center gap-1 whitespace-nowrap`}><span className="font-bold">Zac Score:</span> <input type="number" min="1" max="10" className={`bg-transparent w-6 rounded px-1 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!task.zac_score ? 'border border-green-400/40' : ''} ${getScoreColor(task.zac_score)}`} placeholder="" value={task.zac_score || ''} onChange={(e) => updateTask(task.id, 'zac_score', e.target.value ? parseInt(e.target.value) : undefined)} /></span>
                  <span className={`${getScoreColor(task.luke_score)} flex items-center gap-1 whitespace-nowrap`}><span className="font-bold">Luke Score:</span> <input type="number" min="1" max="10" className={`bg-transparent w-6 rounded px-1 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!task.luke_score ? 'border border-green-400/40' : ''} ${getScoreColor(task.luke_score)}`} placeholder="" value={task.luke_score || ''} onChange={(e) => updateTask(task.id, 'luke_score', e.target.value ? parseInt(e.target.value) : undefined)} /></span>
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">Priority:</span>
                    <input type="number" min="1" max="50" className={`bg-transparent w-10 rounded px-1 font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!task.priority ? 'border border-green-400/40' : ''}`} placeholder="" value={task.priority || ''} onChange={(e) => updateTask(task.id, 'priority', e.target.value ? parseInt(e.target.value) : undefined)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">Opportunity:</span>
                    <select className={`bg-transparent border-0 rounded px-2 py-1 text-xs font-bold focus:outline-none ${getOpportunityColor(task.opportunity_level)}`} value={task.opportunity_level} onChange={(e) => updateTask(task.id, 'opportunity_level', e.target.value)}>
                      <option value="Quick Wins" className="bg-gray-800 text-green-300">Quick Win</option>
                      <option value="Big Wins" className="bg-gray-800 text-blue-300">Big Win</option>
                      <option value="Mid Opportunities" className="bg-gray-800 text-orange-300">Mid Opportunity</option>
                      <option value="Ungraded" className="bg-gray-800 text-gray-400">Ungraded</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 text-sm">
                  <span className="text-white font-bold">Status:</span>
                  <select className={`border rounded px-2 py-1 text-xs font-bold focus:outline-none ${getStatusColor(task.status)}`} value={task.status || ''} onChange={(e) => updateTask(task.id, 'status', e.target.value)}>
                    <option value="" className="bg-gray-800 text-gray-400">Select Status</option>
                    <option value="Completed" className="bg-gray-800">Completed</option>
                    <option value="In Progress" className="bg-gray-800">In Progress</option>
                    <option value="Testing" className="bg-gray-800">Testing</option>
                    <option value="Next Up" className="bg-gray-800">Next Up</option>
                    <option value="Bench" className="bg-gray-800">Bench</option>
                    <option value="Huge Help" className="bg-gray-800">Huge Help</option>
                    <option value="Ungraded" className="bg-gray-800">Ungraded</option>
                  </select>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <button
                    onClick={() => toggleStepsChecklist(task.id)}
                    className="py-2 flex items-center gap-2 text-white text-xs hover:bg-green-400/10 rounded transition-colors"
                  >
                    {expandedStepsChecklists.has(task.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>{expandedStepsChecklists.has(task.id) ? 'Hide' : ''} Step by Step Checklist</span>
                  </button>

                  <button
                    onClick={() => toggleIntegrationChecklist(task.id)}
                    className="py-2 flex items-center gap-2 text-white text-xs hover:bg-green-400/10 rounded transition-colors"
                  >
                    {expandedIntegrationChecklists.has(task.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>{expandedIntegrationChecklists.has(task.id) ? 'Hide' : ''} Integration Checklist</span>
                  </button>

                  <button
                    onClick={() => toggleNotes(task.id)}
                    className="py-2 flex items-center gap-2 text-white text-xs hover:bg-green-400/10 rounded transition-colors"
                  >
                    {expandedNotes.has(task.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>{expandedNotes.has(task.id) ? 'Hide' : ''} Notes</span>
                  </button>
                </div>

                {(expandedStepsChecklists.has(task.id) || expandedIntegrationChecklists.has(task.id) || expandedNotes.has(task.id)) && (
                  <div className="mt-3 pt-3 border-t border-green-400/20">
                    <div className="flex gap-3">
                      {/* Steps Checklist - 50% */}
                      {expandedStepsChecklists.has(task.id) && (
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white text-sm font-bold">Step by Step Checklist</h4>
                        </div>
                        <div className="space-y-2">
                          {task.stepsChecklist?.map((item: ChecklistItem, index: number) => (
                            <div key={item.id} className="flex items-start gap-1">
                              <button
                                onClick={() => updateChecklistItem(task.id, 'stepsChecklist', item.id, 'completed', !item.completed)}
                                className={`w-4 h-4 mt-1 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                  item.completed
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-green-400/40 hover:border-green-400'
                                }`}
                              >
                                {item.completed && <CheckCircle className="w-3 h-3 text-white" />}
                              </button>
                              <span className="text-white text-xs font-medium w-4 text-center mt-1 flex-shrink-0">{index + 1}.</span>
                              <textarea
                                value={item.text}
                                onChange={(e) => updateChecklistItem(task.id, 'stepsChecklist', item.id, 'text', e.target.value)}
                                placeholder="Enter step..."
                                className="flex-1 bg-transparent text-white text-xs px-2 py-1 border border-green-400/20 rounded focus:outline-none focus:border-green-400/40 resize-none overflow-hidden min-h-[28px]"
                                rows={1}
                                onInput={(e) => {
                                  e.currentTarget.style.height = 'auto';
                                  e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                }}
                              />
                              <button
                                onClick={() => deleteChecklistItem(task.id, 'stepsChecklist', item.id)}
                                className="text-gray-400 hover:text-red-400 mt-1 flex-shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => addChecklistItem(task.id, 'stepsChecklist')}
                          className="mt-2 w-full py-1 text-green-300 hover:text-green-200 text-xs flex items-center justify-center gap-1 border border-green-400/20 rounded hover:border-green-400/40 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Step</span>
                        </button>
                      </div>
                      )}

                      {/* Integration Checklist - 50% */}
                      {expandedIntegrationChecklists.has(task.id) && (
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white text-sm font-bold">Integration Checklist</h4>
                        </div>
                        <div className="space-y-2">
                          {task.integrationChecklist?.map((item: ChecklistItem, index: number) => (
                            <div key={item.id} className="flex items-start gap-1">
                              <button
                                onClick={() => updateChecklistItem(task.id, 'integrationChecklist', item.id, 'completed', !item.completed)}
                                className={`w-4 h-4 mt-1 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                  item.completed
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-green-400/40 hover:border-green-400'
                                }`}
                              >
                                {item.completed && <CheckCircle className="w-3 h-3 text-white" />}
                              </button>
                              <span className="text-white text-xs font-medium w-4 text-center mt-1 flex-shrink-0">{index + 1}.</span>
                              <textarea
                                value={item.text}
                                onChange={(e) => updateChecklistItem(task.id, 'integrationChecklist', item.id, 'text', e.target.value)}
                                placeholder="Enter integration..."
                                className="flex-1 bg-transparent text-white text-xs px-2 py-1 border border-green-400/20 rounded focus:outline-none focus:border-green-400/40 resize-none overflow-hidden min-h-[28px]"
                                rows={1}
                                onInput={(e) => {
                                  e.currentTarget.style.height = 'auto';
                                  e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                }}
                              />
                              <button
                                onClick={() => deleteChecklistItem(task.id, 'integrationChecklist', item.id)}
                                className="text-gray-400 hover:text-red-400 mt-1 flex-shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => addChecklistItem(task.id, 'integrationChecklist')}
                          className="mt-2 w-full py-1 text-green-300 hover:text-green-200 text-xs flex items-center justify-center gap-1 border border-green-400/20 rounded hover:border-green-400/40 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Integration</span>
                        </button>
                      </div>
                      )}

                      {/* Notes */}
                      {expandedNotes.has(task.id) && (
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white text-sm font-bold">Notes</h4>
                        </div>
                        <textarea
                          value={task.notes}
                          onChange={(e) => updateTask(task.id, 'notes', e.target.value)}
                          placeholder="Enter notes..."
                          className="w-full bg-transparent text-white text-xs px-2 py-2 border border-green-400/20 rounded focus:outline-none focus:border-green-400/40 resize-none min-h-[200px]"
                          rows={8}
                        />
                      </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() => addNewTask(selectedOpportunityFilter)}
              className={`border-2 border-dashed rounded-xl p-2 transition-colors flex flex-col items-center justify-center w-20 gap-1 flex-shrink-0 ${
                selectedOpportunityFilter === 'Quick Wins' ? 'bg-green-500/20 border-green-400/40 hover:bg-green-500/30' :
                selectedOpportunityFilter === 'Big Wins' ? 'bg-blue-500/20 border-blue-400/40 hover:bg-blue-500/30' :
                selectedOpportunityFilter === 'Mid Opportunities' ? 'bg-orange-500/20 border-orange-400/40 hover:bg-orange-500/30' :
                'bg-gray-500/20 border-gray-400/40 hover:bg-gray-500/30'
              }`}
            >
              <span className={`text-[13.5px] font-semibold ${
                selectedOpportunityFilter === 'Quick Wins' ? 'text-green-300' :
                selectedOpportunityFilter === 'Big Wins' ? 'text-blue-300' :
                selectedOpportunityFilter === 'Mid Opportunities' ? 'text-orange-300' :
                'text-gray-300'
              }`}>Add</span>
              <span className={`text-[13.5px] font-semibold ${
                selectedOpportunityFilter === 'Quick Wins' ? 'text-green-300' :
                selectedOpportunityFilter === 'Big Wins' ? 'text-blue-300' :
                selectedOpportunityFilter === 'Mid Opportunities' ? 'text-orange-300' :
                'text-gray-300'
              }`}>New</span>
              <span className={`text-[13.5px] font-semibold ${
                selectedOpportunityFilter === 'Quick Wins' ? 'text-green-300' :
                selectedOpportunityFilter === 'Big Wins' ? 'text-blue-300' :
                selectedOpportunityFilter === 'Mid Opportunities' ? 'text-orange-300' :
                'text-gray-300'
              }`}>Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottlenecks and Time Drains */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-red-400/10 border border-red-300/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-200 mb-3">Huge - Bottlenecks</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- Customers not available when he wants to call</li>
            <li>- They're calling when we're busy (Calendly)
              <ul className="ml-6 mt-1 space-y-1">
                <li>- Text Links</li>
              </ul>
            </li>
            <li>- Non stop grinding between meetings & customer calls (meetings eating up time)</li>
            <li>- Objective for Calls Automation</li>
            <li>- Needs Assistant</li>
          </ul>
        </div>

        {/* Card 2 */}
        <div className="bg-red-400/10 border border-red-300/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-200 mb-3">HUGE - Time Drains - Zac</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- Creating Debt Schedules</li>
            <li>- Getting information from CPA</li>
            <li>- Manually submitting to Lenders (slack to GHL / Gmail)
              <ul className="ml-6 mt-1 space-y-1">
                <li>- Bank Statements (break down)</li>
                <li>- Email (to lender)</li>
                <li>- Application</li>
              </ul>
            </li>
            <li>- Luke asking Zac for deals</li>
            <li>- Keep Offers for Clients in Dashboard or easy to find place for them</li>
          </ul>
        </div>

        {/* Card 3 */}
        <div className="bg-red-400/10 border border-red-300/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-200 mb-3">HUGE - Time Drains - Luke</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- Affiliates / Referral Partners - Phone Calls</li>
            <li>- LUKE / ZAC scheming this whole process out</li>
            <li>- FAQ Loom Videos</li>
            <li>- Gameplan the Affiliate Process</li>
            <li>- Google Drive &gt; One Pager PDF's &gt; Client Facing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

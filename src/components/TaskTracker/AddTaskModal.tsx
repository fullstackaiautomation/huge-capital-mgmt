import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type Task = {
  id: string;
  taskName: string;
  description: string;
  assignee: 'Zac' | 'Luke' | 'Dillon' | '';
  area: 'Tactstack' | 'Full Stack' | 'Admin' | 'Marketing' | 'Deals' | '';
  dueDate: string;
  completed: boolean;
  completed_date?: string;
};

type AddTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'completed' | 'completed_date'>) => void;
};

const DEFAULT_ASSIGNEES = ['Zac', 'Luke', 'Dillon'] as const;
const DEFAULT_AREAS = ['Tactstack', 'Full Stack', 'Admin', 'Marketing', 'Deals'] as const;

export const AddTaskModal = ({ isOpen, onClose, onSave }: AddTaskModalProps) => {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [customAssignees, setCustomAssignees] = useState<string[]>([]);
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [assigneeColors, setAssigneeColors] = useState<{ [key: string]: string }>({});
  const [areaColors, setAreaColors] = useState<{ [key: string]: string }>({});

  // Available color palette
  const availableAssigneeColors = [
    'bg-indigo-600/30 text-indigo-300 border-indigo-400/40',
    'bg-pink-600/30 text-pink-300 border-pink-400/40',
    'bg-teal-600/30 text-teal-300 border-teal-400/40',
    'bg-amber-600/30 text-amber-300 border-amber-400/40',
    'bg-rose-600/30 text-rose-300 border-rose-400/40',
    'bg-emerald-600/30 text-emerald-300 border-emerald-400/40',
    'bg-violet-600/30 text-violet-300 border-violet-400/40',
    'bg-sky-600/30 text-sky-300 border-sky-400/40',
    'bg-lime-600/30 text-lime-300 border-lime-400/40',
    'bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-400/40',
  ];

  const availableAreaColors = [
    'bg-red-600/30 text-red-300 border-red-400/40',
    'bg-indigo-600/30 text-indigo-300 border-indigo-400/40',
    'bg-purple-600/30 text-purple-300 border-purple-400/40',
    'bg-teal-600/30 text-teal-300 border-teal-400/40',
    'bg-lime-600/30 text-lime-300 border-lime-400/40',
    'bg-rose-600/30 text-rose-300 border-rose-400/40',
    'bg-sky-600/30 text-sky-300 border-sky-400/40',
    'bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-400/40',
    'bg-emerald-600/30 text-emerald-300 border-emerald-400/40',
    'bg-amber-600/30 text-amber-300 border-amber-400/40',
  ];

  // Load custom options from database
  useEffect(() => {
    if (!isOpen) return;

    const loadCustomOptions = async () => {
      // Load custom assignees
      const { data: assigneeData, error: assigneeError } = await supabase
        .from('custom_options')
        .select('name, color')
        .eq('type', 'assignee');

      if (assigneeError) {
        console.error('Error loading custom assignees:', assigneeError);
      } else if (assigneeData) {
        const names = assigneeData.map(item => item.name);
        const colors = assigneeData.reduce((acc, item) => {
          acc[item.name] = item.color;
          return acc;
        }, {} as { [key: string]: string });

        setCustomAssignees(names);
        setAssigneeColors(colors);
      }

      // Load custom areas
      const { data: areaData, error: areaError } = await supabase
        .from('custom_options')
        .select('name, color')
        .eq('type', 'area');

      if (areaError) {
        console.error('Error loading custom areas:', areaError);
      } else if (areaData) {
        const names = areaData.map(item => item.name);
        const colors = areaData.reduce((acc, item) => {
          acc[item.name] = item.color;
          return acc;
        }, {} as { [key: string]: string });

        setCustomAreas(names);
        setAreaColors(colors);
      }
    };

    loadCustomOptions();
  }, [isOpen]);

  const handleAssigneeChange = async (value: string) => {
    if (value === '__add_new__') {
      const newAssignee = prompt('Enter new assignee name:');
      if (newAssignee && newAssignee.trim()) {
        const trimmedName = newAssignee.trim();
        if (!customAssignees.includes(trimmedName) && !DEFAULT_ASSIGNEES.includes(trimmedName as any)) {
          // Assign a color from available colors
          const usedColors = Object.values(assigneeColors);
          const nextColor = availableAssigneeColors.find(color => !usedColors.includes(color))
            || availableAssigneeColors[customAssignees.length % availableAssigneeColors.length];

          // Save to database
          const { error } = await supabase
            .from('custom_options')
            .insert({
              type: 'assignee',
              name: trimmedName,
              color: nextColor
            });

          if (!error) {
            setCustomAssignees([...customAssignees, trimmedName]);
            setAssigneeColors({ ...assigneeColors, [trimmedName]: nextColor });
            setAssignee(trimmedName);
          } else {
            console.error('Error saving custom assignee:', error);
            if (error.code === '42P01') {
              alert('Database table not found. Please ask your administrator to run the migration: supabase/migrations/create-custom-options-table.sql');
            } else {
              alert(`Failed to save custom assignee: ${error.message}`);
            }
          }
        } else {
          setAssignee(trimmedName);
        }
      }
    } else {
      setAssignee(value);
    }
  };

  const handleAreaChange = async (value: string) => {
    if (value === '__add_new__') {
      const newArea = prompt('Enter new area name:');
      if (newArea && newArea.trim()) {
        const trimmedArea = newArea.trim();
        if (!customAreas.includes(trimmedArea) && !DEFAULT_AREAS.includes(trimmedArea as any)) {
          // Assign a color from available colors
          const usedColors = Object.values(areaColors);
          const nextColor = availableAreaColors.find(color => !usedColors.includes(color))
            || availableAreaColors[customAreas.length % availableAreaColors.length];

          // Save to database
          const { error } = await supabase
            .from('custom_options')
            .insert({
              type: 'area',
              name: trimmedArea,
              color: nextColor
            });

          if (!error) {
            setCustomAreas([...customAreas, trimmedArea]);
            setAreaColors({ ...areaColors, [trimmedArea]: nextColor });
            setArea(trimmedArea);
          } else {
            console.error('Error saving custom area:', error);
            if (error.code === '42P01') {
              alert('Database table not found. Please ask your administrator to run the migration: supabase/migrations/create-custom-options-table.sql');
            } else {
              alert(`Failed to save custom area: ${error.message}`);
            }
          }
        } else {
          setArea(trimmedArea);
        }
      }
    } else {
      setArea(value);
    }
  };

  const handleSave = () => {
    if (!taskName.trim()) {
      alert('Please enter a task name');
      return;
    }

    onSave({
      taskName,
      description,
      assignee: assignee as any,
      area: area as any,
      dueDate,
    });

    // Reset form
    setTaskName('');
    setDescription('');
    setAssignee('');
    setArea('');
    setDueDate('');
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setTaskName('');
    setDescription('');
    setAssignee('');
    setArea('');
    setDueDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-gray-100">Add New Task</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Task Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name..."
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-base"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-base resize-none"
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Assignee
            </label>
            <select
              value={assignee}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-base"
            >
              <option value="">Select assignee...</option>
              {DEFAULT_ASSIGNEES.map(person => (
                <option key={person} value={person}>{person}</option>
              ))}
              {customAssignees.map((person) => (
                <option key={person} value={person}>{person}</option>
              ))}
              <option value="__add_new__" className="font-bold text-brand-400">+ Add New...</option>
            </select>
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Area
            </label>
            <select
              value={area}
              onChange={(e) => handleAreaChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-base"
            >
              <option value="">Select area...</option>
              {DEFAULT_AREAS.map(areaOption => (
                <option key={areaOption} value={areaOption}>{areaOption}</option>
              ))}
              {customAreas.map((areaOption) => (
                <option key={areaOption} value={areaOption}>{areaOption}</option>
              ))}
              <option value="__add_new__" className="font-bold text-brand-400">+ Add New...</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-base"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={handleCancel}
            className="px-6 py-3 text-base font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-lg shadow-emerald-500/30"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

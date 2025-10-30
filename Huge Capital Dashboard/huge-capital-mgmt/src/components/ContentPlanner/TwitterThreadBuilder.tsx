import { Plus, X, GripVertical, Twitter, AlertCircle } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TwitterThread } from '../../types/content';

interface TwitterThreadBuilderProps {
  threads: TwitterThread[];
  onChange: (threads: TwitterThread[]) => void;
  hook: string;
  onHookChange: (hook: string) => void;
}

interface ThreadPartProps {
  thread: TwitterThread;
  index: number;
  onUpdate: (content: string) => void;
  onRemove: () => void;
}

const ThreadPart = ({ thread, index, onUpdate, onRemove }: ThreadPartProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `thread-${thread.order}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const characterCount = thread.content.length;
  const isOverLimit = characterCount > 280;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-800/50 rounded-lg border ${
        isDragging ? 'border-brand-500 opacity-50' : 'border-gray-700/50'
      } ${isOverLimit ? 'border-red-500' : ''}`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-500 hover:text-gray-300 cursor-move"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Thread number */}
        <div className="flex-shrink-0 w-8 h-8 bg-brand-500/20 text-brand-500 rounded-full flex items-center justify-center font-semibold text-sm">
          {index + 1}
        </div>

        {/* Content editor */}
        <div className="flex-1">
          <textarea
            value={thread.content}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder={index === 0 ? "Continue from your hook..." : "Continue your thread..."}
            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            rows={3}
          />
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-xs ${
                isOverLimit ? 'text-red-400' : 'text-gray-500'
              }`}
            >
              {characterCount} / 280
            </span>
            {isOverLimit && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Over character limit
              </span>
            )}
          </div>
        </div>

        {/* Remove button */}
        {index > 0 && (
          <button
            onClick={onRemove}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export const TwitterThreadBuilder = ({
  threads,
  onChange,
  hook,
  onHookChange,
}: TwitterThreadBuilderProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = threads.findIndex((t) => `thread-${t.order}` === active.id);
      const newIndex = threads.findIndex((t) => `thread-${t.order}` === over?.id);

      const reordered = arrayMove(threads, oldIndex, newIndex).map((thread, index) => ({
        ...thread,
        order: index + 1,
      }));

      onChange(reordered);
    }
  };

  const addThreadPart = () => {
    const newThread: TwitterThread = {
      order: threads.length + 1,
      content: '',
      characterCount: 0,
    };
    onChange([...threads, newThread]);
  };

  const updateThreadPart = (index: number, content: string) => {
    const updated = [...threads];
    updated[index] = {
      ...updated[index],
      content,
      characterCount: content.length,
    };
    onChange(updated);
  };

  const removeThreadPart = (index: number) => {
    const filtered = threads.filter((_, i) => i !== index);
    const reordered = filtered.map((thread, i) => ({
      ...thread,
      order: i + 1,
    }));
    onChange(reordered);
  };

  const getTotalCharacters = () => {
    return hook.length + threads.reduce((total, thread) => total + thread.content.length, 0);
  };

  const getThreadCount = () => {
    return threads.length + 1; // +1 for the hook
  };

  return (
    <div className="space-y-6">
      {/* Thread Header */}
      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Twitter className="w-5 h-5 text-sky-500" />
            <h3 className="text-lg font-semibold text-gray-100">Twitter Thread Builder</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{getThreadCount()} tweets</span>
            <span>{getTotalCharacters()} total characters</span>
          </div>
        </div>

        {/* Hook Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Hook (First Tweet - Make it compelling!)
          </label>
          <div className="relative">
            <textarea
              value={hook}
              onChange={(e) => onHookChange(e.target.value)}
              placeholder="Start with a powerful hook that grabs attention..."
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="absolute top-2 right-2 bg-sky-500/20 text-sky-400 px-2 py-1 rounded text-xs font-medium">
              HOOK
            </div>
            <div className="flex justify-between mt-2">
              <span className={`text-xs ${hook.length > 280 ? 'text-red-400' : 'text-gray-500'}`}>
                {hook.length} / 280
              </span>
              {hook.length > 280 && (
                <span className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Over character limit
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thread Parts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">Thread Content</h4>
          <button
            onClick={addThreadPart}
            className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Tweet
          </button>
        </div>

        {threads.length === 0 ? (
          <div className="bg-gray-800/30 rounded-lg p-8 border border-gray-700/50 text-center">
            <Twitter className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No thread parts yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Click "Add Tweet" to start building your thread
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={threads.map(t => `thread-${t.order}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {threads.map((thread, index) => (
                  <ThreadPart
                    key={`thread-${thread.order}`}
                    thread={thread}
                    index={index}
                    onUpdate={(content) => updateThreadPart(index, content)}
                    onRemove={() => removeThreadPart(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Thread Tips */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-400 mb-2">Thread Best Practices</h4>
        <ul className="text-xs text-blue-300 space-y-1">
          <li>• Start with a compelling hook that makes people want to read more</li>
          <li>• Each tweet should provide value while leading to the next</li>
          <li>• Use numbers, statistics, or bold claims in your hook</li>
          <li>• End with a clear call-to-action or summary</li>
          <li>• Keep each tweet under 250 characters for better readability</li>
          <li>• Use line breaks for easier scanning</li>
        </ul>
      </div>
    </div>
  );
};
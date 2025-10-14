import { useState, useEffect } from 'react';
import {
  Save,
  Copy,
  Check,
  Calendar,
  Clock,
  Tag,
  Image,
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react';
import { TwitterThreadBuilder } from './TwitterThreadBuilder';
import { AIContentSuggestions } from './AIContentSuggestions';
import { generateAIContent } from '../../services/aiContentGenerator';
import { PLATFORM_LIMITS, PLATFORM_COLORS, type Platform, type ContentPost, type TwitterThread, type ContentSource, type Person, type ContentProfile } from '../../types/content';
import type { Story } from '../../types/story';

interface ContentEditorProps {
  post: Partial<ContentPost>;
  platform: Platform;
  person: Person;
  profile?: ContentProfile;
  stories?: Story[];
  onSave: (post: Partial<ContentPost>) => Promise<void>;
  onSchedule: (post: Partial<ContentPost>) => Promise<void>;
  onApprove: (post: Partial<ContentPost>) => Promise<void>;
  tags?: string[];
  pillars?: string[];
}

export const ContentEditor = ({
  post,
  platform,
  person,
  profile,
  stories = [],
  onSave,
  onSchedule,
  onApprove,
  tags = [],
  pillars = [],
}: ContentEditorProps) => {
  const [content, setContent] = useState(post.content || '');
  const [threadHook, setThreadHook] = useState(post.threadHook || '');
  const [threadParts, setThreadParts] = useState<TwitterThread[]>(post.threadContent || []);
  const [isThread, setIsThread] = useState(post.isThread || false);
  const [selectedTags, setSelectedTags] = useState<string[]>(post.tags || []);
  const [selectedPillar, setSelectedPillar] = useState(post.contentPillar || '');
  const [sources, setSources] = useState<ContentSource[]>(post.sources || []);
  const [scheduledDate, setScheduledDate] = useState(post.scheduledFor || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIPromptModal, setShowAIPromptModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);

  // Auto-save effect (every 30 seconds)
  useEffect(() => {
    if (!hasUnsavedChanges || !content) return;

    const autoSaveTimer = setTimeout(async () => {
      await handleSave('draft');
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    }, 30000); // 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [content, threadHook, threadParts, selectedTags, selectedPillar, sources, hasUnsavedChanges]);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [content, threadHook, threadParts, selectedTags, selectedPillar, sources]);

  const characterLimit = PLATFORM_LIMITS[platform];
  const characterCount = isThread ? threadHook.length : content.length;
  const isOverLimit = characterCount > characterLimit;

  // Platform-specific features
  const supportsThreads = platform === 'Twitter';
  const supportsImages = ['Twitter', 'Facebook', 'Instagram', 'LinkedIn'].includes(platform);
  const supportsSources = ['Blog', 'Newsletter'].includes(platform);

  const handleSave = async (status: 'draft' | 'scheduled' = 'draft') => {
    setIsSaving(true);
    try {
      const postData: Partial<ContentPost> = {
        ...post,
        content: isThread ? threadHook : content,
        threadContent: isThread ? threadParts : undefined,
        isThread,
        threadHook: isThread ? threadHook : undefined,
        tags: selectedTags,
        contentPillar: selectedPillar,
        sources: supportsSources ? sources : undefined,
        scheduledFor: status === 'scheduled' ? scheduledDate : undefined,
        status,
        platform,
      };

      if (status === 'scheduled') {
        await onSchedule(postData);
      } else {
        await onSave(postData);
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = isThread
      ? `${threadHook}\n\n${threadParts.map(t => t.content).join('\n\n')}`
      : content;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    await handleSave('scheduled');
    await onApprove({
      ...post,
      content: isThread ? threadHook : content,
      status: 'scheduled',
    });
  };

  const addSource = () => {
    setSources([...sources, { type: 'website', title: '', url: '' }]);
  };

  const updateSource = (index: number, field: keyof ContentSource, value: string) => {
    const updated = [...sources];
    updated[index] = { ...updated[index], [field]: value };
    setSources(updated);
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleGenerateAI = async () => {
    if (!profile) return;

    setIsGeneratingAI(true);
    setShowAISuggestions(true);
    setShowAIPromptModal(false);

    try {
      // Get selected stories or approved stories for this person
      let selectedStories: Story[] = [];

      if (selectedStoryIds.length > 0) {
        selectedStories = stories.filter(s => selectedStoryIds.includes(s.id));
      } else {
        // Default to approved stories for this person
        selectedStories = stories
          .filter(s => s.personName === person && s.isApproved)
          .slice(0, 5); // Limit to top 5 stories
      }

      const suggestions = await generateAIContent({
        person,
        platform,
        profile,
        contentPillar: selectedPillar,
        topic: aiTopic || undefined,
        stories: selectedStories.length > 0 ? selectedStories : undefined,
      });
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const openAIPromptModal = () => {
    setShowAIPromptModal(true);
  };

  const handleSelectAISuggestion = (suggestion: string) => {
    if (isThread && platform === 'Twitter') {
      setThreadHook(suggestion);
    } else {
      setContent(suggestion);
    }
    setShowAISuggestions(false);
    setHasUnsavedChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div
        className="flex items-center justify-between p-3 rounded-lg"
        style={{ backgroundColor: `${PLATFORM_COLORS[platform]}20` }}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-100">
            {platform} Post Editor
          </h3>
          {/* Auto-save indicator */}
          {isSaving ? (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="animate-spin">⏳</span> Saving...
            </span>
          ) : lastSaved ? (
            <span className="text-xs text-gray-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          ) : hasUnsavedChanges ? (
            <span className="text-xs text-yellow-500">Unsaved changes</span>
          ) : null}
        </div>
        {supportsThreads && (
          <button
            onClick={() => setIsThread(!isThread)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isThread
                ? 'bg-sky-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isThread ? 'Thread Mode' : 'Single Post'}
          </button>
        )}
      </div>

      {/* Content Editor */}
      {isThread && supportsThreads ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openAIPromptModal}
              disabled={!profile || isGeneratingAI}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              AI Generate Thread Hook
            </button>
          </div>
          <TwitterThreadBuilder
            threads={threadParts}
            onChange={setThreadParts}
            hook={threadHook}
            onHookChange={setThreadHook}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Content
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={openAIPromptModal}
                  disabled={!profile || isGeneratingAI}
                  className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Generate
                </button>
                <span
                  className={`text-xs ${
                    isOverLimit ? 'text-red-400' : 'text-gray-500'
                  }`}
                >
                  {characterCount} / {characterLimit}
                </span>
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Write your ${platform} post here...`}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              rows={platform === 'Blog' ? 15 : 6}
            />
            {isOverLimit && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Content exceeds {platform} character limit
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tags and Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Content Pillar */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Content Pillar
          </label>
          <select
            value={selectedPillar}
            onChange={(e) => setSelectedPillar(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select pillar...</option>
            {pillars.map((pillar) => (
              <option key={pillar} value={pillar}>
                {pillar}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTags(
                    selectedTags.includes(tag)
                      ? selectedTags.filter((t) => t !== tag)
                      : [...selectedTags, tag]
                  );
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Tag className="w-3 h-3 inline mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sources (for Blog/Newsletter) */}
      {supportsSources && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">
              Sources & References
            </label>
            <button
              onClick={addSource}
              className="text-sm text-brand-500 hover:text-brand-400"
            >
              + Add Source
            </button>
          </div>
          {sources.map((source, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={source.title}
                onChange={(e) => updateSource(index, 'title', e.target.value)}
                placeholder="Source title"
                className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
              <input
                type="url"
                value={source.url || ''}
                onChange={(e) => updateSource(index, 'url', e.target.value)}
                placeholder="URL (optional)"
                className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
              <button
                onClick={() => removeSource(index)}
                className="px-2 text-gray-500 hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Media Upload (placeholder) */}
      {supportsImages && (
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
          <Image className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            Drag & drop images here, or click to browse
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, GIF up to 10MB
          </p>
        </div>
      )}

      {/* Scheduling */}
      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
        <label className="text-sm font-medium text-gray-300 mb-3 block flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Schedule Post
        </label>
        <div className="flex gap-3">
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button className="px-3 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors">
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>

          {scheduledDate && (
            <button
              onClick={() => handleSave('scheduled')}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
          )}

          <button
            onClick={handleApprove}
            disabled={isSaving || isOverLimit}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Approve & Post
          </button>
        </div>
      </div>

      {/* Status Badge */}
      {post.status && (
        <div className="flex justify-end">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            post.status === 'published' ? 'bg-green-500/20 text-green-400' :
            post.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
            post.status === 'failed' ? 'bg-red-500/20 text-red-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
          </span>
        </div>
      )}

      {/* AI Prompt Modal */}
      {showAIPromptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-100">AI Content Generator</h2>
                  <p className="text-sm text-gray-400">Customize your AI-generated content</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIPromptModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Topic Input */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Topic or Prompt (Optional)
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., SBA loans for first-time entrepreneurs, overcoming funding challenges..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Leave blank to generate content based on your content pillars
                </p>
              </div>

              {/* Story Selection */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Select Stories to Reference (Optional)
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  {stories.filter(s => s.personName === person && s.isApproved).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No approved stories available. Add stories in the Stories tab!
                    </p>
                  ) : (
                    stories
                      .filter(s => s.personName === person && s.isApproved)
                      .map((story) => (
                        <label
                          key={story.id}
                          className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStoryIds.includes(story.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStoryIds([...selectedStoryIds, story.id]);
                              } else {
                                setSelectedStoryIds(selectedStoryIds.filter(id => id !== story.id));
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-200">{story.title}</p>
                            {story.fundingType && (
                              <p className="text-xs text-gray-400 mt-1">{story.fundingType}</p>
                            )}
                            {story.keyTakeaways && story.keyTakeaways.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                {story.keyTakeaways.slice(0, 2).join(', ')}
                              </p>
                            )}
                          </div>
                        </label>
                      ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedStoryIds.length > 0
                    ? `${selectedStoryIds.length} ${selectedStoryIds.length === 1 ? 'story' : 'stories'} selected`
                    : 'Select stories to create content based on real experiences'}
                </p>
              </div>

              {/* Current Settings Summary */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-300 mb-2">AI Will Generate:</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• 3 variations for {platform}</li>
                  <li>• Matching {person}'s brand voice</li>
                  {selectedPillar && <li>• Focused on: {selectedPillar}</li>}
                  {aiTopic && <li>• About: {aiTopic}</li>}
                  {selectedStoryIds.length > 0 && (
                    <li>• Using {selectedStoryIds.length} selected {selectedStoryIds.length === 1 ? 'story' : 'stories'}</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-700">
              <button
                onClick={() => setShowAIPromptModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="flex items-center gap-2 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Generate Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Content Suggestions Modal */}
      {showAISuggestions && (
        <AIContentSuggestions
          suggestions={aiSuggestions}
          isLoading={isGeneratingAI}
          onSelect={handleSelectAISuggestion}
          onRegenerate={handleGenerateAI}
          onClose={() => setShowAISuggestions(false)}
        />
      )}
    </div>
  );
};
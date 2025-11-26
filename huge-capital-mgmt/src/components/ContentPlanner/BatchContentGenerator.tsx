import { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  Plus,
  Pencil,
} from 'lucide-react';
import {
  SkillsRunner,
  type ContentGenerationRequest,
  type GeneratedContent,
  type BatchGenerationResult,
} from '../../services/skillsRunner';
import type { Person, Platform } from '../../types/content';
import { SchedulingModal } from './SchedulingModal';
import { saveMultipleToLibrary } from '../../services/contentLibraryService';

interface BatchContentGeneratorProps {
  selectedPerson: Person;
  onContentGenerated?: (contents: GeneratedContent[]) => void;
  onAddToCalendar?: (content: GeneratedContent) => void;
  onTakeToEditor?: (content: GeneratedContent) => void;
}

// Platform configuration per persona (matches agent YAML files)
const PERSONA_PLATFORMS: Record<Person, Platform[]> = {
  'Zac': ['LinkedIn', 'Instagram', 'Facebook'],
  'Luke': ['LinkedIn', 'Instagram', 'Facebook', 'Skool'],
  'Huge Capital': ['Facebook', 'Blog', 'Newsletter'],
};

// Topic options for content generation (industry-specific themes)
const TOPIC_OPTIONS = [
  { value: '', label: 'Any Topic (Random)' },
  { value: 'sba-loans', label: 'SBA Loans & Programs' },
  { value: 'credit-challenges', label: 'Credit Challenges & Solutions' },
  { value: 'business-growth', label: 'Business Growth & Expansion' },
  { value: 'startup-funding', label: 'Startup & New Business Funding' },
  { value: 'equipment-financing', label: 'Equipment Financing' },
  { value: 'real-estate', label: 'Commercial Real Estate' },
  { value: 'working-capital', label: 'Working Capital & Cash Flow' },
  { value: 'industry-spotlight', label: 'Industry Spotlight (Restaurant, Construction, etc.)' },
  { value: 'client-success', label: 'Client Success Stories' },
  { value: 'myths-debunked', label: 'Funding Myths Debunked' },
  { value: 'application-tips', label: 'Application Tips & Process' },
  { value: 'lender-relationships', label: 'Lender Relationships' },
  { value: 'entrepreneur-mindset', label: 'Entrepreneur Mindset' },
  { value: 'market-trends', label: 'Market Trends & Updates' },
  { value: 'personal-brand', label: 'Personal Brand & Authenticity' },
];

export const BatchContentGenerator = ({
  selectedPerson,
  onContentGenerated,
  onAddToCalendar,
  onTakeToEditor
}: BatchContentGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [result, setResult] = useState<BatchGenerationResult | null>(null);
  const [expandedContent, setExpandedContent] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Configuration state - start with NO platforms selected
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [postsPerPlatform, setPostsPerPlatform] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [inspiration, setInspiration] = useState('');

  // Scheduling modal state
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [contentToSchedule, setContentToSchedule] = useState<GeneratedContent | null>(null);

  // Get available platforms for current persona
  const availablePlatforms = PERSONA_PLATFORMS[selectedPerson] || [];
  const personaConfig = SkillsRunner.personaConfig[selectedPerson];

  // Reset platform selection when persona changes
  useEffect(() => {
    setSelectedPlatforms([]);
    setResult(null);
  }, [selectedPerson]);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms(availablePlatforms);
  };

  const clearAllPlatforms = () => {
    setSelectedPlatforms([]);
  };

  const calculateTotalPosts = () => {
    return selectedPlatforms.length * postsPerPlatform;
  };

  const handleGenerate = async () => {
    if (selectedPlatforms.length === 0) return;

    setIsGenerating(true);
    setResult(null);
    setProgress({ completed: 0, total: calculateTotalPosts() });

    // Build requests for the selected persona only
    const requests: ContentGenerationRequest[] = [];
    for (const platform of selectedPlatforms) {
      for (let i = 0; i < postsPerPlatform; i++) {
        requests.push({
          persona: selectedPerson,
          platform,
          topic: selectedTopic || undefined,
          inspiration: inspiration || undefined,
        });
      }
    }

    try {
      const batchResult = await SkillsRunner.orchestrateBatchGeneration(
        requests,
        (completed, total) => setProgress({ completed, total })
      );

      setResult(batchResult);

      // Auto-save all generated content to the library
      if (batchResult.contents.length > 0) {
        saveMultipleToLibrary(batchResult.contents, selectedTopic || undefined);
        console.log(`[BatchGenerator] Saved ${batchResult.contents.length} items to library`);
      }

      if (onContentGenerated) {
        onContentGenerated(batchResult.contents);
      }
    } catch (error) {
      console.error('Batch generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportAll = () => {
    if (!result) return;

    const exportData = result.contents.map((content, index) => ({
      id: index + 1,
      persona: content.metadata.persona,
      platform: content.metadata.platform,
      content: content.content,
      hashtags: content.hashtags.join(' '),
      imagePrompt: {
        subject: content.imagePrompt.subject,
        briefConcept: content.imagePrompt.briefConceptPrompt,
        plugAndPlay: content.imagePrompt.plugAndPlayPrompt,
      },
      voiceScore: content.metadata.voiceScore,
      complianceScore: content.metadata.complianceScore,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPerson.toLowerCase().replace(' ', '-')}-content-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Selected Persona */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: personaConfig.color }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">Content Generator</h2>
            <p className="text-sm text-gray-400">
              Selected Persona: <span className="font-semibold" style={{ color: personaConfig.color }}>{selectedPerson}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 space-y-6">

        {/* Platform Selection - Only show valid platforms for persona */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">Select Platforms for {selectedPerson}</label>
            <div className="flex gap-2">
              <button
                onClick={selectAllPlatforms}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Select All
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={clearAllPlatforms}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {availablePlatforms.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform);
              return (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all border-2 ${
                    isSelected
                      ? 'border-transparent text-white shadow-lg'
                      : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                  }`}
                  style={{
                    backgroundColor: isSelected ? personaConfig.color : 'transparent',
                    boxShadow: isSelected ? `0 4px 12px ${personaConfig.color}40` : undefined,
                  }}
                >
                  {isSelected && <Plus className="w-4 h-4 inline mr-1 rotate-45" />}
                  {platform}
                </button>
              );
            })}
          </div>
          {selectedPlatforms.length === 0 && (
            <p className="text-xs text-yellow-500/80 mt-2">
              Click platforms above to select them for content generation
            </p>
          )}
        </div>

        {/* Topic Selection (Optional) */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-3 block">
            Topic <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 appearance-none cursor-pointer hover:border-gray-500 focus:border-gray-400 focus:outline-none transition-colors"
              style={{
                borderColor: selectedTopic ? personaConfig.color : undefined,
              }}
            >
              {TOPIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          {selectedTopic && (
            <p className="text-xs mt-2" style={{ color: personaConfig.color }}>
              Content will focus on: {TOPIC_OPTIONS.find(t => t.value === selectedTopic)?.label}
            </p>
          )}
        </div>

        {/* Inspiration Field (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">
              Inspiration <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <span className={`text-xs ${inspiration.split(/\s+/).filter(Boolean).length > 100 ? 'text-red-400' : 'text-gray-500'}`}>
              {inspiration.split(/\s+/).filter(Boolean).length}/100 words
            </span>
          </div>
          <textarea
            value={inspiration}
            onChange={(e) => {
              const words = e.target.value.split(/\s+/).filter(Boolean);
              if (words.length <= 100 || e.target.value.length < inspiration.length) {
                setInspiration(e.target.value);
              }
            }}
            placeholder="Share a story, idea, or angle you'd like the content to incorporate... (e.g., 'Just closed a deal where the client had 3 previous bank rejections but we found an SBA lender who understood their situation')"
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-500 resize-none hover:border-gray-500 focus:border-gray-400 focus:outline-none transition-colors"
            rows={3}
            style={{
              borderColor: inspiration ? personaConfig.color : undefined,
            }}
          />
          {inspiration && (
            <p className="text-xs mt-2 text-gray-400">
              AI will weave this inspiration into the {selectedPerson} voice
            </p>
          )}
        </div>

        {/* Posts Per Platform - Actual Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">Posts Per Platform</label>
            <span
              className="text-lg font-bold px-3 py-1 rounded-lg"
              style={{ backgroundColor: `${personaConfig.color}20`, color: personaConfig.color }}
            >
              {postsPerPlatform}
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="10"
              value={postsPerPlatform}
              onChange={(e) => setPostsPerPlatform(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${personaConfig.color} 0%, ${personaConfig.color} ${(postsPerPlatform - 1) / 9 * 100}%, #374151 ${(postsPerPlatform - 1) / 9 * 100}%, #374151 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <span
                  key={n}
                  className={n === postsPerPlatform ? 'font-bold' : ''}
                  style={{ color: n === postsPerPlatform ? personaConfig.color : undefined }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div
          className="rounded-lg p-4 border"
          style={{
            backgroundColor: `${personaConfig.color}10`,
            borderColor: `${personaConfig.color}30`
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold" style={{ color: personaConfig.color }}>Generation Summary</h4>
              <p className="text-xs text-gray-400 mt-1">
                {selectedPlatforms.length > 0
                  ? `${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? 's' : ''} × ${postsPerPlatform} post${postsPerPlatform > 1 ? 's' : ''} each`
                  : 'No platforms selected'
                }
              </p>
              {selectedTopic && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Topic: {TOPIC_OPTIONS.find(t => t.value === selectedTopic)?.label}
                </p>
              )}
              {inspiration && (
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                  Inspiration: "{inspiration.substring(0, 40)}..."
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: personaConfig.color }}>
                {calculateTotalPosts()}
              </p>
              <p className="text-xs text-gray-400">total posts</p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || selectedPlatforms.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: selectedPlatforms.length > 0
              ? `linear-gradient(135deg, ${personaConfig.color}, ${personaConfig.color}dd)`
              : '#4B5563',
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating... {progress.completed}/{progress.total}
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Generate {calculateTotalPosts()} Posts for {selectedPerson}
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Generating {selectedPerson} content...</span>
            <span className="text-sm text-gray-300">
              {progress.completed} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${(progress.completed / progress.total) * 100}%`,
                backgroundColor: personaConfig.color
              }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100">
                {selectedPerson} Content Generated
              </h3>
              <button
                onClick={handleExportAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
                style={{ backgroundColor: personaConfig.color }}
              >
                <Download className="w-4 h-4" />
                Export All
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{result.summary.generated}</p>
                <p className="text-xs text-gray-400">Generated</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-400">{result.summary.failed}</p>
                <p className="text-xs text-gray-400">Failed</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {result.contents.length > 0 ? Math.round(
                    result.contents.reduce((sum, c) => sum + (c.metadata.voiceScore || 0), 0) /
                    result.contents.length
                  ) : 0}
                </p>
                <p className="text-xs text-gray-400">Avg Voice Score</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {result.contents.length > 0 ? Math.round(
                    result.contents.reduce((sum, c) => sum + (c.metadata.complianceScore || 0), 0) /
                    result.contents.length
                  ) : 0}
                </p>
                <p className="text-xs text-gray-400">Avg Compliance</p>
              </div>
            </div>

            {/* Breakdown by Platform */}
            <div className="mt-4 flex gap-3 flex-wrap">
              {Object.entries(result.summary.byPlatform).map(([platform, count]) => (
                <div
                  key={platform}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{
                    backgroundColor: `${personaConfig.color}20`,
                    color: personaConfig.color,
                  }}
                >
                  {platform}: {count}
                </div>
              ))}
            </div>
          </div>

          {/* Generated Content List */}
          <div className="space-y-3">
            {result.contents.map((content, index) => {
              const isExpanded = expandedContent === index;

              return (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/70 transition-colors"
                    onClick={() => setExpandedContent(isExpanded ? null : index)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: personaConfig.color }}
                      >
                        {content.metadata.platform.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-200">
                          {content.metadata.platform} Post #{index + 1}
                        </p>
                        <p className="text-sm text-gray-400 truncate max-w-md">
                          {content.content.substring(0, 80)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {(content.metadata.voiceScore || 0) >= 85 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="text-sm text-gray-400">
                          {content.metadata.voiceScore}%
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-700/50 p-4 space-y-4">
                      {/* Action Buttons */}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleCopy(content.content, index)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedIndex === index ? 'Copied!' : 'Copy'}
                        </button>
                        {onTakeToEditor && (
                          <button
                            onClick={() => onTakeToEditor(content)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                            Take to Editor
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setContentToSchedule(content);
                            setShowSchedulingModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white rounded-lg transition-colors"
                          style={{ backgroundColor: personaConfig.color }}
                        >
                          <Calendar className="w-4 h-4" />
                          Add to Calendar
                        </button>
                      </div>

                      {/* Content */}
                      <div>
                        <label className="text-sm font-medium text-gray-400 mb-2 block">Content</label>
                        <div className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">
                          {content.content}
                        </div>
                      </div>

                      {/* Hashtags */}
                      <div>
                        <label className="text-sm font-medium text-gray-400 mb-2 block">Hashtags</label>
                        <div className="flex flex-wrap gap-2">
                          {content.hashtags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Image Prompt */}
                      <div>
                        <label className="text-sm font-medium text-gray-400 mb-2 block">
                          Image Prompt
                        </label>
                        <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
                          <div>
                            <p className="text-xs mb-1" style={{ color: personaConfig.color }}>Subject:</p>
                            <p className="text-sm text-gray-300">{content.imagePrompt.subject}</p>
                          </div>
                          <div>
                            <p className="text-xs mb-1" style={{ color: personaConfig.color }}>Brief Concept:</p>
                            <p className="text-sm text-gray-300">{content.imagePrompt.briefConceptPrompt}</p>
                          </div>
                          <div>
                            <p className="text-xs mb-1" style={{ color: personaConfig.color }}>Plug & Play (Midjourney):</p>
                            <p className="text-sm text-gray-300 font-mono text-xs bg-gray-800 p-2 rounded">
                              {content.imagePrompt.plugAndPlayPrompt}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="flex gap-4">
                        <div className="flex-1 bg-gray-900/50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Voice Score</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  (content.metadata.voiceScore || 0) >= 85
                                    ? 'bg-green-500'
                                    : 'bg-yellow-500'
                                }`}
                                style={{ width: `${content.metadata.voiceScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-300">
                              {content.metadata.voiceScore}%
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 bg-gray-900/50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Compliance Score</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  (content.metadata.complianceScore || 0) >= 95
                                    ? 'bg-green-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${content.metadata.complianceScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-300">
                              {content.metadata.complianceScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scheduling Modal */}
      <SchedulingModal
        isOpen={showSchedulingModal}
        onClose={() => {
          setShowSchedulingModal(false);
          setContentToSchedule(null);
        }}
        content={contentToSchedule}
        onScheduled={() => {
          setShowSchedulingModal(false);
          setContentToSchedule(null);
          // Optionally navigate to calendar - handled by parent if needed
          if (onAddToCalendar && contentToSchedule) {
            // Signal to parent that content was scheduled
          }
        }}
      />
    </div>
  );
};

export default BatchContentGenerator;

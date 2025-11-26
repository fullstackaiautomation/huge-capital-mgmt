/**
 * Content Library Page
 *
 * Displays all generated content with filtering by persona, platform, topic, and search.
 * Allows users to schedule, edit, copy, or delete saved content.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Library,
  Search,
  Filter,
  Calendar,
  Copy,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Person, Platform } from '../types/content';
import { PERSON_COLORS, PLATFORM_COLORS } from '../types/content';
import {
  getAllLibraryContent,
  deleteFromLibrary,
  getLibraryStats,
  type LibraryItem,
} from '../services/contentLibraryService';
import { SchedulingModal } from '../components/ContentPlanner/SchedulingModal';
import type { GeneratedContent } from '../services/skillsRunner';

// Topic options (same as BatchContentGenerator)
const TOPIC_OPTIONS = [
  { value: '', label: 'All Topics' },
  { value: 'sba-loans', label: 'SBA Loans & Programs' },
  { value: 'credit-challenges', label: 'Credit Challenges & Solutions' },
  { value: 'business-growth', label: 'Business Growth & Expansion' },
  { value: 'startup-funding', label: 'Startup & New Business Funding' },
  { value: 'equipment-financing', label: 'Equipment Financing' },
  { value: 'real-estate', label: 'Commercial Real Estate' },
  { value: 'working-capital', label: 'Working Capital & Cash Flow' },
  { value: 'industry-spotlight', label: 'Industry Spotlight' },
  { value: 'client-success', label: 'Client Success Stories' },
  { value: 'myths-debunked', label: 'Funding Myths Debunked' },
  { value: 'application-tips', label: 'Application Tips & Process' },
  { value: 'lender-relationships', label: 'Lender Relationships' },
  { value: 'entrepreneur-mindset', label: 'Entrepreneur Mindset' },
  { value: 'market-trends', label: 'Market Trends & Updates' },
  { value: 'personal-brand', label: 'Personal Brand & Authenticity' },
];

const ALL_PERSONAS: Person[] = ['Zac', 'Luke', 'Huge Capital'];
const ALL_PLATFORMS: Platform[] = ['LinkedIn', 'Instagram', 'Facebook', 'Twitter', 'Blog', 'Newsletter', 'Skool'];

export const ContentLibrary = () => {
  // Library state
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    byPersona: {} as Record<Person, number>,
    byPlatform: {} as Record<Platform, number>,
    scheduled: 0,
  });

  // Filter state
  const [selectedPersonas, setSelectedPersonas] = useState<Person[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Scheduling modal state
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [contentToSchedule, setContentToSchedule] = useState<GeneratedContent | null>(null);

  // Load library content
  const loadLibrary = () => {
    const items = getAllLibraryContent();
    const libraryStats = getLibraryStats();
    setLibraryItems(items);
    setStats(libraryStats);
    console.log(`[ContentLibrary] Loaded ${items.length} items`);
  };

  useEffect(() => {
    loadLibrary();

    // Refresh when window gains focus
    window.addEventListener('focus', loadLibrary);
    return () => window.removeEventListener('focus', loadLibrary);
  }, []);

  // Filtered items
  const filteredItems = useMemo(() => {
    let items = libraryItems;

    // Filter by personas
    if (selectedPersonas.length > 0) {
      items = items.filter(item => selectedPersonas.includes(item.persona));
    }

    // Filter by platforms
    if (selectedPlatforms.length > 0) {
      items = items.filter(item => selectedPlatforms.includes(item.platform));
    }

    // Filter by topic
    if (selectedTopic) {
      items = items.filter(item => item.topic === selectedTopic);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.content.toLowerCase().includes(query) ||
        item.hashtags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return items;
  }, [libraryItems, selectedPersonas, selectedPlatforms, selectedTopic, searchQuery]);

  // Toggle persona filter
  const togglePersona = (persona: Person) => {
    setSelectedPersonas(prev =>
      prev.includes(persona)
        ? prev.filter(p => p !== persona)
        : [...prev, persona]
    );
  };

  // Toggle platform filter
  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  // Copy content
  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete item
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      deleteFromLibrary(id);
      loadLibrary();
    }
  };

  // Schedule item
  const handleSchedule = (item: LibraryItem) => {
    // Convert LibraryItem to GeneratedContent format for the modal
    const content: GeneratedContent = {
      content: item.content,
      hashtags: item.hashtags,
      imagePrompt: item.imagePrompt,
      metadata: {
        persona: item.persona,
        platform: item.platform,
        format: 'single_post',
        generatedAt: item.createdAt,
        voiceScore: item.voiceScore,
        complianceScore: item.complianceScore,
      },
    };
    setContentToSchedule(content);
    setShowSchedulingModal(true);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedPersonas([]);
    setSelectedPlatforms([]);
    setSelectedTopic('');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedPersonas.length > 0 || selectedPlatforms.length > 0 || selectedTopic || searchQuery;

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center">
              <Library className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Content Library</h1>
              <p className="text-gray-400">
                {stats.total} total items • {stats.scheduled} scheduled
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadLibrary}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh library"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <Link
              to="/content"
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
            >
              Generate New Content
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {ALL_PERSONAS.map(persona => (
            <div
              key={persona}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: PERSON_COLORS[persona] }}
                />
                <span className="text-sm text-gray-400">{persona}</span>
              </div>
              <p className="text-2xl font-bold text-gray-100">
                {stats.byPersona[persona] || 0}
              </p>
            </div>
          ))}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-400">Scheduled</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.scheduled}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-brand-500" />
              <span className="font-medium text-gray-200">Filters</span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 bg-brand-500/20 text-brand-500 rounded-full text-xs">
                  Active
                </span>
              )}
            </div>
            {showFilters ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showFilters && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-700/50 pt-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-gray-200 placeholder-gray-500 focus:border-brand-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Persona Toggles */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Personas</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PERSONAS.map(persona => {
                    const isSelected = selectedPersonas.includes(persona);
                    return (
                      <button
                        key={persona}
                        onClick={() => togglePersona(persona)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                          isSelected
                            ? 'border-transparent text-white'
                            : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                        style={{
                          backgroundColor: isSelected ? PERSON_COLORS[persona] : 'transparent',
                        }}
                      >
                        {persona}
                        {isSelected && (
                          <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                            {stats.byPersona[persona] || 0}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Platform Filters */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PLATFORMS.map(platform => {
                    const isSelected = selectedPlatforms.includes(platform);
                    return (
                      <button
                        key={platform}
                        onClick={() => togglePlatform(platform)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                          isSelected
                            ? 'border-transparent text-white'
                            : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                        style={{
                          backgroundColor: isSelected ? PLATFORM_COLORS[platform] : 'transparent',
                        }}
                      >
                        {platform}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic Dropdown */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full md:w-64 bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 appearance-none cursor-pointer"
                >
                  {TOPIC_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-brand-500 hover:text-brand-400 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400">
            Showing <span className="text-gray-200 font-medium">{filteredItems.length}</span> of {libraryItems.length} items
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-brand-500/20 text-brand-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-brand-500/20 text-brand-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Grid/List */}
        {filteredItems.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-12 text-center">
            <Library className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No content found</h3>
            <p className="text-gray-500 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query'
                : 'Generate some content to get started'
              }
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/content"
                className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                Generate Content
              </Link>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredItems.map(item => {
              const isExpanded = expandedItem === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 border-b border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: PERSON_COLORS[item.persona] }}
                        >
                          {item.persona.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{item.persona}</p>
                          <p className="text-xs text-gray-500">{item.platform}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.isScheduled && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                            Scheduled
                          </span>
                        )}
                        <span
                          className="px-2 py-0.5 rounded text-xs text-white"
                          style={{ backgroundColor: PLATFORM_COLORS[item.platform] }}
                        >
                          {item.platform}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Content Preview */}
                  <div className="p-4">
                    <p className={`text-gray-300 text-sm ${isExpanded ? '' : 'line-clamp-4'}`}>
                      {item.content}
                    </p>
                    {item.content.length > 200 && (
                      <button
                        onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                        className="text-brand-500 text-xs mt-2 hover:underline"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}

                    {/* Hashtags */}
                    {item.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {item.hashtags.slice(0, 5).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400">
                            {tag}
                          </span>
                        ))}
                        {item.hashtags.length > 5 && (
                          <span className="text-xs text-gray-500">+{item.hashtags.length - 5} more</span>
                        )}
                      </div>
                    )}

                    {/* Scores */}
                    {(item.voiceScore || item.complianceScore) && (
                      <div className="flex gap-4 mt-3">
                        {item.voiceScore && (
                          <div className="text-xs">
                            <span className="text-gray-500">Voice: </span>
                            <span className={item.voiceScore >= 85 ? 'text-green-400' : 'text-yellow-400'}>
                              {item.voiceScore}%
                            </span>
                          </div>
                        )}
                        {item.complianceScore && (
                          <div className="text-xs">
                            <span className="text-gray-500">Compliance: </span>
                            <span className={item.complianceScore >= 95 ? 'text-green-400' : 'text-red-400'}>
                              {item.complianceScore}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      onClick={() => handleCopy(item.content, item.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleSchedule(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg transition-colors"
                      style={{ backgroundColor: PERSON_COLORS[item.persona] }}
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
          loadLibrary(); // Refresh to update scheduled status
        }}
      />
    </div>
  );
};

export default ContentLibrary;

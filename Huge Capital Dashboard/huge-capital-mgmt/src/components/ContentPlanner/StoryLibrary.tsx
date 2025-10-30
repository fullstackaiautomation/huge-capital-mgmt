import { useState } from 'react';
import type { Story, StoryType, FundingType, SourceType } from '../../types/story';
import { BookOpen, Edit2, Trash2, Check, Calendar, Tag, DollarSign, Briefcase, FileText, CheckCircle, Clock, Mic, FileEdit, Search, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import { VoiceMemoUpload } from './VoiceMemoUpload';

interface StoryLibraryProps {
  stories: Story[];
  onAddStory: (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateStory: (id: string, story: Partial<Story>) => Promise<void>;
  onDeleteStory: (id: string) => Promise<void>;
  onApproveStory: (id: string) => Promise<void>;
}

const storyTypes: { value: StoryType; label: string }[] = [
  { value: 'funding_success', label: 'Funding Success' },
  { value: 'client_challenge', label: 'Client Challenge' },
  { value: 'industry_insight', label: 'Industry Insight' },
  { value: 'personal_experience', label: 'Personal Experience' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'other', label: 'Other' },
];

const fundingTypes: { value: FundingType; label: string }[] = [
  { value: 'SBA 7(a)', label: 'SBA 7(a)' },
  { value: 'SBA 504', label: 'SBA 504' },
  { value: 'Construction Loan', label: 'Construction Loan' },
  { value: 'Equipment Financing', label: 'Equipment Financing' },
  { value: 'Working Capital', label: 'Working Capital' },
  { value: 'Commercial Real Estate', label: 'Commercial Real Estate' },
  { value: 'Business Acquisition', label: 'Business Acquisition' },
  { value: 'Other', label: 'Other' },
];

const sourceTypes: { value: SourceType; label: string }[] = [
  { value: 'voice_memo', label: 'Voice Memo' },
  { value: 'slack_message', label: 'Slack Message' },
  { value: 'call_transcript', label: 'Call Transcript' },
  { value: 'manual_entry', label: 'Manual Entry' },
  { value: 'other', label: 'Other' },
];

const loanAmountRanges = [
  '< $100k',
  '$100k - $500k',
  '$500k - $1M',
  '$1M - $5M',
  '$5M+',
];

type AddMode = 'none' | 'manual' | 'voice';

export const StoryLibrary = ({
  stories,
  onAddStory,
  onUpdateStory,
  onDeleteStory,
  onApproveStory,
}: StoryLibraryProps) => {
  const [addMode, setAddMode] = useState<AddMode>('none');
  const [editingStory, setEditingStory] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<'all' | 'Zac' | 'Luke' | 'Huge Capital'>('all');
  const [showOnlyUnapproved, setShowOnlyUnapproved] = useState(false);
  const [voiceUploadPerson] = useState<'Zac' | 'Luke' | 'Huge Capital'>('Zac');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFundingType, setSelectedFundingType] = useState<'all' | FundingType>('all');
  const [selectedStoryType, setSelectedStoryType] = useState<'all' | StoryType>('all');
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    personName: 'Zac',
    title: '',
    transcript: '',
    storyType: 'funding_success' as StoryType,
    fundingType: 'SBA 7(a)' as FundingType,
    themes: '',
    keyTakeaways: '',
    clientIndustry: '',
    loanAmountRange: '',
    sourceType: 'manual_entry' as SourceType,
    sourceUrl: '',
    recordedDate: '',
    usageNotes: '',
  });

  const filteredStories = stories.filter((story) => {
    // Person filter
    if (selectedPerson !== 'all' && story.personName !== selectedPerson) return false;

    // Approval filter
    if (showOnlyUnapproved && story.isApproved) return false;

    // Funding type filter
    if (selectedFundingType !== 'all' && story.fundingType !== selectedFundingType) return false;

    // Story type filter
    if (selectedStoryType !== 'all' && story.storyType !== selectedStoryType) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = story.title.toLowerCase().includes(query);
      const matchesTranscript = story.transcript.toLowerCase().includes(query);
      const matchesThemes = story.themes?.some(t => t.toLowerCase().includes(query));
      const matchesTakeaways = story.keyTakeaways?.some(t => t.toLowerCase().includes(query));
      const matchesIndustry = story.clientIndustry?.toLowerCase().includes(query);

      if (!matchesTitle && !matchesTranscript && !matchesThemes && !matchesTakeaways && !matchesIndustry) {
        return false;
      }
    }

    return true;
  });

  const toggleStoryExpansion = (id: string) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedStories(newExpanded);
  };

  const toggleStorySelection = (id: string) => {
    const newSelected = new Set(selectedStories);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStories(newSelected);
  };

  const selectAllStories = () => {
    if (selectedStories.size === filteredStories.length) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(new Set(filteredStories.map(s => s.id)));
    }
  };

  const bulkApproveStories = async () => {
    const storiesToApprove = Array.from(selectedStories);
    for (const id of storiesToApprove) {
      await onApproveStory(id);
    }
    setSelectedStories(new Set());
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.transcript.trim()) {
      alert('Title and transcript are required');
      return;
    }

    const storyData = {
      personName: formData.personName,
      title: formData.title.trim(),
      transcript: formData.transcript.trim(),
      storyType: formData.storyType,
      fundingType: formData.fundingType || undefined,
      themes: formData.themes ? formData.themes.split(',').map(t => t.trim()) : [],
      keyTakeaways: formData.keyTakeaways ? formData.keyTakeaways.split(',').map(t => t.trim()) : [],
      clientIndustry: formData.clientIndustry || undefined,
      loanAmountRange: formData.loanAmountRange || undefined,
      sourceType: formData.sourceType,
      sourceUrl: formData.sourceUrl || undefined,
      recordedDate: formData.recordedDate ? new Date(formData.recordedDate) : undefined,
      usageNotes: formData.usageNotes || undefined,
      isApproved: false,
    };

    if (editingStory) {
      await onUpdateStory(editingStory, storyData);
      setEditingStory(null);
    } else {
      await onAddStory(storyData);
    }
    setAddMode('none');

    // Reset form
    setFormData({
      personName: 'Zac',
      title: '',
      transcript: '',
      storyType: 'funding_success',
      fundingType: 'SBA 7(a)',
      themes: '',
      keyTakeaways: '',
      clientIndustry: '',
      loanAmountRange: '',
      sourceType: 'manual_entry',
      sourceUrl: '',
      recordedDate: '',
      usageNotes: '',
    });
  };

  const handleEdit = (story: Story) => {
    setEditingStory(story.id);
    setFormData({
      personName: story.personName,
      title: story.title,
      transcript: story.transcript,
      storyType: story.storyType || 'funding_success',
      fundingType: story.fundingType || 'SBA 7(a)',
      themes: story.themes?.join(', ') || '',
      keyTakeaways: story.keyTakeaways?.join(', ') || '',
      clientIndustry: story.clientIndustry || '',
      loanAmountRange: story.loanAmountRange || '',
      sourceType: story.sourceType || 'manual_entry',
      sourceUrl: story.sourceUrl || '',
      recordedDate: story.recordedDate ? new Date(story.recordedDate).toISOString().split('T')[0] : '',
      usageNotes: story.usageNotes || '',
    });
    setAddMode('manual');
  };

  const handleCancel = () => {
    setAddMode('none');
    setEditingStory(null);
    setFormData({
      personName: 'Zac',
      title: '',
      transcript: '',
      storyType: 'funding_success',
      fundingType: 'SBA 7(a)',
      themes: '',
      keyTakeaways: '',
      clientIndustry: '',
      loanAmountRange: '',
      sourceType: 'manual_entry',
      sourceUrl: '',
      recordedDate: '',
      usageNotes: '',
    });
  };

  const handleVoiceStoryExtracted = (storyData: Partial<Story>) => {
    // Pre-fill the form with extracted data
    setFormData({
      personName: storyData.personName || 'Zac',
      title: storyData.title || '',
      transcript: storyData.transcript || '',
      storyType: storyData.storyType || 'funding_success',
      fundingType: storyData.fundingType || 'SBA 7(a)',
      themes: storyData.themes?.join(', ') || '',
      keyTakeaways: storyData.keyTakeaways?.join(', ') || '',
      clientIndustry: storyData.clientIndustry || '',
      loanAmountRange: storyData.loanAmountRange || '',
      sourceType: storyData.sourceType || 'voice_memo',
      sourceUrl: storyData.sourceUrl || '',
      recordedDate: storyData.recordedDate ? new Date(storyData.recordedDate).toISOString().split('T')[0] : '',
      usageNotes: storyData.usageNotes || '',
    });
    // Switch to manual mode so user can review and edit
    setAddMode('manual');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-purple-500" />
          <h2 className="text-2xl font-bold text-gray-100">Story Library</h2>
          <span className="px-3 py-1 text-sm bg-purple-500/20 text-purple-300 rounded-full">
            {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAddMode('voice')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors shadow-lg"
          >
            <Mic className="w-5 h-5" />
            Upload Voice Memo
          </button>
          <button
            onClick={() => setAddMode('manual')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <FileEdit className="w-5 h-5" />
            Manual Entry
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 bg-gray-800/50 border-b border-gray-700 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories by title, content, themes, or industry..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Person Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Person:</span>
            <div className="flex gap-2">
              {(['all', 'Zac', 'Luke', 'Huge Capital'] as const).map((person) => (
                <button
                  key={person}
                  onClick={() => setSelectedPerson(person)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedPerson === person
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {person === 'all' ? 'All' : person}
                </button>
              ))}
            </div>
          </div>

          {/* Story Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Type:</span>
            <select
              value={selectedStoryType}
              onChange={(e) => setSelectedStoryType(e.target.value as 'all' | StoryType)}
              className="px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded-lg text-gray-300"
            >
              <option value="all">All Types</option>
              {storyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Funding Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Funding:</span>
            <select
              value={selectedFundingType}
              onChange={(e) => setSelectedFundingType(e.target.value as 'all' | FundingType)}
              className="px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded-lg text-gray-300"
            >
              <option value="all">All Funding Types</option>
              {fundingTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Approval Filter */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="unapproved"
              checked={showOnlyUnapproved}
              onChange={(e) => setShowOnlyUnapproved(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="unapproved" className="text-sm text-gray-400 cursor-pointer">
              Unapproved only
            </label>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedStories.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-purple-300">
                {selectedStories.size} {selectedStories.size === 1 ? 'story' : 'stories'} selected
              </span>
              <button
                onClick={() => setSelectedStories(new Set())}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={bulkApproveStories}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              >
                <Check className="w-4 h-4" />
                Approve Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {addMode === 'voice' ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
            <VoiceMemoUpload
              person={voiceUploadPerson}
              onStoryExtracted={handleVoiceStoryExtracted}
              onCancel={handleCancel}
            />
          </div>
        ) : addMode === 'manual' ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-100 mb-4">
              {editingStory ? 'Edit Story' : 'Add New Story'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Person */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Person *</label>
                <select
                  value={formData.personName}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                >
                  <option value="Zac">Zac</option>
                  <option value="Luke">Luke</option>
                  <option value="Huge Capital">Huge Capital</option>
                </select>
              </div>

              {/* Story Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Story Type</label>
                <select
                  value={formData.storyType}
                  onChange={(e) => setFormData({ ...formData, storyType: e.target.value as StoryType })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                >
                  {storyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief title for this story"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>

              {/* Transcript */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Transcript / Story Content *</label>
                <textarea
                  value={formData.transcript}
                  onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                  placeholder="Paste transcript or type the story content here..."
                  rows={8}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>

              {/* Funding Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Funding Type</label>
                <select
                  value={formData.fundingType}
                  onChange={(e) => setFormData({ ...formData, fundingType: e.target.value as FundingType })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                >
                  {fundingTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Loan Amount</label>
                <select
                  value={formData.loanAmountRange}
                  onChange={(e) => setFormData({ ...formData, loanAmountRange: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                >
                  <option value="">Not specified</option>
                  {loanAmountRanges.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Client Industry</label>
                <input
                  type="text"
                  value={formData.clientIndustry}
                  onChange={(e) => setFormData({ ...formData, clientIndustry: e.target.value })}
                  placeholder="e.g., Construction, Healthcare"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>

              {/* Source Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Source Type</label>
                <select
                  value={formData.sourceType}
                  onChange={(e) => setFormData({ ...formData, sourceType: e.target.value as SourceType })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                >
                  {sourceTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Themes */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Themes (comma-separated)</label>
                <input
                  type="text"
                  value={formData.themes}
                  onChange={(e) => setFormData({ ...formData, themes: e.target.value })}
                  placeholder="e.g., client transformation, speed to close, overcoming obstacles"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>

              {/* Key Takeaways */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Key Takeaways (comma-separated)</label>
                <input
                  type="text"
                  value={formData.keyTakeaways}
                  onChange={(e) => setFormData({ ...formData, keyTakeaways: e.target.value })}
                  placeholder="e.g., Closed in 3 weeks, Saved client $50k, Overcame credit challenges"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>

              {/* Source URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Source URL</label>
                <input
                  type="text"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  placeholder="Link to Slack message, recording, etc."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>

              {/* Recorded Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Recorded Date</label>
                <input
                  type="date"
                  value={formData.recordedDate}
                  onChange={(e) => setFormData({ ...formData, recordedDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                />
              </div>

              {/* Usage Notes */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Usage Notes</label>
                <textarea
                  value={formData.usageNotes}
                  onChange={(e) => setFormData({ ...formData, usageNotes: e.target.value })}
                  placeholder="Any special instructions for using this story in content..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {editingStory ? 'Update Story' : 'Save Story'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Story List */}
        <div className="space-y-4">
          {/* Select All */}
          {filteredStories.length > 0 && (
            <div className="flex items-center gap-2 px-2">
              <button
                onClick={selectAllStories}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {selectedStories.size === filteredStories.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Select all {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
              </button>
            </div>
          )}

          {filteredStories.map((story) => (
            <div
              key={story.id}
              className={`bg-gray-800 rounded-xl border p-6 ${
                story.isApproved ? 'border-green-700/50' : 'border-gray-700'
              } ${selectedStories.has(story.id) ? 'ring-2 ring-purple-500' : ''}`}
            >
              <div className="flex items-start gap-4 mb-4">
                {/* Selection Checkbox */}
                <button
                  onClick={() => toggleStorySelection(story.id)}
                  className="mt-1 text-gray-400 hover:text-purple-400 transition-colors"
                >
                  {selectedStories.has(story.id) ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-100">{story.title}</h3>
                    {story.isApproved ? (
                      <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Approved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full">
                        <Clock className="w-3 h-3" />
                        Pending Review
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <span className="font-medium text-purple-400">{story.personName}</span>
                    {story.storyType && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {storyTypes.find((t) => t.value === story.storyType)?.label}
                      </span>
                    )}
                    {story.fundingType && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {story.fundingType}
                      </span>
                    )}
                    {story.loanAmountRange && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {story.loanAmountRange}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!story.isApproved && (
                    <button
                      onClick={() => onApproveStory(story.id)}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      title="Approve for use"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(story)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this story?')) {
                        onDeleteStory(story.id);
                      }
                    }}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className={`text-gray-300 whitespace-pre-wrap ${expandedStories.has(story.id) ? '' : 'line-clamp-4'}`}>
                  {story.transcript}
                </p>
                {story.transcript.length > 300 && (
                  <button
                    onClick={() => toggleStoryExpansion(story.id)}
                    className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 mt-2 transition-colors"
                  >
                    {expandedStories.has(story.id) ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Read full story
                      </>
                    )}
                  </button>
                )}
              </div>

              {(story.themes && story.themes.length > 0) && (
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <div className="flex flex-wrap gap-2">
                    {story.themes.map((theme, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(story.keyTakeaways && story.keyTakeaways.length > 0) && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Key Takeaways:</div>
                    <div className="flex flex-wrap gap-2">
                      {story.keyTakeaways.map((takeaway, index) => (
                        <span
                          key={index}
                          className="text-sm text-gray-300"
                        >
                          • {takeaway}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {story.recordedDate && (
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  Recorded: {new Date(story.recordedDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}

          {filteredStories.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No stories found</p>
              <p className="text-gray-500 text-sm mt-2">
                {showOnlyUnapproved
                  ? 'No unapproved stories'
                  : 'Add your first story to get started'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

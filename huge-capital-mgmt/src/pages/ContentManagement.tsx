import { useState } from 'react';
import {
  FileText,
  Calendar,
  BarChart3,
  Target,
  MessageSquare,
  TrendingUp,
  Clock,
  BookOpen,
  User,
  PenTool,
  Sparkles,
} from 'lucide-react';
import { ContentEditor } from '../components/ContentPlanner/ContentEditor';
import { ContentCalendar } from '../components/ContentPlanner/ContentCalendar';
import { StoryLibrary } from '../components/ContentPlanner/StoryLibrary';
import { BatchContentGenerator } from '../components/ContentPlanner/BatchContentGenerator';
import type { GeneratedContent } from '../services/skillsRunner';
import { useContentPlanner } from '../hooks/useContentPlanner';
import type { Person, Platform, ContentPost } from '../types/content';
import { PERSON_COLORS, CONTENT_PILLARS } from '../types/content';

type ViewMode = 'editor' | 'calendar' | 'analytics' | 'goals' | 'stories' | 'profile' | 'batch';

export const ContentManagement = () => {
  const {
    posts,
    profiles,
    tags,
    stories,
    loading,
    savePost,
    approvePost,
    getPostingStats,
    addStory,
    updateStory,
    deleteStory,
    approveStory,
  } = useContentPlanner();

  const [selectedPerson, setSelectedPerson] = useState<Person>('Zac');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('LinkedIn');
  const [currentView, setCurrentView] = useState<ViewMode>('editor');
  const [selectedPost, setSelectedPost] = useState<Partial<ContentPost>>({});

  // Get content pillars for selected person
  const contentPillars = CONTENT_PILLARS[selectedPerson].map(p => p.name);

  // Get profile data for selected person
  const currentProfile = profiles.find(p => p.personName === selectedPerson);

  // Get posting stats for current selection
  const weekStats = getPostingStats(selectedPerson, selectedPlatform, 'week');
  const monthStats = getPostingStats(selectedPerson, selectedPlatform, 'month');

  // Handle post selection from calendar
  const handlePostClick = (post: ContentPost) => {
    setSelectedPost(post);
    setSelectedPerson(post.personName);
    setSelectedPlatform(post.platform);
    setCurrentView('editor');
  };

  // Handle date click from calendar
  const handleDateClick = (date: Date) => {
    setSelectedPost({
      scheduledFor: date.toISOString(),
      personName: selectedPerson,
      platform: selectedPlatform,
      status: 'draft',
    });
    setCurrentView('editor');
  };

  // Handle save
  const handleSave = async (post: Partial<ContentPost>) => {
    await savePost({
      ...post,
      personName: selectedPerson,
      platform: selectedPlatform,
    });
  };

  // Handle schedule
  const handleSchedule = async (post: Partial<ContentPost>) => {
    await savePost({
      ...post,
      personName: selectedPerson,
      platform: selectedPlatform,
      status: 'scheduled',
    });
  };

  // Handle approve
  const handleApprove = async (post: Partial<ContentPost>) => {
    if (post.id) {
      await approvePost(post.id);
    }
  };

  // Handle taking generated content to the editor
  const handleTakeToEditor = (content: GeneratedContent) => {
    setSelectedPost({
      content: content.content,
      personName: content.metadata.persona,
      platform: content.metadata.platform,
      tags: content.hashtags,
      status: 'draft',
    });
    setSelectedPerson(content.metadata.persona);
    setSelectedPlatform(content.metadata.platform);
    setCurrentView('editor');
  };

  // Handle adding generated content to calendar
  const handleAddToCalendar = async (content: GeneratedContent) => {
    // Default to scheduling for tomorrow at 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    await savePost({
      content: content.content,
      personName: content.metadata.persona,
      platform: content.metadata.platform,
      tags: content.hashtags,
      scheduledFor: tomorrow.toISOString(),
      status: 'scheduled',
    });

    // Switch to calendar view to show the scheduled post
    setCurrentView('calendar');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading content planner...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-primary">Content Planner</h1>

        {/* Person Selector - Compact in Header */}
        <div className="flex items-center gap-3">
          {(['Zac', 'Luke', 'Huge Capital'] as Person[]).map((person) => {
            const isSelected = selectedPerson === person;
            return (
              <button
                key={person}
                onClick={() => setSelectedPerson(person)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'text-white shadow-lg'
                    : 'bg-gray-800/40 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-gray-700/50'
                }`}
                style={{
                  backgroundColor: isSelected ? PERSON_COLORS[person] : undefined,
                  borderColor: isSelected ? PERSON_COLORS[person] : undefined,
                  boxShadow: isSelected
                    ? `0 4px 16px ${PERSON_COLORS[person]}50`
                    : undefined,
                }}
              >
                {person.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-end gap-6">
        {/* View Mode Selector - Sleek Segmented Control */}
        <div className="flex gap-1 bg-gray-900/60 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-700/40 shadow-xl">
          <button
            onClick={() => setCurrentView('batch')}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
              currentView === 'batch'
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'text-purple-400 hover:text-white hover:bg-purple-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Generate 10+</span>
          </button>
          <button
            onClick={() => setCurrentView('editor')}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
              currentView === 'editor'
                ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 scale-105'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span className="text-sm font-semibold">Editor</span>
          </button>
          <button
            onClick={() => setCurrentView('calendar')}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
              currentView === 'calendar'
                ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 scale-105'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-semibold">Calendar</span>
          </button>
          <button
            onClick={() => setCurrentView('stories')}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
              currentView === 'stories'
                ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 scale-105'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-semibold">Stories</span>
          </button>
          <button
            onClick={() => setCurrentView('profile')}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
              currentView === 'profile'
                ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 scale-105'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-semibold">Profile</span>
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
              currentView === 'analytics'
                ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 scale-105'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-semibold">Analytics</span>
          </button>
          <button
            onClick={() => setCurrentView('goals')}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
              currentView === 'goals'
                ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 scale-105'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Target className="w-4 h-4" />
            <span className="text-sm font-semibold">Goals</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-blue-900/20 rounded-lg shadow-xl border border-blue-700/30 p-6 hover:border-blue-500/50 transition-all backdrop-blur-sm">
        {currentView === 'batch' && (
          <BatchContentGenerator
            selectedPerson={selectedPerson}
            onTakeToEditor={handleTakeToEditor}
            onAddToCalendar={handleAddToCalendar}
          />
        )}

        {currentView === 'editor' && (
          <ContentEditor
            post={selectedPost}
            platform={selectedPlatform}
            person={selectedPerson}
            profile={currentProfile}
            stories={stories}
            onSave={handleSave}
            onSchedule={handleSchedule}
            onApprove={handleApprove}
            tags={tags.map(t => t.tagName)}
            pillars={contentPillars}
          />
        )}

        {currentView === 'calendar' && (
          <ContentCalendar
            posts={posts}
            onPostClick={handlePostClick}
            onDateClick={handleDateClick}
            selectedPerson={selectedPerson}
            selectedPlatform={selectedPlatform}
          />
        )}

        {currentView === 'stories' && (
          <StoryLibrary
            stories={stories}
            onAddStory={async (story) => { await addStory(story); }}
            onUpdateStory={async (id, story) => { await updateStory(id, story); }}
            onDeleteStory={async (id) => { await deleteStory(id); }}
            onApproveStory={async (id) => { await approveStory(id); }}
          />
        )}

        {currentView === 'profile' && currentProfile && (
          <div className="space-y-6">
            <div
              className="rounded-lg shadow-xl p-6 border-2"
              style={{
                backgroundColor: `${PERSON_COLORS[selectedPerson]}20`,
                borderColor: `${PERSON_COLORS[selectedPerson]}40`,
              }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {selectedPerson} Content Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Content Pillars */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-100 mb-2">Content Pillars</h3>
                  <ul className="space-y-1">
                    {CONTENT_PILLARS[selectedPerson].map((pillar) => (
                      <li key={pillar.name} className="text-sm text-gray-300">
                        • {pillar.name} ({pillar.percentage}%)
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Brand Voice */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-100 mb-2">Brand Voice</h3>
                  <ul className="space-y-1">
                    {currentProfile.brandVoice.slice(0, 4).map((voice) => (
                      <li key={voice} className="text-sm text-gray-300">
                        • {voice}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Posting Stats */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-100 mb-2">Posting Frequency</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">This Week</span>
                      <span className="text-sm font-bold text-brand-500">
                        {weekStats.actual} / {weekStats.target}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-brand-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(weekStats.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-400">This Month</span>
                      <span className="text-sm font-bold text-brand-500">
                        {monthStats.actual} / {monthStats.target}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-brand-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(monthStats.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'analytics' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                Analytics Dashboard
              </h3>
              <p className="text-gray-400">
                Track engagement, reach, and performance across all platforms
              </p>
              <p className="text-gray-500 text-sm mt-4">Coming soon...</p>
            </div>
          </div>
        )}

        {currentView === 'goals' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                Posting Goals & Frequency
              </h3>
              <p className="text-gray-400">
                Set and track your content posting targets
              </p>
              <p className="text-gray-500 text-sm mt-4">Coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-900/20 rounded-lg shadow-xl border border-blue-700/30 p-4 hover:border-blue-500/50 transition-all backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm">Scheduled Posts</p>
              <p className="text-2xl font-bold text-gray-100">
                {posts.filter(p => p.status === 'scheduled').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-blue-900/20 rounded-lg shadow-xl border border-blue-700/30 p-4 hover:border-blue-500/50 transition-all backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm">Published Today</p>
              <p className="text-2xl font-bold text-gray-100">
                {
                  posts.filter(
                    p =>
                      p.status === 'published' &&
                      p.publishedAt &&
                      new Date(p.publishedAt).toDateString() === new Date().toDateString()
                  ).length
                }
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-blue-900/20 rounded-lg shadow-xl border border-blue-700/30 p-4 hover:border-blue-500/50 transition-all backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm">Draft Posts</p>
              <p className="text-2xl font-bold text-gray-100">
                {posts.filter(p => p.status === 'draft').length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-blue-900/20 rounded-lg shadow-xl border border-blue-700/30 p-4 hover:border-blue-500/50 transition-all backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-100">--</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
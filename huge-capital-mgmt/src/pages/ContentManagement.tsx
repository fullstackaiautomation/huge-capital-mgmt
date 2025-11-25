import { useState } from 'react';
import {
  Facebook,
  Instagram,
  Linkedin,
  FileText,
  Twitter,
  Users,
  Mail,
  Calendar,
  BarChart3,
  Target,
  MessageSquare,
  TrendingUp,
  Clock,
  BookOpen,
  User,
  PenTool,
} from 'lucide-react';
import { ContentEditor } from '../components/ContentPlanner/ContentEditor';
import { ContentCalendar } from '../components/ContentPlanner/ContentCalendar';
import { StoryLibrary } from '../components/ContentPlanner/StoryLibrary';
import { useContentPlanner } from '../hooks/useContentPlanner';
import type { Person, Platform, ContentPost } from '../types/content';
import { PLATFORM_COLORS, PERSON_COLORS, CONTENT_PILLARS } from '../types/content';

type ViewMode = 'editor' | 'calendar' | 'analytics' | 'goals' | 'stories' | 'profile';

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

  // Platform configuration for each person
  const getPlatformsForPerson = (person: Person) => {
    const allPlatforms = [
      { name: 'LinkedIn' as Platform, icon: Linkedin },
      { name: 'Twitter' as Platform, icon: Twitter },
      { name: 'Facebook' as Platform, icon: Facebook },
      { name: 'Instagram' as Platform, icon: Instagram },
      { name: 'Skool' as Platform, icon: Users },
      { name: 'Blog' as Platform, icon: FileText },
      { name: 'Newsletter' as Platform, icon: Mail },
      { name: 'ISO Newsletter' as Platform, icon: Mail },
    ];

    if (person === 'Zac') {
      return allPlatforms.filter(p =>
        ['LinkedIn', 'Twitter', 'Facebook', 'Instagram'].includes(p.name)
      );
    }
    if (person === 'Luke') {
      return allPlatforms.filter(p =>
        ['LinkedIn', 'Facebook', 'Twitter', 'Instagram', 'Skool'].includes(p.name)
      );
    }
    if (person === 'Huge Capital') {
      return allPlatforms.filter(p =>
        ['Blog', 'Newsletter', 'ISO Newsletter'].includes(p.name)
      );
    }
    return allPlatforms;
  };

  const platforms = getPlatformsForPerson(selectedPerson);

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

      {/* View Toggle */}
      <div className="flex items-center justify-between gap-6">
        {/* Platform Selector - Modern Pills */}
        <div className="flex gap-2 flex-wrap">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatform === platform.name;
            return (
              <button
                key={platform.name}
                onClick={() => setSelectedPlatform(platform.name)}
                className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-gray-800/40 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-gray-700/50'
                }`}
                style={{
                  backgroundColor: isSelected ? PLATFORM_COLORS[platform.name] : undefined,
                  boxShadow: isSelected ? `0 8px 24px ${PLATFORM_COLORS[platform.name]}50, 0 0 0 1px ${PLATFORM_COLORS[platform.name]}30` : undefined,
                }}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-sm font-semibold tracking-wide">{platform.name}</span>
                {isSelected && (
                  <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      background: `radial-gradient(circle at center, ${PLATFORM_COLORS[platform.name]}20 0%, transparent 70%)`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode Selector - Sleek Segmented Control */}
        <div className="flex gap-1 bg-gray-900/60 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-700/40 shadow-xl">
          <button
            onClick={() => setCurrentView('editor')}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
              currentView === 'editor'
                ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 scale-105'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span className="text-sm font-semibold">Planner</span>
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
            <span className="text-sm font-semibold">Scheduler</span>
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
            <span className="text-sm font-semibold">Vault</span>
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-blue-900/20 rounded-lg shadow-xl border border-blue-700/30 p-6 hover:border-blue-500/50 transition-all backdrop-blur-sm">
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
            {/* Profile Header */}
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

              {/* Row 1: Content Pillars, Brand Voice, Posting Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Content Pillars */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-100 mb-3">Content Pillars</h3>
                  <ul className="space-y-2">
                    {CONTENT_PILLARS[selectedPerson].map((pillar) => (
                      <li key={pillar.name} className="text-sm text-gray-300 flex justify-between">
                        <span>• {pillar.name}</span>
                        <span className="text-brand-400 font-medium">{pillar.percentage}%</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Brand Voice */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-100 mb-3">Brand Voice</h3>
                  <ul className="space-y-2">
                    {currentProfile.brandVoice.map((voice) => (
                      <li key={voice} className="text-sm text-gray-300">
                        • {voice}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Posting Frequency */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-100 mb-3">Posting Frequency</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
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
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
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

              {/* Row 2: Key Messaging, AI Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key Messaging */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-100 mb-3">Key Messaging</h3>
                  {currentProfile.keyMessaging && currentProfile.keyMessaging.length > 0 ? (
                    <ul className="space-y-2">
                      {currentProfile.keyMessaging.map((message, idx) => (
                        <li key={idx} className="text-sm text-gray-300">
                          • {message}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No key messaging defined yet</p>
                  )}
                </div>

                {/* AI Context */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-100 mb-3">AI Learning Context</h3>
                  <div className="space-y-3">
                    {currentProfile.aiContext?.preferredStyle && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Preferred Style</span>
                        <p className="text-sm text-gray-300">{currentProfile.aiContext.preferredStyle}</p>
                      </div>
                    )}
                    {currentProfile.aiContext?.bestPerformingTopics && currentProfile.aiContext.bestPerformingTopics.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Best Performing Topics</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentProfile.aiContext.bestPerformingTopics.map((topic, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-brand-500/20 text-brand-400 text-xs rounded-full">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentProfile.aiContext?.commonEdits && currentProfile.aiContext.commonEdits.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Common Edits</span>
                        <ul className="mt-1 space-y-1">
                          {currentProfile.aiContext.commonEdits.slice(0, 3).map((edit, idx) => (
                            <li key={idx} className="text-sm text-gray-400">• {edit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!currentProfile.aiContext?.preferredStyle &&
                     !currentProfile.aiContext?.bestPerformingTopics?.length &&
                     !currentProfile.aiContext?.commonEdits?.length && (
                      <p className="text-sm text-gray-500 italic">AI will learn your preferences over time</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Goals Section */}
            <div className="bg-gray-800/30 rounded-lg shadow-xl p-6 border border-gray-700/50">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-brand-500" />
                <h2 className="text-xl font-bold text-white">Posting Goals & Frequency</h2>
              </div>
              <div className="text-center py-8">
                <p className="text-gray-400">
                  Set and track your content posting targets
                </p>
                <p className="text-gray-500 text-sm mt-4">Coming soon...</p>
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
      </div>
    </div>
  );
};
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
      {/* Header with Title and Person Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
          <FileText className="w-8 h-8 text-brand-500" />
          Content Planner
        </h1>

        {/* Person Selector - Prominent Boxes */}
        <div className="flex gap-3">
          {(['Zac', 'Luke', 'Huge Capital'] as Person[]).map((person) => (
            <button
              key={person}
              onClick={() => setSelectedPerson(person)}
              className={`px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 border-2 ${
                selectedPerson === person
                  ? 'text-white shadow-2xl'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border-gray-700'
              }`}
              style={{
                backgroundColor:
                  selectedPerson === person ? PERSON_COLORS[person] : undefined,
                borderColor:
                  selectedPerson === person ? PERSON_COLORS[person] : undefined,
                boxShadow:
                  selectedPerson === person
                    ? `0 15px 35px ${PERSON_COLORS[person]}60`
                    : undefined,
              }}
            >
              {person}
            </button>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        {/* Platform Selector */}
        <div className="flex gap-2">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <button
                key={platform.name}
                onClick={() => setSelectedPlatform(platform.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  selectedPlatform === platform.name
                    ? 'text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
                style={{
                  backgroundColor:
                    selectedPlatform === platform.name
                      ? PLATFORM_COLORS[platform.name]
                      : undefined,
                  boxShadow:
                    selectedPlatform === platform.name
                      ? `0 5px 15px ${PLATFORM_COLORS[platform.name]}40`
                      : undefined,
                }}
              >
                <Icon className="w-4 h-4" />
                {platform.name}
              </button>
            );
          })}
        </div>

        {/* View Mode Selector */}
        <div className="flex gap-2 bg-gray-800/50 p-1 rounded-lg">
          <button
            onClick={() => setCurrentView('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'editor'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Editor
          </button>
          <button
            onClick={() => setCurrentView('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'calendar'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
          <button
            onClick={() => setCurrentView('stories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'stories'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Stories
          </button>
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'profile'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'analytics'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setCurrentView('goals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'goals'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            Goals
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
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
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Scheduled Posts</p>
              <p className="text-2xl font-bold text-brand-500">
                {posts.filter(p => p.status === 'scheduled').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Published Today</p>
              <p className="text-2xl font-bold text-green-500">
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
            <TrendingUp className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Draft Posts</p>
              <p className="text-2xl font-bold text-yellow-500">
                {posts.filter(p => p.status === 'draft').length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Engagement Rate</p>
              <p className="text-2xl font-bold text-blue-500">--</p>
            </div>
            <MessageSquare className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
import { useState } from 'react';
import { Facebook, Instagram, Linkedin, FileText, Copy, Save, Check } from 'lucide-react';

type Platform = 'LinkedIn' | 'Facebook' | 'Instagram' | 'Blog';
type Person = 'Zac' | 'Luke' | 'Huge Capital';

export const ContentManagement = () => {
  const [selectedPerson, setSelectedPerson] = useState<Person>('Zac');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('LinkedIn');
  const [selectedTab, setSelectedTab] = useState('Monday');
  const [content, setContent] = useState(
    'Excited to share our latest insights on business growth strategies...'
  );

  const platforms = [
    { name: 'LinkedIn' as Platform, icon: Linkedin, color: 'text-blue-600' },
    { name: 'Facebook' as Platform, icon: Facebook, color: 'text-blue-500' },
    { name: 'Instagram' as Platform, icon: Instagram, color: 'text-pink-600' },
    { name: 'Blog' as Platform, icon: FileText, color: 'text-gray-700' },
  ];

  const schedules = ['Monday', 'Wednesday', 'Friday'];

  const characterLimit = {
    LinkedIn: 3000,
    Facebook: 63206,
    Instagram: 2200,
    Blog: 10000,
  };

  const brandVoiceGuidelines = {
    'Zac': [
      'Data-driven insights',
      'Industry leadership',
      'Strategic partnerships',
    ],
    'Luke': [
      'Innovation & technology',
      'Customer success stories',
      'Operational excellence',
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
        <FileText className="w-8 h-8 text-brand-500" />
        Content Planner
      </h1>

      {/* Person Toggle */}
      <div className="flex gap-3">
        <button
          onClick={() => setSelectedPerson('Zac')}
          className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors ${
            selectedPerson === 'Zac'
              ? 'bg-blue-500 text-white border-2 border-blue-600'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          Zac
        </button>
        <button
          onClick={() => setSelectedPerson('Luke')}
          className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors ${
            selectedPerson === 'Luke'
              ? 'bg-green-500 text-white border-2 border-green-600'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          Luke
        </button>
        <button
          onClick={() => setSelectedPerson('Huge Capital')}
          className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors ${
            selectedPerson === 'Huge Capital'
              ? 'bg-purple-500 text-white border-2 border-purple-600'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          Huge Capital
        </button>
      </div>

      {/* Brand Voice Guidelines */}
      <div className={`rounded-lg shadow p-6 ${
        selectedPerson === 'Zac'
          ? 'bg-blue-50 border-2 border-blue-200'
          : selectedPerson === 'Luke'
          ? 'bg-green-50 border-2 border-green-200'
          : 'bg-purple-50 border-2 border-purple-200'
      }`}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Brand Voice Guidelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(brandVoiceGuidelines).map(([founder, pillars]) => (
            <div key={founder}>
              <h3 className="font-semibold text-gray-900 mb-2">
                {founder}'s Content Pillars
              </h3>
              <ul className="space-y-1">
                {pillars.map((pillar) => (
                  <li key={pillar} className="text-sm text-gray-600">
                    • {pillar}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 mb-6">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <button
                key={platform.name}
                onClick={() => setSelectedPlatform(platform.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedPlatform === platform.name
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${platform.color}`} />
                {platform.name}
              </button>
            );
          })}
        </div>

        {/* Schedule Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {schedules.map((schedule) => (
            <button
              key={schedule}
              onClick={() => setSelectedTab(schedule)}
              className={`px-4 py-2 font-medium transition-colors ${
                selectedTab === schedule
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {schedule} Post
            </button>
          ))}
        </div>

        {/* Content Editor and Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Editor */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Edit Content
                </label>
                <span
                  className={`text-xs ${
                    content.length > characterLimit[selectedPlatform]
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {content.length} / {characterLimit[selectedPlatform]}
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Write your post content here..."
              />
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Check className="w-4 h-4" />
                Approve Post
              </button>
            </div>

            <div className="flex gap-2">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                Pending
              </span>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">
              Live Preview
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 min-h-[300px]">
              {selectedPlatform === 'LinkedIn' && (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      HC
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Huge Capital
                      </p>
                      <p className="text-xs text-gray-500">Just now</p>
                    </div>
                  </div>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">
                    {content}
                  </p>
                </div>
              )}
              {selectedPlatform === 'Facebook' && (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      HC
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Huge Capital
                      </p>
                      <p className="text-xs text-gray-500">Just now · 🌎</p>
                    </div>
                  </div>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">
                    {content}
                  </p>
                </div>
              )}
              {selectedPlatform === 'Instagram' && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-3 p-4 border-b">
                    <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-full"></div>
                    <p className="font-semibold text-sm">hugecapital</p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm">
                      <span className="font-semibold">hugecapital</span>{' '}
                      {content}
                    </p>
                  </div>
                </div>
              )}
              {selectedPlatform === 'Blog' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Blog Post Preview
                  </h2>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {content}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

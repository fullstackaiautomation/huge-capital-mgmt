import { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Send, Bookmark, MoreHorizontal, Globe, Monitor, Smartphone } from 'lucide-react';
import type { Platform, Person } from '../../types/content';

interface PlatformPreviewProps {
  platform: Platform;
  person: Person;
  content: string;
  threadParts?: { content: string }[];
  isThread?: boolean;
  imageUrl?: string;
}

export const PlatformPreview = ({
  platform,
  person,
  content,
  threadParts = [],
  isThread = false,
  imageUrl,
}: PlatformPreviewProps) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');

  const getPersonInfo = () => {
    if (person === 'Zac') {
      return {
        name: 'Zac Wheeler',
        handle: '@zacwheeler',
        title: 'CEO & Founder at Huge Capital',
        avatar: '👨‍💼',
      };
    } else if (person === 'Luke') {
      return {
        name: 'Luke Wilson',
        handle: '@lukewilson',
        title: 'Partner at Huge Capital',
        avatar: '👨',
      };
    } else {
      return {
        name: 'Huge Capital',
        handle: '@hugecapital',
        title: 'Business Funding Solutions',
        avatar: '💼',
      };
    }
  };

  const personInfo = getPersonInfo();
  const displayContent = content || 'Start typing to see a preview...';

  // Container width based on view mode
  const containerClass = viewMode === 'mobile' ? 'max-w-sm mx-auto' : 'max-w-2xl mx-auto';

  // LinkedIn Preview
  if (platform === 'LinkedIn') {
    return (
      <div className="space-y-3">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-center gap-2 bg-gray-800/50 rounded-lg p-2">
          <button
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'desktop'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'mobile'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
        </div>

        <div className={containerClass}>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden text-sm">
        {/* LinkedIn Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl">
              {personInfo.avatar}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{personInfo.name}</h3>
              <p className="text-xs text-gray-600">{personInfo.title}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                Now • <Globe className="w-3 h-3" />
              </p>
            </div>
            <button className="text-gray-500 hover:bg-gray-100 p-1 rounded">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LinkedIn Content */}
        <div className="p-4">
          <div className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">
            {displayContent}
          </div>
          {imageUrl && (
            <div className="mt-3 bg-gray-100 rounded h-48 flex items-center justify-center">
              <span className="text-gray-400 text-xs">Image Preview</span>
            </div>
          )}
        </div>

        {/* LinkedIn Engagement */}
        <div className="px-4 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-blue-500 border border-white"></div>
                <div className="w-4 h-4 rounded-full bg-green-500 border border-white"></div>
              </div>
              <span>0</span>
            </div>
            <div>0 comments</div>
          </div>
        </div>

        {/* LinkedIn Actions */}
        <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-around">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">Like</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <Repeat2 className="w-5 h-5" />
            <span className="text-sm font-medium">Repost</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <Send className="w-5 h-5" />
            <span className="text-sm font-medium">Send</span>
          </button>
        </div>
          </div>
        </div>
      </div>
    );
  }

  // Twitter Preview
  if (platform === 'Twitter') {
    return (
      <div className="space-y-3">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-center gap-2 bg-gray-800/50 rounded-lg p-2">
          <button
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'desktop'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'mobile'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
        </div>

        <div className={containerClass}>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden text-sm">
        {/* Twitter Post */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-sky-500 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0">
              {personInfo.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-bold text-gray-900">{personInfo.name}</span>
                <span className="text-gray-500">{personInfo.handle}</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500">now</span>
              </div>

              {/* Thread Hook */}
              {isThread && (
                <div className="mt-2">
                  <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {displayContent}
                  </div>
                  {threadParts.length > 0 && (
                    <div className="mt-3 text-sky-500 text-sm font-medium">
                      Show this thread
                    </div>
                  )}
                </div>
              )}

              {/* Single Post */}
              {!isThread && (
                <div className="mt-2 text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {displayContent}
                </div>
              )}

              {imageUrl && (
                <div className="mt-3 bg-gray-100 rounded-2xl h-48 flex items-center justify-center border border-gray-200">
                  <span className="text-gray-400 text-xs">Image Preview</span>
                </div>
              )}

              {/* Twitter Actions */}
              <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
                <button className="flex items-center gap-2 hover:text-sky-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-xs">0</span>
                </button>
                <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
                  <Repeat2 className="w-5 h-5" />
                  <span className="text-xs">0</span>
                </button>
                <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span className="text-xs">0</span>
                </button>
                <button className="hover:text-sky-500 transition-colors">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thread Parts Preview */}
        {isThread && threadParts.length > 0 && (
          <div className="px-4 pb-4 space-y-4">
            {threadParts.slice(0, 2).map((part, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-gray-300"></div>
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-sky-500 rounded-full flex items-center justify-center text-white text-xl">
                    {personInfo.avatar}
                  </div>
                </div>
                <div className="flex-1 pt-4">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-gray-900">{personInfo.name}</span>
                    <span className="text-gray-500">{personInfo.handle}</span>
                  </div>
                  <div className="mt-2 text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {part.content || `Thread part ${index + 1}...`}
                  </div>
                </div>
              </div>
            ))}
            {threadParts.length > 2 && (
              <div className="text-center text-gray-500 text-sm">
                ... and {threadParts.length - 2} more {threadParts.length - 2 === 1 ? 'tweet' : 'tweets'}
              </div>
            )}
          </div>
        )}
          </div>
        </div>
      </div>
    );
  }

  // Instagram Preview
  if (platform === 'Instagram') {
    return (
      <div className="space-y-3">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-center gap-2 bg-gray-800/50 rounded-lg p-2">
          <button
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'desktop'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'mobile'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
        </div>

        <div className={containerClass}>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden text-sm">
        {/* Instagram Header */}
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white">
              {personInfo.avatar}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{personInfo.handle.replace('@', '')}</h3>
              <p className="text-xs text-gray-600">Sponsored</p>
            </div>
          </div>
          <button className="text-gray-900">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Instagram Image */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 aspect-square flex items-center justify-center">
          {imageUrl ? (
            <span className="text-gray-400">Image Preview</span>
          ) : (
            <span className="text-gray-400 text-center px-8">
              Add an image to see Instagram preview
            </span>
          )}
        </div>

        {/* Instagram Actions */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="hover:text-gray-500 transition-colors">
                <Heart className="w-6 h-6" />
              </button>
              <button className="hover:text-gray-500 transition-colors">
                <MessageCircle className="w-6 h-6" />
              </button>
              <button className="hover:text-gray-500 transition-colors">
                <Send className="w-6 h-6" />
              </button>
            </div>
            <button className="hover:text-gray-500 transition-colors">
              <Bookmark className="w-6 h-6" />
            </button>
          </div>

          <div className="font-semibold text-sm">0 likes</div>

          <div className="text-sm">
            <span className="font-semibold mr-2">{personInfo.handle.replace('@', '')}</span>
            <span className="text-gray-900">
              {displayContent.length > 100
                ? `${displayContent.substring(0, 100)}... `
                : displayContent}
            </span>
            {displayContent.length > 100 && (
              <button className="text-gray-500">more</button>
            )}
          </div>

          <div className="text-xs text-gray-500 uppercase">Just now</div>
        </div>
          </div>
        </div>
      </div>
    );
  }

  // Facebook Preview
  if (platform === 'Facebook') {
    return (
      <div className="space-y-3">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-center gap-2 bg-gray-800/50 rounded-lg p-2">
          <button
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'desktop'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'mobile'
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
        </div>

        <div className={containerClass}>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden text-sm">
        {/* Facebook Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white">
              {personInfo.avatar}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{personInfo.name}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                Just now • <Globe className="w-3 h-3" />
              </p>
            </div>
            <button className="text-gray-500 hover:bg-gray-100 p-1 rounded">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Facebook Content */}
        <div className="px-4 py-3">
          <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
            {displayContent}
          </div>
        </div>

        {imageUrl && (
          <div className="bg-gray-100 h-64 flex items-center justify-center border-t border-b border-gray-200">
            <span className="text-gray-400">Image Preview</span>
          </div>
        )}

        {/* Facebook Engagement */}
        <div className="px-4 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-blue-500 border border-white flex items-center justify-center text-white text-[8px]">
                  👍
                </div>
              </div>
              <span>0</span>
            </div>
            <div className="flex gap-2">
              <span>0 comments</span>
              <span>0 shares</span>
            </div>
          </div>
        </div>

        {/* Facebook Actions */}
        <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-around">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors flex-1 justify-center">
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">Like</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors flex-1 justify-center">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors flex-1 justify-center">
            <Send className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
          </div>
        </div>
      </div>
    );
  }

  // Default/Other Platforms
  return (
    <div className="space-y-3">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-center gap-2 bg-gray-800/50 rounded-lg p-2">
        <button
          onClick={() => setViewMode('desktop')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === 'desktop'
              ? 'bg-brand-500 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          Desktop
        </button>
        <button
          onClick={() => setViewMode('mobile')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === 'mobile'
              ? 'bg-brand-500 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Mobile
        </button>
      </div>

      <div className={containerClass}>
        <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center text-gray-500">
        <p className="text-sm">Preview not available for {platform}</p>
        <div className="mt-4 p-4 bg-gray-50 rounded text-left">
          <p className="text-xs text-gray-600 font-medium mb-2">Content:</p>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{displayContent}</p>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};
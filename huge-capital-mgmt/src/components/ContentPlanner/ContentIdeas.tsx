import React, { useState } from 'react';
import {
  Lightbulb,
  ThumbsDown,
  ThumbsUp,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Plus
} from 'lucide-react';
import type { ContentIdea, Person, Platform, ContentProfile } from '../../types/content';
import { CONTENT_PILLARS } from '../../types/content';

interface ContentIdeasProps {
  person: Person;
  platform: Platform;
  ideas: ContentIdea[];
  profile?: ContentProfile;
  onDismiss: (id: string) => void;
  onApprove: (id: string) => void;
  onGenerateIdeas: (person: Person, platform: Platform) => Promise<void>;
  onUseIdea: (idea: ContentIdea) => void;
  isGenerating?: boolean;
}

export const ContentIdeas: React.FC<ContentIdeasProps> = ({
  person,
  platform,
  ideas,
  profile,
  onDismiss,
  onApprove,
  onGenerateIdeas,
  onUseIdea,
  isGenerating = false,
}) => {
  const [expanded, setExpanded] = useState(true);

  // Get content pillars for this person
  const pillars = profile?.contentPillars || CONTENT_PILLARS[person] || [];

  // Group ideas by content pillar
  const ideasByPillar = ideas.reduce((acc, idea) => {
    const pillar = idea.contentPillar || 'General';
    if (!acc[pillar]) acc[pillar] = [];
    acc[pillar].push(idea);
    return acc;
  }, {} as Record<string, ContentIdea[]>);

  const handleGenerate = async () => {
    await onGenerateIdeas(person, platform);
  };

  const pendingIdeas = ideas.filter(i => i.status === 'pending');
  const approvedIdeas = ideas.filter(i => i.status === 'approved');

  return (
    <div className="bg-gray-800/30 rounded-lg border border-gray-700/30 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/20"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-gray-100">Content Ideas</h3>
          {ideas.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
              {pendingIdeas.length} pending
            </span>
          )}
          {approvedIdeas.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
              {approvedIdeas.length} approved
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleGenerate();
          }}
          disabled={isGenerating}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700
                     disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Ideas
            </>
          )}
        </button>
      </div>

      {/* Ideas List */}
      {expanded && (
        <div className="border-t border-gray-700/30">
          {ideas.length === 0 ? (
            <div className="p-8 text-center">
              <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">No content ideas yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Click "Generate Ideas" to get AI-powered content suggestions based on{' '}
                <span className="text-purple-400">{person}'s</span> content pillars.
              </p>
              {pillars.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {pillars.map((pillar, idx) => {
                    const pillarName = typeof pillar === 'string' ? pillar : pillar.name;
                    return (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded bg-gray-700/50 text-gray-300"
                      >
                        {pillarName}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-700/30">
              {Object.entries(ideasByPillar).map(([pillar, pillarIdeas]) => (
                <div key={pillar} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">
                      {pillar}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({pillarIdeas.length} ideas)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pillarIdeas.map((idea) => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        onDismiss={onDismiss}
                        onApprove={onApprove}
                        onUse={onUseIdea}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface IdeaCardProps {
  idea: ContentIdea;
  onDismiss: (id: string) => void;
  onApprove: (id: string) => void;
  onUse: (idea: ContentIdea) => void;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onDismiss, onApprove, onUse }) => {
  const isApproved = idea.status === 'approved';

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isApproved
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-gray-900/50 border-gray-700/30 hover:border-gray-600/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-100 text-sm">{idea.ideaTitle}</h4>
          {idea.ideaDescription && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {idea.ideaDescription}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isApproved && (
            <button
              onClick={() => onUse(idea)}
              className="p-1.5 rounded-lg bg-green-600 hover:bg-green-700
                       text-white transition-colors"
              title="Use this idea"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {!isApproved && (
            <button
              onClick={() => onApprove(idea.id)}
              className="p-1.5 rounded-lg hover:bg-green-500/20 text-gray-400
                       hover:text-green-400 transition-colors"
              title="Approve idea"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDismiss(idea.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400
                     hover:text-red-400 transition-colors"
            title="Dismiss idea"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentIdeas;

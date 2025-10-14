import { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, X, Loader2 } from 'lucide-react';

interface AIContentSuggestionsProps {
  suggestions: string[];
  isLoading: boolean;
  onSelect: (content: string) => void;
  onRegenerate: () => void;
  onClose: () => void;
}

export const AIContentSuggestions = ({
  suggestions,
  isLoading,
  onSelect,
  onRegenerate,
  onClose,
}: AIContentSuggestionsProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">AI Content Suggestions</h2>
              <p className="text-sm text-gray-400">Choose a suggestion or generate more</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <p className="text-gray-400">Generating personalized content...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Sparkles className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-gray-400">No suggestions yet</p>
              <p className="text-sm text-gray-500 mt-2">Click "Generate" to create AI content</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden hover:border-purple-500/50 transition-colors group"
                >
                  <div className="flex items-start justify-between p-4 border-b border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
                        Option {index + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {suggestion.length} characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(suggestion, index)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {suggestion}
                    </p>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => onSelect(suggestion)}
                      className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                    >
                      Use This Content
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && suggestions.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Not quite right? Generate more variations
            </p>
            <button
              onClick={onRegenerate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        )}

        {/* API Key Notice */}
        {suggestions.length > 0 && suggestions[0].includes('mock suggestion') && (
          <div className="p-4 bg-yellow-500/10 border-t border-yellow-500/20">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-200 font-medium">
                  Using Mock Suggestions
                </p>
                <p className="text-xs text-yellow-300/80 mt-1">
                  Add <code className="bg-black/20 px-1 rounded">VITE_ANTHROPIC_API_KEY</code> to your{' '}
                  <code className="bg-black/20 px-1 rounded">.env</code> file to enable real AI-generated content
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

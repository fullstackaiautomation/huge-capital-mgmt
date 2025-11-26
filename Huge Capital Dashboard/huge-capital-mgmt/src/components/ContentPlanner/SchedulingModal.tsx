import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  Check,
  ChevronDown,
} from 'lucide-react';
import type { GeneratedContent } from '../../services/skillsRunner';
import {
  getSuggestedTimes,
  getScheduleInfo,
  saveScheduledPost,
  type SuggestedTime,
} from '../../services/schedulingService';
import { PERSON_COLORS } from '../../types/content';

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: GeneratedContent | null;
  onScheduled: () => void;
}

export const SchedulingModal = ({
  isOpen,
  onClose,
  content,
  onScheduled,
}: SchedulingModalProps) => {
  const [suggestedTimes, setSuggestedTimes] = useState<SuggestedTime[]>([]);
  const [selectedTime, setSelectedTime] = useState<SuggestedTime | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  const [useCustom, setUseCustom] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (content && isOpen) {
      // Debug logging to trace persona handling
      console.log(`[SchedulingModal] Opening for persona: "${content.metadata.persona}", platform: "${content.metadata.platform}"`);

      const times = getSuggestedTimes(
        content.metadata.persona,
        content.metadata.platform
      );

      console.log(`[SchedulingModal] Received ${times.length} suggested times:`, times.map(t => t.label));

      setSuggestedTimes(times);
      setSelectedTime(times[0] || null);
      setUseCustom(false);
      setShowSuccess(false);

      // Set default custom date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCustomDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [content, isOpen]);

  if (!isOpen || !content) return null;

  const persona = content.metadata.persona;
  const platform = content.metadata.platform;
  const scheduleInfo = getScheduleInfo(persona, platform);
  const personaColor = PERSON_COLORS[persona];

  const handleSchedule = async () => {
    setIsScheduling(true);

    try {
      let scheduledDate: Date;

      if (useCustom) {
        const [year, month, day] = customDate.split('-').map(Number);
        const [hours, minutes] = customTime.split(':').map(Number);
        scheduledDate = new Date(year, month - 1, day, hours, minutes);
      } else if (selectedTime) {
        scheduledDate = selectedTime.date;
      } else {
        throw new Error('No time selected');
      }

      saveScheduledPost(content, scheduledDate);

      setShowSuccess(true);
      setTimeout(() => {
        onScheduled();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to schedule:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-gray-700"
          style={{ backgroundColor: `${personaColor}15` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: personaColor }}
              >
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Schedule Post
                </h2>
                <p className="text-sm text-gray-400">
                  {persona} • {platform}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success State */}
        {showSuccess ? (
          <div className="p-8 text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${personaColor}20` }}
            >
              <Check className="w-8 h-8" style={{ color: personaColor }} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Post Scheduled!
            </h3>
            <p className="text-gray-400">
              Your content has been added to the calendar.
            </p>
          </div>
        ) : (
          <>
            {/* Content Preview */}
            <div className="px-6 py-4 border-b border-gray-800">
              <p className="text-sm text-gray-400 mb-2">Content Preview</p>
              <p className="text-gray-300 text-sm line-clamp-3">
                {content.content.substring(0, 200)}...
              </p>
            </div>

            {/* Suggested Times */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4" style={{ color: personaColor }} />
                <span className="text-sm font-medium text-gray-300">
                  AI-Recommended Times
                </span>
                {scheduleInfo && (
                  <span className="text-xs text-gray-500 ml-auto">
                    {scheduleInfo.frequency}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {suggestedTimes.map((time, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedTime(time);
                      setUseCustom(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      !useCustom && selectedTime === time
                        ? 'border-opacity-100 bg-opacity-10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    style={{
                      borderColor:
                        !useCustom && selectedTime === time
                          ? personaColor
                          : undefined,
                      backgroundColor:
                        !useCustom && selectedTime === time
                          ? `${personaColor}10`
                          : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Clock
                        className="w-4 h-4"
                        style={{
                          color:
                            !useCustom && selectedTime === time
                              ? personaColor
                              : '#9CA3AF',
                        }}
                      />
                      <div className="text-left">
                        <p
                          className="font-medium"
                          style={{
                            color:
                              !useCustom && selectedTime === time
                                ? personaColor
                                : '#E5E7EB',
                          }}
                        >
                          {time.label}
                        </p>
                        <p className="text-xs text-gray-500">{time.reason}</p>
                      </div>
                    </div>
                    {!useCustom && selectedTime === time && (
                      <Check className="w-5 h-5" style={{ color: personaColor }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Time Toggle */}
            <div className="px-6 pb-4">
              <button
                onClick={() => setUseCustom(!useCustom)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    useCustom ? 'rotate-180' : ''
                  }`}
                />
                Choose custom date & time
              </button>

              {useCustom && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Date
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Time
                    </label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={isScheduling || (!selectedTime && !useCustom)}
                className="flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: personaColor }}
              >
                {isScheduling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Schedule Post
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SchedulingModal;

import { useState, useRef } from 'react';
import { Upload, Mic, Loader2, CheckCircle, AlertCircle, FileAudio } from 'lucide-react';
import { transcribeAudio, validateAudioFile, formatDuration } from '../../services/voiceTranscription';
import { extractStoryData } from '../../services/storyExtraction';
import type { Story } from '../../types/story';

interface VoiceMemoUploadProps {
  person: 'Zac' | 'Luke' | 'Huge Capital';
  onStoryExtracted: (storyData: Partial<Story>) => void;
  onCancel: () => void;
}

type UploadState = 'idle' | 'uploading' | 'transcribing' | 'extracting' | 'success' | 'error';

export const VoiceMemoUpload = ({ person, onStoryExtracted, onCancel }: VoiceMemoUploadProps) => {
  const [state, setState] = useState<UploadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setErrorMessage('');

    // Validate file
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      setState('error');
      return;
    }

    setAudioFile(file);
    setState('uploading');

    try {
      // Step 1: Transcribe audio
      setState('transcribing');
      const transcriptionResult = await transcribeAudio(file);
      setTranscript(transcriptionResult.transcript);
      setDuration(transcriptionResult.duration || 0);

      // Step 2: Extract story data using AI
      setState('extracting');
      const extractedData = await extractStoryData(transcriptionResult.transcript);

      // Step 3: Build complete story object
      const storyData: Partial<Story> = {
        personName: person,
        title: extractedData.title,
        transcript: transcriptionResult.transcript,
        storyType: extractedData.storyType,
        fundingType: extractedData.fundingType,
        loanAmountRange: extractedData.loanAmountRange,
        clientIndustry: extractedData.clientIndustry,
        themes: extractedData.themes,
        keyTakeaways: extractedData.keyTakeaways,
        sourceType: 'voice_memo',
        recordedDate: new Date(),
        isApproved: false, // Requires manual approval
      };

      setState('success');

      // Pass the extracted data to parent
      onStoryExtracted(storyData);
    } catch (error) {
      console.error('Voice upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process voice memo');
      setState('error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const getStateDisplay = () => {
    switch (state) {
      case 'uploading':
        return {
          icon: <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />,
          title: 'Uploading...',
          message: 'Reading audio file',
        };
      case 'transcribing':
        return {
          icon: <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />,
          title: 'Transcribing...',
          message: 'Converting speech to text using Whisper AI',
        };
      case 'extracting':
        return {
          icon: <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />,
          title: 'Extracting Details...',
          message: 'Analyzing transcript and extracting story data',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          title: 'Success!',
          message: 'Story extracted successfully',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-12 h-12 text-red-500" />,
          title: 'Error',
          message: errorMessage,
        };
      default:
        return null;
    }
  };

  const stateDisplay = getStateDisplay();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-100">Upload Voice Memo</h3>
        <span className="px-3 py-1 text-sm bg-purple-500/20 text-purple-300 rounded-full">
          {person}
        </span>
      </div>

      {/* Drop Zone */}
      {state === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFilePicker}
          className={`
            relative border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all
            ${isDragging
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-purple-500/20 rounded-full">
              <Mic className="w-12 h-12 text-purple-400" />
            </div>

            <div className="text-center">
              <p className="text-lg font-medium text-gray-200 mb-2">
                Drop voice memo here or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Supports MP3, M4A, WAV, WEBM, OGG (max 25MB)
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Upload className="w-4 h-4" />
              <span>Drag & drop or click</span>
            </div>
          </div>
        </div>
      )}

      {/* Processing State */}
      {stateDisplay && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          {stateDisplay.icon}
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-100 mb-1">
              {stateDisplay.title}
            </h4>
            <p className="text-sm text-gray-400">{stateDisplay.message}</p>
          </div>

          {audioFile && state !== 'idle' && (
            <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-gray-800 rounded-lg">
              <FileAudio className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">{audioFile.name}</span>
              {duration > 0 && (
                <span className="text-xs text-gray-500">
                  ({formatDuration(duration)})
                </span>
              )}
            </div>
          )}

          {transcript && state === 'success' && (
            <div className="w-full mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Transcript Preview:</p>
              <p className="text-sm text-gray-300 line-clamp-4">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={state === 'transcribing' || state === 'extracting'}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>

        {state === 'error' && (
          <button
            onClick={() => {
              setState('idle');
              setAudioFile(null);
              setErrorMessage('');
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        )}
      </div>

      {/* API Key Notice */}
      {state === 'idle' && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">API Keys Required:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-300">
                <li>VITE_OPENAI_API_KEY for Whisper transcription</li>
                <li>VITE_ANTHROPIC_API_KEY for AI extraction (optional)</li>
              </ul>
              <p className="mt-2 text-xs text-blue-400">
                Add these to your .env file. Basic extraction will work without Anthropic key.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Voice Transcription Service using OpenAI Whisper API
 */

interface TranscriptionResult {
  transcript: string;
  duration?: number;
  language?: string;
}

export async function transcribeAudio(audioFile: File): Promise<TranscriptionResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file');
  }

  // Create form data for Whisper API
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json'); // Get detailed info

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Transcription failed');
    }

    const data = await response.json();

    return {
      transcript: data.text,
      duration: data.duration,
      language: data.language,
    };
  } catch (error) {
    console.error('Whisper API error:', error);
    throw error;
  }
}

/**
 * Validate audio file
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Supported formats by Whisper
  const supportedMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/webm',
    'audio/ogg',
  ];

  // Supported file extensions
  const supportedExtensions = ['.mp3', '.m4a', '.mp4', '.wav', '.webm', '.ogg'];

  const fileName = file.name.toLowerCase();
  const hasValidExtension = supportedExtensions.some(ext => fileName.endsWith(ext));
  const hasValidMimeType = supportedMimeTypes.includes(file.type);

  // Accept if either MIME type or extension is valid (browsers can be inconsistent with MIME types)
  if (!hasValidExtension && !hasValidMimeType) {
    return {
      valid: false,
      error: `Unsupported audio format. Please use: MP3, M4A, WAV, WEBM, or OGG (detected: ${file.type || 'unknown'})`,
    };
  }

  // Check file size (Whisper limit is 25MB)
  const maxSize = 25 * 1024 * 1024; // 25MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is 25MB (your file is ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Format duration in seconds to readable time
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Document Upload Component
 * Handles drag-and-drop file upload for deal submission
 * Separated upload zones for Application and Bank Statements
 */

import { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  category: 'application' | 'statements';
}

interface DocumentUploadProps {
  onFilesReady: (files: { file: File; category: 'application' | 'statements' }[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export default function DocumentUpload({
  onFilesReady,
  maxFiles = 10,
  acceptedTypes = ['.pdf', '.csv', '.png', '.jpg', '.jpeg'],
}: DocumentUploadProps) {
  const [applicationFiles, setApplicationFiles] = useState<UploadedFile[]>([]);
  const [statementFiles, setStatementFiles] = useState<UploadedFile[]>([]);
  const [isDraggingApp, setIsDraggingApp] = useState(false);
  const [isDraggingStmt, setIsDraggingStmt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appInputRef = useRef<HTMLInputElement>(null);
  const stmtInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!acceptedTypes.includes(fileExtension)) {
      return `File type ${fileExtension} not allowed. Accepted: ${acceptedTypes.join(', ')}`;
    }

    if (file.size > 50 * 1024 * 1024) {
      return 'File size exceeds 50MB limit';
    }

    return null;
  };

  const notifyParent = () => {
    const allFiles = [
      ...applicationFiles.map((f) => ({ file: f.file, category: 'application' as const })),
      ...statementFiles.map((f) => ({ file: f.file, category: 'statements' as const })),
    ];
    onFilesReady(allFiles);
  };

  const handleAddFiles = (newFiles: File[], category: 'application' | 'statements') => {
    setError(null);

    const currentFiles = category === 'application' ? applicationFiles : statementFiles;
    const totalFiles = applicationFiles.length + statementFiles.length + newFiles.length;

    if (totalFiles > maxFiles) {
      setError(`Maximum ${maxFiles} files total allowed`);
      return;
    }

    const validFiles = newFiles.filter((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return false;
      }
      return true;
    });

    const uploadedFiles: UploadedFile[] = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending',
      category,
    }));

    if (category === 'application') {
      setApplicationFiles([...currentFiles, ...uploadedFiles]);
    } else {
      setStatementFiles([...currentFiles, ...uploadedFiles]);
    }

    // Notify parent after state update
    setTimeout(() => notifyParent(), 0);
  };

  const removeFile = (id: string, category: 'application' | 'statements') => {
    if (category === 'application') {
      const updated = applicationFiles.filter((f) => f.id !== id);
      setApplicationFiles(updated);
    } else {
      const updated = statementFiles.filter((f) => f.id !== id);
      setStatementFiles(updated);
    }
    setTimeout(() => notifyParent(), 0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderUploadZone = (
    category: 'application' | 'statements',
    title: string,
    description: string,
    isDragging: boolean,
    setIsDragging: (val: boolean) => void,
    inputRef: React.RefObject<HTMLInputElement | null>,
    files: UploadedFile[]
  ) => (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleAddFiles(Array.from(e.dataTransfer.files), category);
        }}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
        <h4 className="text-base font-semibold text-white mb-1">{title}</h4>
        <p className="text-gray-400 text-xs mb-2">{description}</p>
        <p className="text-xs text-gray-500">
          PDF, CSV, PNG, JPG (Max 50MB each)
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => {
            if (e.target.files) {
              handleAddFiles(Array.from(e.target.files), category);
            }
          }}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-400">
            {files.length} file{files.length !== 1 ? 's' : ''} uploaded
          </h5>
          <div className="space-y-1.5">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/30 rounded-lg p-2.5"
              >
                {getStatusIcon(file.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{file.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {file.status === 'uploading' && (
                  <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                {file.status === 'error' && file.error && (
                  <p className="text-xs text-red-400 truncate max-w-[100px]">{file.error}</p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id, category);
                  }}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Two Upload Zones Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Application Upload */}
        {renderUploadZone(
          'application',
          'Application Documents',
          'Upload loan application, business documents',
          isDraggingApp,
          setIsDraggingApp,
          appInputRef,
          applicationFiles
        )}

        {/* Bank Statements Upload */}
        {renderUploadZone(
          'statements',
          'Bank Statements',
          'Upload 3+ months of bank statements',
          isDraggingStmt,
          setIsDraggingStmt,
          stmtInputRef,
          statementFiles
        )}
      </div>

      {/* Total Files Counter */}
      {(applicationFiles.length > 0 || statementFiles.length > 0) && (
        <div className="text-center text-sm text-gray-400">
          Total: {applicationFiles.length + statementFiles.length} / {maxFiles} files
        </div>
      )}
    </div>
  );
}

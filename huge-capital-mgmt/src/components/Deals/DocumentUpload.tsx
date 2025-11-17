/**
 * Document Upload Component
 * Displays all uploaded files in a 2-column grid layout
 * Upload zones for Application & Bank Statement files
 */

import { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export type DealUploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface DealUploadFileDisplay {
  id: string;
  name: string;
  size: number;
  status: DealUploadStatus;
  progress: number;
  category: 'application' | 'statements';
  error?: string;
}

interface DocumentUploadProps {
  files: DealUploadFileDisplay[];
  onAddFiles: (files: File[], category: 'application' | 'statements') => void;
  onRemoveFile: (id: string) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  helperText?: string | null;
}

export default function DocumentUpload({
  files,
  onAddFiles,
  onRemoveFile,
  maxFiles = 10,
  acceptedTypes = ['.pdf', '.csv', '.png', '.jpg', '.jpeg'],
  disabled = false,
  helperText = null,
}: DocumentUploadProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDraggingApp, setIsDraggingApp] = useState(false);
  const [isDraggingStmt, setIsDraggingStmt] = useState(false);
  const appInputRef = useRef<HTMLInputElement>(null);
  const stmtInputRef = useRef<HTMLInputElement>(null);

  const totalFiles = files.length;

  const resetError = () => {
    if (localError) {
      setLocalError(null);
    }
  };

  const validateFiles = (incoming: File[]): File[] => {
    const allowed = new Set(acceptedTypes);
    const valid: File[] = [];

    for (const file of incoming) {
      const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;

      if (!allowed.has(extension)) {
        setLocalError(`File type ${extension} not allowed. Accepted: ${acceptedTypes.join(', ')}`);
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        setLocalError('File size exceeds 50MB limit (50MB).');
        continue;
      }

      valid.push(file);
    }

    if (valid.length > 0) {
      resetError();
    }

    return valid;
  };

  const handleAdd = (incoming: File[], category: 'application' | 'statements') => {
    if (disabled || incoming.length === 0) return;

    const remainingSlots = maxFiles - totalFiles;
    if (remainingSlots <= 0) {
      setLocalError(`Maximum ${maxFiles} files total allowed.`);
      return;
    }

    const trimmed = incoming.slice(0, remainingSlots);
    const valid = validateFiles(trimmed);
    if (valid.length) {
      onAddFiles(valid, category);
    }
  };

  const getStatusIcon = (status: DealUploadStatus) => {
    if (status === 'success') {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    if (status === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
    if (status === 'uploading') {
      return <Loader className="w-4 h-4 text-indigo-400 animate-spin" />;
    }
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  const renderUploadZone = (
    category: 'application' | 'statements',
    title: string,
    description: string,
    isDragging: boolean,
    setIsDragging: (val: boolean) => void,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => (
    <div
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => {
        if (disabled) return;
        setIsDragging(false);
      }}
      onDrop={(event) => {
        if (disabled) return;
        event.preventDefault();
        setIsDragging(false);
        handleAdd(Array.from(event.dataTransfer.files), category);
      }}
      aria-disabled={disabled}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      } ${
        isDragging
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
      }`}
      onClick={() => {
        if (disabled) return;
        inputRef.current?.click();
      }}
    >
      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
      <h4 className="text-base font-semibold text-white mb-1">{title}</h4>
      <p className="text-gray-400 text-xs mb-2">{description}</p>
      <p className="text-xs text-gray-500">PDF, CSV, PNG, JPG (Max 50MB each)</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(event) => {
          if (disabled) return;
          const selected = event.target.files ? Array.from(event.target.files) : [];
          handleAdd(selected, category);
          // Reset input so same file can be selected again later
          event.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );

  const renderFileCard = (file: DealUploadFileDisplay) => (
    <div
      key={file.id}
      className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/30 rounded-lg p-2.5"
    >
      {getStatusIcon(file.status)}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        {file.error && file.status === 'error' && (
          <p className="text-xs text-red-400 truncate">{file.error}</p>
        )}
      </div>
      {file.status === 'uploading' && (
        <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, file.progress))}%` }}
          />
        </div>
      )}
      <button
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) return;
          onRemoveFile(file.id);
        }}
        className={`text-gray-400 transition-colors ${
          disabled ? 'cursor-not-allowed opacity-60' : 'hover:text-gray-300'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const totalError = helperText ?? localError;

  // Split files into two columns evenly
  const midpoint = Math.ceil(files.length / 2);
  const leftColumnFiles = files.slice(0, midpoint);
  const rightColumnFiles = files.slice(midpoint);

  return (
    <div className="space-y-4">
      {totalError && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{totalError}</p>
        </div>
      )}

      {/* Upload zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderUploadZone(
          'application',
          'Application Documents',
          'Upload loan application and supporting business documents',
          isDraggingApp,
          setIsDraggingApp,
          appInputRef,
        )}

        {renderUploadZone(
          'statements',
          'Bank Statements',
          'Upload at least 3 recent months of bank statements',
          isDraggingStmt,
          setIsDraggingStmt,
          stmtInputRef,
        )}
      </div>

      {/* File list in 2 even columns */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-300">
            Uploaded Files ({files.length} / {maxFiles})
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              {leftColumnFiles.map(renderFileCard)}
            </div>
            <div className="space-y-2">
              {rightColumnFiles.map(renderFileCard)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

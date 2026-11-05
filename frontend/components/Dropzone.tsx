'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileImage, Video, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface DropzoneProps {
  mediaType: 'image' | 'video';
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  acceptedFormats: string;
  maxSizeMB?: number;
}

export default function Dropzone({
  mediaType,
  onFileSelected,
  isLoading,
  acceptedFormats,
  maxSizeMB = 50,
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const validateAndProcess = (file: File) => {
    setErrorMessage(null);

    // Size validation
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`File exceeds ${maxSizeMB}MB maximum limit.`);
      return;
    }

    // Format validation
    const validExtensions = mediaType === 'image'
      ? ['jpg', 'jpeg', 'png', 'webp']
      : ['mp4', 'avi', 'mov'];

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      setErrorMessage(`Invalid format. Allowed: ${validExtensions.join(', ').toUpperCase()}`);
      return;
    }

    setSelectedFile(file);
    if (mediaType === 'image') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
    onFileSelected(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20 shadow-glow-cyan'
            : 'border-sentinel-700 bg-sentinel-900/60 hover:border-sentinel-600 hover:bg-sentinel-850'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={handleFileInput}
          disabled={isLoading}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-sentinel-800 border border-sentinel-700 flex items-center justify-center text-cyan-400 shadow-inner">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            ) : mediaType === 'image' ? (
              <FileImage className="w-6 h-6" />
            ) : (
              <Video className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="text-sm font-semibold text-sentinel-100 font-mono">
              {isLoading
                ? 'EXECUTING FORENSIC NEURAL INFERENCE...'
                : `DRAG & DROP FORENSIC ${mediaType.toUpperCase()} MEDIA`}
            </div>
            <div className="text-xs text-sentinel-400 mt-1 font-mono">
              or click to browse local files (Max {maxSizeMB}MB)
            </div>
          </div>

          {selectedFile && !isLoading && (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-md mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Loaded: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}

          {previewUrl && mediaType === 'image' && (
            <div className="mt-4 border border-sentinel-700 rounded-lg overflow-hidden max-h-48 shadow-lg">
              <img src={previewUrl} alt="Inspection Preview" className="object-contain max-h-48 mx-auto" />
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 text-xs font-mono text-crimson-400 bg-crimson-950/40 border border-crimson-800/60 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 text-crimson-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}


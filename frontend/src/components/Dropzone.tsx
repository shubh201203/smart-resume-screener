import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface DropzoneProps {
  projectId: string;
  onUploadSuccess: () => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ projectId, onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      addValidFiles(files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addValidFiles(files);
    }
  };

  const addValidFiles = (files: File[]) => {
    setErrorMsg(null);
    const valid: File[] = [];
    let oversized = false;
    let invalidExt = false;

    files.forEach((f) => {
      const ext = f.name.toLowerCase().split('.').pop();
      if (ext !== 'pdf' && ext !== 'txt') {
        invalidExt = true;
      } else if (f.size > 10 * 1024 * 1024) {
        oversized = true;
      } else {
        valid.push(f);
      }
    });

    if (invalidExt) {
      setErrorMsg('Only PDF and TXT file formats are supported.');
    } else if (oversized) {
      setErrorMsg('One or more files exceed the maximum allowed size limit of 10MB.');
    }

    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;
    try {
      setUploading(true);
      setErrorMsg(null);
      await api.uploadResumes(projectId, selectedFiles);
      setSelectedFiles([]);
      onUploadSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800">
      <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
        <Upload className="w-4 h-4 text-indigo-400" />
        <span>Upload Candidate Resumes</span>
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Support PDF or TXT files. SHA-256 duplicate detection will automatically prevent repeated uploads.
      </p>

      {/* Drag Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt"
          onChange={handleChange}
          className="hidden"
        />
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800/80 flex items-center justify-center text-indigo-400">
          <Upload className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-200">
          Drag & drop resumes here, or <span className="text-indigo-400 underline">browse files</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">PDF or TXT up to 10MB per file</p>
      </div>

      {errorMsg && (
        <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-2 text-xs text-rose-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selected File List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Selected Files ({selectedFiles.length})</span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-500">({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartUpload}
            disabled={uploading}
            className="w-full mt-3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing & Parsing Resumes...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Upload & Parse {selectedFiles.length} Resume{selectedFiles.length > 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

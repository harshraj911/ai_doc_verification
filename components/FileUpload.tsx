
import React, { useCallback, useState } from 'react';
import { DocumentIcon } from './icons/DocumentIcon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, previewUrl }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div>
      <label
        htmlFor="file-upload"
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Document preview" className="object-contain h-full w-full rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <DocumentIcon className="w-10 h-10 mb-3 text-slate-400" />
            <p className="mb-2 text-sm text-slate-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">PNG, JPG, or WEBP</p>
          </div>
        )}
        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
      </label>
    </div>
  );
};

export default FileUpload;

import React, { useRef } from 'react';
import { UploadCloud, ImagePlus } from 'lucide-react';

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesSelected, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      // Reset input value to allow re-uploading the same file if needed (e.g. after clearing)
      e.target.value = '';
    }
  };

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        relative group cursor-pointer 
        border-2 border-dashed border-slate-700 hover:border-indigo-500 
        bg-slate-800/50 hover:bg-slate-800 
        rounded-2xl p-10 transition-all duration-300 ease-out
        flex flex-col items-center justify-center text-center
        ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp, image/heic"
        multiple
      />
      
      <div className="bg-slate-900 p-4 rounded-full mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300">
        <UploadCloud className="w-8 h-8 text-indigo-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">
        Upload your shots
      </h3>
      <p className="text-slate-400 mb-6 max-w-sm">
        Click to browse or drop your images here. Supports JPEG, PNG, WEBP.
      </p>
      
      <div className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
        <ImagePlus className="w-4 h-4 mr-2" />
        Select Images
      </div>
    </div>
  );
};
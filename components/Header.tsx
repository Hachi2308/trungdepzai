import React from 'react';
import { Camera, Sparkles, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="mb-8 pt-8 relative">
      <div className="absolute right-0 top-8">
        <button 
          onClick={onOpenSettings}
          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all"
          title="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
          <Camera className="w-8 h-8 text-indigo-400 mr-3" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Trung - 083.987.9999
          </h1>
        </div>
      </div>
    </header>
  );
};
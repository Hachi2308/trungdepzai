import React, { useState, useEffect } from 'react';
import { X, Save, Key, User, BrainCircuit, Sliders, Zap } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings,
  onSaveSettings
}) => {
  const [localKeywords, setLocalKeywords] = useState(settings.negativeKeywords);
  const [localArtist, setLocalArtist] = useState(settings.artistName);
  const [localModel, setLocalModel] = useState(settings.model || 'gemini-2.5-flash');
  const [localConcurrency, setLocalConcurrency] = useState(settings.maxConcurrency || 5);
  const [hasKey, setHasKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'api'>('general');

  useEffect(() => {
    setLocalKeywords(settings.negativeKeywords);
    setLocalArtist(settings.artistName);
    setLocalModel(settings.model || 'gemini-2.5-flash');
    setLocalConcurrency(settings.maxConcurrency || 5);
    checkKey();
  }, [settings, isOpen]);

  const checkKey = async () => {
    if ((window as any).aistudio?.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(has);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      negativeKeywords: localKeywords,
      artistName: localArtist,
      model: localModel,
      maxConcurrency: localConcurrency
    });
    onClose();
  };

  const handleConnectAccount = async () => {
    if ((window as any).aistudio?.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
        window.location.reload(); 
    } else {
        alert("API Key management is not available in this environment.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 pb-0 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center">
              Settings
            </h2>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 mt-6 px-6">
            <button 
                onClick={() => setActiveTab('general')}
                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'general' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
                <span className="flex items-center gap-2"><Sliders className="w-4 h-4" /> General</span>
                {activeTab === 'general' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('api')}
                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'api' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
                 <span className="flex items-center gap-2"><Key className="w-4 h-4" /> API & Model</span>
                 {activeTab === 'api' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"></div>}
            </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Artist Name */}
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Artist Name
                    </label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        value={localArtist}
                        onChange={(e) => setLocalArtist(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-600"
                        placeholder="e.g. quoctrung"
                    />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                    Used in the 'Artist' column of the CSV export.
                    </p>
                </div>

                {/* Concurrency Slider */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-slate-300">
                           Processing Threads (Multi-threading)
                        </label>
                        <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                            {localConcurrency}x
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Zap className="w-4 h-4 text-slate-500" />
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={localConcurrency}
                            onChange={(e) => setLocalConcurrency(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <Zap className="w-5 h-5 text-indigo-400" />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Higher threads process images faster but may hit API rate limits. Recommended: 5.
                    </p>
                </div>

                {/* Negative Keywords */}
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Ignored Keywords
                    </label>
                    <textarea
                    value={localKeywords}
                    onChange={(e) => setLocalKeywords(e.target.value)}
                    className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none placeholder-slate-600"
                    placeholder="Enter keywords to ignore, separated by commas..."
                    />
                    <p className="text-xs text-slate-500 mt-2">
                    These words will be automatically removed from the AI results.
                    </p>
                </div>
              </div>
          )}

          {activeTab === 'api' && (
              <div className="space-y-6">
                {/* AI Model Selection */}
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                        AI Model
                    </label>
                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <BrainCircuit className="h-4 w-4 text-slate-500" />
                        </div>
                        <select
                            value={localModel}
                            onChange={(e) => setLocalModel(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
                        >
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest & Efficient)</option>
                            <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Higher Reasoning)</option>
                        </select>
                         <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                         </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        'Flash' is faster for bulk processing. 'Pro' may offer slightly better creative nuance but is slower.
                    </p>
                </div>

                {/* API Key Connection */}
                <div className="pt-4 border-t border-slate-800">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                    API Key Connection
                    </label>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${hasKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm text-slate-400">
                                Status: <span className={hasKey ? "text-green-400 font-medium" : "text-red-400 font-medium"}>{hasKey ? "Connected" : "Not Configured"}</span>
                            </span>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleConnectAccount}
                        className="flex items-center justify-center w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium text-white transition-colors"
                    >
                        <Key className="w-4 h-4 mr-2" />
                        {hasKey ? "Update API Key" : "Connect Google Account"}
                    </button>
                    <p className="text-xs text-slate-500 mt-3 text-center">
                        This app uses your Google AI Studio API key. The key is stored locally in your browser session.
                    </p>
                    </div>
                </div>
              </div>
          )}

        </div>

        <div className="p-6 mt-auto flex justify-end border-t border-slate-800 bg-slate-900">
          <button
            onClick={handleSave}
            className="flex items-center px-6 py-2.5 bg-white text-slate-900 hover:bg-indigo-50 rounded-lg font-bold transition-colors shadow-lg shadow-white/5"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
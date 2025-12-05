import React, { useState } from 'react';
import { ProcessedImage } from '../types';
import { Copy, Check, Loader2, AlertCircle, X, Sparkles, Tag } from 'lucide-react';

interface MetadataCardProps {
  item: ProcessedImage;
  onRemove: (id: string) => void;
  onUpdateContext: (id: string, context: string) => void;
  onGenerate: (id: string) => void;
}

export const MetadataCard: React.FC<MetadataCardProps> = ({ 
  item, 
  onRemove, 
  onUpdateContext,
  onGenerate 
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isPending = item.status === 'pending' || item.status === 'error';
  const isProcessing = item.status === 'processing';
  const isCompleted = item.status === 'completed';

  const getStatusBorder = () => {
    switch (item.status) {
      case 'completed': return 'border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]';
      case 'error': return 'border-red-500/50';
      case 'processing': return 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]';
      default: return 'border-slate-700';
    }
  };

  return (
    <div className={`bg-slate-800 border ${getStatusBorder()} rounded-xl overflow-hidden shadow-lg flex flex-col transition-all duration-300 h-full`}>
      {/* Image Section - Stacked on top, fixed height */}
      <div className="w-full relative bg-slate-900 group shrink-0 h-48 sm:h-56">
        <img 
          src={item.previewUrl} 
          alt="Preview" 
          className={`w-full h-full object-cover transition-opacity ${isProcessing ? 'opacity-50' : 'opacity-90 group-hover:opacity-100'}`}
        />
        <button 
          onClick={() => onRemove(item.id)}
          className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm transition-colors z-10"
          title="Remove image"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-2" />
            <span className="text-xs font-semibold text-indigo-200 tracking-wider">ANALYZING</span>
          </div>
        )}
        
        {/* Error Overlay */}
        {item.status === 'error' && (
          <div className="absolute inset-x-0 bottom-0 bg-red-900/90 backdrop-blur p-2 flex items-start gap-2">
             <AlertCircle className="w-5 h-5 text-red-200 shrink-0 mt-0.5" />
             <p className="text-xs text-red-100 line-clamp-2">{item.error || "Analysis Failed"}</p>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="w-full p-4 flex flex-col flex-grow">
        
        {/* PENDING STATE: Input & Actions */}
        {(isPending) && (
          <div className="h-full flex flex-col">
            <div className="mb-4">
              <label className="flex items-center text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wide">
                <Tag className="w-3 h-3 mr-1.5" />
                Main Keyword (Optional)
              </label>
              <input
                type="text"
                value={item.manualContext}
                onChange={(e) => onUpdateContext(item.id, e.target.value)}
                placeholder="E.g. business, nature..."
                className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent block p-2.5 transition-all"
              />
            </div>
            
            <div className="mt-auto flex gap-2">
              <button
                onClick={() => onGenerate(item.id)}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-indigo-500/20"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Generate
              </button>
              {item.status === 'error' && (
                 <button
                 onClick={() => onGenerate(item.id)}
                 className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium text-sm transition-colors"
               >
                 Retry
               </button>
              )}
            </div>
          </div>
        )}

        {/* COMPLETED STATE: Results */}
        {isCompleted && item.metadata && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col h-full">
            {/* Title */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Title</label>
                <button 
                  onClick={() => copyToClipboard(item.metadata!.title, 'title')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {copiedField === 'title' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-slate-200 text-sm font-medium leading-snug line-clamp-2">{item.metadata.title}</p>
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Description</label>
                <button 
                  onClick={() => copyToClipboard(item.metadata!.description, 'description')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                   {copiedField === 'description' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{item.metadata.description}</p>
            </div>

            {/* Keywords */}
            <div className="flex-grow min-h-0">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                  Keywords ({item.metadata.keywords.length})
                </label>
                <button 
                  onClick={() => copyToClipboard(item.metadata!.keywords.join(', '), 'keywords')}
                  className="flex items-center text-[10px] font-medium px-2 py-1 bg-slate-700 hover:bg-indigo-600 rounded text-slate-300 hover:text-white transition-colors"
                >
                   {copiedField === 'keywords' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                   Copy All
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar content-start">
                {item.metadata.keywords.map((keyword, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 bg-slate-900/50 border border-slate-700 text-slate-300 text-[10px] rounded hover:border-indigo-500/50 transition-colors cursor-default">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-700/50 flex justify-end mt-auto">
               <button 
                  onClick={() => onGenerate(item.id)}
                  className="text-[10px] text-slate-500 hover:text-indigo-400 flex items-center transition-colors"
               >
                 <Sparkles className="w-3 h-3 mr-1" /> Regenerate
               </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
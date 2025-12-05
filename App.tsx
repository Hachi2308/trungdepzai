import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { MetadataCard } from './components/MetadataCard';
import { SettingsModal } from './components/SettingsModal';
import { ProcessedImage, AppSettings } from './types';
import { generateImageMetadata } from './services/geminiService';
import { generateCSV, downloadCSV } from './services/csvService';
import { Play, RotateCcw, Zap, Download, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessingGlobal, setIsProcessingGlobal] = useState<boolean>(false);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    negativeKeywords: '',
    artistName: 'quoctrung',
    model: 'gemini-2.5-flash',
    maxConcurrency: 5,
    apiKey: ''
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedNegatives = localStorage.getItem('stock_ai_negative_keywords');
    const savedArtist = localStorage.getItem('stock_ai_artist');
    const savedModel = localStorage.getItem('stock_ai_model');
    const savedConcurrency = localStorage.getItem('stock_ai_concurrency');
    const savedApiKey = localStorage.getItem('stock_ai_api_key');
    
    setSettings({
      negativeKeywords: savedNegatives || '',
      artistName: savedArtist || 'quoctrung',
      model: savedModel || 'gemini-2.5-flash',
      maxConcurrency: savedConcurrency ? parseInt(savedConcurrency) : 5,
      apiKey: savedApiKey || ''
    });
  }, []);

  // Save settings handler
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('stock_ai_negative_keywords', newSettings.negativeKeywords);
    localStorage.setItem('stock_ai_artist', newSettings.artistName);
    localStorage.setItem('stock_ai_model', newSettings.model);
    localStorage.setItem('stock_ai_concurrency', newSettings.maxConcurrency.toString());
    
    if (newSettings.apiKey) {
      localStorage.setItem('stock_ai_api_key', newSettings.apiKey);
    } else {
      localStorage.removeItem('stock_ai_api_key');
    }
  };

  const handleFilesSelected = (files: File[]) => {
    const newImages: ProcessedImage[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      manualContext: ''
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const updateImageContext = (id: string, context: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, manualContext: context } : img
    ));
  };

  const resetAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setIsProcessingGlobal(false);
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSV(images, settings.artistName);
    if (csvContent) {
      downloadCSV(csvContent, `stock_metadata_${new Date().toISOString().split('T')[0]}.csv`);
    } else {
      alert("No completed images to export.");
    }
  };

  // Generate for a single image
  const generateSingle = async (id: string) => {
    const targetImage = images.find(img => img.id === id);
    if (!targetImage) return;

    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, status: 'processing', error: undefined } : img
    ));

    try {
      const metadata = await generateImageMetadata(
        targetImage.file, 
        targetImage.manualContext,
        settings.negativeKeywords,
        settings.model,
        settings.apiKey
      );
      
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'completed', metadata } : img
      ));
    } catch (err: any) {
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'error', error: err.message || "Failed" } : img
      ));
    }
  };

  // Generate All Pending with Concurrency Limit
  const processAllPending = useCallback(async () => {
    const pendingImages = images.filter(img => img.status === 'pending' || img.status === 'error');
    if (pendingImages.length === 0) return;

    setIsProcessingGlobal(true);
    
    // Concurrency control using a worker pool concept
    const limit = settings.maxConcurrency || 5;
    const executing: Promise<void>[] = [];

    for (const imageItem of pendingImages) {
       // Define the task
       const task = async () => {
           // 1. Mark strictly as processing right before API call
           setImages(prev => prev.map(img => 
             img.id === imageItem.id 
               ? { ...img, status: 'processing', error: undefined } 
               : img
           ));

           try {
             const metadata = await generateImageMetadata(
               imageItem.file, 
               imageItem.manualContext,
               settings.negativeKeywords,
               settings.model,
               settings.apiKey
             );
             
             setImages(prev => prev.map(img => 
               img.id === imageItem.id 
                 ? { ...img, status: 'completed', metadata } 
                 : img
             ));
           } catch (err: any) {
             setImages(prev => prev.map(img => 
               img.id === imageItem.id 
                 ? { ...img, status: 'error', error: err.message || "Failed" } 
                 : img
             ));
           }
       };

       // 2. Add to execution pool
       const p = task().then(() => {
           // Remove from executing array when done
           executing.splice(executing.indexOf(p), 1);
       });
       executing.push(p);

       // 3. If pool is full, wait for the fastest one to finish
       if (executing.length >= limit) {
           await Promise.race(executing);
       }
    }

    // Wait for remaining tasks
    await Promise.all(executing);
    setIsProcessingGlobal(false);
  }, [images, settings.negativeKeywords, settings.model, settings.maxConcurrency, settings.apiKey]);

  const pendingCount = images.filter(i => i.status === 'pending' || i.status === 'error').length;
  const completedCount = images.filter(i => i.status === 'completed').length;
  const totalCount = images.length;
  const progressPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="min-h-screen pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <div className="space-y-8">
        
        {/* Upload Area */}
        <div className="max-w-3xl mx-auto">
           <ImageUploader onFilesSelected={handleFilesSelected} isProcessing={isProcessingGlobal} />
        </div>

        {/* Action Bar */}
        {images.length > 0 && (
          <div className="sticky top-4 z-40 max-w-3xl mx-auto animate-in slide-in-from-top-4">
            <div className="bg-slate-800/90 backdrop-blur-md border border-slate-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-3 flex flex-wrap gap-2 justify-between items-center px-4">
                <div className="flex items-center mr-auto">
                  <span className="text-sm font-bold text-slate-200 ml-2 bg-slate-700 px-2 py-0.5 rounded-md">
                     {images.length}
                  </span>
                  <span className="text-sm text-slate-400 ml-2 hidden sm:inline">Images Loaded</span>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={resetAll}
                    disabled={isProcessingGlobal}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    title="Clear All"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>

                  {completedCount > 0 && (
                     <button
                      onClick={handleDownloadCSV}
                      disabled={isProcessingGlobal}
                      className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-indigo-500/30"
                      title="Download CSV"
                     >
                       <Download className="w-4 h-4" />
                       <span className="hidden sm:inline">Download CSV</span>
                     </button>
                  )}
                  
                  {pendingCount > 0 && (
                    <button
                      onClick={processAllPending}
                      disabled={isProcessingGlobal}
                      className={`
                        flex items-center px-4 sm:px-6 py-2 rounded-lg font-bold text-sm shadow-lg transform transition-all
                        ${isProcessingGlobal
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 hover:shadow-indigo-500/25'
                        }
                      `}
                    >
                      {isProcessingGlobal ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing {completedCount}/{totalCount}
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2 fill-current" />
                          Generate All ({pendingCount})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              {isProcessingGlobal && (
                <div className="h-1.5 w-full bg-slate-700 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid gap-6">
          {images.map((item) => (
            <MetadataCard 
              key={item.id} 
              item={item} 
              onRemove={removeImage} 
              onUpdateContext={updateImageContext}
              onGenerate={generateSingle}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default App;
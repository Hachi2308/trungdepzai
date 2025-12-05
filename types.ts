export interface StockMetadata {
  title: string;
  description: string;
  keywords: string[];
}

export interface ProcessedImage {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  manualContext: string;
  metadata?: StockMetadata;
  error?: string;
}

export interface AppSettings {
  negativeKeywords: string;
  artistName: string;
  model: string;
  maxConcurrency: number;
}
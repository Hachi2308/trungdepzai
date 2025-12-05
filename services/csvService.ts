import { ProcessedImage } from "../types";

export const generateCSV = (images: ProcessedImage[], artist: string = 'quoctrung'): string => {
  // Filter only completed images
  const completedImages = images.filter(img => img.status === 'completed' && img.metadata);

  if (completedImages.length === 0) {
    return '';
  }

  // Header row as specified
  const header = ['filename', 'title', 'keywords', 'Artist', 'locale', 'description'];
  
  const rows = completedImages.map(img => {
    if (!img.metadata) return null;

    // Helper to escape CSV fields containing commas or quotes
    const escape = (text: string) => {
      if (!text) return '';
      const stringText = String(text);
      // If it contains a comma, quote, or newline, wrap in quotes and escape existing quotes
      if (stringText.includes(',') || stringText.includes('"') || stringText.includes('\n')) {
        return `"${stringText.replace(/"/g, '""')}"`;
      }
      return stringText;
    };

    // Join keywords with commas. Since this string contains commas, the escape function will wrap it in quotes.
    const keywordsString = img.metadata.keywords.join(',');

    return [
      escape(img.file.name),          // filename
      escape(img.metadata.title),     // title
      escape(keywordsString),         // keywords
      escape(artist || 'quoctrung'),  // Artist
      escape('en'),                   // locale
      escape(img.metadata.description)// description
    ].join(',');
  });

  return [header.join(','), ...rows.filter(row => row !== null)].join('\n');
};

export const downloadCSV = (csvContent: string, filename: string = 'stock_metadata.csv') => {
  // Add Byte Order Mark (BOM) \uFEFF for UTF-8 to ensure Vietnamese characters display correctly in Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
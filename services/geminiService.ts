import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StockMetadata } from "../types";

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const metadataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A concise, keyword-rich title (max 7 words).",
    },
    description: {
      type: Type.STRING,
      description: "A concise description containing main keywords (max 25 words).",
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 45-50 keywords sorted strictly by relevance.",
    },
  },
  required: ["title", "description", "keywords"],
};

export const generateImageMetadata = async (
  file: File, 
  userContext: string,
  negativeKeywords: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<StockMetadata> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please connect your Google Account in Settings.");
  }

  // Create a fresh instance to ensure we use the latest key if it changed
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToBase64(file);

  const prompt = `
    You are an elite Stock Photography SEO specialist for Adobe Stock, Shutterstock, and Canva. 
    Your goal is to maximize the 'Findability' and 'Click-Through Rate' of this image.

    Input Context (Main Keywords): "${userContext || 'Extract from image content'}"
    Negative Keywords (MUST EXCLUDE): "${negativeKeywords || 'None'}"
    
    INSTRUCTIONS:
    1. **Analyze**: Identify the main subject, action, lighting, and conceptual meaning.
    2. **Prioritize User Context**: If provided, the Input Context keywords MUST appear in the Title and Description.
    3. **Exclude**: Do NOT use any words from the Negative Keywords list.

    OUTPUT RULES:
    
    A. TITLE (SEO Optimization):
    - Format: [Main Keyword/Subject] + [Action/Context].
    - Length: Extremely concise (Max 7-8 words).
    - Style: Factual and punchy. No filler words.
    
    B. DESCRIPTION (SEO Optimization):
    - Length: Concise (1-2 sentences max).
    - Content: Incorporate the top 3-4 most relevant keywords naturally. 
    
    C. KEYWORDS (Search Visibility):
    - Quantity: Generate exactly 45-50 keywords.
    - **SORTING ORDER IS CRITICAL**:
      1. First 5 tags: The most obvious subjects and the User Context (High volume).
      2. Next 10 tags: Concepts and emotions (e.g., "happiness", "connection").
      3. Next 10 tags: Visual descriptors (e.g., "blue", "bright", "copy space").
      4. Remaining tags: Specific details, people attributes, and variations.
    - Format: Single words or short phrases. Lowercase. English only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: metadataSchema,
        temperature: 0.3,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini.");
    }

    const data = JSON.parse(text) as StockMetadata;

    // Post-processing: Strictly remove negative keywords
    if (negativeKeywords) {
      const negatives = negativeKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
      data.keywords = data.keywords.filter(k => !negatives.includes(k.toLowerCase()));
    }

    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

import { GoogleGenAI, Type } from "@google/genai";
import type { VerificationResult } from '../types';
import { VerificationStatus } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const schema = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      enum: [VerificationStatus.VERIFIED, VerificationStatus.SUSPICIOUS, VerificationStatus.UNVERIFIED],
      description: 'The overall verification status of the document.',
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: 'A score from 0.0 to 1.0 indicating the confidence in the verification status.',
    },
    extractedDetails: {
      type: Type.ARRAY,
      description: 'Key-value pairs of information extracted from the document.',
      items: {
        type: Type.OBJECT,
        properties: {
          field: { type: Type.STRING, description: 'The name of the data field (e.g., Name, ID Number).' },
          value: { type: Type.STRING, description: 'The extracted value for the field.' },
        },
        required: ['field', 'value'],
      },
    },
    inconsistencies: {
      type: Type.ARRAY,
      description: 'A list of detected issues, anomalies, or signs of potential forgery.',
      items: {
        type: Type.STRING,
      },
    },
    summary: {
      type: Type.STRING,
      description: 'A brief summary of the verification findings.',
    },
  },
  required: ['status', 'confidenceScore', 'extractedDetails', 'inconsistencies', 'summary'],
};


export const verifyDocument = async (file: File): Promise<VerificationResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(file);

  const prompt = `You are an expert AI document verification system. Analyze the provided image of an official document. Your task is to: 
    1. Determine the authenticity status ('${VerificationStatus.VERIFIED}', '${VerificationStatus.SUSPICIOUS}', or '${VerificationStatus.UNVERIFIED}'). 
    2. Provide a confidence score (from 0.0 to 1.0). 
    3. Extract key details (like 'Name', 'Document Type', 'ID Number', 'Date of Birth', 'Expiration Date'). 
    4. List any inconsistencies or potential signs of forgery (e.g., 'Mismatched fonts', 'Blurry text in critical areas', 'Unusual hologram reflection'). If none, return an empty array.
    5. Provide a brief summary of your findings. 
    
    Respond ONLY with the JSON object defined in the schema. Do not include any other text or markdown formatting.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: prompt },
        imagePart,
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  try {
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result as VerificationResult;
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Could not parse the verification result from AI.");
  }
};

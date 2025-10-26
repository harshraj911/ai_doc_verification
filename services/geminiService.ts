
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


export const verifyDocument = async (file: File): Promise<VerificationResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const documentPart = await fileToGenerativePart(file);

  const prompt = `
    You are an expert AI document verification specialist. Your tasks are to:
    1.  First, act as a machine learning classifier to identify the document type (e.g., Passport, Driver's License, Invoice, Utility Bill).
    2.  Carefully analyze the provided document image or PDF for authenticity.
    3.  Assess its validity and assign a verification status: 'Verified', 'Suspicious', or 'Unverified'.
    4.  Provide a confidence score between 0.0 and 1.0 for your assessment.
    5.  Extract all relevant key-value pairs of information from the document (e.g., Name, ID Number, Address, Dates).
    6.  Identify and list any potential inconsistencies, signs of tampering, or irregularities. If none, return an empty array.
    7.  Provide a concise one-sentence summary of your findings.

    Strictly follow the provided JSON schema for your response.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      status: {
        type: Type.STRING,
        enum: [
          VerificationStatus.VERIFIED,
          VerificationStatus.SUSPICIOUS,
          VerificationStatus.UNVERIFIED,
        ],
        description: 'The verification status of the document.',
      },
      confidenceScore: {
        type: Type.NUMBER,
        description: 'A score from 0.0 to 1.0 representing the confidence in the verification status. For example, 0.95.',
      },
      documentType: {
          type: Type.STRING,
          description: 'The classified type of the document (e.g., "Passport", "Driver\'s License", "Invoice").'
      },
      extractedDetails: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            field: {
              type: Type.STRING,
              description: 'The name of the extracted field (e.g., "Name", "Date of Birth").',
            },
            value: {
              type: Type.STRING,
              description: 'The value of the extracted field.',
            },
          },
          required: ['field', 'value'],
        },
        description: 'A list of key details extracted from the document.',
      },
      inconsistencies: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: 'A list of detected inconsistencies or potential issues.',
      },
      summary: {
        type: Type.STRING,
        description: 'A brief, one-sentence summary of the verification findings.',
      },
    },
    required: ['status', 'confidenceScore', 'documentType', 'extractedDetails', 'inconsistencies', 'summary'],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: prompt },
        documentPart,
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    }
  });

  const jsonText = response.text.trim();
  
  try {
    const parsedJson = JSON.parse(jsonText);
    return parsedJson as VerificationResult;
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonText);
    throw new Error("The AI returned an invalid response format.");
  }
};

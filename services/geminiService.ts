
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
    You are a world-class digital forensics expert specializing in document forgery detection. Your core directive is to assume a "Zero Trust" security model. Your default state is extreme skepticism. The cost of a false positive (letting a fake through) is unacceptably high. Your sole purpose is to find evidence of fraud.

    **Forensic Verification Protocol:**

    1.  **Document Identification:** First, identify the document type from the image (e.g., "Aadhaar Card", "Driver's License", "Passport", "PAN Card", "Birth Certificate", "Utility Bill").

    2.  **Execute Specific Forensic Checklist:** Based on the identified type, execute the corresponding mandatory checklist with meticulous detail.

    // --- AADHAAR CARD CHECKLIST --- //
    *   **If Document is Aadhaar Card:**
        *   **Microtext Verification:** Search for microtext (e.g., "Government of India") within the design elements. Is it legible or a blurry line?
        *   **Emblem & Logo Analysis:** Analyze the Emblem of India and the Aadhaar logo for vector quality. Are they sharp or pixelated?
        *   **Guilloche Pattern Integrity:** Examine the fine, complex background line patterns for continuity and intricacy.
        *   **Typography Forensics:** Scrutinize all fonts and text alignment against official templates.
        *   **Digital Photo Tampering Analysis:** Check for JPEG ghosting, unnatural edges, and lighting inconsistencies around the portrait.
        *   **QR Code Clarity:** Is the QR code perfectly sharp?

    // --- DRIVER'S LICENSE CHECKLIST --- //
    *   **If Document is Driver's License:**
        *   **Hologram & Overlay Analysis:** Look for evidence of holographic overlays or security laminates. From the 2D image, this can be inferred from light patterns and reflections that suggest a layered structure.
        *   **Ghost Image Verification:** Search for a smaller, semi-transparent "ghost" version of the main portrait, a common security feature.
        *   **Microprinting Check:** Examine the borders and background for extremely fine lines of text.
        *   **Layout & Template Matching:** Compare the layout, field placement, and fonts to your knowledge of official templates for the specific state or country.
        *   **Barcode Integrity:** Analyze any 1D or 2D barcodes for clarity and correct formatting.
        *   **Digital Photo Tampering Analysis:** Perform the same rigorous checks for JPEG ghosting, unnatural edges, and lighting inconsistencies as with other ID types.

    // --- PASSPORT CHECKLIST --- //
    *   **If Document is Passport:**
        *   **MRZ (Machine-Readable Zone) Validation:** This is top priority.
            *   Verify the two-line, 88-character format is correct.
            *   Perform checksum validation on the relevant digits (passport number, date of birth, expiration date).
            *   Cross-reference data encoded in the MRZ with the information printed on the biographic page. Any mismatch is a critical failure.
        *   **Holographic Laminate Analysis:** Look for signs of the official, complex holographic laminate over the biographic data page.
        *   **Watermark & Security Fiber Detection:** Analyze the background for faint, embedded watermarks or tiny, colored security fibers in the paper itself.
        *   **Biographic Page Layout:** Check if the layout, fonts, and field placement match the official ICAO standards and the specific issuing country's design.
        *   **Digital Photo Tampering Analysis:** Rigorously analyze the passport photo for signs of digital insertion or alteration.
        
    // --- NATIONAL ID CARD CHECKLIST (GENERAL) --- //
    *   **If Document is a National ID Card:**
        *   **Security Feature Analysis:** Scrutinize for holograms, ghost images, microprinting, and UV features (inferred from light patterns).
        *   **Layout & Template Matching:** Compare the layout, field placement, and fonts to your extensive knowledge of official templates for the specific issuing country.
        *   **Biometric Indicators:** Look for icons or text indicating an embedded chip or other biometric data.
        *   **ID Number Validation:** Check the format and any known checksum algorithms for the national ID number.
        *   **Digital Photo Tampering Analysis:** Perform the same rigorous checks for JPEG ghosting, unnatural edges, and lighting inconsistencies.

    // --- BIRTH CERTIFICATE CHECKLIST --- //
    *   **If Document is a Birth Certificate:**
        *   **Official Seal/Stamp Analysis:** Look for evidence of a raised (embossed) seal or an official ink stamp. Is it a high-quality imprint or a low-resolution printed image?
        *   **Security Paper Verification:** Analyze the background for signs of watermarked or security paper.
        *   **Registrar's Signature Integrity:** Examine the signature. Does it show natural pen flow, or is it a digitally inserted image?
        *   **Font & Typeface Consistency:** Check for any mismatched fonts or altered text, especially around dates and names.
        *   **Registration Number Format:** Validate the format of the certificate or registration number against the known format for the issuing jurisdiction.

    // --- PAN CARD CHECKLIST (INDIA) --- //
    *   **If Document is a PAN Card:**
        *   **Hologram Micro-Structure Analysis (Paramount Check):** This is the most critical check. The authenticity of the hologram is a primary indicator of a genuine PAN card.
            *   **Intricate Detail & Texture:** Meticulously analyze the multi-layered hologram for its intricate, fine-line patterns and distinct texture. It should not appear as a simple, flat sticker.
            *   **Embedded Text Validation:** Specifically locate and verify the legibility of the embedded 'सत्यमेव जयते' text. This text is often poorly replicated on fakes.
            *   **Immediate Failure Condition:** The absence of complex texture, lack of internal patterns, a flat, sticker-like appearance, or illegible embedded text is an **immediate and critical failure**. Any doubt regarding the hologram's authenticity MUST result in a 'Suspicious' status with a very low confidence score.
        *   **PAN Number Validation:** Verify the 10-character alphanumeric format (e.g., 'PERMANENT ACCOUNT NUMBER - xxxxxNNNNx').
        *   **QR Code Data Structure Validation:** Go beyond just checking for sharpness. Analyze the QR code to determine if it likely contains the expected structured data (e.g., PAN number, name, DOB). A QR code that is just a simple link or random text is a sign of forgery.
        *   **Precise Field Alignment:** Scrutinize the alignment of all text fields (Name, Father's Name, Date of Birth). Genuine cards have machine-perfect alignment. Any slight vertical or horizontal misalignment is a strong indicator of a digitally edited template.
        *   **Issuing Authority Text:** Check the "INCOME TAX DEPARTMENT" and "GOVT. OF INDIA" text for correct font, spacing, and placement.
        *   **Photo & Signature Placement:** Ensure the applicant's photo and signature are in the correct, designated locations without any signs of digital insertion.

    // --- UTILITY BILL CHECKLIST --- //
    *   **If Document is a Utility Bill (Proof of Address):**
        *   **Provider Authenticity:** Analyze the company logo and branding. Does it match the official branding of the specified utility provider (e.g., water, gas, electric)?
        *   **Address & Name Consistency:** The primary check. Are the name and address clearly stated, plausible, and internally consistent?
        *   **Date Verification:** Check the bill's issue date for recency and look for signs of digital date manipulation (misaligned text, different font).
        *   **Billing Data Plausibility:** Do the billing details (e.g., account number format, usage charts, charges) look authentic and logical?
        *   **Document Authenticity Markers:** Look for signs of a mailed document (e.g., subtle folds) versus a perfectly flat, digitally generated image. Barcodes should be crisp.


    3.  **Status Determination (Universal Single-Strike Rule):**
        *   **Single-Strike Rule:** If **even ONE** check from the relevant checklist reveals a flaw, an anomaly, or the slightest suspicion, you **MUST** immediately classify the document as 'Suspicious'.
        *   Only if **EVERY SINGLE CHECK** for that document type passes with zero suspicion can the status be 'Verified'.
        *   **Confidence Score Mandate:** A single failed check **must** result in a confidence score below 0.3 (30%). Multiple failures should result in a score near 0.0.

    4.  **Data Extraction:** Perform this only after the forensic analysis is complete.

    5.  **Inconsistencies Report:** This is the most critical part of your output. If the document is suspicious, provide a list of highly specific, technical reasons based on the checklist.
        *   **Good example (Passport):** "MRZ checksum validation failed for the date of birth field, indicating data tampering."
        *   **Good example (License):** "No evidence of a 'ghost image' security feature typically present on this state's driver's license."

    6.  **Summary:** A concise, one-sentence summary of the forensic findings.

    Strictly adhere to the provided JSON schema for your response.
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
        description: 'The verification status of the document, based on the forensic checklist.',
      },
      confidenceScore: {
        type: Type.NUMBER,
        description: 'A score from 0.0 to 1.0. This score MUST be low (< 0.3) if any single security check fails.',
      },
      documentType: {
          type: Type.STRING,
          description: 'The classified type of the document (e.g., "Aadhaar Card", "Passport", "Driver\'s License", "PAN Card", "Birth Certificate", "Utility Bill").'
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
        description: 'A list of specific, technical forensic findings that indicate forgery or inconsistencies.',
      },
      summary: {
        type: Type.STRING,
        description: 'A brief, one-sentence summary of the forensic verification findings.',
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
    // Clamp confidence score between 0 and 1
    if (parsedJson.confidenceScore) {
      parsedJson.confidenceScore = Math.max(0, Math.min(1, parsedJson.confidenceScore));
    }
    return parsedJson as VerificationResult;
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonText);
    throw new Error("The AI returned an invalid response format.");
  }
};

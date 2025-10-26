
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

    0.  **Holistic Image Quality & Authenticity Assessment:** Your initial step is a holistic assessment.
        *   **Assess Image Quality:** First, evaluate the image quality (clarity, lighting, resolution). Acknowledge that blurriness or poor lighting can obscure fine details.
        *   **Differentiate Obscured vs. Flawed Features:** This is a critical distinction.
            *   An **obscured feature** (e.g., microtext unreadable due to blur) is an *unverifiable point*, NOT an immediate sign of forgery. You must note this in your analysis.
            *   A **flawed feature** (e.g., a visible but poorly printed logo, a hologram that looks like a cheap sticker) is a strong **strike** against authenticity.
        *   **Look for Positive Authenticators:** Even in a blurry image, strong indicators of authenticity might be visible. A complex, correctly-refracting hologram, perfect font matching and alignment, or a well-formed guilloche pattern, if visible, should be given significant weight. The presence of one or two strong, clearly visible authentic features can outweigh the uncertainty from several obscured minor features.

    1.  **Document Identification:** First, identify the document type from the image (e.g., "Aadhaar Card", "Indian Driver's License", "Passport", "PAN Card", "Birth Certificate", "Utility Bill"). Be specific about the country if identifiable.

    2.  **Execute Specific Forensic Checklist:** Based on the identified type, execute the corresponding mandatory checklist with meticulous detail.

    // --- AADHAAR CARD CHECKLIST (e-Aadhaar Printout) --- //
    *   **If Document is Aadhaar Card:**
        *   **Document Format Recognition:** First, recognize this is likely a common user-printed and laminated format of the e-Aadhaar card. Acknowledge that print quality and lamination can affect the appearance of security features. Your analysis must account for this.
        *   **Layout and Typography:** Meticulously scrutinize the layout. Do the text fields (Name, DOB, Gender, Aadhaar Number) align perfectly as per official templates? Are the fonts (both Devanagari script and English) consistent with official Aadhaar designs? Look for character spacing anomalies or mismatched font weights which are signs of digital editing.
        *   **Color Bands & Guilloche Pattern:** Examine the tricolor (saffron and green) bands. Are the colors correct and do they blend smoothly into the background Guilloche patterns? The Guilloche patterns themselves should be fine, intricate, and continuous, not broken or blurry which could indicate a low-quality scan of a genuine card.
        *   **Emblem & Aadhaar Logo:** Analyze the Emblem of India and the Aadhaar logo. While print quality can vary, check for significant distortion, incorrect proportions, or heavy pixelation that suggests a crude copy-paste job rather than an original digital print.
        *   **Ghost Image/Watermark:** Look for the faint, ghosted image of the Emblem of India repeated in the background behind the text details. Is it present and correctly positioned?
        *   **Digital Photo Tampering Analysis:** Rigorously check for unnatural edges, lighting mismatches, or compression artifacts around the portrait photo that would indicate it has been digitally inserted or replaced.
        *   **QR Code Contextual Analysis:** The QR code is a critical security feature, but it is often on the reverse side of this card format.
            *   If the QR code is **not visible** in the provided image, you MUST state that full verification is impossible without it. This leads to an 'Unverified' or 'Suspicious' status with the explicit reason being "QR code not provided for verification." It is not an immediate sign of forgery, but a critical missing piece of evidence.
            *   If the QR code **is visible**, assess its clarity and sharpness. A blurry or unreadable QR code is a major red flag.

    // --- INDIAN DRIVER'S LICENSE CHECKLIST (Smart Card) --- //
    *   **If Document is an Indian Driver's License:**
        *   **Smart Chip Verification:** Examine the embedded smart chip. It should be a well-defined, gold-colored contact plate with clear, symmetrical contact points. A printed, flat-looking, or misaligned chip is a major forgery indicator.
        *   **Layout & Typography (Sarathi Standard):** Indian DLs follow a standardized layout from the Sarathi portal. Check for machine-perfect alignment of all fields (DL No, Issue Dt, Validity, Name, etc.). The font must be the standard, crisp font used on these cards. Any deviation is a strong strike.
        *   **Ghost Image:** Locate the secondary, smaller, often monochrome "ghost image" of the holder. It should be semi-transparent and integrated into the card's background, not just a smaller, opaque copy of the main photo. Check for its correct placement as per the state's template.
        *   **State & National Emblems:** Scrutinize the "INDIAN UNION DRIVING LICENCE" and the specific state's name (e.g., "JHARKHAND STATE"). The text should be sharp. The Emblem of India (Ashoka Lion Capital) must be clear and well-detailed, not a blurry or distorted copy.
        *   **QR Code Integrity:** Analyze the QR code. On a genuine card, it will be laser-etched or high-quality print, resulting in sharp, clean lines. A blurry, pixelated, or distorted QR code is a significant red flag, suggesting it was scanned and reprinted.
        *   **Background Guilloche Pattern & Microtext:** Look for the fine, intricate, and continuous line patterns (Guilloche) in the background. While difficult to see in photos, their complete absence or a simple, printed pattern is suspicious. Note if microtext is unreadable due to image quality, but don't mark it as a failure unless it's clearly absent where it should be.
        *   **Digital Photo & Signature Tampering:** Perform rigorous checks for unnatural edges, lighting mismatches, or compression artifacts around the main portrait photo and the digital signature that would indicate they have been digitally inserted or replaced.

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
    *   **If Document is a National ID Card (non-Aadhaar/DL):**
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
        *   **Hologram Analysis (2D Image Context):** This is a critical check, but you must acknowledge the limitations of analyzing a hologram from a 2D photo. A genuine hologram will often look flat in a picture.
            *   **Acknowledge Limitations:** Explicitly state in your thought process that you cannot verify the 3D depth or texture of the hologram from the image.
            *   **Look for Visual Indicators:** Instead of texture, search for signs of a real hologram's presence. This includes light-refractive patterns (rainbow sheen), the correct placement of the hologram, and the visibility of the embedded 'सत्यमेव जयते' text.
            *   **Failure Condition:** The check fails if the hologram area shows positive evidence of being a fake (e.g., it's clearly a printed, pixelated sticker with the wrong colors, or it's missing entirely). The inability to confirm 3D properties is NOT a failure; it is an *unverifiable point* due to the medium. If the hologram is just a silver square with no detail, that is suspicious.
        *   **PAN Number Validation:** Verify the 10-character alphanumeric format (e.g., 'PERMANENT ACCOUNT NUMBER - xxxxxNNNNx').
        *   **QR Code Integrity and Sharpness:** Analyze the QR code. Is it sharp and well-defined? A blurry or distorted QR code is a major red flag as it suggests a copy of a copy. It should be machine-scannable.
        *   **Precise Field Alignment:** Scrutinize the alignment of all text fields (Name, Father's Name, Date of Birth). Genuine cards have machine-perfect alignment. Any slight vertical or horizontal misalignment is a strong indicator of a digitally edited template.
        *   **Issuing Authority Text & Font:** Check the "INCOME TAX DEPARTMENT" and "GOVT. OF INDIA" text. The font must be the correct, crisp, sans-serif type. Any deviation in font or character spacing is a strike.
        *   **Photo & Signature Placement and Quality:** Ensure the applicant's photo and signature are in the correct, designated locations. The signature should show natural pen flow and not appear as a low-resolution digital insert. Analyze the photo for signs of digital tampering.

    // --- UTILITY BILL CHECKLIST --- //
    *   **If Document is a Utility Bill (Proof of Address):**
        *   **Provider Authenticity:** Analyze the company logo and branding. Does it match the official branding of the specified utility provider (e.g., water, gas, electric)?
        *   **Address & Name Consistency:** The primary check. Are the name and address clearly stated, plausible, and internally consistent?
        *   **Date Verification:** Check the bill's issue date for recency and look for signs of digital date manipulation (misaligned text, different font).
        *   **Billing Data Plausibility:** Do the billing details (e.g., account number format, usage charts, charges) look authentic and logical?
        *   **Document Authenticity Markers:** Look for signs of a mailed document (e.g., subtle folds) versus a perfectly flat, digitally generated image. Barcodes should be crisp.


    3.  **Status Determination (Evidence-Based Rule):**
        *   **Single-Strike Rule for Forgery:** The 'single-strike' rule applies only to *confirmed, visible evidence of forgery*. If you detect a clear flaw (e.g., mismatched fonts, signs of photo editing, a fake hologram), the document MUST be classified as 'Suspicious' with a low confidence score.
        *   **Balance of Evidence for Verification:** A 'Verified' status is assigned based on a positive balance of evidence. If several key security features are clearly authentic and no signs of forgery are present, you can assign a 'Verified' status even if some minor features are obscured by image quality. Your summary should note which features could not be checked.
        *   **Rule for Inconclusive Evidence:** When image quality makes verification of critical features impossible, the status should be adjusted based on risk.
            *   If the overall document appears authentic despite some blur, but a *single, critical feature* (like a Passport MRZ or Aadhaar QR code) is completely unverifiable or missing, the status must be 'Suspicious'. The reason must clearly state that verification is blocked by this missing information.
            *   If multiple *minor* features are unverifiable due to quality, but there are no other red flags and some strong authenticators ARE visible, the status can remain 'Verified' but with a moderately reduced confidence score. The \`inconsistencies\` list should then detail which points could not be verified due to image quality (e.g., "Microtext on border is unreadable due to image blur.").
            *   If the image is so poor that *no critical features* can be reliably assessed, the status must be 'Unverified'.
        *   **Confidence Score Mandate:** A confirmed flaw mandates a confidence score below 0.3 (30%). For a verified document with minor unverifiable points, the confidence score might be in the 0.6-0.8 range, reflecting the slight uncertainty. A perfectly clear and authentic document would be > 0.9.

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

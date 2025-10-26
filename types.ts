
export enum VerificationStatus {
  VERIFIED = 'Verified',
  SUSPICIOUS = 'Suspicious',
  UNVERIFIED = 'Unverified',
}

export interface ExtractedDetail {
  field: string;
  value: string;
}

export interface VerificationResult {
  status: VerificationStatus;
  confidenceScore: number;
  extractedDetails: ExtractedDetail[];
  inconsistencies: string[];
  summary: string;
}

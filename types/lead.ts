export type Priority = "Hot" | "Warm" | "Cold";

export type LeadFormData = {
  name: string;
  email: string;
  phone: string;
  serviceNeeded: string;
  budget: string;
  timeline: string;
  message: string;
};

export type LeadQualificationResult = {
  leadScore: number;
  priority: Priority;
  summary: string;
  recommendedAction: string;
  draftReply: string;
  salesNotes: string[];
  missingInfo: string[];
};

export type AutomationStatus = {
  sentToN8n: boolean;
  message: string;
};

export type QualifyLeadSuccessResponse = {
  result: LeadQualificationResult;
  automation: AutomationStatus;
};

export type QualifyLeadErrorResponse = {
  error: string;
};

export type QualifyLeadResponse =
  | QualifyLeadSuccessResponse
  | QualifyLeadErrorResponse;
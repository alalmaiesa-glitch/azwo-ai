export type VerificationStatus =
  | "discovered"
  | "relevant"
  | "reviewed"
  | "tested"
  | "approved"
  | "rejected"
  | "needs_review";

export type IntegrationStatus =
  | "not_connected"
  | "connector_draft"
  | "connected"
  | "disabled"
  | "error";

export type PublicApiCatalogEntry = {
  name: string;
  description: string;
  category: string;
  auth_type: string;
  https: boolean;
  cors: "Yes" | "No" | "Unknown";
  documentation_url: string;
  source: string;
  relevance_score: number;
  azwo_use_case: string | null;
  verification_status: VerificationStatus;
  integration_status: IntegrationStatus;
  enabled: boolean;
  last_checked_at: null;
};

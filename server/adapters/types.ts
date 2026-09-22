export type SourceEvidence = {
  sourceId: string;
  sourceName: string;
  canonicalUrl?: string;
  location?: string;
  excerpt: string;
  rightsStatus: "public_domain" | "licensed" | "restricted" | "unknown";
  provider: string;
  metadata?: Record<string, unknown>;
};

export interface KnowledgeSourceAdapter {
  search(query: string, options?: Record<string, unknown>): Promise<SourceEvidence[]>;
}

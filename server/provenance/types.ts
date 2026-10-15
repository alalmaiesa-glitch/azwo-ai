export type AssetType =
  | "text" | "document" | "image" | "manuscript"
  | "audio" | "video" | "url" | "dataset";

export type SegmentType =
  | "whole" | "page" | "folio" | "page_region"
  | "paragraph" | "sentence" | "table" | "image_region"
  | "frame" | "time_range" | "audio_segment"
  | "caption" | "metadata_block";

export type ProvenanceRelationType =
  | "derived_from" | "generated_by" | "attributed_to"
  | "revision_of" | "version_of" | "cites" | "cited_by"
  | "supports" | "contradicts" | "same_as" | "depicts"
  | "transcribes" | "extracted_from" | "published_by"
  | "stored_at" | "located_at" | "part_of"
  | "translation_of" | "reproduction_of" | "mentions"
  | "created_from";

export interface ProvenanceAssetRef {
  id: string;
  asset_type: AssetType;
  sha256?: string | null;
  canonical_url?: string | null;
  status: "ingested" | "processing" | "ready" | "needs_review" | "error" | "archived";
}

export interface ProvenanceEdge {
  id: string;
  subject_entity_id: string;
  relation_type: ProvenanceRelationType;
  object_entity_id?: string | null;
  activity_id?: string | null;
  agent_id?: string | null;
  confidence?: number | null;
  review_status: "unreviewed" | "verified" | "rejected" | "needs_review";
}

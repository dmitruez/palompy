export interface KnowledgeChunk {
  id: number;
  shop_id: number;
  source_type: string;
  source_id: string | null;
  text: string;
  created_at: string;
}

export interface KnowledgeDocument {
  sourceType: string;
  sourceId?: string;
  text: string;
  chunkSize?: number;
}

import { openai } from '../config/openai';
import { env } from '../config/env';
import { pool } from '../config/db';
import { KnowledgeChunk, KnowledgeDocument } from '../models/knowledgeChunk';
import { chunkText } from '../utils/chunkText';

function toPgVector(values: number[]): string {
  return `[${values.join(',')}]`;
}

export async function ingestKnowledgeDocuments(
  shopId: number,
  documents: KnowledgeDocument[],
): Promise<number> {
  let inserted = 0;

  for (const doc of documents) {
    const chunks = chunkText(doc.text, { chunkSize: doc.chunkSize ?? 700 });
    for (const chunk of chunks) {
      const embeddingResponse = await openai.embeddings.create({
        model: env.embeddingModel,
        input: chunk,
      });
      const embedding = embeddingResponse.data[0]?.embedding;
      if (!embedding) {
        continue;
      }
      await pool.query(
        `INSERT INTO knowledge_chunks (shop_id, source_type, source_id, text, embedding)
         VALUES ($1, $2, $3, $4, $5)`,
        [shopId, doc.sourceType, doc.sourceId ?? null, chunk, toPgVector(embedding)],
      );
      inserted += 1;
    }
  }

  return inserted;
}

export async function searchRelevantChunks(
  shopId: number,
  query: string,
  limit = 5,
): Promise<KnowledgeChunk[]> {
  if (!query.trim()) {
    return [];
  }
  const embeddingResponse = await openai.embeddings.create({
    model: env.embeddingModel,
    input: query,
  });
  const embedding = embeddingResponse.data[0]?.embedding;
  if (!embedding) {
    return [];
  }

  const { rows } = await pool.query<KnowledgeChunk>(
    `SELECT id, shop_id, source_type, source_id, text, created_at
     FROM knowledge_chunks
     WHERE shop_id = $1
     ORDER BY embedding <=> $2
     LIMIT $3`,
    [shopId, toPgVector(embedding), limit],
  );

  return rows;
}

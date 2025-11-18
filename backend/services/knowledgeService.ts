import { KnowledgeChunk, KnowledgeDocument } from '../models/knowledgeChunk';
import { chunkText } from '../utils/chunkText';
import { getDatabase, nextId, persistDatabase } from '../storage/database';

function normalizeToken(token: string): string {
  return token.replace(/[аеёиоуыэюя]$/u, '').replace(/[aeiou]$/u, '');
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9\u0400-\u04FF]+/g) ?? [])
    .map((token) => normalizeToken(token))
    .filter(Boolean);
}

function scoreText(text: string, queryTokens: string[]): number {
  if (!queryTokens.length) {
    return 0;
  }
  const tokens = tokenize(text);
  if (!tokens.length) {
    return 0;
  }
  const tokenSet = new Set(tokens);
  let matches = 0;
  for (const token of queryTokens) {
    if (tokenSet.has(token)) {
      matches += 1;
    }
  }
  return matches / queryTokens.length;
}

export async function ingestKnowledgeDocuments(shopId: number, documents: KnowledgeDocument[]): Promise<number> {
  const db = getDatabase();
  let inserted = 0;

  for (const doc of documents) {
    const chunks = chunkText(doc.text, { chunkSize: doc.chunkSize ?? 700 });
    for (const chunk of chunks) {
      const record: KnowledgeChunk = {
        id: nextId(db.knowledge_chunks),
        shop_id: shopId,
        source_type: doc.sourceType,
        source_id: doc.sourceId ?? null,
        text: chunk,
        created_at: new Date().toISOString(),
      };
      db.knowledge_chunks.push(record);
      inserted += 1;
    }
  }

  if (inserted > 0) {
    persistDatabase();
  }

  return inserted;
}

export async function searchRelevantChunks(
  shopId: number,
  query: string,
  limit = 5,
): Promise<KnowledgeChunk[]> {
  const db = getDatabase();
  const queryTokens = tokenize(query);
  if (!queryTokens.length) {
    return [];
  }

  const scored = db.knowledge_chunks
    .filter((chunk) => chunk.shop_id === shopId)
    .map((chunk) => ({ chunk, score: scoreText(chunk.text, queryTokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.chunk);

  return scored;
}

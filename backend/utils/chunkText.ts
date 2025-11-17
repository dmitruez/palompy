interface ChunkTextOptions {
  chunkSize?: number;
  overlap?: number;
}

export function chunkText(text: string, options: ChunkTextOptions = {}): string[] {
  const sanitized = text.replace(/\s+/g, ' ').trim();
  if (!sanitized) {
    return [];
  }

  const chunkSize = options.chunkSize ?? 700;
  const overlap = options.overlap ?? 100;

  if (sanitized.length <= chunkSize) {
    return [sanitized];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < sanitized.length) {
    const end = Math.min(start + chunkSize, sanitized.length);
    const chunk = sanitized.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    if (end === sanitized.length) {
      break;
    }
    start = Math.max(0, end - overlap);
  }

  return chunks;
}

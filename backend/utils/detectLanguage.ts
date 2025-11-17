export type SupportedLanguage = 'ru' | 'en';

export function detectLanguage(message: string): SupportedLanguage {
  const cyrillicRatio = (message.match(/[\u0400-\u04FF]/g) ?? []).length / Math.max(1, message.length);
  if (cyrillicRatio > 0.15) {
    return 'ru';
  }
  return 'en';
}

/**
 * Split text into chunks of at most maxLen characters.
 * Tries to break at newline or space boundaries.
 */
export function chunkText(text: string, maxLen: number = 1000): string[] {
  if (!text) return [];
  if (text.length <= maxLen) return [text];
  return text.match(new RegExp(`.{1,${maxLen}}`, 'g')) || [];
}

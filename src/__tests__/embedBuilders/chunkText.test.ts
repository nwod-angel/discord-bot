import { describe, it, expect } from 'vitest';
import { chunkText } from '../../embedBuilders/chunkText.js';

describe('chunkText', () => {
  it('returns single chunk for text shorter than maxLen', () => {
    expect(chunkText('hello', 10)).toEqual(['hello']);
  });

  it('returns single chunk for text exactly maxLen', () => {
    expect(chunkText('12345', 5)).toEqual(['12345']);
  });

  it('splits text longer than maxLen into multiple chunks each <= maxLen', () => {
    const text = 'a'.repeat(2500);
    const chunks = chunkText(text, 1000);
    expect(chunks.length).toBe(3);
    chunks.forEach(chunk => expect(chunk.length).toBeLessThanOrEqual(1000));
    expect(chunks.join('')).toBe(text);
  });

  it('returns empty array for empty string', () => {
    expect(chunkText('')).toEqual([]);
  });

  it('returns empty array for falsy input', () => {
    expect(chunkText(undefined as any)).toEqual([]);
    expect(chunkText(null as any)).toEqual([]);
  });
});

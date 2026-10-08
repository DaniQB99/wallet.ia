import { describe, it, expect } from 'vitest';
import { sanitizeEmoji } from './emoji';

describe('sanitizeEmoji', () => {
  it('should return regular emojis unchanged', () => {
    expect(sanitizeEmoji('💵')).toBe('💵');
    expect(sanitizeEmoji('🍺')).toBe('🍺');
    expect(sanitizeEmoji('🍔')).toBe('🍔');
  });

  it('should decode \\U0001F... uppercase 8-digit hex codepoints', () => {
    expect(sanitizeEmoji('\\U0001F4B5')).toBe('💵');
    expect(sanitizeEmoji('\\U0001F37A')).toBe('🍺');
    expect(sanitizeEmoji('\\U0001F354')).toBe('🍔');
    expect(sanitizeEmoji('\\U0001F68C')).toBe('🚌');
    expect(sanitizeEmoji('\\U0001F6CD')).toBe('\u{1F6CD}');
    expect(sanitizeEmoji('\\U0001F4F1')).toBe('📱');
    expect(sanitizeEmoji('\\U0001F3E0')).toBe('🏠');
    expect(sanitizeEmoji('\\U0001F6D2')).toBe('🛒');
    expect(sanitizeEmoji('\\U0001F4A1')).toBe('💡');
    expect(sanitizeEmoji('\\U0001F697')).toBe('🚗');
  });

  it('should decode \\u... standard JS hex escapes', () => {
    expect(sanitizeEmoji('\\u{1F4B5}')).toBe('💵');
    expect(sanitizeEmoji('\\u26A1')).toBe('⚡');
  });

  it('should fallback on empty or undefined input', () => {
    expect(sanitizeEmoji(null)).toBe('💳');
    expect(sanitizeEmoji(undefined)).toBe('💳');
    expect(sanitizeEmoji('', '🏷️')).toBe('🏷️');
  });
});

/**
 * Decodifica secuencias de escape unicode literales (ej: '\U0001F4B5', '\\U0001F4B5', '\u1F4B5')
 * a caracteres emoji UTF-8 reales. Si la cadena ya es un emoji normal, la retorna intacta.
 */
export function sanitizeEmoji(icon: string | null | undefined, fallback = '💳'): string {
  if (!icon || typeof icon !== 'string') return fallback;

  // Decodificar \U0001F4B5 o \\U0001F4B5 (hexadecimal de 8 caracteres estándar en volcados SQL)
  let clean = icon.replace(/\\+U([0-9A-Fa-f]{8})/g, (_, hex) => {
    try {
      return String.fromCodePoint(parseInt(hex, 16));
    } catch {
      return _;
    }
  });

  // Decodificar \u{1F4B5} o \u1F4B5
  clean = clean.replace(/\\+u(?:\{([0-9A-Fa-f]+)\}|([0-9A-Fa-f]{4}))/g, (_, hex1, hex2) => {
    try {
      const code = parseInt(hex1 || hex2, 16);
      return String.fromCodePoint(code);
    } catch {
      return _;
    }
  });

  return clean.trim() || fallback;
}

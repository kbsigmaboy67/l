/**
 * Supported encoding types (case-insensitive, with aliases):
 *   base64       → standard base64
 *   hex / hexadecimal → hex string (e.g. 3c68746d6c3e)
 *   uri / url    → encodeURIComponent / percent-encoding
 *   utf8 / utf-8 / plain / text / raw → no encoding, literal text
 *   binary / bin → binary / latin-1 byte string
 *   rot13        → ROT-13 text obfuscation
 */

export function normalizeEncoding(type = '') {
  const t = type.toLowerCase().trim();
  if (t === 'base64' || t === 'b64') return 'base64';
  if (t === 'hex' || t === 'hexadecimal') return 'hex';
  if (t === 'uri' || t === 'url') return 'uri';
  if (t === 'utf8' || t === 'utf-8' || t === 'plain' || t === 'text' || t === 'raw') return 'plain';
  if (t === 'binary' || t === 'bin') return 'binary';
  if (t === 'rot13') return 'rot13';
  return null; // unknown
}

export function decodePayload(encoded, encoding) {
  const norm = normalizeEncoding(encoding);
  switch (norm) {
    case 'base64':
      return atob(encoded);
    case 'hex':
      return hexToString(encoded);
    case 'uri':
      return decodeURIComponent(encoded);
    case 'plain':
      return encoded;
    case 'binary':
      // binary / latin-1: each char code is one byte
      return encoded; // treated as-is in browser
    case 'rot13':
      return rot13(encoded);
    default:
      throw new Error(`Unknown encoding: "${encoding}"`);
  }
}

function hexToString(hex) {
  hex = hex.replace(/\s+/g, '');
  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return result;
}

function rot13(str) {
  return str.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export const ENCODINGS = [
  { slug: 'base64',      label: 'Base64',       example: 'aHR0cHM6Ly9leGFtcGxlLmNvbQ==' },
  { slug: 'hex',         label: 'Hexadecimal',  example: '68656c6c6f' },
  { slug: 'hexadecimal', label: 'Hexadecimal (alias)', example: '68656c6c6f' },
  { slug: 'uri',         label: 'URI / percent', example: 'hello%20world' },
  { slug: 'plain',       label: 'Plain / UTF-8', example: 'hello world' },
  { slug: 'utf-8',       label: 'UTF-8 (alias)', example: 'hello world' },
  { slug: 'binary',      label: 'Binary (latin-1)', example: '\x48\x65\x6c\x6c\x6f' },
  { slug: 'rot13',       label: 'ROT-13',        example: 'uryyb jbeyq' },
];

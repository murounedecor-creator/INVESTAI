/**
 * Computes SHA-256 hash of raw bytes and returns hex string.
 * Uses Web Crypto API (available in Node 18+ and Expo).
 */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const crypto = globalThis.crypto;
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is not available in this runtime');
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a string to Uint8Array using UTF-8 encoding.
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Computes SHA-256 hash of a string (UTF-8 encoded) and returns hex string.
 */
export async function sha256HexOfString(str: string): Promise<string> {
  return sha256Hex(stringToBytes(str));
}

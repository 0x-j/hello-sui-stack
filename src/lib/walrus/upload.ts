const AGGREGATOR_URL = import.meta.env.VITE_WALRUS_AGGREGATOR_URL;

/**
 * Convert base64 data URL to Blob
 */
export function base64ToBlob(base64: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');

  // Decode base64
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create blob
  return new Blob([bytes], { type: 'image/png' });
}

/**
 * Check if Walrus is configured
 */
export function isWalrusConfigured(): boolean {
  return !!(import.meta.env.VITE_WALRUS_PUBLISHER_URL && AGGREGATOR_URL);
}

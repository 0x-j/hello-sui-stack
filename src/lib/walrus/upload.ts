/**
 * Walrus upload utilities using the publisher relay endpoint
 * Based on: https://github.com/MystenLabs/walrus-sdk-relay-example-app
 */

const PUBLISHER_URL = import.meta.env.VITE_WALRUS_PUBLISHER_URL;
const AGGREGATOR_URL = import.meta.env.VITE_WALRUS_AGGREGATOR_URL;

export interface WalrusUploadResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
      blobId: string;
      storedEpoch: number;
      size: number;
    };
    encodedSize: number;
    cost: number;
  };
  alreadyCertified?: {
    blobId: string;
    endEpoch: number;
    eventOrObject: string;
  };
}

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
 * Upload a blob to Walrus using the publisher relay
 */
export async function uploadToWalrus(blob: Blob): Promise<string> {
  if (!PUBLISHER_URL) {
    throw new Error('VITE_WALRUS_PUBLISHER_URL not configured');
  }

  // Upload to Walrus publisher
  const response = await fetch(`${PUBLISHER_URL}/v1/store`, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Walrus upload failed: ${response.status} ${errorText}`);
  }

  const result: WalrusUploadResponse = await response.json();

  // Extract blob ID
  let blobId: string;

  if (result.newlyCreated) {
    blobId = result.newlyCreated.blobObject.blobId;
  } else if (result.alreadyCertified) {
    blobId = result.alreadyCertified.blobId;
  } else {
    throw new Error('Invalid Walrus upload response');
  }

  return blobId;
}

/**
 * Convert blob ID to Walrus URL
 */
export function getWalrusUrl(blobId: string): string {
  if (!AGGREGATOR_URL) {
    throw new Error('VITE_WALRUS_AGGREGATOR_URL not configured');
  }

  return `${AGGREGATOR_URL}/v1/${blobId}`;
}

/**
 * Upload image from base64 data URL and return Walrus URL
 */
export async function uploadImageToWalrus(base64Image: string): Promise<string> {
  // Convert base64 to blob
  const blob = base64ToBlob(base64Image);

  // Upload to Walrus
  const blobId = await uploadToWalrus(blob);

  // Get the URL
  const url = getWalrusUrl(blobId);

  return url;
}

/**
 * Check if Walrus is configured
 */
export function isWalrusConfigured(): boolean {
  return !!(PUBLISHER_URL && AGGREGATOR_URL);
}

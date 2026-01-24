const AGGREGATOR_URL = import.meta.env.VITE_WALRUS_AGGREGATOR_URL;

/**
 * Build a Walrus blob URL from patch ID and blob ID
 */
export function buildWalrusUrl(patchId: string, blobId: string): string {
  if (!AGGREGATOR_URL) {
    throw new Error('VITE_WALRUS_AGGREGATOR_URL not configured');
  }
  return `${AGGREGATOR_URL}/v1/blobs/by-quilt-patch-id/${patchId}?blobId=${blobId}`;
}

/**
 * Parse a Walrus URL to extract patch ID and blob ID
 */
export interface ParsedWalrusUrl {
  patchId: string;
  blobId: string;
}

export function parseWalrusUrl(url: string): ParsedWalrusUrl {
  // Format: ${AGGREGATOR_URL}/v1/blobs/by-quilt-patch-id/${patchId}?blobId=${blobId}
  const urlParts = url.split('/by-quilt-patch-id/');
  const pathAndQuery = urlParts.length > 1 ? urlParts[1] : '';
  const [patchId, queryString] = pathAndQuery.split('?');
  const blobId = queryString ? new URLSearchParams(queryString).get('blobId') || '' : '';

  return {
    patchId: patchId || '',
    blobId,
  };
}

import { WalrusFile } from '@mysten/walrus';
import { walrusClient } from './client';
import type { SignAndExecuteTransaction } from '@mysten/dapp-kit';

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
 * Upload image to Walrus using the official SDK with upload relay
 * Following the pattern from: https://github.com/MystenLabs/walrus-sdk-relay-example-app
 *
 * @param base64Image - Base64 encoded image data URL
 * @param signAndExecuteTransaction - Function to sign and execute transactions
 * @param userAddress - User's Sui address
 * @returns Walrus blob URL
 */
export async function uploadImageToWalrus(
  base64Image: string,
  signAndExecuteTransaction: SignAndExecuteTransaction,
  userAddress: string
): Promise<string> {
  try {
    // Step 1: Convert base64 to blob
    const blob = base64ToBlob(base64Image);
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Step 2: Create WalrusFile
    const files = [
      WalrusFile.from({
        contents: uint8Array,
        identifier: 'profile-nft.png',
        tags: {
          contentType: 'image/png',
        },
      }),
    ];

    // Step 3: Create WriteFilesFlow
    const flow = walrusClient.writeFilesFlow({
      files,
    });

    // Step 4: Encode the file
    await flow.encode();

    // Step 5: Register blob on-chain AND send tip to upload relay
    // The register() method automatically handles BOTH:
    // 1. Registering the blob with storage parameters
    // 2. Sending tip to the upload relay (configured in client.ts with sendTip.max)
    const { digest: registerDigest } = await signAndExecuteTransaction({
      transaction: flow.register({
        epochs: 1, // Store for 1 epoch (about 1 day on testnet)
        deletable: false,
        owner: userAddress,
      }),
    });

    // Step 6: Upload to storage nodes via relay
    await flow.upload({
      digest: registerDigest,
    });

    // Step 7: Certify blob on-chain
    await signAndExecuteTransaction({
      transaction: flow.certify(),
    });

    // Step 8: Get the blob IDs
    const fileList = await flow.listFiles();

    if (fileList.length === 0) {
      throw new Error('No files were uploaded');
    }

    const blobId = fileList[0].blobId;

    // Step 9: Construct Walrus URL
    if (!AGGREGATOR_URL) {
      throw new Error('VITE_WALRUS_AGGREGATOR_URL not configured');
    }

    return `${AGGREGATOR_URL}/v1/${blobId}`;

  } catch (error) {
    console.error('Walrus upload error:', error);
    throw new Error(
      `Failed to upload to Walrus: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if Walrus is configured
 */
export function isWalrusConfigured(): boolean {
  return !!(import.meta.env.VITE_WALRUS_PUBLISHER_URL && AGGREGATOR_URL);
}

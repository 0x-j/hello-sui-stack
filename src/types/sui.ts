// Contract configuration from environment
export const CONTRACT_CONFIG = {
  packageId: import.meta.env.VITE_CONTRACT_PACKAGE_ID as string,
  paymentConfigId: import.meta.env.VITE_PAYMENT_CONFIG_ID as string,
} as const;

// ProfileNFT object type
export interface ProfileNFT {
  id: {
    id: string;
  };
  name: string;
  description: string;
  image_url: string;
  creator: string;
  created_at: string;
}

// Payment config type
export interface PaymentConfig {
  id: {
    id: string;
  };
  price: string;
  treasury: string;
}

// Type guard for ProfileNFT
export function isProfileNFT(obj: any): obj is ProfileNFT {
  return (
    obj &&
    typeof obj === 'object' &&
    'name' in obj &&
    'description' in obj &&
    'image_url' in obj &&
    'creator' in obj &&
    'created_at' in obj
  );
}

// NFT with object ID for display
export interface ProfileNFTWithId extends ProfileNFT {
  objectId: string;
}

// Transaction status
export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

// Image generation state
export interface ImageGenerationState {
  status: TransactionStatus;
  generatedImage: string | null;
  paymentTxDigest: string | null;
  error: string | null;
}

// NFT minting state
export interface NFTMintingState {
  status: TransactionStatus;
  nftId: string | null;
  error: string | null;
}

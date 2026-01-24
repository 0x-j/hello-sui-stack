import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

/**
 * Get the network from environment variables
 */
export function getNetwork(): 'testnet' | 'mainnet' {
  const network = process.env.VITE_SUI_NETWORK || 'testnet';
  if (network !== 'testnet' && network !== 'mainnet') {
    throw new Error(`Invalid network: ${network}. Must be 'testnet' or 'mainnet'`);
  }
  return network;
}

/**
 * Get RPC URL for the configured network
 */
export function getRpcUrl(): string {
  return getFullnodeUrl(getNetwork());
}

/**
 * Create a Sui client for the configured network
 */
export function createSuiClient(): SuiClient {
  return new SuiClient({ url: getRpcUrl() });
}

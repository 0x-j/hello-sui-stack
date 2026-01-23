import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';

const NETWORK = (import.meta.env.VITE_SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet';

export const suiClient = new SuiClient({
  url: getFullnodeUrl(NETWORK),
});

export const walrusClient = new WalrusClient({
  network: NETWORK,
  suiClient,
  uploadRelay: {
    timeout: 600_000, // 10 minutes
    host: import.meta.env.VITE_WALRUS_PUBLISHER_URL || 'https://upload-relay.testnet.walrus.space',
    sendTip: {
      max: 1_000,
    },
  },
});

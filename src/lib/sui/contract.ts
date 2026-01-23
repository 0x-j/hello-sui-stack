import { Transaction } from '@mysten/sui/transactions';
import { CONTRACT_CONFIG } from '@/types/sui';

const PAYMENT_AMOUNT = 10_000_000; // 0.01 SUI in MIST

/**
 * Build a transaction to pay for image generation
 * Splits 0.01 SUI from gas and calls pay_for_generation
 */
export function buildPaymentTransaction(): Transaction {
  const tx = new Transaction();

  // Split payment amount from gas
  const [paymentCoin] = tx.splitCoins(tx.gas, [PAYMENT_AMOUNT]);

  // Call pay_for_generation
  tx.moveCall({
    target: `${CONTRACT_CONFIG.packageId}::profile_nft::pay_for_generation`,
    arguments: [
      paymentCoin,
      tx.object(CONTRACT_CONFIG.paymentConfigId),
    ],
  });

  return tx;
}

/**
 * Build a transaction to mint a ProfileNFT
 */
export function buildMintNFTTransaction(
  name: string,
  description: string,
  imageUrl: string
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACT_CONFIG.packageId}::profile_nft::mint_nft`,
    arguments: [
      tx.pure.string(name),
      tx.pure.string(description),
      tx.pure.string(imageUrl),
    ],
  });

  return tx;
}

/**
 * Build a transaction to transfer an NFT
 */
export function buildTransferNFTTransaction(
  nftId: string,
  recipient: string
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACT_CONFIG.packageId}::profile_nft::transfer_nft`,
    arguments: [
      tx.object(nftId),
      tx.pure.address(recipient),
    ],
  });

  return tx;
}

/**
 * Get the payment amount in SUI (for display)
 */
export function getPaymentAmountInSui(): number {
  return PAYMENT_AMOUNT / 1_000_000_000;
}

/**
 * Get the payment amount in MIST
 */
export function getPaymentAmountInMist(): number {
  return PAYMENT_AMOUNT;
}

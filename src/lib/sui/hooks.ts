import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { CONTRACT_CONFIG, ProfileNFTWithId } from '@/types/sui';

/**
 * Hook to fetch user's owned ProfileNFTs
 */
export function useProfileNFTs() {
  const account = useCurrentAccount();
  const client = useSuiClient();

  return useQuery({
    queryKey: ['profile-nfts', account?.address],
    queryFn: async () => {
      if (!account?.address) {
        return [];
      }

      const response = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${CONTRACT_CONFIG.packageId}::profile_nft::ProfileNFT`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      const nfts: ProfileNFTWithId[] = [];

      for (const obj of response.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          nfts.push({
            objectId: obj.data.objectId,
            id: { id: obj.data.objectId },
            name: fields.name,
            description: fields.description,
            image_url: fields.image_url,
            creator: fields.creator,
            created_at: fields.created_at,
          });
        }
      }

      // Sort by creation date (newest first)
      return nfts.sort((a, b) =>
        Number(b.created_at) - Number(a.created_at)
      );
    },
    enabled: !!account?.address && !!CONTRACT_CONFIG.packageId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

/**
 * Hook to get the latest ProfileNFT
 */
export function useLatestProfileNFT() {
  const { data: nfts, ...rest } = useProfileNFTs();

  return {
    data: nfts?.[0] || null,
    ...rest,
  };
}

/**
 * Hook to check if contracts are configured
 */
export function useContractConfigured() {
  return !!(CONTRACT_CONFIG.packageId && CONTRACT_CONFIG.paymentConfigId);
}

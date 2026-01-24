import { useQuery } from '@tanstack/react-query';
import { walrusClient } from '@/lib/walrus/client';

interface StorageCostResult {
  storageCost: string;
  writeCost: string;
  totalCost: string;
  isLoading: boolean;
  error: Error | null;
}

export function useStorageCost(fileSize: number, epochs: number): StorageCostResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['storage-cost', fileSize, epochs],
    queryFn: async () => {
      const cost = await walrusClient.storageCost(fileSize, epochs);
      return {
        storageCost: cost.storageCost,
        writeCost: cost.writeCost,
        totalCost: cost.totalCost,
      };
    },
    enabled: fileSize > 0 && epochs > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    storageCost: data?.storageCost || '---',
    writeCost: data?.writeCost || '---',
    totalCost: data?.totalCost || '---',
    isLoading,
    error: error as Error | null,
  };
}

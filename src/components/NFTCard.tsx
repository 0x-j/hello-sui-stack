import { ProfileNFTWithId } from '@/types/sui';
import { useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';

interface NFTCardProps {
  nft: ProfileNFTWithId;
}

export function NFTCard({ nft }: NFTCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const client = useSuiClient();

  // Extract blob ID from image URL (format: ${AGGREGATOR_URL}/v1/${blobId})
  const blobId = nft.image_url.split('/v1/')[1] || '';

  // Fetch object details to get storage info
  const { data: objectData } = useQuery({
    queryKey: ['nft-object', nft.objectId],
    queryFn: async () => {
      const obj = await client.getObject({
        id: nft.objectId,
        options: {
          showStorageRebate: true,
        },
      });
      return obj.data;
    },
    enabled: !!nft.objectId,
  });

  return (
    <div className="w-full max-w-[480px] bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-200 flex flex-col sm:flex-row gap-4 p-4">
      {/* Image */}
      <div className="w-full sm:w-[142px] h-[142px] flex-shrink-0 relative rounded-lg overflow-hidden bg-gray-100">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        )}
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 flex-col gap-2">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ) : (
          <img
            src={nft.image_url}
            alt={nft.name}
            className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Metadata */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="bg-blue-50 rounded-t-md px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">End Epoch</span>
          <span className="text-sm font-medium text-blue-600">
            {objectData?.storageRebate ? 'N/A' : 'Permanent'}
          </span>
        </div>
        <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Walruscan</span>
          <div className="flex-1 min-w-0 ml-2">
            <a
              href={`https://walruscan.com/testnet/blob/${blobId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-purple-600 hover:text-purple-700 underline block truncate text-right"
              title={blobId}
            >
              {blobId}
            </a>
          </div>
        </div>
        <div className="bg-blue-50 px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Associated Sui Object</span>
          <div className="flex-1 min-w-0 ml-2">
            <a
              href={`https://testnet.suivision.xyz/object/${nft.objectId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-purple-600 hover:text-purple-700 underline block truncate text-right"
              title={nft.objectId}
            >
              {nft.objectId}
            </a>
          </div>
        </div>
        <div className="bg-gray-50 rounded-b-md px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Download Link</span>
          <div className="flex-1 min-w-0 ml-2">
            <a
              href={nft.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-purple-600 hover:text-purple-700 underline block truncate text-right"
              title={blobId}
            >
              {blobId}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

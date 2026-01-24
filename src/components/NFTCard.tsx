import { ProfileNFTWithId } from '@/types/sui';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { walrusClient } from '@/lib/walrus/client';
import { parseWalrusUrl } from '@/lib/walrus/url';

interface NFTCardProps {
  nft: ProfileNFTWithId;
}

export function NFTCard({ nft }: NFTCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Extract patch ID and blob ID from image URL
  const { patchId, blobId: blobIdFromUrl } = parseWalrusUrl(nft.image_url);

  // Fetch blob metadata using Walrus SDK
  const { data: blobMetadata } = useQuery({
    queryKey: ['walrus-blob-metadata', patchId, blobIdFromUrl],
    queryFn: async () => {
      if (!patchId) return null;

      try {
        let blobId = blobIdFromUrl;

        // If blobId not in URL (old NFTs), get it from the quilt/patch using Walrus SDK
        if (!blobId) {
          const files = await walrusClient.getFiles({ ids: [patchId] });
          if (files.length > 0) {
            const file = files[0];
            // Access the blob to get blobId
            const blob = await file.blob();
            blobId = (blob as any).blobId || (blob as any)._blobId;
          }
        }

        if (!blobId) return null;

        // Get blob using Walrus SDK - this queries the blockchain
        const blob = await walrusClient.getBlob({ blobId });

        // Get the blob's Sui object to access storage information
        const blobData = (blob as any)._blob || blob;

        if (blobData?.blobObject?.storage?.end_epoch) {
          return {
            endEpoch: blobData.blobObject.storage.end_epoch,
            blobId,
          };
        }

        return null;
      } catch (error) {
        console.error('Failed to fetch blob metadata:', error);
        return null;
      }
    },
    enabled: !!patchId,
  });

  // Use blobId from metadata or URL for display
  const displayId = blobMetadata?.blobId || blobIdFromUrl || patchId;

  // Handle download by fetching blob and creating download link
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloading(true);

    try {
      const response = await fetch(nft.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nft.name}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

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
            {blobMetadata?.endEpoch || 'N/A'}
          </span>
        </div>
        <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Walruscan</span>
          <div className="flex-1 min-w-0 ml-2">
            <a
              href={`https://walruscan.com/testnet/blob/${displayId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-purple-600 hover:text-purple-700 underline block truncate text-right"
              title={displayId}
            >
              {displayId}
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
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 underline block truncate text-right w-full text-right disabled:opacity-50"
              title={downloading ? 'Downloading...' : displayId}
            >
              {downloading ? 'Downloading...' : displayId}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { ProfileNFTWithId } from '@/types/sui';
import { useState } from 'react';

interface NFTCardProps {
  nft: ProfileNFTWithId;
}

export function NFTCard({ nft }: NFTCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const createdDate = new Date(Number(nft.created_at)).toLocaleDateString();

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-200">
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative">
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
            <span className="text-sm">Failed to load image</span>
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
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-lg text-gray-900 truncate">{nft.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">
          {nft.description}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
          <span className="font-medium">Created {createdDate}</span>
          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
            {nft.objectId.slice(0, 6)}...{nft.objectId.slice(-4)}
          </span>
        </div>
      </div>
    </div>
  );
}

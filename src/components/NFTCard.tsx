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
    <div className="border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="aspect-square bg-muted relative">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Failed to load image
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
        <h3 className="font-semibold text-lg truncate">{nft.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {nft.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Created {createdDate}</span>
          <span className="font-mono">
            {nft.objectId.slice(0, 6)}...{nft.objectId.slice(-4)}
          </span>
        </div>
      </div>
    </div>
  );
}

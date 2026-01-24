import { ProfileNFTWithId } from '@/types/sui';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { walrusClient } from '@/lib/walrus/client';
import { parseWalrusUrl } from '@/lib/walrus/url';
import { Download, ExternalLink, Loader2, AlertCircle, Database } from 'lucide-react';

interface NFTCardProps {
  nft: ProfileNFTWithId;
}

export function NFTCard({ nft }: NFTCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { patchId, blobId: blobIdFromUrl } = parseWalrusUrl(nft.image_url);

  const { data: blobMetadata } = useQuery({
    queryKey: ['walrus-blob-metadata', patchId, blobIdFromUrl],
    queryFn: async () => {
      if (!patchId) return null;

      try {
        let blobId = blobIdFromUrl;

        if (!blobId) {
          const files = await walrusClient.getFiles({ ids: [patchId] });
          if (files.length > 0) {
            const file = files[0];
            const blob = await file.blob();
            blobId = (blob as any).blobId || (blob as any)._blobId;
          }
        }

        if (!blobId) return null;

        const blob = await walrusClient.getBlob({ blobId });
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

  const displayId = blobMetadata?.blobId || blobIdFromUrl || patchId;

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
    <div className="card-brutal bg-slate p-6 group">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Image */}
        <div className="relative w-full sm:w-48 h-48 flex-shrink-0 border-[3px] border-magenta overflow-hidden bg-void">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="animate-spin text-cyber" size={32} />
            </div>
          )}
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertCircle className="text-blood" size={48} />
            </div>
          ) : (
            <img
              src={nft.image_url}
              alt={nft.name}
              className={`w-full h-full object-cover transition-all duration-500 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              } group-hover:scale-110`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 border-2 border-cyber bg-void text-cyber font-bold uppercase text-xs tracking-wider hover:bg-cyber hover:text-void transition-all duration-200 disabled:opacity-50"
            >
              {downloading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={14} />
                  Loading
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Download size={14} />
                  Download
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex-1 flex flex-col justify-between min-w-0 space-y-3">
          {/* Name */}
          <div>
            <h3 className="text-lg font-bold text-ghost mb-1 truncate">
              {nft.name}
            </h3>
            <p className="text-xs text-smoke font-mono">
              {new Date(Number(nft.created_at)).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Data Grid */}
          <div className="space-y-2 font-mono text-xs">
            {/* End Epoch */}
            <div className="flex items-center justify-between py-2 border-b border-cyber/30">
              <span className="text-smoke uppercase tracking-wider">End Epoch</span>
              <span className="text-cyber font-bold">
                {blobMetadata?.endEpoch || 'N/A'}
              </span>
            </div>

            {/* Walruscan Link */}
            <div className="flex items-center justify-between py-2 border-b border-magenta/30">
              <span className="text-smoke uppercase tracking-wider">Walruscan</span>
              <a
                href={`https://walruscan.com/testnet/blob/${displayId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-magenta hover:text-ghost font-bold flex items-center gap-1 transition-colors"
                title={displayId}
              >
                <span className="truncate max-w-[120px]">
                  {displayId.slice(0, 8)}...{displayId.slice(-6)}
                </span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Sui Object Link */}
            <div className="flex items-center justify-between py-2">
              <span className="text-smoke uppercase tracking-wider">Sui Object</span>
              <a
                href={`https://testnet.suivision.xyz/object/${nft.objectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-acid hover:text-ghost font-bold flex items-center gap-1 transition-colors"
                title={nft.objectId}
              >
                <span className="truncate max-w-[120px]">
                  {nft.objectId.slice(0, 8)}...{nft.objectId.slice(-6)}
                </span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

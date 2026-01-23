import { createFileRoute } from '@tanstack/react-router';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useProfileNFTs } from '@/lib/sui/hooks';
import { NFTCard } from '@/components/NFTCard';

export const Route = createFileRoute('/gallery')({ component: Gallery });

function Gallery() {
  const account = useCurrentAccount();
  const { data: nfts, isLoading, error } = useProfileNFTs();

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              NFT Gallery
            </h1>
            <p className="text-gray-400">
              Please connect your Sui wallet to view your NFTs
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
              Your NFT Gallery
            </h1>
            <p className="text-gray-400">
              View all your minted profile NFTs
            </p>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-slate-700"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">
                Error loading NFTs: {error.message}
              </p>
            </div>
          )}

          {!isLoading && !error && nfts && nfts.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 mb-4">
                <svg
                  className="w-10 h-10 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                No NFTs Yet
              </h2>
              <p className="text-gray-400 mb-6">
                Generate and mint your first profile NFT to see it here
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
              >
                Create Your First NFT
              </a>
            </div>
          )}

          {!isLoading && !error && nfts && nfts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nfts.map((nft) => (
                <NFTCard key={nft.objectId} nft={nft} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

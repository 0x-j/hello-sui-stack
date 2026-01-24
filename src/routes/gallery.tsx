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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
              NFT Gallery
            </h1>
            <p className="text-gray-700 text-lg">
              Please connect your Sui wallet to view your NFTs
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      <section className="py-12 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Your NFT Gallery
            </h1>
            <p className="text-gray-700 text-lg">
              View all your minted profile NFTs
            </p>
          </div>

          {isLoading && (
            <div className="flex flex-col gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-full max-w-[480px] bg-white border-2 border-gray-200 rounded-2xl animate-pulse flex flex-col sm:flex-row gap-4 p-4"
                >
                  <div className="w-full sm:w-[142px] h-[142px] bg-gray-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-medium">
                Error loading NFTs: {error.message}
              </p>
            </div>
          )}

          {!isLoading && !error && nfts && nfts.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 mb-6 shadow-inner">
                <svg
                  className="w-12 h-12 text-blue-600"
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
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                No NFTs Yet
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                Generate and mint your first profile NFT to see it here
              </p>
              <a
                href="/"
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
              >
                ✨ Create Your First NFT
              </a>
            </div>
          )}

          {!isLoading && !error && nfts && nfts.length > 0 && (
            <div className="flex flex-col gap-6">
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

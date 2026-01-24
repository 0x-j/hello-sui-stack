import { createFileRoute } from '@tanstack/react-router';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useProfileNFTs } from '@/lib/sui/hooks';
import { NFTCard } from '@/components/NFTCard';
import { Image, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/gallery')({ component: Gallery });

function Gallery() {
  const account = useCurrentAccount();
  const { data: nfts, isLoading, error } = useProfileNFTs();

  if (!account) {
    return (
      <div className="min-h-screen bg-void grain-overlay scanline-container">
        <section className="py-32 px-6">
          <div className="max-w-2xl mx-auto text-center border-[3px] border-magenta bg-slate p-12">
            <AlertCircle className="mx-auto mb-6 text-magenta" size={64} />
            <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-ghost mb-6">
              Wallet Not Connected
            </h1>
            <p className="text-smoke font-mono text-lg mb-8">
              Connect your Sui wallet to view your NFT gallery
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void grain-overlay scanline-container">
      {/* Header Section */}
      <section className="px-6 pt-16 pb-12 border-b-[3px] border-cyber">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8 opacity-0 animate-fade-in-up">
            <div className="inline-block mb-4">
              <span className="badge-brutal border-magenta text-magenta">
                YOUR COLLECTION
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold uppercase tracking-tighter leading-none mb-4">
              <span className="block text-ghost">NFT</span>
              <span className="block text-cyber">Gallery_</span>
            </h1>
            <p className="text-smoke font-mono text-lg max-w-2xl">
              View all your minted profile NFTs stored on Walrus
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Content */}
      <section className="py-12 px-6 pb-20">
        <div className="max-w-[1600px] mx-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="border-[3px] border-smoke/30 bg-slate p-6 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex gap-6">
                    <div className="w-40 h-40 bg-smoke/20 border-[3px] border-smoke/30 animate-pulse"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-smoke/20 animate-pulse"></div>
                      <div className="h-6 bg-smoke/20 animate-pulse"></div>
                      <div className="h-6 bg-smoke/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="border-[3px] border-blood bg-slate p-8 opacity-0 animate-fade-in-up">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-blood flex-shrink-0" size={32} />
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-blood text-xl mb-2">
                    Error Loading NFTs
                  </h3>
                  <p className="text-smoke font-mono">{error.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && nfts && nfts.length === 0 && (
            <div className="text-center py-20 opacity-0 animate-fade-in-up">
              <div className="max-w-2xl mx-auto border-[3px] border-cyber bg-slate p-12">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-cyber blur-xl opacity-50"></div>
                  <Image className="relative text-cyber" size={80} strokeWidth={2} />
                </div>
                <h2 className="text-4xl font-bold uppercase tracking-tight text-ghost mb-4">
                  No NFTs Yet
                </h2>
                <p className="text-smoke font-mono text-lg mb-8">
                  Generate and mint your first profile NFT to start your collection
                </p>
                <Link
                  to="/"
                  className="inline-block px-8 py-4 border-[3px] border-cyber bg-void text-cyber font-bold uppercase tracking-wider hover:bg-cyber hover:text-void transition-all duration-200"
                  style={{ boxShadow: '6px 6px 0px var(--color-cyber)' }}
                >
                  Create First NFT
                </Link>
              </div>
            </div>
          )}

          {/* NFT Grid */}
          {!isLoading && !error && nfts && nfts.length > 0 && (
            <>
              {/* Stats Header */}
              <div className="mb-8 flex items-center gap-4 opacity-0 animate-fade-in-up">
                <Sparkles className="text-cyan" size={24} />
                <span className="text-smoke font-mono text-lg">
                  <span className="text-cyber font-bold">{nfts.length}</span> NFT{nfts.length !== 1 ? 's' : ''} in collection
                </span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {nfts.map((nft, index) => (
                  <div
                    key={nft.objectId}
                    className="opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <NFTCard nft={nft} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Bottom decorative line */}
      <div className="border-t-[3px] border-magenta"></div>
    </div>
  );
}

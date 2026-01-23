import { createFileRoute } from '@tanstack/react-router';
import { ImageGenerator } from '@/components/ImageGenerator';
import { useContractConfigured } from '@/lib/sui/hooks';
import { useLatestProfileNFT } from '@/lib/sui/hooks';

export const Route = createFileRoute('/')({ component: App });

function App() {
  const isConfigured = useContractConfigured();
  const { data: latestNFT, isLoading } = useLatestProfileNFT();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Sui Profile NFT
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-2 font-light">
            Generate AI-powered profile images and mint them as NFTs
          </p>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            Powered by nano banana AI, stored on Walrus, minted on Sui
          </p>
        </div>
      </section>

      {!isConfigured && (
        <div className="max-w-2xl mx-auto px-6 mb-8">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm text-center">
              Smart contract not deployed. Run <code className="px-2 py-1 bg-slate-700 rounded">npm run deploy:contract</code> first.
            </p>
          </div>
        </div>
      )}

      <section className="py-8 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Generator */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Generate Your Profile NFT
              </h2>
              <ImageGenerator />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Latest NFT Preview */}
            {latestNFT && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Your Latest NFT
                </h3>
                <div className="aspect-square rounded-lg overflow-hidden mb-3">
                  <img
                    src={latestNFT.image_url}
                    alt={latestNFT.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-gray-300 font-medium truncate">
                  {latestNFT.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Created {new Date(Number(latestNFT.created_at)).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* How it Works */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                How it Works
              </h3>
              <ol className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>Connect your Sui wallet</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>Describe your profile image</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>Pay 0.01 SUI to generate</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span>Upload to Walrus & mint NFT</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { createFileRoute } from '@tanstack/react-router';
import { ImageGenerator } from '@/components/ImageGenerator';
import { useContractConfigured } from '@/lib/sui/hooks';
import { useLatestProfileNFT } from '@/lib/sui/hooks';

export const Route = createFileRoute('/')({ component: App });

function App() {
  const isConfigured = useContractConfigured();
  const { data: latestNFT, isLoading } = useLatestProfileNFT();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      <section className="relative py-16 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-blue-500/5"></div>
        <div className="relative max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Sui Profile NFT
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-2 font-medium">
            Generate AI-powered profile images and mint them as NFTs
          </p>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Powered by nano banana AI, stored on Walrus, minted on Sui
          </p>
        </div>
      </section>

      {!isConfigured && (
        <div className="max-w-2xl mx-auto px-6 mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm text-center">
              Smart contract not deployed. Run <code className="px-2 py-1 bg-amber-100 text-amber-900 rounded font-mono">npm run deploy:contract</code> first.
            </p>
          </div>
        </div>
      )}

      <section className="py-8 px-6 max-w-7xl mx-auto pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Generator */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-xl shadow-blue-500/10 border border-gray-200 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Generate Your Profile NFT
              </h2>
              <ImageGenerator />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Latest NFT Preview */}
            {latestNFT && (
              <div className="bg-white shadow-lg border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Your Latest NFT
                </h3>
                <div className="aspect-square rounded-xl overflow-hidden mb-3 border-2 border-gray-100">
                  <img
                    src={latestNFT.image_url}
                    alt={latestNFT.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-gray-900 font-semibold truncate">
                  {latestNFT.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Created {new Date(Number(latestNFT.created_at)).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* How it Works */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                How it Works
              </h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    1
                  </span>
                  <span className="pt-1">Connect your Sui wallet</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    2
                  </span>
                  <span className="pt-1">Describe your profile image</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    3
                  </span>
                  <span className="pt-1">Pay 0.01 SUI to generate</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    4
                  </span>
                  <span className="pt-1">Upload to Walrus & mint NFT</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

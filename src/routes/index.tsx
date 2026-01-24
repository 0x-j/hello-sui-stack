import { createFileRoute } from '@tanstack/react-router';
import { ImageGenerator } from '@/components/ImageGenerator';
import { useContractConfigured, useLatestProfileNFT } from '@/lib/sui/hooks';
import { Sparkles, Wallet, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

export const Route = createFileRoute('/')({ component: App });

function App() {
  const isConfigured = useContractConfigured();
  const { data: latestNFT, isLoading } = useLatestProfileNFT();

  return (
    <div className="min-h-screen bg-void grain-overlay scanline-container">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 overflow-hidden border-b-[3px] border-cyber">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l-[3px] border-t-[3px] border-cyber"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-r-[3px] border-t-[3px] border-magenta"></div>

        {/* Background grid */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(var(--color-cyber) 1px, transparent 1px), linear-gradient(90deg, var(--color-cyber) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative max-w-[1400px] mx-auto">
          {/* Main heading with staggered animation */}
          <div className="mb-8 animate-fade-in-up">
            <div className="inline-block mb-4">
              <span className="badge-brutal border-cyber text-cyber">
                AI-POWERED • WEB3
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-none mb-6">
              <span className="block text-ghost glitch-hover">MINT YOUR</span>
              <span className="block text-cyber">IDENTITY_</span>
            </h1>
            <p className="text-xl md:text-2xl text-smoke max-w-2xl font-mono">
              Generate AI-powered profile images. Store on <span className="text-magenta">Walrus</span>.
              Mint as NFTs on <span className="text-cyber">Sui</span> blockchain.
            </p>
          </div>

          {/* Tech stack badges */}
          <div className="flex flex-wrap gap-3 animate-fade-in-up delay-100">
            <div className="badge-brutal border-cyber text-cyber">
              NANO BANANA AI
            </div>
            <div className="badge-brutal border-magenta text-magenta">
              WALRUS STORAGE
            </div>
            <div className="badge-brutal border-acid text-acid">
              SUI NETWORK
            </div>
          </div>
        </div>
      </section>

      {/* Contract warning */}
      {!isConfigured && (
        <div className="max-w-[1400px] mx-auto px-6 py-6 animate-fade-in-up delay-200">
          <div className="border-[3px] border-blood bg-slate p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-blood flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold uppercase tracking-wider text-blood mb-2">
                  Contract Not Deployed
                </h3>
                <p className="text-smoke font-mono text-sm">
                  Run <code className="px-2 py-1 bg-void border border-blood text-blood font-bold">npm run deploy:contract</code> to deploy the smart contract.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <section className="py-12 px-6 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Generator - 8 columns */}
          <div className="lg:col-span-8 animate-fade-in-up delay-300">
            <div className="relative bg-slate border-[3px] border-cyber p-8 md:p-12">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber to-magenta"></div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold uppercase tracking-tight text-ghost mb-2">
                  Generate_
                </h2>
                <p className="text-smoke font-mono text-sm">
                  Create your unique profile NFT in 4 steps
                </p>
              </div>

              <ImageGenerator />
            </div>
          </div>

          {/* Sidebar - 4 columns */}
          <div className="lg:col-span-4 space-y-8">
            {/* Latest NFT Preview */}
            {latestNFT && (
              <div className="card-brutal p-6 animate-fade-in-up delay-400">
                <h3 className="text-lg font-bold uppercase tracking-wider text-cyber mb-4 flex items-center gap-2">
                  <Sparkles size={18} />
                  Latest Mint
                </h3>
                <div className="aspect-square border-[3px] border-magenta overflow-hidden mb-4 relative group">
                  <img
                    src={latestNFT.image_url}
                    alt={latestNFT.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <p className="text-sm text-ghost font-bold truncate mb-1">
                  {latestNFT.name}
                </p>
                <p className="text-xs text-smoke font-mono">
                  {new Date(Number(latestNFT.created_at)).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* How it Works */}
            <div className="card-brutal p-6 animate-fade-in-up delay-500">
              <h3 className="text-lg font-bold uppercase tracking-wider text-magenta mb-6">
                Process_
              </h3>
              <ol className="space-y-4">
                <li className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-10 h-10 border-[3px] border-cyber flex items-center justify-center text-cyber font-bold bg-void group-hover:bg-cyber group-hover:text-void transition-colors duration-200">
                    01
                  </div>
                  <div className="pt-1">
                    <div className="font-bold text-ghost text-sm uppercase tracking-wide mb-1">
                      Connect Wallet
                    </div>
                    <p className="text-xs text-smoke font-mono">
                      Link your Sui wallet to begin
                    </p>
                  </div>
                </li>
                <li className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-10 h-10 border-[3px] border-cyber flex items-center justify-center text-cyber font-bold bg-void group-hover:bg-cyber group-hover:text-void transition-colors duration-200">
                    02
                  </div>
                  <div className="pt-1">
                    <div className="font-bold text-ghost text-sm uppercase tracking-wide mb-1">
                      Describe & Pay
                    </div>
                    <p className="text-xs text-smoke font-mono">
                      Enter prompt, pay 0.01 SUI
                    </p>
                  </div>
                </li>
                <li className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-10 h-10 border-[3px] border-cyber flex items-center justify-center text-cyber font-bold bg-void group-hover:bg-cyber group-hover:text-void transition-colors duration-200">
                    03
                  </div>
                  <div className="pt-1">
                    <div className="font-bold text-ghost text-sm uppercase tracking-wide mb-1">
                      Upload to Walrus
                    </div>
                    <p className="text-xs text-smoke font-mono">
                      Decentralized storage on Walrus
                    </p>
                  </div>
                </li>
                <li className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-10 h-10 border-[3px] border-cyber flex items-center justify-center text-cyber font-bold bg-void group-hover:bg-cyber group-hover:text-void transition-colors duration-200">
                    04
                  </div>
                  <div className="pt-1">
                    <div className="font-bold text-ghost text-sm uppercase tracking-wide mb-1">
                      Mint NFT
                    </div>
                    <p className="text-xs text-smoke font-mono">
                      Your profile becomes an NFT
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom decorative line */}
      <div className="border-t-[3px] border-magenta mt-20"></div>
    </div>
  );
}

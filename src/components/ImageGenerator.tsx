import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { buildPaymentTransaction, buildMintNFTTransaction, getPaymentAmountInSui } from '@/lib/sui/contract';
import { generateProfileImage } from '@/server/ai';
import { useQueryClient } from '@tanstack/react-query';
import { useStorageCost } from '@/hooks/useStorageCost';
import { useWalrusUpload } from '@/hooks/useWalrusUpload';
import { formatCostDisplay, formatTotalCost } from '@/lib/walrus/costFormatting';
import { base64ToBlob } from '@/lib/walrus/upload';
import { useNavigate } from '@tanstack/react-router';

// Tip amount configured in client.ts (max: 1000 MIST = 0.000001 SUI)
const TIP_AMOUNT_SUI = 0.000001;

// Helper function to get button class based on state
function getStepButtonClass(isReady: boolean, isLoading: boolean, isCompleted: boolean): string {
  const baseClass = 'w-full py-6 px-8 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center';

  if (isCompleted) {
    // Completed - green
    return `${baseClass} bg-green-600 text-white cursor-default`;
  } else if (isLoading) {
    // Loading - semi-transparent teal
    return `${baseClass} bg-teal-500/50 text-white cursor-wait`;
  } else if (isReady) {
    // Ready to interact - bright teal
    return `${baseClass} bg-teal-500 text-white hover:bg-teal-600 cursor-pointer`;
  } else {
    // Disabled - gray
    return `${baseClass} bg-gray-500/50 text-gray-300 cursor-not-allowed`;
  }
}

export function ImageGenerator() {
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutate: signAndExecute, mutateAsync: signAndExecuteAsync } = useSignAndExecuteTransaction();

  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'paying' | 'generating' | 'success' | 'error'>('idle');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [imageSize, setImageSize] = useState(0);
  const [walrusUrl, setWalrusUrl] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  // Upload hook for step-by-step process
  const walrusUpload = useWalrusUpload();

  // Storage cost calculation (1 epoch)
  const storageCost = useStorageCost(imageSize, 1);

  // Calculate image size when generated
  useEffect(() => {
    if (generatedImage) {
      const blob = base64ToBlob(generatedImage);
      setImageSize(blob.size);
    } else {
      setImageSize(0);
    }
  }, [generatedImage]);

  const handleGenerate = async () => {
    if (!account || !prompt.trim()) return;

    setStatus('paying');
    setError(null);
    setGeneratedImage(null);

    try {
      // Step 1: Pay for image generation
      const paymentTx = buildPaymentTransaction();

      signAndExecute(
        {
          transaction: paymentTx,
        },
        {
          onSuccess: async (result) => {
            console.log('Payment successful:', result.digest);

            // Step 2: Generate image via server function
            setStatus('generating');

            try {
              const response = await generateProfileImage({
                data: {
                  prompt: prompt.trim(),
                  paymentTxDigest: result.digest,
                },
              });

              if (response.success && response.image) {
                // Server already returns full data URL, use it directly
                setGeneratedImage(response.image);
                setNftName(`Profile: ${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}`);
                setNftDescription(`AI-generated profile picture based on: "${prompt}"`);
                setStatus('success');
              } else {
                throw new Error('Image generation failed');
              }
            } catch (err: any) {
              console.error('Generation error:', err);
              setError(err.message || 'Failed to generate image');
              setStatus('error');
            }
          },
          onError: (err) => {
            console.error('Payment error:', err);
            setError(err.message || 'Payment failed');
            setStatus('error');
          },
        }
      );
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred');
      setStatus('error');
    }
  };

  // Step 1: Encode and prepare for registration
  const handlePrepareUpload = async () => {
    if (!generatedImage) return;
    setError(null);
    await walrusUpload.encodeFile(generatedImage);
  };

  // Step 2: Register blob on-chain
  const handleRegisterBlob = async () => {
    if (!account) return;
    setError(null);

    try {
      await walrusUpload.registerBlob(signAndExecuteAsync, account.address, 1);
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Failed to register blob');
    }
  };

  // Step 3: Upload to network
  const handleUploadToNetwork = async () => {
    setError(null);

    try {
      await walrusUpload.writeToUploadRelay();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload to network');
    }
  };

  // Step 3: Certify upload
  const handleCertifyUpload = async () => {
    if (!account) return;
    setError(null);

    try {
      // Certify the blob
      const url = await walrusUpload.certifyBlob(signAndExecuteAsync);
      console.log('Uploaded to Walrus:', url);
      setWalrusUrl(url);
    } catch (err: any) {
      console.error('Certify error:', err);
      setError(err.message || 'Failed to certify blob');
    }
  };

  // Step 4: Mint NFT
  const handleMintNFT = async () => {
    if (!account || !walrusUrl) return;
    setIsMinting(true);
    setError(null);

    try {
      const mintTx = buildMintNFTTransaction(
        nftName,
        nftDescription,
        walrusUrl
      );

      signAndExecute(
        {
          transaction: mintTx,
        },
        {
          onSuccess: (result) => {
            console.log('NFT minted:', result.digest);
            setStatus('success');
            setGeneratedImage(null);
            setPrompt('');
            setNftName('');
            setNftDescription('');
            setWalrusUrl(null);
            setIsMinting(false);
            walrusUpload.reset();

            // Invalidate NFT queries to refetch
            queryClient.invalidateQueries({ queryKey: ['profile-nfts'] });

            // Redirect to gallery page
            navigate({ to: '/gallery' });
          },
          onError: (err) => {
            console.error('Minting error:', err);
            setError(err.message || 'Failed to mint NFT');
            setIsMinting(false);
          },
        }
      );
    } catch (err: any) {
      console.error('Minting error:', err);
      setError(err.message || 'Failed to mint NFT');
      setIsMinting(false);
    }
  };

  // Prepare upload when image is generated
  useEffect(() => {
    if (generatedImage && status === 'success') {
      handlePrepareUpload();
    }
  }, [generatedImage, status]);

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">
          Please connect your Sui wallet to generate profile images
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <div className="space-y-2">
        <label htmlFor="prompt" className="text-sm font-semibold text-gray-700 block">
          Describe your profile image
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A futuristic astronaut with neon colors"
          className="w-full min-h-28 p-4 border-2 border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
          disabled={status !== 'idle' && status !== 'success' && status !== 'error'}
        />
        <p className="text-xs text-gray-600 font-medium">
          💰 Cost: {getPaymentAmountInSui()} SUI per generation
        </p>
      </div>

      {/* Generate Button */}
      {!generatedImage && (
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || (status !== 'idle' && status !== 'error')}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
        >
          {status === 'paying' && '⏳ Processing Payment...'}
          {status === 'generating' && '🎨 Generating Image...'}
          {(status === 'idle' || status === 'error') && '✨ Generate Image'}
        </button>
      )}

      {/* Error Message */}
      {(error || walrusUpload.error) && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-sm text-red-700 font-medium">❌ {error || walrusUpload.error}</p>
        </div>
      )}

      {/* Generated Image */}
      {generatedImage && (
        <div className="space-y-5">
          <div className="border-4 border-blue-100 rounded-2xl overflow-hidden shadow-xl">
            <img
              src={generatedImage}
              alt="Generated profile"
              className="w-full aspect-square object-cover"
            />
          </div>

          {/* NFT Metadata Inputs */}
          <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <div>
              <label htmlFor="nft-name" className="text-sm font-semibold text-gray-700 block mb-2">
                NFT Name
              </label>
              <input
                id="nft-name"
                type="text"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                disabled={walrusUpload.isRegistering || walrusUpload.isRelaying || walrusUpload.isCertifying || isMinting}
              />
            </div>

            <div>
              <label htmlFor="nft-description" className="text-sm font-semibold text-gray-700 block mb-2">
                NFT Description
              </label>
              <textarea
                id="nft-description"
                value={nftDescription}
                onChange={(e) => setNftDescription(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                rows={3}
                disabled={walrusUpload.isRegistering || walrusUpload.isRelaying || walrusUpload.isCertifying || isMinting}
              />
            </div>
          </div>

          {/* Upload Cost Estimate */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-3">
            <h3 className="text-xl font-bold text-white mb-4">Upload Cost Estimate</h3>

            <div className="flex justify-between items-center text-gray-300">
              <span>Storage Cost:</span>
              <span className="font-mono text-white">
                {formatCostDisplay(storageCost.storageCost, 'WAL')}
              </span>
            </div>

            <div className="flex justify-between items-center text-gray-300">
              <span>Write Cost:</span>
              <span className="font-mono text-white">
                {formatCostDisplay(storageCost.writeCost, 'WAL')}
              </span>
            </div>

            <div className="flex justify-between items-center text-gray-300">
              <span>Tip Amount:</span>
              <span className="font-mono text-white">
                {imageSize > 0 ? formatCostDisplay(TIP_AMOUNT_SUI.toString(), 'SUI') : '---'}
              </span>
            </div>

            <div className="border-t border-gray-700 pt-3 mt-3">
              <div className="flex justify-between items-center text-gray-300">
                <span className="font-bold text-white">Total Cost:</span>
                <span className="font-mono text-white font-bold">
                  {formatTotalCost(storageCost.totalCost, TIP_AMOUNT_SUI)}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Actual costs may vary based on current network conditions and file size.
            </p>
          </div>

          {/* Step-by-Step Upload Buttons */}
          <div className="space-y-4">
            {/* Step 1: Register Blob */}
            <button
              onClick={handleRegisterBlob}
              disabled={!walrusUpload.canRegister || walrusUpload.isRegistering || !account}
              className={getStepButtonClass(walrusUpload.canRegister && !!account, walrusUpload.isRegistering, walrusUpload.canRelay || walrusUpload.canCertify)}
            >
              <span className="text-2xl font-bold">1. Register Blob</span>
              {walrusUpload.isRegistering && (
                <span className="ml-2 animate-spin">⏳</span>
              )}
              {(walrusUpload.canRelay || walrusUpload.canCertify) && (
                <span className="ml-2">✓</span>
              )}
              {!account && (
                <span className="ml-2 text-sm">(Connect Wallet First)</span>
              )}
            </button>

            {/* Arrow/Chevron */}
            <div className="flex justify-center">
              <svg className={`w-8 h-8 ${walrusUpload.canRelay || walrusUpload.canCertify ? 'text-green-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Step 2: Upload to Network */}
            <button
              onClick={handleUploadToNetwork}
              disabled={!walrusUpload.canRelay || walrusUpload.isRelaying}
              className={getStepButtonClass(walrusUpload.canRelay, walrusUpload.isRelaying, walrusUpload.canCertify)}
            >
              <span className="text-2xl font-bold">2. Upload to Network</span>
              {walrusUpload.isRelaying && (
                <span className="ml-2 animate-spin">⏳</span>
              )}
              {walrusUpload.canCertify && (
                <span className="ml-2">✓</span>
              )}
            </button>

            {/* Arrow/Chevron */}
            <div className="flex justify-center">
              <svg className={`w-8 h-8 ${walrusUpload.canCertify ? 'text-green-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Step 3: Certify Upload */}
            <button
              onClick={handleCertifyUpload}
              disabled={!walrusUpload.canCertify || walrusUpload.isCertifying}
              className={getStepButtonClass(walrusUpload.canCertify, walrusUpload.isCertifying, !!walrusUrl)}
            >
              <span className="text-2xl font-bold">3. Certify Upload</span>
              {walrusUpload.isCertifying && (
                <span className="ml-2 animate-spin">⏳</span>
              )}
              {walrusUrl && (
                <span className="ml-2">✓</span>
              )}
            </button>

            {/* Arrow/Chevron */}
            <div className="flex justify-center">
              <svg className={`w-8 h-8 ${walrusUrl ? 'text-green-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Step 4: Mint NFT */}
            <button
              onClick={handleMintNFT}
              disabled={!walrusUrl || isMinting || !nftName.trim()}
              className={getStepButtonClass(!!walrusUrl && !!nftName.trim(), isMinting, false)}
            >
              <span className="text-2xl font-bold">4. Mint NFT</span>
              {isMinting && (
                <span className="ml-2 animate-spin">⏳</span>
              )}
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={() => {
              setGeneratedImage(null);
              setStatus('idle');
              setError(null);
              setWalrusUrl(null);
              setIsMinting(false);
              walrusUpload.reset();
            }}
            disabled={walrusUpload.isRegistering || walrusUpload.isRelaying || walrusUpload.isCertifying || isMinting}
            className="w-full px-6 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

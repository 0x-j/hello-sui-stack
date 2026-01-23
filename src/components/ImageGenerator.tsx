import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { buildPaymentTransaction, buildMintNFTTransaction, getPaymentAmountInSui } from '@/lib/sui/contract';
import { uploadImageToWalrus } from '@/lib/walrus/upload';
import { generateProfileImage } from '@/server/ai';
import { useQueryClient } from '@tanstack/react-query';

export function ImageGenerator() {
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'paying' | 'generating' | 'uploading' | 'minting' | 'success' | 'error'>('idle');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');

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
                setGeneratedImage(`data:image/png;base64,${response.image}`);
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

  const handleMint = async () => {
    if (!account || !generatedImage) return;

    setStatus('uploading');
    setError(null);

    try {
      // Step 1: Upload to Walrus
      const walrusUrl = await uploadImageToWalrus(generatedImage);
      console.log('Uploaded to Walrus:', walrusUrl);

      // Step 2: Mint NFT
      setStatus('minting');

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

            // Invalidate NFT queries to refetch
            queryClient.invalidateQueries({ queryKey: ['profile-nfts'] });
          },
          onError: (err) => {
            console.error('Minting error:', err);
            setError(err.message || 'Failed to mint NFT');
            setStatus('error');
          },
        }
      );
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
      setStatus('error');
    }
  };

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
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-sm text-red-700 font-medium">❌ {error}</p>
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
                disabled={status === 'uploading' || status === 'minting'}
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
                disabled={status === 'uploading' || status === 'minting'}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleMint}
              disabled={!nftName.trim() || status === 'uploading' || status === 'minting'}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
            >
              {status === 'uploading' && '📤 Uploading to Walrus...'}
              {status === 'minting' && '⚡ Minting NFT...'}
              {status !== 'uploading' && status !== 'minting' && '🚀 Upload & Mint NFT'}
            </button>

            <button
              onClick={() => {
                setGeneratedImage(null);
                setStatus('idle');
                setError(null);
              }}
              disabled={status === 'uploading' || status === 'minting'}
              className="px-6 py-4 border-2 border-gray-300 bg-white text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

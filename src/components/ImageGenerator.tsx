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
        <p className="text-muted-foreground">
          Please connect your Sui wallet to generate profile images
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Prompt Input */}
      <div className="space-y-2">
        <label htmlFor="prompt" className="text-sm font-medium">
          Describe your profile image
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A futuristic astronaut with neon colors"
          className="w-full min-h-24 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={status !== 'idle' && status !== 'success' && status !== 'error'}
        />
        <p className="text-xs text-muted-foreground">
          Cost: {getPaymentAmountInSui()} SUI per generation
        </p>
      </div>

      {/* Generate Button */}
      {!generatedImage && (
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || (status !== 'idle' && status !== 'error')}
          className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'paying' && 'Processing Payment...'}
          {status === 'generating' && 'Generating Image...'}
          {(status === 'idle' || status === 'error') && 'Generate Image'}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Generated Image */}
      {generatedImage && (
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <img
              src={generatedImage}
              alt="Generated profile"
              className="w-full aspect-square object-cover"
            />
          </div>

          {/* NFT Metadata Inputs */}
          <div className="space-y-3">
            <div>
              <label htmlFor="nft-name" className="text-sm font-medium">
                NFT Name
              </label>
              <input
                id="nft-name"
                type="text"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={status === 'uploading' || status === 'minting'}
              />
            </div>

            <div>
              <label htmlFor="nft-description" className="text-sm font-medium">
                NFT Description
              </label>
              <textarea
                id="nft-description"
                value={nftDescription}
                onChange={(e) => setNftDescription(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
                disabled={status === 'uploading' || status === 'minting'}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleMint}
              disabled={!nftName.trim() || status === 'uploading' || status === 'minting'}
              className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'uploading' && 'Uploading to Walrus...'}
              {status === 'minting' && 'Minting NFT...'}
              {status !== 'uploading' && status !== 'minting' && 'Upload & Mint NFT'}
            </button>

            <button
              onClick={() => {
                setGeneratedImage(null);
                setStatus('idle');
                setError(null);
              }}
              disabled={status === 'uploading' || status === 'minting'}
              className="px-4 py-3 border rounded-lg font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

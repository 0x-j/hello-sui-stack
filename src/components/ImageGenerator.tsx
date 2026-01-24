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
import { UPLOAD_TIP_SUI } from '@/lib/walrus/client';
import { Loader2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

// Helper function to get step status icon
function getStepIcon(isActive: boolean, isCompleted: boolean, isLoading: boolean) {
  if (isLoading) {
    return <Loader2 className="animate-spin" size={20} />;
  }
  if (isCompleted) {
    return <CheckCircle2 size={20} />;
  }
  return <Circle size={20} className={isActive ? 'opacity-100' : 'opacity-30'} />;
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

  const walrusUpload = useWalrusUpload();
  const storageCost = useStorageCost(imageSize, 1);

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
      const paymentTx = buildPaymentTransaction();

      signAndExecute(
        { transaction: paymentTx },
        {
          onSuccess: async (result) => {
            setStatus('generating');

            try {
              const response = await generateProfileImage({
                data: {
                  prompt: prompt.trim(),
                  paymentTxDigest: result.digest,
                },
              });

              if (response.success && response.image) {
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

  const handlePrepareUpload = async () => {
    if (!generatedImage) return;
    setError(null);
    await walrusUpload.encodeFile(generatedImage);
  };

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

  const handleUploadToNetwork = async () => {
    setError(null);

    try {
      await walrusUpload.writeToUploadRelay();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload to network');
    }
  };

  const handleCertifyUpload = async () => {
    if (!account) return;
    setError(null);

    try {
      const url = await walrusUpload.certifyBlob(signAndExecuteAsync);
      setWalrusUrl(url);
    } catch (err: any) {
      console.error('Certify error:', err);
      setError(err.message || 'Failed to certify blob');
    }
  };

  const handleMintNFT = async () => {
    if (!account || !walrusUrl) return;
    setIsMinting(true);
    setError(null);

    try {
      const mintTx = buildMintNFTTransaction(nftName, nftDescription, walrusUrl);

      signAndExecute(
        { transaction: mintTx },
        {
          onSuccess: (result) => {
            setStatus('success');
            setGeneratedImage(null);
            setPrompt('');
            setNftName('');
            setNftDescription('');
            setWalrusUrl(null);
            setIsMinting(false);
            walrusUpload.reset();
            queryClient.invalidateQueries({ queryKey: ['profile-nfts'] });
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

  useEffect(() => {
    if (generatedImage && status === 'success') {
      handlePrepareUpload();
    }
  }, [generatedImage, status]);

  if (!account) {
    return (
      <div className="text-center py-16 border-[3px] border-magenta bg-void p-8">
        <AlertCircle className="mx-auto mb-4 text-magenta" size={48} />
        <p className="text-smoke font-mono text-lg uppercase tracking-wider">
          Connect wallet to generate
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Prompt Input */}
      <div className="space-y-4">
        <label htmlFor="prompt" className="text-sm font-bold uppercase tracking-wider text-cyber block">
          Input Prompt_
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="DESCRIBE YOUR PROFILE IMAGE..."
          className="input-brutal w-full min-h-32 resize-none placeholder:uppercase"
          disabled={status !== 'idle' && status !== 'success' && status !== 'error'}
        />
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-smoke">COST:</span>
          <span className="text-cyber font-bold">{getPaymentAmountInSui()} SUI</span>
        </div>
      </div>

      {/* Generate Button */}
      {!generatedImage && (
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || (status !== 'idle' && status !== 'error')}
          className="btn-brutal w-full"
        >
          {status === 'paying' && (
            <span className="flex items-center gap-3">
              <Loader2 className="animate-spin" size={20} />
              Processing Payment
            </span>
          )}
          {status === 'generating' && (
            <span className="flex items-center gap-3">
              <Loader2 className="animate-spin" size={20} />
              Generating Image
            </span>
          )}
          {(status === 'idle' || status === 'error') && 'Generate Image'}
        </button>
      )}

      {/* Error Message */}
      {(error || walrusUpload.error) && (
        <div className="border-[3px] border-blood bg-slate p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blood flex-shrink-0" size={20} />
            <p className="text-sm text-blood font-mono font-bold">
              {error || walrusUpload.error}
            </p>
          </div>
        </div>
      )}

      {/* Generated Image & Upload Flow */}
      {generatedImage && (
        <div className="space-y-8">
          {/* Generated Image */}
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-cyber via-magenta to-cyber opacity-50 blur-xl group-hover:opacity-75 transition-opacity"></div>
            <div className="relative border-[5px] border-cyber overflow-hidden">
              <img
                src={generatedImage}
                alt="Generated profile"
                className="w-full aspect-square object-cover"
              />
            </div>
          </div>

          {/* NFT Metadata */}
          <div className="space-y-4 border-[3px] border-magenta bg-slate p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-magenta mb-4">
              NFT Metadata_
            </h3>

            <div>
              <label htmlFor="nft-name" className="text-xs font-bold uppercase tracking-wider text-smoke block mb-2">
                Name
              </label>
              <input
                id="nft-name"
                type="text"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                className="input-brutal w-full"
                disabled={walrusUpload.isRegistering || walrusUpload.isRelaying || walrusUpload.isCertifying || isMinting}
              />
            </div>

            <div>
              <label htmlFor="nft-description" className="text-xs font-bold uppercase tracking-wider text-smoke block mb-2">
                Description
              </label>
              <textarea
                id="nft-description"
                value={nftDescription}
                onChange={(e) => setNftDescription(e.target.value)}
                className="input-brutal w-full resize-none"
                rows={3}
                disabled={walrusUpload.isRegistering || walrusUpload.isRelaying || walrusUpload.isCertifying || isMinting}
              />
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="border-[3px] border-acid bg-void p-6 space-y-3 font-mono">
            <h3 className="text-sm font-bold uppercase tracking-wider text-acid mb-4">
              Upload Cost_
            </h3>

            <div className="flex justify-between items-center text-sm">
              <span className="text-smoke">Storage</span>
              <span className="text-ghost font-bold">
                {formatCostDisplay(storageCost.storageCost, 'WAL')}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-smoke">Write</span>
              <span className="text-ghost font-bold">
                {formatCostDisplay(storageCost.writeCost, 'WAL')}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-smoke">Tip</span>
              <span className="text-ghost font-bold">
                {imageSize > 0 ? formatCostDisplay(UPLOAD_TIP_SUI.toString(), 'SUI') : '---'}
              </span>
            </div>

            <div className="border-t-2 border-acid pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-acid font-bold uppercase tracking-wider text-sm">Total</span>
                <span className="text-acid font-bold text-lg">
                  {formatTotalCost(storageCost.totalCost, UPLOAD_TIP_SUI)}
                </span>
              </div>
            </div>

            <p className="text-xs text-smoke opacity-60 mt-3">
              * Costs vary by network conditions
            </p>
          </div>

          {/* Upload Steps */}
          <div className="space-y-3">
            {/* Step 1 */}
            <button
              onClick={handleRegisterBlob}
              disabled={!walrusUpload.canRegister || walrusUpload.isRegistering || !account}
              className={`w-full px-6 py-5 border-[3px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-between ${
                walrusUpload.canRelay || walrusUpload.canCertify
                  ? 'border-cyber bg-cyber/10 text-cyber cursor-default'
                  : walrusUpload.canRegister && !!account
                  ? 'border-cyber bg-void text-cyber hover:bg-cyber hover:text-void'
                  : 'border-smoke/30 bg-void text-smoke/30 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-3">
                {getStepIcon(walrusUpload.canRegister, walrusUpload.canRelay || walrusUpload.canCertify, walrusUpload.isRegistering)}
                <span>01. Register Blob</span>
              </span>
              {!account && <span className="text-xs">Connect Wallet</span>}
            </button>

            {/* Step 2 */}
            <button
              onClick={handleUploadToNetwork}
              disabled={!walrusUpload.canRelay || walrusUpload.isRelaying}
              className={`w-full px-6 py-5 border-[3px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-3 ${
                walrusUpload.canCertify
                  ? 'border-cyber bg-cyber/10 text-cyber cursor-default'
                  : walrusUpload.canRelay
                  ? 'border-cyber bg-void text-cyber hover:bg-cyber hover:text-void'
                  : 'border-smoke/30 bg-void text-smoke/30 cursor-not-allowed'
              }`}
            >
              {getStepIcon(walrusUpload.canRelay, walrusUpload.canCertify, walrusUpload.isRelaying)}
              <span>02. Upload to Network</span>
            </button>

            {/* Step 3 */}
            <button
              onClick={handleCertifyUpload}
              disabled={!walrusUpload.canCertify || walrusUpload.isCertifying}
              className={`w-full px-6 py-5 border-[3px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-3 ${
                !!walrusUrl
                  ? 'border-cyber bg-cyber/10 text-cyber cursor-default'
                  : walrusUpload.canCertify
                  ? 'border-cyber bg-void text-cyber hover:bg-cyber hover:text-void'
                  : 'border-smoke/30 bg-void text-smoke/30 cursor-not-allowed'
              }`}
            >
              {getStepIcon(walrusUpload.canCertify, !!walrusUrl, walrusUpload.isCertifying)}
              <span>03. Certify Upload</span>
            </button>

            {/* Step 4 */}
            <button
              onClick={handleMintNFT}
              disabled={!walrusUrl || isMinting || !nftName.trim()}
              className={`w-full px-6 py-5 border-[3px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-3 ${
                !!walrusUrl && !!nftName.trim()
                  ? 'border-magenta bg-void text-magenta hover:bg-magenta hover:text-void'
                  : 'border-smoke/30 bg-void text-smoke/30 cursor-not-allowed'
              }`}
            >
              {getStepIcon(!!walrusUrl && !!nftName.trim(), false, isMinting)}
              <span>04. Mint NFT</span>
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
            className="w-full px-6 py-4 border-[3px] border-blood bg-void text-blood font-bold uppercase tracking-wider hover:bg-blood hover:text-void disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

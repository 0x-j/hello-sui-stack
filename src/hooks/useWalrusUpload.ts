import { useState, useCallback } from 'react';
import { WalrusFile } from '@mysten/walrus';
import { walrusClient } from '@/lib/walrus/client';
import { base64ToBlob } from '@/lib/walrus/upload';
import { buildWalrusUrl } from '@/lib/walrus/url';
import { Transaction } from '@mysten/sui/transactions';

type UploadState =
  | 'idle'
  | 'encoding'
  | 'can-register'
  | 'registering'
  | 'can-relay'
  | 'relaying'
  | 'can-certify'
  | 'certifying';

type SignAndExecuteFunction = (args: { transaction: Transaction }) => Promise<{ digest: string }>;

interface UseWalrusUploadResult {
  state: UploadState;
  error: string | null;
  blobUrl: string | null;
  encodeFile: (base64Image: string) => Promise<void>;
  registerBlob: (signAndExecute: SignAndExecuteFunction, userAddress: string, epochs: number) => Promise<void>;
  writeToUploadRelay: (registerDigest: string) => Promise<void>;
  certifyBlob: (signAndExecute: SignAndExecuteFunction) => Promise<string>;
  reset: () => void;
  isEncoding: boolean;
  canRegister: boolean;
  isRegistering: boolean;
  canRelay: boolean;
  isRelaying: boolean;
  canCertify: boolean;
  isCertifying: boolean;
}

export function useWalrusUpload(): UseWalrusUploadResult {
  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [flow, setFlow] = useState<any>(null);
  const [registerDigest, setRegisterDigest] = useState<string | null>(null);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setBlobUrl(null);
    setFlow(null);
    setRegisterDigest(null);
  }, []);

  const encodeFile = useCallback(async (base64Image: string) => {
    try {
      setState('encoding');
      setError(null);

      // Convert base64 to blob
      const blob = base64ToBlob(base64Image);
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Create WalrusFile
      const files = [
        WalrusFile.from({
          contents: uint8Array,
          identifier: 'profile-nft.png',
          tags: {
            contentType: 'image/png',
          },
        }),
      ];

      // Create WriteFilesFlow
      const writeFlow = walrusClient.writeFilesFlow({ files });

      // Encode the file
      await writeFlow.encode();

      setFlow(writeFlow);
      setState('can-register');
    } catch (err: unknown) {
      console.error('Encoding error:', err);
      setError(err instanceof Error ? err.message : 'Failed to encode file');
      setState('idle');
    }
  }, []);

  const registerBlob = useCallback(async (
    signAndExecute: SignAndExecuteFunction,
    userAddress: string,
    epochs: number = 1
  ) => {
    if (!flow || state !== 'can-register') {
      throw new Error('Cannot register: flow not ready');
    }

    try {
      setState('registering');
      setError(null);

      const { digest } = await signAndExecute({
        transaction: flow.register({
          epochs,
          deletable: false,
          owner: userAddress,
        }),
      });

      setRegisterDigest(digest);
      setState('can-relay');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register blob');
      setState('can-register');
      throw err;
    }
  }, [flow, state]);

  const writeToUploadRelay = useCallback(async (digest?: string) => {
    if (!flow || state !== 'can-relay') {
      throw new Error('Cannot upload: flow not ready');
    }

    const uploadDigest = digest || registerDigest;
    if (!uploadDigest) {
      throw new Error('No register digest available');
    }

    try {
      setState('relaying');
      setError(null);

      await flow.upload({ digest: uploadDigest });

      setState('can-certify');
    } catch (err: unknown) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload to network');
      setState('can-relay');
      throw err;
    }
  }, [flow, state, registerDigest]);

  const certifyBlob = useCallback(async (signAndExecute: SignAndExecuteFunction): Promise<string> => {
    if (!flow || state !== 'can-certify') {
      throw new Error('Cannot certify: flow not ready');
    }

    try {
      setState('certifying');
      setError(null);

      await signAndExecute({
        transaction: flow.certify(),
      });

      // Get the blob information
      const fileList = await flow.listFiles();

      if (fileList.length === 0) {
        throw new Error('No files were uploaded');
      }

      const fileInfo = fileList[0];
      const patchId = fileInfo.id;
      const blobId = fileInfo.blobId;

      const url = buildWalrusUrl(patchId, blobId);
      setBlobUrl(url);
      setState('idle');

      return url;
    } catch (err: unknown) {
      console.error('Certification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to certify blob');
      setState('can-certify');
      throw err;
    }
  }, [flow, state]);

  return {
    state,
    error,
    blobUrl,
    encodeFile,
    registerBlob,
    writeToUploadRelay,
    certifyBlob,
    reset,
    isEncoding: state === 'encoding',
    canRegister: state === 'can-register',
    isRegistering: state === 'registering',
    canRelay: state === 'can-relay',
    isRelaying: state === 'relaying',
    canCertify: state === 'can-certify',
    isCertifying: state === 'certifying',
  };
}

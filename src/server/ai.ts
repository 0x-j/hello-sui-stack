import { createServerFn } from '@tanstack/react-start';
import { generateText } from 'ai';
import { SuiClient } from '@mysten/sui/client';

const API_KEY = process.env.AI_GATEWAY_API_KEY;
const NETWORK = process.env.VITE_SUI_NETWORK || 'testnet';
const RPC_URL = NETWORK === 'mainnet'
  ? 'https://fullnode.mainnet.sui.io:443'
  : 'https://fullnode.testnet.sui.io:443';

interface GenerateImageInput {
  prompt: string;
  paymentTxDigest: string;
}

/**
 * Server function to generate profile image using nano banana AI model
 * Verifies payment on-chain before generating the image
 */
export const generateProfileImage = createServerFn({ method: 'POST' })
  .inputValidator((data: GenerateImageInput) => {
    if (!data.prompt || typeof data.prompt !== 'string') {
      throw new Error('Invalid prompt');
    }
    if (!data.paymentTxDigest || typeof data.paymentTxDigest !== 'string') {
      throw new Error('Invalid payment transaction digest');
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { prompt, paymentTxDigest } = data;

    console.log('🎨 Generating image for prompt:', prompt);
    console.log('💳 Payment transaction:', paymentTxDigest);

    // 1. Verify payment transaction on-chain
    try {
      const client = new SuiClient({ url: RPC_URL });
      const txResponse = await client.getTransactionBlock({
        digest: paymentTxDigest,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      // Check if transaction was successful
      if (txResponse.effects?.status?.status !== 'success') {
        throw new Error('Payment transaction failed');
      }

      // Verify PaymentReceived event was emitted
      const paymentEvent = txResponse.events?.find(
        (event) => event.type.includes('PaymentReceived')
      );

      if (!paymentEvent) {
        throw new Error('No payment event found in transaction');
      }

      console.log('✅ Payment verified');

    } catch (error) {
      console.error('❌ Payment verification failed:', error);
      throw new Error('Failed to verify payment on blockchain');
    }

    // 2. Generate image using nano banana AI model
    if (!API_KEY) {
      throw new Error('AI_GATEWAY_API_KEY not configured');
    }

    try {
      // Using nano banana model via Vercel AI SDK
      // Reference: https://vercel.com/docs/ai-gateway/image-generation/ai-sdk#nano-banana-google/gemini-2.5-flash-image
      const result = await generateText({
        model: 'google/gemini-2.5-flash-image',
        prompt: `Create a unique profile picture: ${prompt}. Style: vibrant, artistic, suitable for a social media avatar.`,
      });

      console.log(`Generated ${result.files?.length || 0} file(s)`);
      console.log('Usage:', JSON.stringify(result.usage, null, 2));

      // Filter for image files from result.files
      const imageFiles = result.files?.filter((f) =>
        f.mediaType?.startsWith('image/'),
      ) || [];

      console.log(`Found ${imageFiles.length} image file(s)`);

      if (imageFiles.length === 0) {
        console.error('No image files generated');
        throw new Error('No image was generated. The model may not support image generation.');
      }

      // Get the first image
      const imageFile = imageFiles[0];
      console.log('Image media type:', imageFile.mediaType);
      console.log('Image size:', imageFile.uint8Array.byteLength, 'bytes');

      // Convert uint8Array to base64 using Node.js Buffer
      const base64Image = Buffer.from(imageFile.uint8Array).toString('base64');
      const imageUrl = `data:${imageFile.mediaType};base64,${base64Image}`;

      console.log('Image converted to base64 data URL successfully');

      // Return base64 image
      return {
        success: true,
        image: imageUrl,
      };
    } catch (error: any) {
      console.error('❌ Image generation failed:', error);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  });

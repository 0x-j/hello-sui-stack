import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createSuiClient } from './utils/sui.js';
import { PAYMENT_AMOUNT } from './utils/constants.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const PACKAGE_ID = process.env.VITE_CONTRACT_PACKAGE_ID;
const PAYMENT_CONFIG_ID = process.env.VITE_PAYMENT_CONFIG_ID;

async function testContract() {
  console.log('🧪 Testing Sui Smart Contract');
  console.log('=====================================\n');

  if (!PACKAGE_ID || !PAYMENT_CONFIG_ID) {
    console.error('❌ Contract not deployed. Run "npm run deploy:contract" first.');
    return;
  }

  // 1. Setup
  const seedPhrase = process.env.DEPLOYER_SEED_PHRASE;
  if (!seedPhrase) {
    throw new Error('DEPLOYER_SEED_PHRASE not found in .env.local');
  }

  const keypair = Ed25519Keypair.deriveKeypair(seedPhrase);
  const address = keypair.toSuiAddress();
  const client = createSuiClient();

  console.log('📝 Test account:', address);
  console.log('📦 Package ID:', PACKAGE_ID);
  console.log('⚙️  PaymentConfig ID:', PAYMENT_CONFIG_ID);
  console.log();

  // 2. Check balance
  const balance = await client.getBalance({ owner: address });
  console.log('💰 Balance:', Number(balance.totalBalance) / 1_000_000_000, 'SUI\n');

  // 3. Test payment for generation
  console.log('🧪 Test 1: Payment for image generation');
  console.log('---------------------------------------');

  try {
    const tx = new Transaction();

    // Split 0.01 SUI from gas
    const [paymentCoin] = tx.splitCoins(tx.gas, [PAYMENT_AMOUNT]);

    // Call pay_for_generation
    tx.moveCall({
      target: `${PACKAGE_ID}::profile_nft::pay_for_generation`,
      arguments: [
        paymentCoin,
        tx.object(PAYMENT_CONFIG_ID),
      ],
    });

    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    console.log('✅ Payment successful!');
    console.log('   Transaction:', result.digest);

    // Check for PaymentReceived event
    const paymentEvent = result.events?.find(
      (event) => event.type.includes('PaymentReceived')
    );

    if (paymentEvent) {
      console.log('   Event emitted:', paymentEvent.type);
      console.log('   Event data:', JSON.stringify(paymentEvent.parsedJson, null, 2));
    }

    console.log();

    // 4. Test NFT minting
    console.log('🧪 Test 2: Mint Profile NFT');
    console.log('---------------------------------------');

    const mintTx = new Transaction();

    const testImageUrl = 'https://aggregator.walrus-testnet.walrus.space/v1/test-blob-id';
    const testName = 'Test Profile NFT #1';
    const testDescription = 'This is a test profile NFT generated during contract testing';

    const [mintedNft] = mintTx.moveCall({
      target: `${PACKAGE_ID}::profile_nft::mint_nft`,
      arguments: [
        mintTx.pure.string(testName),
        mintTx.pure.string(testDescription),
        mintTx.pure.string(testImageUrl),
      ],
    });

    mintTx.transferObjects([mintedNft], keypair.toSuiAddress());


    const mintResult = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: mintTx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

    console.log('✅ NFT minted successfully!');
    console.log('   Transaction:', mintResult.digest);

    // Check for NFTMinted event
    const nftEvent = mintResult.events?.find(
      (event) => event.type.includes('NFTMinted')
    );

    if (nftEvent) {
      console.log('   Event emitted:', nftEvent.type);
      console.log('   Event data:', JSON.stringify(nftEvent.parsedJson, null, 2));
    }

    // Extract NFT object ID
    const nftObject = mintResult.objectChanges?.find(
      (change) =>
        change.type === 'created' &&
        change.objectType?.includes('ProfileNFT')
    );

    if (nftObject && nftObject.type === 'created') {
      console.log('   NFT Object ID:', nftObject.objectId);

      // Fetch NFT details
      const nftDetails = await client.getObject({
        id: nftObject.objectId,
        options: { showContent: true },
      });

      console.log('   NFT Details:', JSON.stringify(nftDetails.data?.content, null, 2));
    }

    console.log();

    // 5. Query user's NFTs
    console.log('🧪 Test 3: Query owned NFTs');
    console.log('---------------------------------------');

    const ownedObjects = await client.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${PACKAGE_ID}::profile_nft::ProfileNFT`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    console.log(`✅ Found ${ownedObjects.data.length} ProfileNFT(s)`);

    ownedObjects.data.forEach((obj, index) => {
      console.log(`\n   NFT #${index + 1}:`);
      console.log('   Object ID:', obj.data?.objectId);
      if (obj.data?.content && 'fields' in obj.data.content) {
        const fields = obj.data.content.fields as any;
        console.log('   Name:', fields.name);
        console.log('   Description:', fields.description);
        console.log('   Image URL:', fields.image_url);
        console.log('   Creator:', fields.creator);
      }
    });

    console.log();

    // Summary
    console.log('=====================================');
    console.log('🎉 All tests passed!');
    console.log('=====================================\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests
testContract().catch(console.error);

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getNetwork, createSuiClient } from './utils/sui.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const NETWORK = getNetwork();

async function deploy() {
  console.log('🚀 Starting deployment to Sui', NETWORK);
  console.log('=====================================\n');

  // 1. Get deployer account from seed phrase
  const seedPhrase = process.env.DEPLOYER_SEED_PHRASE;
  if (!seedPhrase) {
    throw new Error('DEPLOYER_SEED_PHRASE not found in .env.local');
  }

  const keypair = Ed25519Keypair.deriveKeypair(seedPhrase);
  const deployer = keypair.toSuiAddress();
  console.log('📝 Deployer address:', deployer);

  // 2. Initialize Sui client
  const client = createSuiClient();

  // 3. Check balance
  const balance = await client.getBalance({ owner: deployer });
  console.log('💰 Balance:', Number(balance.totalBalance) / 1_000_000_000, 'SUI\n');

  if (Number(balance.totalBalance) === 0) {
    console.log('❌ Insufficient balance. Please fund your account first.');
    console.log('   Visit https://faucet.testnet.sui.io/ for testnet tokens\n');
    return;
  }

  // 4. Run unit tests
  console.log('🧪 Running unit tests...');
  try {
    execSync('sui move test', {
      cwd: join(__dirname, '../move'),
      stdio: 'inherit'
    });
    console.log('✅ All tests passed\n');
  } catch (error) {
    console.error('❌ Tests failed');
    throw error;
  }

  // 5. Build the Move package
  console.log('🔨 Building Move package...');
  try {
    execSync('sui move build', {
      cwd: join(__dirname, '../move'),
      stdio: 'inherit'
    });
    console.log('✅ Build successful\n');
  } catch (error) {
    console.error('❌ Build failed');
    throw error;
  }

  // 6. Publish the package
  console.log('📦 Publishing package...');
  try {
    const { modules, dependencies } = JSON.parse(
      execSync('sui move build --dump-bytecode-as-base64', {
        cwd: join(__dirname, '../move'),
        encoding: 'utf-8'
      })
    );

    const tx = new Transaction();
    const [upgradeCap] = tx.publish({
      modules,
      dependencies,
    });

    // Transfer upgrade capability to deployer
    tx.transferObjects([upgradeCap], deployer);

    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log('✅ Package published!');
    console.log('   Transaction:', result.digest);

    // Extract package ID from object changes
    const packageId = result.objectChanges?.find(
      (change) => change.type === 'published'
    )?.packageId;

    if (!packageId) {
      throw new Error('Package ID not found in transaction result');
    }

    console.log('   Package ID:', packageId);

    // Extract PaymentConfig object ID
    const paymentConfig = result.objectChanges?.find(
      (change) =>
        change.type === 'created' &&
        change.objectType?.includes('PaymentConfig')
    );

    // @ts-ignore
    let paymentConfigId = paymentConfig?.objectId;

    if (!paymentConfigId) {
      throw new Error('PaymentConfig object ID not found');
    }

    console.log('   PaymentConfig ID:', paymentConfigId);
    console.log();

    // 7. Update .env.local file
    console.log('📝 Updating .env.local...');
    const envPath = join(__dirname, '../.env.local');
    let envContent = readFileSync(envPath, 'utf-8');

    // Update package ID
    envContent = envContent.replace(
      /VITE_CONTRACT_PACKAGE_ID=.*/,
      `VITE_CONTRACT_PACKAGE_ID=${packageId}`
    );

    // Update payment config ID
    envContent = envContent.replace(
      /VITE_PAYMENT_CONFIG_ID=.*/,
      `VITE_PAYMENT_CONFIG_ID=${paymentConfigId}`
    );

    writeFileSync(envPath, envContent);
    console.log('✅ Environment variables updated\n');

    // 8. Summary
    console.log('=====================================');
    console.log('🎉 Deployment complete!');
    console.log('=====================================');
    console.log('Package ID:', packageId);
    console.log('PaymentConfig ID:', paymentConfigId);
    console.log('Network:', NETWORK);
    console.log('Explorer:', NETWORK === 'mainnet'
      ? `https://suiscan.xyz/mainnet/object/${packageId}`
      : `https://suiscan.xyz/testnet/object/${packageId}`
    );
    console.log('=====================================\n');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Run deployment
deploy().catch(console.error);

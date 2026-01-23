# Sui Profile NFT Dapp - Implementation Plan

## Overview

Build a full-stack Sui dapp that allows users to generate AI-powered profile images, upload them to Walrus, and mint them as NFTs on the Sui blockchain.

## Architecture

### Tech Stack

- **Frontend Framework**: TanStack Start (React 19)
- **Blockchain**: Sui (TypeScript SDK)
- **Storage**: Walrus (TypeScript SDK with relay)
- **AI**: Vercel AI SDK (nano banana model)
- **Wallet**: Sui dApp Kit
- **Smart Contract**: Sui Move

### Key Workflow

1. User connects Sui wallet
2. User enters prompt for profile image
3. User pays 0.01 SUI → triggers AI generation (server function)
4. AI generates image → returned to client
5. User approves image → uploads to Walrus (client)
6. User mints NFT with Walrus URL (client)
7. User views their NFT collection

---

## File Structure

```
hello-sui-stack/
├── move/
│   ├── sources/
│   │   └── profile_nft.move          # Smart contract
│   ├── tests/
│   │   └── profile_nft_tests.move    # Contract tests
│   └── Move.toml                      # Move package config
├── scripts/
│   ├── deploy.ts                      # Contract deployment script
│   └── test-contract.ts               # Contract testing script
├── src/
│   ├── routes/
│   │   ├── index.tsx                  # Main app page (existing - update)
│   │   ├── gallery.tsx                # NFT gallery page
│   │   └── __root.tsx                 # Root layout (existing - update)
│   ├── components/
│   │   ├── WalletConnect.tsx          # Wallet connection button
│   │   ├── ImageGenerator.tsx         # Image generation UI
│   │   ├── NFTCard.tsx                # NFT display card
│   │   └── Header.tsx                 # Navigation (existing - update)
│   ├── lib/
│   │   ├── sui/
│   │   │   ├── config.ts              # Sui network config
│   │   │   ├── contract.ts            # Contract addresses & types
│   │   │   └── hooks.ts               # Sui-related React hooks
│   │   ├── walrus/
│   │   │   └── upload.ts              # Walrus upload utilities
│   │   └── utils.ts                   # Existing utilities
│   ├── server/
│   │   └── ai.ts                      # Server function for AI generation
│   └── types/
│       └── sui.ts                     # TypeScript types for Sui objects
├── .env.local                         # Environment variables
└── package.json                       # Dependencies (update)
```

---

## Dependencies to Install

### Production Dependencies

```bash
npm install @mysten/sui @mysten/dapp-kit @mysten/wallet-standard @tanstack/react-query ai @walrus-sdk/client
```

### Development Dependencies

```bash
npm install --save-dev @mysten/sui-move-analyzer
```

### Dependency Details

- `@mysten/sui` - Sui TypeScript SDK for blockchain interactions
- `@mysten/dapp-kit` - React hooks and components for Sui wallet integration
- `@mysten/wallet-standard` - Wallet adapter standard
- `@tanstack/react-query` - For data fetching (required by dapp-kit)
- `ai` - Vercel AI SDK
- `@walrus-sdk/client` - Walrus TypeScript SDK

---

## Smart Contract Design

### Module: `profile_nft`

**Objects:**

```move
struct ProfileNFT has key, store {
    id: UID,
    name: String,
    description: String,
    image_url: String,  // Walrus URL
    creator: address,
    created_at: u64,
}

struct PaymentConfig has key {
    id: UID,
    price: u64,  // 0.01 SUI = 10_000_000 MIST
    treasury: address,
}
```

**Entry Functions:**

1. `init(ctx: &mut TxContext)` - Initialize payment config
2. `pay_for_generation(payment: Coin<SUI>, config: &PaymentConfig, ctx: &mut TxContext)` - Accept payment, transfer to treasury
3. `mint_nft(name: String, description: String, image_url: String, ctx: &mut TxContext)` - Mint NFT with Walrus URL
4. `transfer_nft(nft: ProfileNFT, recipient: address)` - Transfer NFT to recipient

**Access Control:**

- Payment config owned by deployer
- NFTs owned by minting user
- Public treasury for collecting payments

---

## Implementation Steps

### Phase 1: Environment Setup

1. Create `.env.local` with:

   ```
   VITE_SUI_NETWORK=testnet
   VITE_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
   VITE_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
   VITE_CONTRACT_PACKAGE_ID=<deployed-package-id>
   VITE_PAYMENT_CONFIG_ID=<payment-config-object-id>
   AI_GATEWAY_API_KEY=<your-api-key>
   DEPLOYER_SEED_PHRASE=<seed-phrase-for-deployment>
   ```

2. Install dependencies
3. Update `package.json` scripts:
   ```json
   "deploy:contract": "tsx scripts/deploy.ts",
   "test:contract": "tsx scripts/test-contract.ts"
   ```

### Phase 2: Smart Contract

1. Create Move package structure (`move/Move.toml`)
2. Implement `profile_nft.move` contract
3. Write tests in `profile_nft_tests.move`
4. Create deployment script (`scripts/deploy.ts`)
   - Load seed phrase from env
   - Compile and publish contract
   - Initialize payment config
   - Save addresses to `.env.local`
5. Create test script (`scripts/test-contract.ts`)

### Phase 3: Sui Integration

1. Create `src/lib/sui/config.ts`
   - Network configuration (testnet)
   - RPC endpoints
   - dApp Kit setup
2. Create `src/lib/sui/contract.ts`
   - Contract addresses from env
   - Transaction builders for payment, minting
   - TypeScript types for contract objects
3. Create `src/lib/sui/hooks.ts`
   - Custom hooks for wallet connection
   - Hooks for fetching user NFTs
   - Transaction execution helpers
4. Create `src/types/sui.ts`
   - TypeScript interfaces for ProfileNFT
   - Type guards and validators

### Phase 4: Walrus Integration

1. Create `src/lib/walrus/upload.ts`
   - Initialize Walrus client with relay config
   - `uploadImageToWalrus(blob: Blob): Promise<string>`
   - Convert base64 image to blob
   - Use publisher relay endpoint
   - Return Walrus blob URL

### Phase 5: AI Server Function

1. Create `src/server/ai.ts`
   - Import Vercel AI SDK
   - Create server function with `createServerFn()`
   - Input: `{ prompt: string, paymentTxDigest: string }`
   - Validation: Verify payment tx on-chain
   - Generate image using nano banana model
   - Return base64 image data
   - Error handling for API failures

### Phase 6: Frontend Components

1. **Update `src/routes/__root.tsx`**
   - Wrap with Sui dApp Kit providers
   - Setup QueryClient for React Query
   - Add wallet connection UI to header

2. **Create `src/components/WalletConnect.tsx`**
   - Use `@mysten/dapp-kit` hooks
   - Connect/disconnect button
   - Display connected address
   - Network indicator

3. **Create `src/components/ImageGenerator.tsx`**
   - Prompt input field
   - "Generate" button (triggers payment)
   - Payment flow:
     - Build payment transaction
     - Execute with `signAndExecuteTransaction`
     - Wait for confirmation
     - Call AI server function with tx digest
   - Display generated image
   - "Upload & Mint" button
   - Loading states for each step
   - Error handling UI

4. **Create `src/components/NFTCard.tsx`**
   - Display NFT image from Walrus
   - Show NFT metadata (name, description)
   - Created timestamp
   - Transfer functionality (optional)

5. **Update `src/routes/index.tsx`**
   - Main landing/app page
   - Require wallet connection
   - Render ImageGenerator component
   - Show user's latest NFT preview

6. **Create `src/routes/gallery.tsx`**
   - Fetch user's NFTs from Sui
   - Grid layout of NFT cards
   - Empty state if no NFTs
   - Loading skeleton

7. **Update `src/components/Header.tsx`**
   - Add navigation links (Home, Gallery)
   - Integrate WalletConnect component

### Phase 7: Transaction Flows

**Payment & Generation Flow:**

```typescript
1. User enters prompt
2. Build payment transaction:
   - splitCoins to get 0.01 SUI
   - moveCall to pay_for_generation
3. Sign and execute transaction
4. Wait for confirmation
5. Call server function with tx digest + prompt
6. Server validates payment, generates image
7. Display image to user
```

**Upload & Mint Flow:**

```typescript
1. User likes generated image
2. Convert base64 to blob
3. Upload to Walrus → get blob ID
4. Construct Walrus URL
5. Build mint transaction:
   - moveCall to mint_nft with Walrus URL
6. Sign and execute transaction
7. Navigate to gallery
```

### Phase 8: Testing & Deployment

1. Test contract deployment on testnet
2. Test payment flow end-to-end
3. Test Walrus upload
4. Test NFT minting
5. Test gallery viewing
6. Deploy contract and save addresses
7. Verify all env vars configured
8. Build and test production build

---

## Environment Variables

### Client-side (VITE\_ prefix)

- `VITE_SUI_NETWORK` - Sui network (testnet/mainnet)
- `VITE_WALRUS_PUBLISHER_URL` - Walrus publisher relay endpoint
- `VITE_WALRUS_AGGREGATOR_URL` - Walrus aggregator endpoint
- `VITE_CONTRACT_PACKAGE_ID` - Deployed contract package ID
- `VITE_PAYMENT_CONFIG_ID` - Payment config object ID

### Server-side

- `AI_GATEWAY_API_KEY` - API key for Vercel AI SDK / nano banana
- `DEPLOYER_SEED_PHRASE` - Seed phrase for contract deployment

---

## Security Considerations

1. **API Key Protection**: AI SDK key only in server function, never exposed to client
2. **Payment Validation**: Server function verifies payment transaction on-chain before generating image
3. **Wallet Security**: Use Sui wallet standard, never handle private keys
4. **Environment Variables**: Use `.env.local` (gitignored), never commit secrets
5. **Input Validation**: Sanitize prompts, validate URLs, check transaction signatures

---

## Error Handling

1. **Wallet Connection Errors**: Display user-friendly messages, retry button
2. **Payment Failures**: Show transaction error, suggest check balance
3. **AI Generation Failures**: Timeout handling, API error messages
4. **Walrus Upload Failures**: Retry logic, network error handling
5. **Minting Failures**: Transaction validation, gas estimation

---

## Testing Strategy

1. **Smart Contract Tests**: Move unit tests for payment and minting logic
2. **Integration Tests**: End-to-end flow with testnet
3. **Manual Testing**:
   - Connect different wallets
   - Generate images with various prompts
   - Upload to Walrus
   - Mint NFTs
   - View gallery
   - Handle edge cases (insufficient balance, network errors)

---

## Deployment Checklist

- [ ] Smart contract compiled and published to Sui testnet
- [ ] Payment config initialized
- [ ] Contract addresses saved to `.env.local`
- [ ] All dependencies installed
- [ ] AI SDK API key configured
- [ ] Walrus endpoints configured
- [ ] Frontend builds successfully
- [ ] Payment flow tested
- [ ] Image generation tested
- [ ] Walrus upload tested
- [ ] NFT minting tested
- [ ] Gallery viewing tested

---

## Success Criteria

1. ✅ User can connect Sui wallet
2. ✅ User can pay 0.01 SUI for image generation
3. ✅ AI generates profile image based on prompt
4. ✅ Generated image uploads to Walrus
5. ✅ NFT mints with Walrus URL as image
6. ✅ User can view all their minted NFTs
7. ✅ Deployment script works with seed phrase from .env
8. ✅ API keys remain secure (server-side only)

---

## Open Questions for User

1. **AI Model**: Which AI gateway provider are you using for nano banana? (Google AI, OpenAI compatible endpoint?)
2. **Treasury**: Where should payment funds go? (Deployer address, separate treasury?)
3. **NFT Metadata**: What should the default name/description format be? (e.g., "Profile #123", user-customizable?)
4. **Transfer**: Should users be able to transfer NFTs to others from the UI?
5. **Limits**: Any rate limiting on image generation per wallet?

---

## Next Steps

Once approved:

1. Install all dependencies
2. Create smart contract structure
3. Implement Move contract
4. Create deployment script
5. Setup Sui integration layer
6. Implement server function for AI
7. Build frontend components
8. Wire up transaction flows
9. Test end-to-end
10. Deploy and verify

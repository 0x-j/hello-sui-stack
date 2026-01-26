# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a full-stack Sui blockchain dApp that combines AI-powered image generation with NFT minting. Users pay 0.01 SUI to generate profile pictures using the nano banana AI model, then mint them as NFTs stored on Walrus decentralized storage.

## Tech Stack

- **Frontend**: TanStack Start (SSR React 19 framework)
- **Blockchain**: Sui (Move smart contracts)
- **Storage**: Walrus (decentralized storage)
- **AI**: Vercel AI SDK with Google Gemini 2.5 Flash Image model
- **Styling**: Tailwind CSS v4 with neo-brutalist design system

## Common Commands

### Development
```bash
npm run dev              # Start dev server on port 3000
npm run build            # Build for production
npm run preview          # Preview production build
npm test                 # Run Vitest tests
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run format           # Run Prettier
npm run check            # Format and lint with auto-fix
```

### Blockchain
```bash
npm run deploy:contract  # Deploy Move contract to Sui testnet
npm run test:contract    # Test deployed contract

# Move-specific commands (run from move/ directory):
sui move build           # Build Move package
sui move test            # Run Move unit tests
```

### Adding UI Components
Use Shadcn with pnpm:
```bash
pnpm dlx shadcn@latest add button
```

## Architecture

### Application Flow

1. **Payment & Verification**: User pays 0.01 SUI via `pay_for_generation()` entry function. Payment transaction emits `PaymentReceived` event.

2. **AI Generation**: Server function (`src/server/ai.ts`) verifies payment on-chain by checking for `PaymentReceived` event, then calls Vercel AI SDK to generate image using `google/gemini-2.5-flash-image` model.

3. **Walrus Upload**: Client-side code uploads base64 image blob to Walrus decentralized storage via publisher relay.

4. **NFT Minting**: Client calls `mint_nft()` entry function with Walrus URL, creating ProfileNFT object transferred to user's wallet.

### Key Architectural Patterns

**Server Functions**: TanStack Start's `createServerFn()` is used for AI generation (`src/server/ai.ts`). This ensures API keys stay server-side while enabling type-safe client calls.

**Sui dApp Kit Integration**: The root layout (`src/routes/__root.tsx`) wraps the app in provider layers:
- `QueryClientProvider` → TanStack Query for state management
- `SuiClientProvider` → Sui network configuration
- `WalletProvider` → Wallet connection with auto-connect

**Move Contract Architecture**: The contract uses a shared `PaymentConfig` object to manage pricing and treasury address. This allows dynamic price updates without redeploying. NFTs are individual owned objects with Walrus storage URLs.

**Environment Variables**: Contract addresses (`VITE_CONTRACT_PACKAGE_ID`, `VITE_PAYMENT_CONFIG_ID`) are automatically populated by the deploy script. Server-only variables (`AI_GATEWAY_API_KEY`, `DEPLOYER_SEED_PHRASE`) are accessed via `process.env`, while client variables use `import.meta.env`.

### Critical Files

- `move/sources/profile_nft.move` - Smart contract with payment and minting logic
- `src/server/ai.ts` - Server function for payment verification and AI generation
- `src/routes/__root.tsx` - Provider setup and layout
- `scripts/deploy.ts` - Automated deployment with env updates
- `src/lib/sui/contract.ts` - TypeScript contract interaction utilities
- `src/lib/walrus/upload.ts` - Walrus storage integration

## Smart Contract Details

**Module**: `profile_nft::profile_nft`

**Shared Objects**:
- `PaymentConfig` - Contains price (in MIST) and treasury address. Created during `init()` and shared globally.

**Owned Objects**:
- `ProfileNFT` - Individual NFT with name, description, image_url (Walrus), creator address, and timestamp.

**Entry Functions**:
- `pay_for_generation(payment: Coin<SUI>, config: &PaymentConfig)` - Accepts payment, transfers to treasury, emits event
- `mint_nft(name, description, image_url)` - Creates NFT and transfers to sender
- `update_price()` / `update_treasury()` - Admin functions (treasury-only)

**Payment Flow**: The contract handles overpayment by splitting coins and returning change. Payment verification happens server-side by querying the transaction's events.

## Testing

Move tests are in `move/sources/profile_nft_tests.move` and run via `sui move test`.

TypeScript tests use Vitest with React Testing Library. Configuration in `vite.config.ts`.

The `scripts/test-contract.ts` script tests the deployed contract end-to-end: payment, NFT minting, and querying owned NFTs.

## Deployment Process

1. Run `npm run deploy:contract`
2. Script performs: Move tests → Build → Publish → Extract IDs → Update `.env.local`
3. `VITE_CONTRACT_PACKAGE_ID` and `VITE_PAYMENT_CONFIG_ID` are automatically populated
4. Deployer address becomes the initial treasury

The deployment script uses `DEPLOYER_SEED_PHRASE` from `.env.local` to derive keypair. For testnet, get SUI from https://faucet.testnet.sui.io/

## Design System

The UI uses a neo-brutalist cyber aesthetic with:
- Bold borders and shadows
- Vibrant color scheme (cyber blue, neon green, electric purple)
- CSS animations defined in `src/styles.css`
- Tailwind CSS v4 with `@tailwindcss/vite` plugin

Avoid changing the design aesthetic unless explicitly requested.

## Important Notes

- The AI model requires `AI_GATEWAY_API_KEY` in `.env.local` (server-side only)
- Walrus endpoints must be configured for testnet/mainnet in environment variables
- Contract addresses in `src/lib/sui/constants.ts` are loaded from environment variables at build time
- The app uses file-based routing via TanStack Router (pages in `src/routes/`)
- All blockchain interactions go through `@mysten/dapp-kit` hooks for wallet integration

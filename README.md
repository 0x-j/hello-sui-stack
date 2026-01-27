# Sui Profile NFT Generator

A full-stack dapp built for the Sui hackathon that allows users to generate AI-powered profile images and mint them as NFTs on the Sui blockchain.

## Features

- 🎨 **AI Image Generation**: Create unique profile pictures using nano banana AI model
- 💰 **Pay-per-Generation**: 0.01 SUI per image generation
- 📦 **Walrus Storage**: Decentralized image storage on Walrus
- 🖼️ **NFT Minting**: Mint your generated images as NFTs on Sui
- 🎯 **NFT Gallery**: View all your minted profile NFTs
- 🔐 **Wallet Integration**: Connect with any Sui wallet

## Tech Stack

- **Frontend**: TanStack Start (React 19)
- **Blockchain**: Sui (Move smart contracts)
- **Storage**: Walrus (decentralized storage)
- **AI**: Vercel AI SDK (nano banana model)
- **Wallet**: Sui dApp Kit
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 18+
- Sui CLI (for contract development and deployment)
- A Sui wallet with testnet SUI tokens
- API key for Vercel AI SDK / nano banana model

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Sui CLI

Follow the [official Sui installation guide](https://docs.sui.io/guides/developer/getting-started/sui-install).

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Sui Network Configuration
VITE_SUI_NETWORK=testnet

# Walrus Endpoints (Testnet)
VITE_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
VITE_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# Contract Addresses (will be populated after deployment)
VITE_CONTRACT_PACKAGE_ID=
VITE_PAYMENT_CONFIG_ID=

# AI SDK Configuration (Server-side only)
AI_GATEWAY_API_KEY=your-api-key-here

# Deployment Configuration (Server-side only)
DEPLOYER_SEED_PHRASE=your-seed-phrase-here
```

### 4. Get Testnet SUI

Visit the [Sui Testnet Faucet](https://faucet.testnet.sui.io/) to get testnet SUI tokens for deployment and testing.

## Deployment

### 1. Deploy Smart Contract

Deploy the Move contract to Sui testnet:

```bash
npm run deploy:contract
```

This will:

- Build the Move package
- Publish it to Sui testnet
- Initialize the payment configuration
- Automatically update `.env.local` with contract addresses

### 2. Test Smart Contract (Optional)

Test the deployed contract:

```bash
npm run test:contract
```

This will:

- Test payment for image generation
- Test NFT minting
- Query owned NFTs

## Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Usage

### 1. Connect Wallet

Click the "Connect Wallet" button in the header and connect your Sui wallet.

### 2. Generate Profile Image

1. Enter a description of your desired profile image
2. Click "Generate Image"
3. Pay 0.01 SUI (transaction will be signed via your wallet)
4. Wait for the AI to generate your image

### 3. Mint NFT

1. Review the generated image
2. Optionally edit the NFT name and description
3. Click "Upload & Mint NFT"
4. Image will be uploaded to Walrus
5. NFT will be minted on Sui (sign transaction)

### 4. View Gallery

Navigate to the Gallery page to see all your minted NFTs.

## Project Structure

```
hello-sui-stack/
├── move/                          # Sui Move smart contracts
│   ├── sources/
│   │   └── profile_nft.move      # Main contract
│   └── Move.toml                  # Move package config
├── scripts/                       # Deployment and testing scripts
│   ├── deploy.ts                  # Contract deployment
│   └── test-contract.ts           # Contract testing
├── src/
│   ├── routes/                    # File-based routing
│   │   ├── __root.tsx            # Root layout with providers
│   │   ├── index.tsx             # Home page with generator
│   │   └── gallery.tsx           # NFT gallery page
│   ├── components/                # React components
│   │   ├── WalletConnect.tsx     # Wallet connection UI
│   │   ├── ImageGenerator.tsx    # Image generation flow
│   │   ├── NFTCard.tsx           # NFT display card
│   │   └── Header.tsx            # Navigation header
│   ├── lib/
│   │   ├── sui/                  # Sui integration
│   │   │   ├── config.ts         # Network configuration
│   │   │   ├── contract.ts       # Contract utilities
│   │   │   └── hooks.ts          # React hooks for Sui
│   │   └── walrus/               # Walrus integration
│   │       └── upload.ts         # Upload utilities
│   ├── server/                   # Server functions
│   │   └── ai.ts                 # AI image generation
│   └── types/                    # TypeScript types
│       └── sui.ts                # Sui-related types
└── .env.local                    # Environment variables
```

## Smart Contract

### Module: `profile_nft::profile_nft`

**Objects:**

- `ProfileNFT`: NFT representing a profile image
- `PaymentConfig`: Shared object for payment settings

**Entry Functions:**

- `pay_for_generation`: Accept payment for image generation
- `mint_nft`: Mint a new profile NFT
- `transfer_nft`: Transfer NFT to another address
- `update_price`: Update generation price (admin)
- `update_treasury`: Update treasury address (admin)

**View Functions:**

- `get_price`: Get current generation price
- `get_treasury`: Get treasury address
- NFT getters: `get_name`, `get_description`, `get_image_url`, etc.

## Workflow

1. **User connects Sui wallet** → dApp Kit handles wallet connection
2. **User enters prompt** → Client-side input
3. **User pays 0.01 SUI** → Smart contract `pay_for_generation` called
4. **AI generates image** → Server function verifies payment + calls AI SDK
5. **User approves image** → Client receives base64 image
6. **Upload to Walrus** → Client uploads blob to Walrus relay
7. **Mint NFT** → Smart contract `mint_nft` called with Walrus URL
8. **View in gallery** → Query owned NFTs from Sui

## Security

- ✅ API keys kept server-side only (AI SDK)
- ✅ Payment verification on-chain before image generation
- ✅ Wallet private keys never exposed (Sui wallet standard)
- ✅ Environment variables in `.env.local` (gitignored)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy:contract` - Deploy smart contract
- `npm run test:contract` - Test deployed contract
- `npm run lint` - Lint code
- `npm run format` - Format code

## Troubleshooting

### Contract not deployed

If you see "Smart contract not deployed", run:

```bash
npm run deploy:contract
```

### Insufficient balance

Get testnet SUI from the faucet:

```
https://faucet.testnet.sui.io/
```

### Walrus upload fails

Verify Walrus endpoints are configured correctly in `.env.local`.

### Image generation fails

Check that `AI_GATEWAY_API_KEY` is set correctly in `.env.local`.

## License

MIT

## Contributing

This project was built for the Sui hackathon. Feel free to fork and improve!

## Links

- [Sui Documentation](https://docs.sui.io/)
- [Walrus Documentation](https://docs.walrus.app/)
- [TanStack Start](https://tanstack.com/start)
- [Vercel AI SDK](https://sdk.vercel.ai/)

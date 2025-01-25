# Netlify Functions for AISTM7

This directory contains the serverless functions that power the AISTM7 backend.

## Structure

```
functions/
├── api.ts              # Main API handler
├── services/           # Local service implementations
│   ├── enhancedAIService.ts
│   └── enhancedSolanaService.ts
├── package.json        # Function-specific dependencies
└── tsconfig.json       # TypeScript configuration
```

## Environment Variables

Required environment variables:
```
SOLANA_RPC_URL=https://api.devnet.solana.com
TOKEN_MINT_ADDRESS=your-token-mint-address
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Build functions:
```bash
npm run build
```

## Deployment

The functions are automatically deployed when pushing to the main branch. The deployment process:

1. Installs dependencies (including Solana packages)
2. Compiles TypeScript
3. Bundles functions with dependencies
4. Deploys to Netlify's serverless infrastructure

## Testing

To test locally:
```bash
netlify dev
```

This will start a local development server that emulates the Netlify Functions environment.
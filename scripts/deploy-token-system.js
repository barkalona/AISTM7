const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@project-serum/anchor');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deployTokenSystem() {
    try {
        console.log('Starting token system deployment...');

        // Load environment variables
        const {
            SOLANA_RPC_URL,
            SOLANA_PROGRAM_KEYPAIR,
            SOLANA_MINT_AUTHORITY_KEYPAIR,
            PYTH_PRICE_FEED
        } = process.env;

        if (!SOLANA_RPC_URL || !SOLANA_PROGRAM_KEYPAIR || !SOLANA_MINT_AUTHORITY_KEYPAIR || !PYTH_PRICE_FEED) {
            throw new Error('Missing required environment variables');
        }

        // Initialize connection and wallet
        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
        const programKeypair = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(fs.readFileSync(SOLANA_PROGRAM_KEYPAIR)))
        );
        const mintAuthorityKeypair = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(fs.readFileSync(SOLANA_MINT_AUTHORITY_KEYPAIR)))
        );

        console.log('Loading program...');
        
        // Load the program IDL
        const idlPath = path.join(__dirname, '../blockchain/target/idl/aistm7_token.json');
        const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

        // Create provider and program
        const wallet = new Wallet(mintAuthorityKeypair);
        const provider = new AnchorProvider(connection, wallet, {
            commitment: 'confirmed',
            preflightCommitment: 'confirmed',
        });

        const program = new Program(idl, programKeypair.publicKey, provider);

        console.log('Deploying token program...');

        // Deploy the program if not already deployed
        const programInfo = await connection.getAccountInfo(programKeypair.publicKey);
        if (!programInfo) {
            // Program deployment logic here
            // Note: This should be done using anchor deploy command
            console.log('Program needs to be deployed first using anchor deploy');
            return;
        }

        console.log('Initializing token mint...');

        // Create mint account
        const mint = await Token.createMint(
            connection,
            mintAuthorityKeypair,
            mintAuthorityKeypair.publicKey,
            mintAuthorityKeypair.publicKey,
            9, // 9 decimals like SOL
            TOKEN_PROGRAM_ID
        );

        console.log('Token mint created:', mint.publicKey.toString());

        // Initialize program state
        console.log('Initializing program state...');

        const [stateAddress] = await PublicKey.findProgramAddress(
            [Buffer.from('token_state')],
            program.programId
        );

        const initialSupply = 1_000_000_000; // 1 billion tokens
        
        await program.methods
            .initialize(initialSupply)
            .accounts({
                authority: mintAuthorityKeypair.publicKey,
                state: stateAddress,
                mint: mint.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .signers([mintAuthorityKeypair])
            .rpc();

        console.log('Program state initialized');

        // Save deployment information
        const deploymentInfo = {
            programId: programKeypair.publicKey.toString(),
            mintAddress: mint.publicKey.toString(),
            stateAddress: stateAddress.toString(),
            mintAuthority: mintAuthorityKeypair.publicKey.toString(),
            network: SOLANA_RPC_URL,
            deployedAt: new Date().toISOString()
        };

        fs.writeFileSync(
            path.join(__dirname, '../blockchain/deployment.json'),
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log('Deployment info saved to blockchain/deployment.json');

        // Initialize price monitoring
        console.log('Initializing price monitoring...');
        
        const TokenPriceService = require('../backend/services/tokenPriceService');
        await TokenPriceService.startPriceMonitoring();

        console.log('Price monitoring started');
        console.log('Token system deployment completed successfully');

        return deploymentInfo;
    } catch (error) {
        console.error('Deployment failed:', error);
        throw error;
    }
}

// Add verification function
async function verifyDeployment(deploymentInfo) {
    try {
        console.log('Verifying deployment...');

        const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');

        // Verify program
        const programInfo = await connection.getAccountInfo(new PublicKey(deploymentInfo.programId));
        if (!programInfo) {
            throw new Error('Program not found');
        }

        // Verify mint
        const mintInfo = await connection.getAccountInfo(new PublicKey(deploymentInfo.mintAddress));
        if (!mintInfo) {
            throw new Error('Mint account not found');
        }

        // Verify state
        const stateInfo = await connection.getAccountInfo(new PublicKey(deploymentInfo.stateAddress));
        if (!stateInfo) {
            throw new Error('State account not found');
        }

        // Verify price feed
        const priceFeedInfo = await connection.getAccountInfo(new PublicKey(process.env.PYTH_PRICE_FEED));
        if (!priceFeedInfo) {
            throw new Error('Price feed not found');
        }

        console.log('Deployment verified successfully');
        return true;
    } catch (error) {
        console.error('Verification failed:', error);
        throw error;
    }
}

// Execute if run directly
if (require.main === module) {
    deployTokenSystem()
        .then(async (deploymentInfo) => {
            if (deploymentInfo) {
                await verifyDeployment(deploymentInfo);
            }
        })
        .catch((error) => {
            console.error('Deployment script failed:', error);
            process.exit(1);
        });
}

module.exports = {
    deployTokenSystem,
    verifyDeployment
};
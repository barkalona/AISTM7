const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
const { Program } = require('@project-serum/anchor');
const { getOrCreateAssociatedTokenAccount } = require('@solana/spl-token');
const { readFileSync } = require('fs');
const path = require('path');

class BalanceRequirementService {
    constructor(connection, tokenProgramId, priceFeedAddress) {
        this.connection = connection;
        this.tokenProgramId = new PublicKey(tokenProgramId);
        this.priceFeedAddress = new PublicKey(priceFeedAddress);
        
        // Constants from the smart contract
        this.TARGET_USD_VALUE = 15_000_000; // $15 in millionths
        this.MIN_TOKENS = 100;
        this.MAX_TOKENS = 10_000;

        // Initialize the program
        this.initializeProgram();
    }

    async initializeProgram() {
        try {
            // Load the program IDL
            const idlPath = path.join(__dirname, '../blockchain/target/idl/aistm7_token.json');
            const idl = JSON.parse(readFileSync(idlPath, 'utf8'));

            // Get the program keypair
            const programKeypairPath = process.env.SOLANA_PROGRAM_KEYPAIR;
            if (!programKeypairPath) {
                throw new Error('SOLANA_PROGRAM_KEYPAIR environment variable not set');
            }

            const programKeypair = JSON.parse(readFileSync(programKeypairPath, 'utf8'));
            this.authority = programKeypair;

            // Initialize the program
            this.program = new Program(idl, this.tokenProgramId, {
                connection: this.connection,
                authority: this.authority
            });

            console.log('Token program initialized successfully');
        } catch (error) {
            console.error('Error initializing program:', error);
            throw error;
        }
    }

    async getCurrentRequirement() {
        try {
            const tokenState = await this.getTokenState();
            return {
                requiredAmount: tokenState.currentRequirement.toNumber(),
                lastUpdate: new Date(tokenState.lastUpdate.toNumber() * 1000),
                targetUsdValue: this.TARGET_USD_VALUE / 1_000_000, // Convert to whole dollars
                minTokens: this.MIN_TOKENS,
                maxTokens: this.MAX_TOKENS
            };
        } catch (error) {
            console.error('Error getting current requirement:', error);
            throw error;
        }
    }

    async verifyBalance(walletAddress) {
        try {
            const wallet = new PublicKey(walletAddress);
            const tokenState = await this.getTokenState();
            
            // Get the user's token account
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                null, // payer not needed for reading
                tokenState.mint, // Use mint from token state
                wallet
            );

            const balance = tokenAccount.amount.toNumber();
            const requirement = tokenState.currentRequirement.toNumber();

            return {
                hasRequiredBalance: balance >= requirement,
                currentBalance: balance,
                requiredAmount: requirement,
                shortfall: balance < requirement ? requirement - balance : 0,
                lastVerified: new Date()
            };
        } catch (error) {
            console.error('Error verifying balance:', error);
            throw error;
        }
    }

    async updateRequirement() {
        try {
            // Build the transaction
            const instruction = await this.program.methods
                .updateBalanceRequirement(this.priceFeedAddress)
                .accounts({
                    authority: this.authority.publicKey,
                    state: await this.getTokenStateAddress(),
                    priceFeed: this.priceFeedAddress,
                })
                .instruction();

            const transaction = new Transaction().add(instruction);
            
            // Sign and send the transaction
            const signature = await this.connection.sendTransaction(
                transaction,
                [this.authority]
            );

            // Wait for confirmation
            const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${confirmation.value.err}`);
            }

            // Get and return the updated requirement
            const newRequirement = await this.getCurrentRequirement();
            console.log('Requirement updated successfully:', newRequirement);
            return newRequirement;
        } catch (error) {
            console.error('Error updating requirement:', error);
            throw error;
        }
    }

    async getTokenState() {
        try {
            const stateAddress = await this.getTokenStateAddress();
            const state = await this.program.account.tokenState.fetch(stateAddress);
            
            if (!state) {
                throw new Error('Token state account not found');
            }

            return state;
        } catch (error) {
            console.error('Error fetching token state:', error);
            throw error;
        }
    }

    async getTokenStateAddress() {
        const [stateAddress] = await PublicKey.findProgramAddress(
            [Buffer.from('token_state')],
            this.program.programId
        );
        return stateAddress;
    }

    async getRequirementHistory(days = 7) {
        try {
            const signatures = await this.connection.getSignaturesForAddress(
                this.program.programId,
                { limit: 100 }
            );

            const events = [];
            for (const sig of signatures) {
                const tx = await this.connection.getParsedTransaction(sig.signature, {
                    commitment: 'confirmed',
                    maxSupportedTransactionVersion: 0
                });

                if (!tx?.meta?.logMessages) continue;

                // Parse logs for BalanceRequirementUpdated events
                const eventParser = new this.program.coder.events.parser();
                for (const log of tx.meta.logMessages) {
                    try {
                        const event = eventParser.parse(log);
                        if (event?.name === 'BalanceRequirementUpdated') {
                            events.push({
                                timestamp: new Date(event.data.timestamp.toNumber() * 1000),
                                requirement: event.data.newRequirement.toNumber(),
                                price: event.data.price.toNumber() / 1_000_000, // Convert to whole dollars
                                signature: sig.signature
                            });
                        }
                    } catch (e) {
                        // Skip logs that aren't program events
                        continue;
                    }
                }
            }

            // Filter for the requested time period
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            
            return events
                .filter(e => e.timestamp >= cutoff)
                .sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Error getting requirement history:', error);
            throw error;
        }
    }
}

module.exports = BalanceRequirementService;
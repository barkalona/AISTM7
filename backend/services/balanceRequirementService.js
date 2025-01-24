const { Connection, PublicKey } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount } = require('@solana/spl-token');

class BalanceRequirementService {
    constructor(connection, tokenProgramId, priceFeedAddress) {
        this.connection = connection;
        this.tokenProgramId = new PublicKey(tokenProgramId);
        this.priceFeedAddress = new PublicKey(priceFeedAddress);
        this.TARGET_USD_VALUE = 15_000_000; // $15 in millionths
        this.MIN_TOKENS = 100;
        this.MAX_TOKENS = 10_000;
    }

    async getCurrentRequirement() {
        try {
            const tokenState = await this.getTokenState();
            return {
                requiredAmount: tokenState.currentRequirement,
                lastUpdate: new Date(tokenState.lastUpdate * 1000),
                targetUsdValue: this.TARGET_USD_VALUE / 1_000_000, // Convert to whole dollars
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
                this.tokenProgramId,
                wallet
            );

            const balance = tokenAccount.amount;
            const requirement = tokenState.currentRequirement;

            return {
                hasRequiredBalance: balance >= requirement,
                currentBalance: balance,
                requiredAmount: requirement,
                shortfall: balance < requirement ? requirement - balance : 0
            };
        } catch (error) {
            console.error('Error verifying balance:', error);
            throw error;
        }
    }

    async updateRequirement() {
        try {
            // Call the token program's update_balance_requirement instruction
            // This will fetch the current price from Pyth and update the requirement
            const instruction = await this.program.methods
                .updateBalanceRequirement(this.priceFeedAddress)
                .accounts({
                    authority: this.authority,
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

            await this.connection.confirmTransaction(signature);

            // Get and return the updated requirement
            return await this.getCurrentRequirement();
        } catch (error) {
            console.error('Error updating requirement:', error);
            throw error;
        }
    }

    async getTokenState() {
        const stateAddress = await this.getTokenStateAddress();
        const accountInfo = await this.connection.getAccountInfo(stateAddress);
        
        if (!accountInfo) {
            throw new Error('Token state account not found');
        }

        // Deserialize the account data based on the TokenState struct layout
        return this.program.coder.accounts.decode(
            'TokenState',
            accountInfo.data
        );
    }

    async getTokenStateAddress() {
        const [stateAddress] = await PublicKey.findProgramAddress(
            [Buffer.from('token_state')],
            this.tokenProgramId
        );
        return stateAddress;
    }

    async getRequirementHistory(days = 7) {
        try {
            // Get requirement update events from the program
            const signatures = await this.connection.getSignaturesForAddress(
                this.tokenProgramId,
                { limit: 100 }
            );

            const events = [];
            for (const sig of signatures) {
                const tx = await this.connection.getTransaction(sig.signature);
                if (!tx?.meta?.logMessages) continue;

                // Parse logs for BalanceRequirementUpdated events
                for (const log of tx.meta.logMessages) {
                    if (log.includes('BalanceRequirementUpdated')) {
                        const event = this.program.coder.events.decode(log);
                        if (event) {
                            events.push({
                                timestamp: new Date(event.timestamp * 1000),
                                requirement: event.newRequirement,
                                price: event.price / 1_000_000, // Convert to whole dollars
                            });
                        }
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
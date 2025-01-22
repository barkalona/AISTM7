const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const tokenMintAddress = new PublicKey('6RMi2pWqEmAE6aH7wrFiAjPvoxAEQV2JVYiufDJXn9L');
const mintAuthority = Keypair.fromSecretKey(
  Uint8Array.from(require('fs').readFileSync(process.env.SOLANA_MINT_AUTHORITY_KEYPAIR).toString('utf8').split(',').map(Number))
);

class SolanaService {
  constructor() {
    this.token = new Token(
      connection,
      tokenMintAddress,
      TOKEN_PROGRAM_ID,
      mintAuthority
    );
  }

  async verifyTokenBalance(walletAddress, requiredBalance = 700000) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const account = await this.token.getOrCreateAssociatedAccountInfo(publicKey);
      return account.amount >= requiredBalance;
    } catch (error) {
      console.error('Error verifying token balance:', error);
      return false;
    }
  }

  async getTokenBalance(walletAddress) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const account = await this.token.getOrCreateAssociatedAccountInfo(publicKey);
      return account.amount;
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  async transferTokens(fromWallet, toWallet, amount) {
    try {
      const fromPublicKey = new PublicKey(fromWallet);
      const toPublicKey = new PublicKey(toWallet);
      
      const fromAccount = await this.token.getOrCreateAssociatedAccountInfo(fromPublicKey);
      const toAccount = await this.token.getOrCreateAssociatedAccountInfo(toPublicKey);

      const transaction = await this.token.transfer(
        fromAccount.address,
        toAccount.address,
        fromPublicKey,
        [],
        amount
      );

      return transaction;
    } catch (error) {
      console.error('Error transferring tokens:', error);
      throw error;
    }
  }
}

module.exports = new SolanaService();
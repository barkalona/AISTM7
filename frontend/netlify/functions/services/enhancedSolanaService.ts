import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

class EnhancedSolanaService {
  private connection: Connection;
  private webSockets: Map<string, WebSocket>;

  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');
    this.webSockets = new Map();
  }

  addWebSocket(userId: string, ws: WebSocket) {
    this.webSockets.set(userId, ws);
  }

  async getTransactionHistory(userId: string) {
    try {
      const publicKey = new PublicKey(userId);
      const transactions = await this.connection.getSignaturesForAddress(publicKey);
      return transactions.map(tx => ({
        signature: tx.signature,
        slot: tx.slot,
        err: tx.err,
        memo: tx.memo,
        blockTime: tx.blockTime
      }));
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  async getTokenAnalytics() {
    try {
      const tokenMint = new PublicKey(process.env.TOKEN_MINT_ADDRESS!);
      const token = new Token(
        this.connection,
        tokenMint,
        TOKEN_PROGRAM_ID,
        // @ts-ignore - We don't need a real signer for supply check
        null
      );

      const supply = await token.getMintInfo();
      
      return {
        totalSupply: supply.supply.toString(),
        decimals: supply.decimals,
        mintAuthority: supply.mintAuthority?.toBase58(),
        freezeAuthority: supply.freezeAuthority?.toBase58()
      };
    } catch (error) {
      console.error('Error fetching token analytics:', error);
      throw error;
    }
  }

  async getAccountBalance(address: string) {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error fetching account balance:', error);
      throw error;
    }
  }

  // Add more methods as needed
}

export const enhancedSolanaService = new EnhancedSolanaService();
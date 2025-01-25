const { 
  Connection, 
  PublicKey, 
  Keypair
} = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const LRU = require('lru-cache');
const EventEmitter = require('events');

// Enhanced confirmation options for better reliability
const confirmOptions = {
  commitment: 'finalized',
  preflightCommitment: 'finalized',
  skipPreflight: false
};

class EnhancedSolanaService extends EventEmitter {
  constructor() {
    super();
    
    // Initialize connections with fallback endpoints
    this.connections = {
      primary: new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', confirmOptions),
      fallback: new Connection('https://solana-api.projectserum.com', confirmOptions)
    };
    
    this.tokenMintAddress = new PublicKey(process.env.TOKEN_MINT_ADDRESS || '6RMi2pWqEmAE6aH7wrFiAjPvoxAEQV2JVYiufDJXn9L');
    this.mintAuthority = this._loadMintAuthority();
    
    // Initialize token
    this.token = new Token(
      this.connections.primary,
      this.tokenMintAddress,
      TOKEN_PROGRAM_ID,
      this.mintAuthority
    );

    // Cache for transaction and account data
    this.cache = {
      transactions: new LRU({ max: 1000, ttl: 1000 * 60 * 5 }), // 5 minutes
      accounts: new LRU({ max: 500, ttl: 1000 * 60 }), // 1 minute
      tokenBalances: new LRU({ max: 500, ttl: 1000 * 30 }) // 30 seconds
    };

    // Track pending transactions
    this.pendingTransactions = new Map();
    
    // Start monitoring services
    this._startTransactionMonitoring();
    this._startMempoolMonitoring();
  }

  _loadMintAuthority() {
    try {
      const keypairData = require('fs').readFileSync(
        process.env.SOLANA_MINT_AUTHORITY_KEYPAIR
      ).toString('utf8');
      return Keypair.fromSecretKey(
        Uint8Array.from(keypairData.split(',').map(Number))
      );
    } catch (error) {
      console.error('Error loading mint authority:', error);
      throw new Error('Failed to load mint authority keypair');
    }
  }

  async _getConnection() {
    try {
      await this.connections.primary.getVersion();
      return this.connections.primary;
    } catch (error) {
      console.warn('Primary connection failed, using fallback');
      return this.connections.fallback;
    }
  }

  _startTransactionMonitoring() {
    const connection = this.connections.primary;
    
    connection.onAccountChange(this.tokenMintAddress, (accountInfo) => {
      this.emit('tokenSupplyChange', {
        supply: accountInfo.lamports,
        timestamp: Date.now()
      });
    });

    // Monitor token program for transfers
    connection.onProgramAccountChange(TOKEN_PROGRAM_ID, (keyedAccountInfo) => {
      const accountData = keyedAccountInfo.accountInfo.data;
      if (this._isTokenTransfer(accountData)) {
        this.emit('tokenTransfer', {
          account: keyedAccountInfo.accountId.toBase58(),
          data: this._parseTokenTransfer(accountData),
          timestamp: Date.now()
        });
      }
    });
  }

  _startMempoolMonitoring() {
    this.connections.primary.onLogs(this.tokenMintAddress, (logs) => {
      if (logs.err) return;

      const signature = logs.signature;
      const pendingTx = this.pendingTransactions.get(signature);
      
      if (pendingTx) {
        this.emit('transactionUpdate', {
          signature,
          status: 'pending',
          logs: logs.logs,
          timestamp: Date.now()
        });
      }
    });
  }

  async verifyTokenBalance(walletAddress, requiredBalance = 700000) {
    try {
      const balance = await this.getTokenBalance(walletAddress);
      return balance >= requiredBalance;
    } catch (error) {
      console.error('Error verifying token balance:', error);
      throw error;
    }
  }

  async getTokenBalance(walletAddress) {
    const cacheKey = `balance:${walletAddress}`;
    const cached = this.cache.tokenBalances.get(cacheKey);
    
    if (cached) return cached;

    try {
      const publicKey = new PublicKey(walletAddress);
      const account = await this.token.getOrCreateAssociatedAccountInfo(publicKey);
      
      const balance = account.amount;
      this.cache.tokenBalances.set(cacheKey, balance);
      
      return balance;
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  async transferTokens(fromWallet, toWallet, amount) {
    const connection = await this._getConnection();
    
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

      // Track pending transaction
      this.pendingTransactions.set(transaction.signature, {
        from: fromWallet,
        to: toWallet,
        amount,
        timestamp: Date.now()
      });

      // Monitor transaction status
      this._monitorTransaction(transaction.signature);

      return transaction;
    } catch (error) {
      console.error('Error transferring tokens:', error);
      throw error;
    }
  }

  async _monitorTransaction(signature) {
    const connection = await this._getConnection();
    
    try {
      const status = await connection.confirmTransaction(signature, 'finalized');
      
      if (status.value.err) {
        this.emit('transactionUpdate', {
          signature,
          status: 'failed',
          error: status.value.err,
          timestamp: Date.now()
        });
      } else {
        this.emit('transactionUpdate', {
          signature,
          status: 'confirmed',
          timestamp: Date.now()
        });
      }

      // Cache transaction result
      this.cache.transactions.set(signature, {
        status: status.value.err ? 'failed' : 'confirmed',
        timestamp: Date.now()
      });

      // Cleanup
      this.pendingTransactions.delete(signature);
    } catch (error) {
      console.error('Error monitoring transaction:', error);
      this.emit('transactionUpdate', {
        signature,
        status: 'error',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  async getTransactionHistory(walletAddress, limit = 50) {
    const connection = await this._getConnection();
    const publicKey = new PublicKey(walletAddress);
    
    try {
      const signatures = await connection.getSignaturesForAddress(
        publicKey,
        { limit }
      );

      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          // Check cache first
          const cached = this.cache.transactions.get(sig.signature);
          if (cached) return cached;

          const tx = await connection.getTransaction(sig.signature);
          const txData = {
            signature: sig.signature,
            timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
            status: tx?.meta?.err ? 'failed' : 'confirmed',
            amount: this._extractTransferAmount(tx),
            from: tx?.transaction.message.accountKeys[0].toBase58(),
            to: tx?.transaction.message.accountKeys[1].toBase58()
          };

          // Cache transaction data
          this.cache.transactions.set(sig.signature, txData);
          
          return txData;
        })
      );

      return transactions;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  async getTokenAnalytics() {
    const connection = await this._getConnection();
    
    try {
      const [supply, largestAccounts] = await Promise.all([
        this.token.getMintInfo(),
        connection.getTokenLargestAccounts(this.tokenMintAddress)
      ]);

      return {
        totalSupply: supply.supply.toString(),
        circulatingSupply: supply.supply.toString(),
        holders: largestAccounts.value.length,
        largestHolders: largestAccounts.value.map(account => ({
          address: account.address.toBase58(),
          balance: account.amount.toString()
        }))
      };
    } catch (error) {
      console.error('Error fetching token analytics:', error);
      throw error;
    }
  }

  _isTokenTransfer(data) {
    // Check if the instruction is a token transfer
    return data.length >= 4 && data.readUInt8(0) === 3; // 3 is the Token instruction index for Transfer
  }

  _parseTokenTransfer(data) {
    // Parse token transfer data from the instruction
    return {
      amount: data.readBigUInt64LE(1).toString()
    };
  }

  _extractTransferAmount(transaction) {
    if (!transaction?.meta?.postTokenBalances || !transaction?.meta?.preTokenBalances) {
      return '0';
    }

    const preBalance = transaction.meta.preTokenBalances[0]?.uiTokenAmount.amount || '0';
    const postBalance = transaction.meta.postTokenBalances[0]?.uiTokenAmount.amount || '0';
    
    return (BigInt(preBalance) - BigInt(postBalance)).toString();
  }
}

module.exports = new EnhancedSolanaService();
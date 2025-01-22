const solanaService = require('../../services/solanaService');
const { Connection, PublicKey } = require('@solana/web3.js');

// Mock web3.js
jest.mock('@solana/web3.js');

describe('Solana Service', () => {
  const mockWalletAddress = 'testWalletAddress123';
  const mockTokenAddress = 'tokenAddress123';
  const REQUIRED_BALANCE = 700000;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    Connection.mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue(1000000000),
      getTokenAccountsByOwner: jest.fn().mockResolvedValue({
        value: [{
          pubkey: new PublicKey('tokenAccountAddress'),
          account: {
            data: {
              parsed: {
                info: {
                  tokenAmount: {
                    uiAmount: REQUIRED_BALANCE
                  }
                }
              }
            }
          }
        }]
      }),
      getParsedTokenAccountsByOwner: jest.fn().mockResolvedValue({
        value: [{
          account: {
            data: {
              parsed: {
                info: {
                  mint: mockTokenAddress,
                  tokenAmount: {
                    uiAmount: REQUIRED_BALANCE
                  }
                }
              }
            }
          }
        }]
      })
    }));
  });

  describe('verifyTokenBalance', () => {
    it('should verify sufficient token balance', async () => {
      const result = await solanaService.verifyTokenBalance(mockWalletAddress);

      expect(result).toEqual({
        isValid: true,
        balance: REQUIRED_BALANCE
      });
    });

    it('should reject insufficient token balance', async () => {
      Connection.mockImplementation(() => ({
        getParsedTokenAccountsByOwner: jest.fn().mockResolvedValue({
          value: [{
            account: {
              data: {
                parsed: {
                  info: {
                    mint: mockTokenAddress,
                    tokenAmount: {
                      uiAmount: REQUIRED_BALANCE - 1000
                    }
                  }
                }
              }
            }
          }]
        })
      }));

      const result = await solanaService.verifyTokenBalance(mockWalletAddress);

      expect(result).toEqual({
        isValid: false,
        balance: REQUIRED_BALANCE - 1000
      });
    });

    it('should handle wallet with no token account', async () => {
      Connection.mockImplementation(() => ({
        getParsedTokenAccountsByOwner: jest.fn().mockResolvedValue({
          value: []
        })
      }));

      const result = await solanaService.verifyTokenBalance(mockWalletAddress);

      expect(result).toEqual({
        isValid: false,
        balance: 0
      });
    });

    it('should handle connection errors', async () => {
      Connection.mockImplementation(() => ({
        getParsedTokenAccountsByOwner: jest.fn().mockRejectedValue(
          new Error('Network error')
        )
      }));

      await expect(solanaService.verifyTokenBalance(mockWalletAddress))
        .rejects
        .toThrow('Failed to verify token balance');
    });
  });

  describe('adjustRequiredBalance', () => {
    it('should adjust required balance based on token price', async () => {
      const mockTokenPrice = 0.02; // $0.02 per token
      const targetUsdAmount = 20; // $20 worth of tokens

      const result = await solanaService.adjustRequiredBalance(mockTokenPrice);
      
      expect(result).toBe(Math.ceil(targetUsdAmount / mockTokenPrice));
      expect(result).toBeLessThan(REQUIRED_BALANCE);
    });

    it('should maintain minimum balance requirement', async () => {
      const mockTokenPrice = 0.00001; // Very low price
      
      const result = await solanaService.adjustRequiredBalance(mockTokenPrice);
      
      expect(result).toBe(REQUIRED_BALANCE);
    });

    it('should handle invalid token prices', async () => {
      await expect(solanaService.adjustRequiredBalance(0))
        .rejects
        .toThrow('Invalid token price');

      await expect(solanaService.adjustRequiredBalance(-1))
        .rejects
        .toThrow('Invalid token price');
    });
  });

  describe('getTokenPrice', () => {
    it('should fetch current token price', async () => {
      const mockPrice = 0.02;
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({
          price: mockPrice
        })
      });

      const price = await solanaService.getTokenPrice();
      expect(price).toBe(mockPrice);
    });

    it('should handle price fetch errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('API error'));

      await expect(solanaService.getTokenPrice())
        .rejects
        .toThrow('Failed to fetch token price');
    });
  });
});
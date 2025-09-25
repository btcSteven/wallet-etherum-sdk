import { YaakoWallet } from '../core/wallet';

describe('YaakoWallet', () => {
  let wallet: YaakoWallet;

  beforeEach(() => {
    jest.resetAllMocks();
    wallet = new YaakoWallet();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(wallet.accounts).toEqual(['0x1234567890123456789012345678901234567890']);
      expect(wallet.chainId).toBe('0x1');
    });
  });

  describe('Account Management', () => {
    it('should get accounts', async () => {
      const accounts = await wallet.request({ method: 'eth_accounts' });
      expect(accounts).toEqual(['0x1234567890123456789012345678901234567890']);
    });

    it('should request accounts', async () => {
      const accounts = await wallet.request({ method: 'eth_requestAccounts' });
      expect(accounts).toEqual(['0x1234567890123456789012345678901234567890']);
    });
  });

  describe('Transaction Handling', () => {
    it('should handle transaction error', async () => {
      await expect(
        wallet.request({
          method: 'eth_sendTransaction',
          params: [],
        })
      ).rejects.toThrow('Missing transaction parameters');
    });
  });

  describe('Chain Management', () => {
    it('should get chain ID', async () => {
      const chainId = await wallet.request({ method: 'eth_chainId' });
      expect(chainId).toBe('0x1');
    });

    it('should switch chain', async () => {
      const result = await wallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2' }],
      });
      expect(result).toBe('Switched to 0x2');
    });

    it('should handle chain switch error', async () => {
      const result = await wallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{}],
      });
      expect(result).toBe('Switched to 0x1');
    });
  });

  describe('Query Methods', () => {
    it('should get balance', async () => {
      const balance = await wallet.request({
        method: 'eth_getBalance',
        params: ['0x1234567890123456789012345678901234567890', 'latest'],
      });
      expect(balance).toBeTruthy();
      expect(balance.startsWith('0x')).toBe(true);
    });

    it('should get block', async () => {
      const block = await wallet.request({
        method: 'eth_getBlockByNumber',
        params: ['0x1', false],
      });
      expect(block).toBeTruthy();
      expect(block.number).toBeTruthy();
    });

    it('should get transaction count', async () => {
      const count = await wallet.request({
        method: 'eth_getTransactionCount',
        params: ['0x1234567890123456789012345678901234567890', 'latest'],
      });
      expect(count).toBe('0x0');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported method', async () => {
      await expect(
        wallet.request({ method: 'unsupported_method' })
      ).rejects.toThrow('Method unsupported_method not supported');
    });
  });
}); 
interface GAWInterface {
  address: string;
  chainId: string;
  chainIds: string[];
  sendTransaction: jest.Mock;
  switchChain: jest.Mock;
  signTransaction: jest.Mock;
  personalSign: jest.Mock;
  signTypedData: jest.Mock;
  getBalance: jest.Mock;
  getBlockByNumber: jest.Mock;
  getTransactionCount: jest.Mock;
}

declare global {
  interface Window {
    GAW: GAWInterface;
  }
} 
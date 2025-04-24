declare interface EthereumProvider {
  // EIP-1193
  request(args: { method: string; params?: any[] }): Promise<any>;
  on(event: string, callback: (...args: any[]) => void): void;
  removeListener(event: string, callback: (...args: any[]) => void): void;
  chainId: string;
  accounts: string[];

  // EIP-6963
  uuid?: string;
  name?: string;
  icon?: string;
  rdns?: string;
  description?: string;
  version?: string;
  chainIds?: string[];

  // Additional properties
  isGawWallet?: boolean;
  selectedAddress?: string;
  isConnected?(): boolean;
  disconnect?(): void;
} 
interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
  description: string;
  chainIds: string[];
  version: string;
}

interface EthereumProvider {
  // EIP-1193 标准属性
  accounts?: string[];
  chainId?: string;
  selectedAddress?: string;
  isYaakoWallet?: boolean;

  // EIP-6963 属性
  yaako?: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
    description: string;
    version: string;
  };

  // Provider state
  _state?: {
    accounts: string[];
    initialized: boolean;
    isConnected: boolean;
    isPermanentlyDisconnected: boolean;
    isUnlocked: boolean;
  };

  // EIP-1193 标准方法
  enable: () => Promise<string[]>;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
  emit?: (event: string, ...args: any[]) => void;
  // isConnected?: () => boolean;
  
  // 兼容性方法
  send: (method: string, params?: any[]) => Promise<any>;
  sendAsync: (payload: { method: string; params?: any[] }, callback: (error: Error | null, result?: any) => void) => Promise<void>;
}

interface YAAKOInterface {
  address: string;
  chainId: string;
  chainIds: string[];
  login?: () => Promise<void>;
  sendTransaction: (txParams: {
    from: string;
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
    nonce?: string;
  }) => Promise<string>;
  switchChain: (chainId: string) => Promise<string>;
  signTransaction: (txParams: {
    from: string;
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
    nonce?: string;
  }) => Promise<string>;
  personalSign: (txParams: { message: string; address: string }) => Promise<string>;
  signTypedData: (params: {
    domain: {
      name: string;
      version: string;
      chainId: number;
      verifyingContract: string;
    };
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, any>;
  }) => Promise<string>;
}

interface Window {
  ethereum: EthereumProvider;
  YAAKO_WALLET: YAAKOInterface;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

interface PermissionObject {
  parentCapability: string;
  invoker: string;
  caveats: Array<{
    type: string;
    value: any;
  }>;
}

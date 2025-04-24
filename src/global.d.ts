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
  isMetaMask?: boolean;
  isGawWallet?: boolean;

  // EIP-1193 标准方法
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
  emit?: (event: string, ...args: any[]) => void;
  isConnected?: () => boolean;
}

interface Window {
  ethereum: EthereumProvider;
  GAW: GAWInterface;  // todo update your wallet
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

 // todo your wallet Interface
interface GAWInterface {
  address: string;
  chainId: string;
  chainIds: string[];
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
  personalSign: (message: string, address: string) => Promise<string>;
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
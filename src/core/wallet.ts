import { ethers } from "ethers";
import { walletConfig } from "../config";

const mockAddress = "0xC01DDB92726f9a9fD3703bD017ddA3DA38efaaa1";

export class GawWallet implements EthereumProvider {
  // EIP-1193 标准属性
  public accounts: string[] = [walletConfig.getConfig()?.address || mockAddress];
  public chainId: string = walletConfig.getConfig()?.chainId || walletConfig.defaultChainId;
  public chainIds: string[] = walletConfig.getConfig()?.chainIds || [walletConfig.defaultChainId];
  public selectedAddress: string = this.accounts[0];
  public isGawWallet: boolean = true;

  private events: Record<string, Function[]> = {};
  private _connected = false;
  private _provider: ethers.JsonRpcProvider;

  // EIP-6963 属性
  public readonly uuid = walletConfig.uuid;
  public readonly name = walletConfig.name;
  public readonly icon = walletConfig.icon;
  public readonly rdns = walletConfig.rdns;
  public readonly description = walletConfig.description;
  public readonly version = walletConfig.version;

  constructor() {
    this._provider = new ethers.JsonRpcProvider(walletConfig.rpcUrl);
    this.initializeWallet();
  }

  // 2. 初始化相关
  private initializeWallet(): void {
    this.accounts = [walletConfig.getConfig()?.address || mockAddress];
    this.selectedAddress = walletConfig.getConfig()?.address || mockAddress;
    this.chainId = walletConfig.getConfig()?.chainId || walletConfig.defaultChainId;
    this._connected = false;
    this.setupChainListener();
  }

  // 3. 账户管理
  public get selectedAccount(): string {
    return this.selectedAddress;
  }

  public set selectedAccount(address: string) {
    this.selectedAddress = address;
    this.notifyAccountsChanged([address]);
  }

  private getAccounts(): string[] {
    this.initializeWallet();
    this._connected = true;
    return this.accounts;
  }

  // 4. 权限管理
  private handleRequestPermissions(): PermissionObject[] {
    if (!this.isConnected()) return [];

    return [
      {
        parentCapability: "eth_accounts",
        invoker: window.location.origin,
        caveats: [
          {
            type: "filterResponse",
            value: this.accounts,
          },
        ],
      },
    ];
  }

  // 5. 连接状态管理
  public isConnected(): boolean {
    return this._connected;
  }

  public disconnect(): void {
    console.log("Wallet disconnecting...");
    this.accounts = [];
    this.selectedAddress = "";
    this._connected = false;
    this.notifyAccountsChanged([]);
    this.notifyChainChanged("");
    this.notifyDisconnect(null);
  }

  // 6. 事件通知
  notifyAccountsChanged(accounts: string[]) {
    console.log("notifyAccountsChanged", accounts);
    this.emit("accountsChanged", accounts);
  }

  notifyChainChanged(chainId: string) {
    console.log("notifyChainChanged", chainId);
    this.emit("chainChanged", chainId);
  }

  notifyDisconnect(error: Error | null) {
    console.log("notifyDisconnect", error);
    this.emit("disconnect", error);
  }

  private notifyMessage(message: { type: string; data: any }): void {
    console.log("notifyMessage", message);
    this.emit("message", message);
  }

  // 7. 事件系统
  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  public emit(event: string, ...args: any[]): void {
    if (this.events[event]) {
      this.events[event].forEach((fn) => fn(...args));
    }
  }

  public removeListener(event: string, callback: (...args: any[]) => void): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((fn) => fn !== callback);
    }
  }

  // 8. RPC 请求处理
  public async request({ method, params }: { method: string; params?: any[] }): Promise<any> {
    console.log(`Request: ${method}`, params);
    try {
      switch (method) {
        // 1. 账户相关
        case "eth_requestAccounts":
          this.notifyAccountsChanged(this.accounts);
          return this.getAccounts();
        case "eth_accounts":
          return this.getAccounts();

        // 2. 权限相关
        case "wallet_revokePermissions":
          this.disconnect();
          return null;
        case "wallet_requestPermissions":
          return this.handleRequestPermissions();

        // 3. 链相关
        case "eth_chainId":
          return this.chainId;
        case "net_version":
          return parseInt(this.chainId || "0", 16).toString();
        case "wallet_switchEthereumChain":
          return this.switchChain(params);
        case "wallet_addEthereumChain":
          return null;

        // 4. 交易相关
        case "eth_sendTransaction":
          return this.sendTransaction(params);
        case "eth_signTransaction":
          return this.signTransaction(params);
        case "personal_sign":
          return this.personalSign(params);
        case "eth_signTypedData_v4":
          return this.signTypedData(params);
        case "eth_sendRawTransaction":
          return this.sendRawTransaction(params);

        // 5. 链状态相关
        case "eth_blockNumber":
          return this.getBlockNumber();
        case "eth_gasPrice":
          return this.getGasPrice();
        case "eth_estimateGas":
          return this.estimateGas(params?.[0]);

        // 6. 合约交互相关
        case "eth_getCode":
          return this.getCode(params);
        case "eth_call":
          return this.ethcall(params);

        // 7. 查询相关
        case "eth_getBalance":
          return this.getBalance(params);
        case "eth_getTransactionByHash":
          return this.getTransactionByHash(params);
        case "eth_getTransactionReceipt":
          return this.getTransactionReceipt(params);
        case "eth_getTransactionCount":
          return this.getTransactionCount(params);
        case "eth_getBlockByNumber":
          return this.getBlockByNumber(params);
        case "eth_getBlockByHash":
          return this.getBlockByHash(params);
        case "eth_getStorageAt":
          return this.getStorageAt(params);
        case "eth_getLogs":
          return this.getLogs(params);

        // 不支持的方法
        case "eth_subscribe":
        case "eth_unsubscribe":
        case "wallet_watchAsset":
          throw new Error("Subscriptions not supported over HTTP RPC.");

        default:
          throw new Error(`Method ${method} not supported`);
      }
    } catch (error: any) {
      this.notifyMessage({ type: "error", data: error });
      if (error.code) {
        throw new Error(`RPC Error ${error.code}: ${error.message}`);
      }
      throw new Error(`Failed to execute ${method}: ${error.message}`);
    }
  }

  // 9. 链监听
  private setupChainListener(): void {
    const config = walletConfig.getConfig();
    if (!config || typeof config !== "object") {
      console.warn("GAW is not initialized");
      return;
    }

    let currentChainId = config.chainId || walletConfig.defaultChainId;

    Object.defineProperty(config, "chainId", {
      get: () => currentChainId,
      set: (newChainId) => {
        if (newChainId !== currentChainId) {
          currentChainId = newChainId;
          this.chainId = newChainId;
          this.notifyChainChanged(newChainId);
        }
      },
    });

    const handleChainChanged = (event: Event) => {
      try {
        if (!event) return;
        
        const customEvent = event as CustomEvent<{ chainId: string }>;
        const newChainId = customEvent?.detail?.chainId;
        
        if (newChainId && newChainId !== this.chainId) {
          this.chainId = newChainId;
          this.notifyChainChanged(newChainId);
        }
      } catch (error) {
        console.error("Error handling chain changed event:", error);
      }
    };

    window.addEventListener("GAW_CHAIN_CHANGED", handleChainChanged as EventListener);
  }

  // 使用 window.GAW 的 sendTransaction
  private async sendTransaction(params?: any[]): Promise<string> {
    const tx = params?.[0];
    if (!tx) throw new Error("Missing transaction parameters");

    try {
      const hash = await walletConfig.getConfig()?.sendTransaction(tx);
      console.log(hash);
      return hash;
    } catch (error) {
      console.error("Failed to send transaction:", error);
      throw new Error("Failed to send transaction");
    }
  }

  // Switch the current chain (updates chainId and emits event)
  private async switchChain(params?: any[]): Promise<string> {
    this.chainId = params?.[0]?.chainId ?? this.chainId;
    await walletConfig.getConfig()?.switchChain(this.chainId);
    this.emit("chainChanged", this.chainId);
    return `Switched to ${this.chainId}`;
  }

  // Mock signTransaction (not usable without private key)
  private async signTransaction(params?: any[]): Promise<string> {
    //todo
    return "0xMockTransactionHash";
  }

  // Mock personal_sign (would need private key to actually sign)
  private async personalSign(params?: any[]): Promise<string> {
    //todo
    return "0xMockSignature_personal_sign";
  }

  // Mock typed data signing
  private async signTypedData(params?: any[]): Promise<string> {
    //todo
    return "0xMockSignature_typedData";
  }

  // Send a raw signed transaction to the network
  private async sendRawTransaction(params?: any[]): Promise<string> {
    const rawTx = params?.[0];
    if (!rawTx) throw new Error("Missing raw transaction data");

    try {
      return await this._provider.send("eth_sendRawTransaction", [rawTx]);
    } catch (error) {
      console.error("Failed to send raw transaction", error);
      throw new Error("Failed to send raw transaction");
    }
  }

  // Estimate gas for a transaction
  private async estimateGas(tx?: any): Promise<string> {
    if (!tx?.to || !tx?.from) throw new Error("Missing `to` or `from`");

    try {
      const gas = await this._provider.send("eth_estimateGas", [
        {
          from: tx.from,
          to: tx.to,
          value: tx.value ?? "0x0",
          data: tx.data ?? "0x",
        },
      ]);
      return ethers.toBeHex(gas);
    } catch (e) {
      console.error("Estimate Gas error", e);
      return "0x186a0"; // fallback
    }
  }

  // Get current gas price
  private async getGasPrice(): Promise<string> {
    try {
      return await this._provider.send("eth_gasPrice", []);
    } catch (e) {
      console.error("Get Gas Price error", e);
      return "0x3b9aca00";
    }
  }

  // Get current block number
  private async getBlockNumber(): Promise<string> {
    try {
      return await this._provider.send("eth_blockNumber", []);
    } catch (e) {
      console.error("Get Block Number error", e);
      return "0x1234";
    }
  }

  // Get ETH balance of an address
  private async getBalance(params?: any[]): Promise<string> {
    const [address, blockTag = "latest"] = params || [];
    if (!address) throw new Error("Missing address");

    try {
      const balance = await this._provider.getBalance(address, blockTag);
      return "0x" + BigInt(balance).toString(16);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      throw new Error("eth_getBalance failed");
    }
  }

  // Get transaction details by hash
  private async getTransactionByHash(params?: any[]): Promise<any> {
    const txHash = params?.[0];
    if (!txHash) throw new Error("Missing transaction hash");

    try {
      return await this._provider.getTransaction(txHash);
    } catch (error) {
      console.error("Error fetching transaction by hash:", error);
      throw new Error("Failed to fetch transaction by hash");
    }
  }

  // Get nonce for address
  private async getTransactionCount(params?: any[]): Promise<string> {
    const [address, blockTag = "latest"] = params || [];
    if (!address) throw new Error("Missing address");

    const nonce = await this._provider.getTransactionCount(address, blockTag);
    return "0x" + nonce.toString(16);
  }

  // Get transaction receipt
  private async getTransactionReceipt(params?: any[]): Promise<any> {
    const [txHash] = params || [];
    if (!txHash) throw new Error("Missing transaction hash");

    try {
      return await this._provider.send("eth_getTransactionReceipt", [txHash]);
    } catch (error) {
      console.error("Failed to fetch transaction receipt:", error);
      throw new Error("eth_getTransactionReceipt failed");
    }
  }

  // Get bytecode at a given address
  private async getCode(params?: any[]): Promise<string> {
    const [address, blockTag = "latest"] = params || [];
    if (!address) throw new Error("Missing address");

    return await this._provider.getCode(address, blockTag);
  }

  // Perform eth_call (read-only contract call)
  private async ethcall(params?: any[]): Promise<string> {
    const [tx, blockTag = "latest"] = params || [];
    if (!tx || !tx.to) throw new Error("Missing call parameters");

    try {
      return await this._provider.send("eth_call", [tx, blockTag]);
    } catch (error) {
      console.error("Error ethcall:", error);
      throw new Error("eth_call failed");
    }
  }

  // 添加获取区块信息的方法
  private async getBlockByNumber(params?: any[]): Promise<any> {
    const [blockNumber, includeTransactions = false] = params || [];
    if (!blockNumber) throw new Error("Missing block number");

    try {
      return await this._provider.send("eth_getBlockByNumber", [blockNumber, includeTransactions]);
    } catch (error) {
      console.error("Failed to fetch block:", error);
      throw new Error("eth_getBlockByNumber failed");
    }
  }

  // 添加常用的方法实现
  private async getBlockByHash(params?: any[]): Promise<any> {
    const [blockHash, includeTransactions = false] = params || [];
    if (!blockHash) throw new Error("Missing block hash");
    return await this._provider.send("eth_getBlockByHash", [blockHash, includeTransactions]);
  }

  private async getStorageAt(params?: any[]): Promise<string> {
    const [address, position, blockTag = "latest"] = params || [];
    if (!address || position === undefined) throw new Error("Missing address or position");
    return await this._provider.send("eth_getStorageAt", [address, position, blockTag]);
  }

  private async getLogs(params?: any[]): Promise<any[]> {
    const [filter] = params || [];
    if (!filter) throw new Error("Missing filter");
    return await this._provider.send("eth_getLogs", [filter]);
  }
}

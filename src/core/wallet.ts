import { ethers } from "ethers";
import { walletConfig } from "../config";
import { Logger } from '../utils/logger';

const mockAddress = "";

const Wallet = () => window?.Wallet;

export class MainWallet implements EthereumProvider {
  // ========== 1. 基础属性 ==========
  // EIP-1193 标准属性
  public accounts: string[] = [Wallet()?.address || mockAddress];
  public chainId: string = Wallet()?.chainId || walletConfig.defaultChainId;
  public chainIds: string[] = Wallet()?.chainIds || [walletConfig.defaultChainId];
  public selectedAddress: string = this.accounts[0];
  public isOwnWallet: boolean = true;

  // EIP-6963 属性
  public readonly uuid = walletConfig.uuid;
  public readonly name = walletConfig.name;
  public readonly icon = walletConfig.icon;
  public readonly rdns = walletConfig.rdns;
  public readonly description = walletConfig.description;
  public readonly version = walletConfig.version;

  // 状态管理
  public _state = {
    accounts: [Wallet()?.address || mockAddress],
    initialized: true,
    isConnected: false,
    isPermanentlyDisconnected: false,
    isUnlocked: true,
    isFirstConnect: true,
  };

  private events: Record<string, Function[]> = {};
  private _connected = false;
  private _provider: ethers.JsonRpcProvider;

  constructor() {
    this._provider = new ethers.JsonRpcProvider(walletConfig.rpcUrl);
    this.initializeWallet();
    this.setupVisibilityListener();
  }

  // ========== 2. 初始化 ==========
  private initializeWallet(): void {
    const address = Wallet()?.address || mockAddress;
    const chainId = Wallet()?.chainId || walletConfig.defaultChainId;

    this.accounts = [address];
    this.selectedAddress = address;

    // 初始化状态，但不自动连接
    this._state = {
      accounts: this.accounts,
      initialized: true,
      isConnected: localStorage.getItem("wallet_connected") === "true",
      isPermanentlyDisconnected: false,
      isUnlocked: true,
      isFirstConnect: true,
    };

    this._connected = this._state.isConnected;

    // 如果之前是连接状态，则恢复连接
    if (this._connected) {
      this._handleAccountsChanged(this.accounts);
      this._handleChainChanged(chainId);
    }

    // window.Wallet监听器
    this.setupWalletListener();
  }

  // 页面加载完成初始化
  private setupVisibilityListener(): void {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.initializeWallet();
        }
      });
    }
  }

  // ========== 3. 连接状态管理 ==========
  private _updateConnectionState(isConnected: boolean): void {
    this._connected = isConnected;
    this._state.isConnected = isConnected;
    this._state.isPermanentlyDisconnected = !isConnected;
    localStorage.setItem("wallet_connected", isConnected.toString());
  }

  public isConnected(): boolean {
    return this._connected && !this._state.isPermanentlyDisconnected;
  }

  public async connect(): Promise<string[]> {
    if (!this._connected) {
      // 验证当前账户
      if (!this.accounts.length || !ethers.isAddress(this.accounts[0])) {
        Logger.warn("No valid account available");
        return [];
      }
      this._updateConnectionState(true);
      await this._handleConnect(this.chainId);
      this._handleAccountsChanged(this.accounts);
    }
    return this.accounts;
  }

  public disconnect(): void {
    Logger.info("Wallet disconnecting...");
    this._updateConnectionState(false);
    this.notifyDisconnect(null);
    this._handleAccountsChanged([]);
    this._handleChainChanged("");
  }

  public get selectedAccount(): string {
    return this.selectedAddress;
  }

  public set selectedAccount(address: string) {
    if (address) {
      this._handleAccountsChanged([address]);
    }
  }

  // ========== 4. 事件系统 ==========
  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    if (event === "accountsChanged" && this.accounts.length > 0) {
      callback(this.accounts);
    }

    if (event === "chainChanged" && this.chainId) {
      callback(this.chainId);
    }
  }

  public emit(event: string, ...args: any[]): void {
    if (this.events[event]) {
      this.events[event].forEach((fn) => {
        try {
          fn(...args);
        } catch (error) {
          Logger.error(`Error in ${event} event handler:`, error);
        }
      });
    }
  }

  public removeListener(event: string, callback: (...args: any[]) => void): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((fn) => fn !== callback);
    }
  }

  private notifyAccountsChanged(accounts: string[]) {
    this.emit("accountsChanged", accounts);
  }

  private notifyChainChanged(chainId: string) {
    this.emit("chainChanged", chainId);
  }

  private notifyDisconnect(error: Error | null) {
    this.emit("disconnect", error);
  }

  private notifyMessage(message: { type: string; data: any }): void {
    this.emit("message", message);
  }

  // ========== 5. 链管理 ==========
  private setupWalletListener(): void {
    if (!Wallet() || typeof Wallet() !== "object") {
      Logger.warn('Wallet', 'Wallet is not initialized');
      return;
    }

    // 定期检查 window.Wallet 的变化
    if (typeof window !== "undefined") {
      setInterval(() => {
        try {
          const newChainId = window.Wallet?.chainId;
          if (newChainId && newChainId !== this.chainId) {
            this._handleChainChanged(newChainId);
          }

          const newAddress = window.Wallet?.address;
          if (newAddress && newAddress !== this.selectedAddress) {
            this._handleAccountsChanged([newAddress]);
          }
        } catch (error) {
          Logger.error('Wallet', 'Error checking Wallet changes:', error);
        }
      }, 2000);
    }
  }

  // ========== 6. RPC 请求处理 ==========
  public async request({ method, params }: { method: string; params?: any[] }): Promise<any> {
    Logger.debug('Request', `${method}`, params);
    try {
      return await this.handleRequest(method, params);
    } catch (error: any) {
      this.notifyMessage({ type: "error", data: error });
      if (error.code) {
        throw new Error(`RPC Error ${error.code}: ${error.message}`);
      }
      throw new Error(`Failed to execute ${method}: ${error.message}`);
    }
  }

  private async handleRequest(method: string, params?: any[]): Promise<any> {
    switch (method) {
      // 1. 账户相关
      case "eth_requestAccounts":
        if (!this._connected) {
          await this.connect();
        }
        return this.accounts;
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
      case "wallet_addEthereumChain":
      case "eth_subscribe":
      case "eth_unsubscribe":
      case "wallet_watchAsset":
        throw new Error("Subscriptions not supported over HTTP RPC.");

      default:
        throw new Error(`Method ${method} not supported`);
    }
  }

  // ========== 7. 交易相关方法 ==========
  private async sendTransaction(params?: any[]): Promise<string> {
    try {
      const tx = params?.[0];
      if (!tx || (!tx.to && !tx.data)) {
        throw new Error("Transaction must have either 'to' address or 'data' field");
      }

      const hash = await Wallet()?.sendTransaction(tx);

      if (!hash) {
        throw new Error("Failed to send transaction");
      }

      return hash;
    } catch (error: any) {
      Logger.error('Transaction', 'Failed to send transaction:', error);
      throw new Error(`Failed to send transaction: ${error?.message || "Unknown error"}`);
    }
  }

  private async signTransaction(params?: any[]): Promise<string> {
    try {
      const tx = params?.[0];
      if (!tx || (!tx.to && !tx.data)) {
        throw new Error("Transaction must have either 'to' address or 'data' field");
      }

      const signedTx = await Wallet()?.signTransaction(tx);

      if (!signedTx) {
        throw new Error("Failed to sign transaction");
      }

      return signedTx;
    } catch (error: any) {
      Logger.error('Transaction', 'Failed to sign transaction:', error);
      throw new Error(`Failed to sign transaction: ${error?.message || "Unknown error"}`);
    }
  }

  private async personalSign(params?: any[]): Promise<string> {
    try {
      // 参数验证
      if (!params || params.length < 2) {
        throw new Error("Missing required parameters for personal_sign");
      }

      const [message, address] = params;

      // 验证地址
      if (!address || !ethers.isAddress(address)) {
        throw new Error("Invalid address for personal_sign");
      }
      // 验证消息
      if (!message) {
        throw new Error("Message cannot be empty");
      }

      if (!Wallet()?.personalSign) {
        throw new Error("PersonalSign method not implemented");
      }

      // 统一处理消息为字符串
      let messageToSign: string;
      if (typeof message === "string") {
        if (message.startsWith("0x")) {
          try {
            messageToSign = ethers.toUtf8String(message);
          } catch (e) {
            messageToSign = message;
          }
        } else {
          messageToSign = message;
        }

        // 移除已有的前缀
        const prefix = "\x19Ethereum Signed Message:\n";
        if (messageToSign.startsWith(prefix)) {
          const lengthStr = messageToSign.slice(prefix.length);
          const lengthMatch = lengthStr.match(/^\d+/);
          if (lengthMatch) {
            const length = parseInt(lengthMatch[0]);
            messageToSign = lengthStr.slice(lengthMatch[0].length);
          }
        }
      } else {
        throw new Error("Message must be a string");
      }

      Logger.debug('Sign', 'Signing message:', messageToSign);
      const signature = await Wallet().personalSign({ message: messageToSign, address });

      if (!signature) {
        throw new Error("Failed to sign message");
      }

      return signature;
    } catch (error: any) {
      Logger.error('Sign', 'Error in personal_sign:', error);
      throw new Error(`personal_sign failed: ${error.message}`);
    }
  }

  // sign EIP-712 格式的 typedData
  private async signTypedData(params?: any[]): Promise<string> {
    try {
      // 参数验证
      if (!params || params.length < 2) {
        throw new Error("Missing required parameters for eth_signTypedData_v4");
      }

      const [address, typedData] = params;

      // 验证地址
      if (!address || !ethers.isAddress(address)) {
        throw new Error("Invalid address for eth_signTypedData_v4");
      }

      // 验证 typedData
      if (!typedData || typeof typedData !== "object") {
        throw new Error("Invalid typed data format");
      }

      // 验证必要字段
      if (!typedData.domain || !typedData.types || !typedData.primaryType || !typedData.message) {
        throw new Error("Missing required fields in typed data");
      }

      // 验证 domain 字段
      const { domain } = typedData;
      if (!domain.name || !domain.version || !domain.chainId || !domain.verifyingContract) {
        throw new Error("Invalid domain data");
      }

      // 验证 types 字段
      if (!typedData.types || typeof typedData.types !== "object") {
        throw new Error("Invalid types data");
      }

      // 验证 primaryType
      if (!typedData.primaryType || typeof typedData.primaryType !== "string") {
        throw new Error("Invalid primaryType");
      }

      // 验证 message
      if (!typedData.message || typeof typedData.message !== "object") {
        throw new Error("Invalid message data");
      }

      // 确保 chainId 是数字
      if (typeof domain.chainId === "string") {
        domain.chainId = parseInt(domain.chainId);
      }

      // 确保 verifyingContract 是有效的地址
      if (!ethers.isAddress(domain.verifyingContract)) {
        throw new Error("Invalid verifyingContract address");
      }

      if (!Wallet()?.signTypedData) {
        throw new Error("Sign typed data method not implemented");
      }

      Logger.debug('Sign', 'Signing typed data:', typedData);
      const signature = await Wallet().signTypedData(typedData);

      if (!signature) {
        throw new Error("Failed to sign typed data");
      }

      return signature;
    } catch (error: any) {
      Logger.error('Sign', 'Error in eth_signTypedData_v4:', error);
      throw new Error(`eth_signTypedData_v4 failed: ${error.message}`);
    }
  }

  private async sendRawTransaction(params?: any[]): Promise<string> {
    const rawTx = params?.[0];
    if (!rawTx) throw new Error("Missing raw transaction data");

    try {
      return await this._provider.send("eth_sendRawTransaction", [rawTx]);
    } catch (error) {
      Logger.error("Failed to send raw transaction", error);
      throw new Error("Failed to send raw transaction");
    }
  }

  private async switchChain(params?: any[]): Promise<string> {
    try {
      const requestedChainId = params?.[0]?.chainId;

      if (!requestedChainId) {
        throw new Error("Missing chainId parameter");
      }

      if (!this.chainIds.includes(requestedChainId)) {
        throw new Error(`Chain ID ${requestedChainId} is not supported`);
      }

      if (this.chainId === requestedChainId) {
        Logger.info('Chain', 'Already on chain', requestedChainId);
        return `Already on chain ${requestedChainId}`;
      }

      await Wallet()?.switchChain(requestedChainId);
      this._handleChainChanged(requestedChainId);

      return `Switched to chain ${requestedChainId}`;
    } catch (error: any) {
      Logger.error('Chain', 'Failed to switch chain:', error);
      throw new Error(`Failed to switch chain: ${error?.message || "Unknown error"}`);
    }
  }

  // ========== 8. 查询相关方法 ==========
  private async estimateGas(tx?: any): Promise<string> {
    if (!tx?.to || !tx?.from) throw new Error("Missing `to` or `from`");

    try {
      const gas = await this._provider.send("eth_estimateGas", [
        {
          from: tx.from,
          to: tx.to,
          value: tx.value,
          data: tx.data,
        },
      ]);
      return ethers.toBeHex(gas);
    } catch (e) {
      Logger.error("Estimate Gas error", e);
      throw new Error("Failed to estimate gas. Please check your transaction parameters or try again later");
    }
  }

  private async getGasPrice(): Promise<string> {
    try {
      return await this._provider.send("eth_gasPrice", []);
    } catch (e) {
      Logger.error("Get Gas Price error", e);
      throw new Error("Failed to get gas price. You can retry or use default value (1 Gwei)");
    }
  }

  private async getBlockNumber(): Promise<string> {
    try {
      return await this._provider.send("eth_blockNumber", []);
    } catch (e) {
      Logger.error("Get Block Number error", e);
      throw new Error("Failed to get block number");
    }
  }

  private async getBalance(params?: any[]): Promise<string> {
    const [address, blockTag = "latest"] = params || [];
    if (!address) throw new Error("Missing address");

    try {
      const balance = await this._provider.getBalance(address, blockTag);
      return "0x" + BigInt(balance).toString(16);
    } catch (error) {
      Logger.error("Failed to fetch balance:", error);
      throw new Error("eth_getBalance failed");
    }
  }

  private async getTransactionByHash(params?: any[]): Promise<any> {
    const txHash = params?.[0];
    if (!txHash) throw new Error("Missing transaction hash");

    try {
      return await this._provider.getTransaction(txHash);
    } catch (error) {
      Logger.error("Error fetching transaction by hash:", error);
      throw new Error("Failed to fetch transaction by hash");
    }
  }

  private async getTransactionCount(params?: any[]): Promise<string> {
    const [address, blockTag = "latest"] = params || [];
    if (!address) throw new Error("Missing address");
    const nonce = await this._provider.getTransactionCount(address, blockTag);
    return "0x" + nonce.toString(16);
  }

  private async getTransactionReceipt(params?: any[]): Promise<any> {
    const [txHash] = params || [];
    if (!txHash) throw new Error("Missing transaction hash");

    try {
      return await this._provider.send("eth_getTransactionReceipt", [txHash]);
    } catch (error) {
      Logger.error("Failed to fetch transaction receipt:", error);
      throw new Error("eth_getTransactionReceipt failed");
    }
  }

  // ========== 9. 合约交互相关方法 ==========
  private async getCode(params?: any[]): Promise<string> {
    const [address, blockTag = "latest"] = params || [];
    if (!address) throw new Error("Missing address");

    return await this._provider.getCode(address, blockTag);
  }

  private async ethcall(params?: any[]): Promise<string> {
    const [tx, blockTag = "latest"] = params || [];
    if (!tx || !tx.to) throw new Error("Missing call parameters");

    try {
      return await this._provider.send("eth_call", [tx, blockTag]);
    } catch (error) {
      Logger.error("Error ethcall:", error);
      throw new Error("eth_call failed");
    }
  }

  private async getBlockByNumber(params?: any[]): Promise<any> {
    const [blockNumber, includeTransactions = false] = params || [];
    if (!blockNumber) throw new Error("Missing block number");

    try {
      return await this._provider.send("eth_getBlockByNumber", [blockNumber, includeTransactions]);
    } catch (error) {
      Logger.error("Failed to fetch block:", error);
      throw new Error("eth_getBlockByNumber failed");
    }
  }

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

  // ========== 10. 兼容性方法 ==========
  public async send(method: string, params?: any[]): Promise<any> {
    return this.request({ method, params });
  }

  public async sendAsync(
    payload: { method: string; params?: any[] },
    callback: (error: Error | null, result?: any) => void
  ): Promise<void> {
    try {
      const result = await this.request(payload);
      callback(null, { id: 1, jsonrpc: "2.0", result });
    } catch (error: any) {
      callback(error);
    }
  }

  public async enable(): Promise<string[]> {
    if (this.accounts && this.accounts.length > 0) {
      await this._handleConnect(this.chainId);
      return this.accounts;
    }
    throw new Error("No accounts available");
  }

  // 标准事件处理方法
  private async _handleConnect(chainId: string): Promise<void> {
    if (!this._connected) {
      this._updateConnectionState(true);
      this.emit("connect", { chainId });
    }
  }

  // EIP-1193 标准断开连接事件处理方法
  private async _handleDisconnect(error?: Error): Promise<void> {
    this._updateConnectionState(false);
    this.notifyDisconnect(error || null);
  }

  private async _handleChainChanged(chainId: string): Promise<void> {
    if (this.chainId !== chainId) {
      this.chainId = chainId;
      this.notifyChainChanged(chainId);
    }
  }

  private async _handleAccountsChanged(accounts: string[]): Promise<void> {
    // 验证账户地址
    const validAccounts = accounts.filter((addr) => addr && ethers.isAddress(addr));
    if (validAccounts.length === 0) {
      Logger.warn("No valid accounts provided");
      return;
    }

    const currentAccounts = JSON.stringify(this.accounts);
    const newAccounts = JSON.stringify(validAccounts);

    if (currentAccounts !== newAccounts) {
      this.accounts = validAccounts;
      this.selectedAddress = validAccounts[0];
      this._state.accounts = validAccounts;
      this.notifyAccountsChanged(validAccounts);
    }
  }

  private async getAccounts(): Promise<string[]> {
    if (!this._connected) {
      return [];
    }
    // 确保返回的账户地址有效
    return this.accounts.filter((addr) => addr && ethers.isAddress(addr));
  }

  // 权限管理
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
}

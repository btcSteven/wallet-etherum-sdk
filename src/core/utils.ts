export class Utils {
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 检查地址是否有效
  static isValidAddress(address: string | undefined): boolean {
    return Boolean(address && address.startsWith("0x") && address.length === 42);
  }

  // 检查域名是否在白名单中
  static isDomainWhitelisted(domain: string, whitelist: string[]): boolean {
    return whitelist.some((url) => domain.includes(url));
  }

  // 格式化链ID
  static formatChainId(chainId: string | number): string {
    if (typeof chainId === "number") {
      return `0x${chainId.toString(16)}`;
    }
    return chainId;
  }

  // 检查是否在浏览器环境
  static isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  // 检查是否在移动设备
  static isMobile(): boolean {
    if (!this.isBrowser()) return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * 解析 approve 交易中的授权额度
   * @param hash approve 交易的 data
   * @returns 授权额度
   */
  static getApproveAmount(hash: string): number {
    // 检查是否是 approve 交易
    if (!hash.startsWith("0x095ea7b3")) {
      throw new Error("Invalid approve data");
    }

    // 移除方法签名和 spender 地址
    const amountHex = hash.slice(74); // 0x095ea7b3(4) + spender(40) = 74

    // 转换为十进制
    const amount = BigInt("0x" + amountHex);

    return Number(amount);
  }

  /**
   * 解析 gas 价格（Gwei）
   * @param gasHex gas 的十六进制值
   * @returns gas 价格（Gwei）
   */
  static getGasValue(gasHex: string): number {
    // 移除 0x 前缀（如果有）
    const hex = gasHex.startsWith("0x") ? gasHex.slice(2) : gasHex;
    // 转换为十进制
    const wei = parseInt(hex, 16);
    // 转换为 Gwei (1 Gwei = 10^9 wei)
    return wei / 1e9;
  }
}

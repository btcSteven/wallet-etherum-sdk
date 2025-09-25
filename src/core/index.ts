import { YaakoWallet } from "./wallet";
import { Logger } from "./logger";
import { Utils } from "./utils";
import { walletConfig } from "../config";

// 注入钱包并锁定
const injectAndLockWallet = (wallet: YaakoWallet) => {
  try {
    Object.defineProperty(window, "ethereum", {
      value: wallet,
      writable: true,
      configurable: true,
    });

    // 设置其他必要的属性
    Object.defineProperties(wallet, {
      _metamask: { value: { isUnlocked: () => true }, writable: false },
      _state: {
        value: {
          isConnected: true,
          accounts: wallet.accounts,
          initialized: true,
          isPermanentlyDisconnected: false,
          isUnlocked: true,
        },
        writable: true,
      },
    });
    Logger.info("Wallet", "Yaako Wallet successfully injected");
  } catch (error) {
    Logger.error("Wallet", "Failed to inject wallet:", error);
  }
};

// 广播钱包
const broadcastWallet = (wallet: YaakoWallet) => {
  // 广播钱包信息
  const announceProvider = (wallet: YaakoWallet) => {
    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: {
          info: {
            uuid: wallet.yaako.uuid,
            name: wallet.yaako.name,
            icon: wallet.yaako.icon,
            rdns: wallet.yaako.rdns,
            description: wallet.yaako.description,
            version: wallet.yaako.version,
          },
          provider: wallet,
        },
      })
    );
  };

  // 立即广播
  announceProvider(wallet);

  // 添加请求提供者的事件监听
  window.addEventListener("eip6963:requestProvider", () => {
    announceProvider(wallet);
  });
};

// 注入ethereum
const injectYakoWallet = (walletInterface?: YAAKOInterface) => {
  if (typeof window === "undefined") return;

  const wallet = new YaakoWallet(walletInterface);


  // 1. 注入钱包并锁定
  injectAndLockWallet(wallet);

  // 2. 广播我们的钱包
  broadcastWallet(wallet);
};

export default injectYakoWallet;

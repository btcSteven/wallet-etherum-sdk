import { MainWallet } from "./wallet";
import { Logger } from '../utils/logger';

// 注入钱包并锁定
const injectAndLockWallet = (wallet: MainWallet) => {
  // 检查是否已经存在 ethereum
  if (window?.ethereum) {
    const existingEthereum = window?.ethereum;

    // 如果已经存在且不是我们的钱包，尝试阻止其他钱包的注入
    if (!existingEthereum.isOwnWallet) {
      Logger.warn("Wallet", "Another wallet is already injected");
      return;
    }
  }

  // 如果不存在或已经是我们的钱包，则注入
  try {
    Object.defineProperty(window, "ethereum", {
      value: wallet,
      writable: false,
      configurable: false,
    });

    Object.defineProperty(wallet, "isMetaMask", {
      value: true,
      writable: false,
      configurable: false,
    });

    // 设置其他必要的属性
    Object.defineProperties(wallet, {
      _metamask: { value: { isUnlocked: () => true }, writable: false },
      _state: { 
        value: { 
          isConnected: localStorage.getItem('wallet_connected') === 'true',
          accounts: wallet.accounts,
          initialized: true,
          isPermanentlyDisconnected: false,
          isUnlocked: true
        }, 
        writable: true 
      },
    });
    Logger.info("Wallet", "Wallet successfully injected");
  } catch (e) {
    Logger.error("Wallet", "Failed to inject wallet:", e);
  }
};

// 阻止其他钱包广播
const preventOtherWalletsBroadcast = () => {
  window.addEventListener(
    "eip6963:announceProvider",
    (event: Event) => {
      const customEvent = event as CustomEvent<EIP6963ProviderDetail>;
      if (customEvent.detail?.info?.name !== "Yaako Wallet") {
        event.stopPropagation();
      }
    },
    true
  );
};

// 广播钱包
const broadcastWallet = (wallet: MainWallet) => {
  // 广播钱包信息
  const announceProvider = (wallet: MainWallet) => {
    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: {
          info: {
            uuid: wallet.uuid,
            name: wallet.name,
            icon: wallet.icon,
            rdns: wallet.rdns,
            description: wallet.description,
            chainIds: wallet.chainIds,
            version: wallet.version,
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

  // 定期重新广播
  // setInterval(() => announceProvider(wallet), 1000);
};

const injectWallet = () => {
  if (typeof window === "undefined") return;

  const wallet = new MainWallet();

  // 1. 注入钱包并锁定
  injectAndLockWallet(wallet);

  // 2. 阻止其他钱包广播
  preventOtherWalletsBroadcast();

  // 3. 广播我们的钱包
  broadcastWallet(wallet);
};

export default injectWallet;
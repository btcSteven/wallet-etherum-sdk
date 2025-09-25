import injectYakoWallet from "./core";

// 在页面加载时注入 Yaako Wallet
document.addEventListener("DOMContentLoaded", () => {
  const walletInterface: YAAKOInterface | undefined = undefined;
  injectYakoWallet(walletInterface);
});

export default injectYakoWallet;

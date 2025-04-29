import injectWallet from "./core";

// 在页面加载时注入 your Wallet
document.addEventListener("DOMContentLoaded", () => {
  injectWallet();
});

export default injectWallet;


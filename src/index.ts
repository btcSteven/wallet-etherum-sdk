import injectGawWallet from "./core";

// 在页面加载时注入 Gaw Wallet
document.addEventListener("DOMContentLoaded", () => {
  injectGawWallet();
  console.log("Gaw Wallet injected into window.ethereum!");
});


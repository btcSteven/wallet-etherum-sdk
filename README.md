# Yaako Wallet SDK

## 功能特性

- 支持 EIP-1193 标准
- 支持 EIP-6963 多钱包共存
- 支持连接状态持久化
- 支持托管钱包接口注入
- 支持白名单域名自动连接


### 使用托管钱包接口

```html
<!-- 引入 SDK -->
<script src="https://your-cdn-path/wallet-sdk.js"></script>

<script>
  // 定义托管钱包接口
  const walletInterface = {
    address: "0x...",
    chainId: "0x1",
    chainIds: ["0x1"],
    sendTransaction: (tx) => Promise.resolve(""),
    personalSign: (data) => Promise.resolve(""),
    signTransaction: (tx) => Promise.resolve(""),
    signTypedData: (data) => Promise.resolve(""),
    switchChain: (chainId) => Promise.resolve(""),
  };

  // 注入钱包时传入托管接口
  document.addEventListener("DOMContentLoaded", () => {
    injectYaakoWallet(walletInterface);
  });
</script>
```

## 连接状态管理

钱包会自动保存用户的连接状态到 localStorage，具体行为如下：

1. 当用户手动连接钱包时，状态会被保存
2. 当用户手动断开连接时，状态会被清除
3. 当页面刷新时，会自动恢复上次的连接状态
4. 白名单域名会自动连接，无需用户手动操作

## 白名单配置

在配置文件中可以设置白名单域名，这些域名会自动连接钱包：

```typescript
{
  whiteUrl: ['example.com', 'test.com']
}
```

## 接口说明

### YaakoInterface

托管钱包需要实现的接口：

```typescript
interface YaakoInterface {
  address: string;
  chainId: string;
  chainIds: string[];
  sendTransaction: (tx: any) => Promise<string>;
  personalSign: (data: { message: string; address: string }) => Promise<string>;
  signTransaction: (tx: any) => Promise<string>;
  signTypedData: (data: any) => Promise<string>;
  switchChain: (chainId: string) => Promise<string>;
}
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 许可证

MIT
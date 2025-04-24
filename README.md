# Wallet SDK

A hosted Ethereum wallet SDK that helps wallet providers implement standardized Ethereum Provider interfaces (EIP-1193). This SDK enables seamless integration with Web3 applications through window injection, making your hosted wallet fully compatible with:

- DApps and DeFi platforms
- Web3 libraries (Web3.js, ethers.js, etc.)
- Third-party aggregators (RabbitKit, Reown, etc.)
- MetaMask-compatible applications
- Cross-chain bridges and protocols

## Features

- 🔒 Secure hosted wallet management
- 🔗 Multi-chain support
- 📝 Transaction handling
- 💼 Account management
- 🔄 Chain switching
- 📊 Balance and block queries
- 🌐 Seamless DApp integration
- 🔌 MetaMask compatibility
- 🤝 Third-party aggregator support (RabbitKit, Reown, etc.)

## DApp Integration

SDK is designed to work seamlessly with existing DApps. It implements the standard Ethereum Provider interface (EIP-1193), making it compatible with popular Web3 libraries:

### Web3.js Integration

```javascript
import Web3 from 'web3';

// Initialize Web3 with SDK
const web3 = new Web3(window.ethereum);

// Use Web3 methods
const accounts = await web3.eth.getAccounts();
const balance = await web3.eth.getBalance(accounts[0]);
```

### ethers.js Integration

```javascript
import { ethers } from 'ethers';

// Initialize ethers with SDK
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Use ethers methods
const balance = await provider.getBalance(await signer.getAddress());
```

### React Integration

```javascript
import { useWeb3React } from '@web3-react/core';

function MyDApp() {
  const { account, chainId, library } = useWeb3React();

  // Use Web3React hooks
  const balance = useBalance(account);
  const { sendTransaction } = useTransaction();
}
```

### Third-Party Aggregator Integration

SDK is fully compatible with popular third-party aggregators:

#### RabbitKit Integration

```javascript
import { RabbitKit } from 'rabbitkit';

// Initialize RabbitKit with SDK
const rabbitKit = new RabbitKit({
  provider: window.ethereum,
  // ... other options
});

// Use RabbitKit methods
const routes = await rabbitKit.getRoutes({
  fromToken: 'ETH',
  toToken: 'USDC',
  amount: '1.0'
});
```

#### Reown Integration

```javascript
import { Reown } from 'reown';

// Initialize Reown with SDK
const reown = new Reown({
  provider: window.ethereum,
  // ... other options
});

// Use Reown methods
const quote = await reown.getQuote({
  fromToken: 'ETH',
  toToken: 'USDT',
  amount: '1.0'
});
```

## Prerequisites

This SDK requires the wallet provider to inject the following into the window object:

```typescript
window.ethereum = {
  isMetaMask: true,           // For compatibility
  isGawWallet: true,          // To identify our wallet
  _metamask: {
    isUnlocked: () => true    // For compatibility
  },
  _state: {
    isConnected: true,
    accounts: string[]        // Current accounts
  },
  // Ethereum Provider Methods
  request: Function,          // Main method for all requests
  on: Function,              // Event subscription
  removeListener: Function,  // Event unsubscription
  // ... other provider methods
};
```

## Installation

```bash
npm install
npm run build
```

## Quick Start

```typescript
// The wallet is automatically injected as window.ethereum
// You can use it directly:

// Get accounts
const accounts = await window.ethereum.request({ method: 'eth_accounts' });

// Send transaction
const txHash = await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from: accounts[0],
    to: '0x...',
    value: '0x...',
    gas: '0x...',
    gasPrice: '0x...'
  }]
});

// Listen to chain changes
window.ethereum.on('chainChanged', (chainId) => {
  console.log('Chain changed:', chainId);
});
```

## Testing

After building the SDK, you can test it using the provided `test.html`:

1. Build the SDK:
```bash
npm run build
```
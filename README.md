# Wallet SDK

A hosted Ethereum wallet SDK that provides seamless integration with Web3 applications through window injection.

## Features

- 🔒 Secure hosted wallet management
- 🔗 Multi-chain support
- 📝 Transaction handling
- 💼 Account management
- 🔄 Chain switching
- 📊 Balance and block queries

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

## Configuration

The SDK automatically reads configuration from `window.walletConfig`. The configuration object should include:

```typescript
{
  uuid: string;          // Unique identifier for the wallet
  name: string;          // Display name
  icon: string;          // Wallet icon URL
  rdns: string;         // Reverse DNS identifier
  description: string;   // Wallet description
  version: string;      // SDK version
  rpcUrl: string;       // Default RPC endpoint
  defaultChainId: string; // Default chain ID (hex format)
}
```

## API Reference

### Account Methods

#### `eth_accounts`
Returns the list of accounts managed by the wallet.

```typescript
const accounts = await window.ethereum.request({ method: 'eth_accounts' });
```

#### `eth_requestAccounts`
Requests user permission to access their accounts.

```typescript
const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
```

### Transaction Methods

#### `eth_sendTransaction`
Sends a transaction.

```typescript
const txHash = await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from: string,
    to: string,
    value: string,
    gas: string,
    gasPrice: string
  }]
});
```

### Chain Management

#### `eth_chainId`
Gets the current chain ID.

```typescript
const chainId = await window.ethereum.request({ method: 'eth_chainId' });
```

#### `wallet_switchEthereumChain`
Switches to a different chain.

```typescript
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x1' }]
});
```

### Query Methods

#### `eth_getBalance`
Gets the balance for an address.

```typescript
const balance = await window.ethereum.request({
  method: 'eth_getBalance',
  params: [address, 'latest']
});
```

#### `eth_getBlockByNumber`
Gets block information.

```typescript
const block = await window.ethereum.request({
  method: 'eth_getBlockByNumber',
  params: [blockNumber, false]
});
```

#### `eth_getTransactionCount`
Gets the transaction count for an address.

```typescript
const count = await window.ethereum.request({
  method: 'eth_getTransactionCount',
  params: [address, 'latest']
});
```

## Events

The wallet SDK supports the following events:

- `chainChanged`: Triggered when the chain is changed
- `accountsChanged`: Triggered when the accounts are changed
- `connect`: Triggered when the wallet is connected
- `disconnect`: Triggered when the wallet is disconnected

```typescript
// Listen to chain changes
window.ethereum.on('chainChanged', (chainId) => {
  console.log('Chain changed:', chainId);
});

// Listen to account changes
window.ethereum.on('accountsChanged', (accounts) => {
  console.log('Accounts changed:', accounts);
});
```

## Development Setup

1. Install dependencies:
```bash
yarn install
```

2. Run tests:
```bash
yarn test
```

## Testing

The SDK includes a comprehensive test suite covering all major functionality. Run tests using:

```bash
yarn test
```

## License

MIT

## Support

For support, please open an issue in the GitHub repository or contact our support team. 
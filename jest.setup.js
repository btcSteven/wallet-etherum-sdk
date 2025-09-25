const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost/',
  referrer: 'http://localhost/',
  contentType: 'text/html',
  includeNodeLocations: true,
  storageQuota: 10000000,
});

const mockYaako = {
  address: '0x1234567890123456789012345678901234567890',
  chainId: '0x1',
  sendTransaction: jest.fn().mockResolvedValue('0x123'),
  switchChain: jest.fn().mockResolvedValue(undefined),
  signTransaction: jest.fn().mockResolvedValue('0x456'),
  getBalance: jest.fn().mockResolvedValue('0x1'),
  getBlockByNumber: jest.fn().mockResolvedValue({ number: '0x1' }),
  getTransactionCount: jest.fn().mockResolvedValue('0x0'),
  chainIds: ['0x1', '0x2'],
  personalSign: jest.fn().mockResolvedValue('0x789'),
  signTypedData: jest.fn().mockResolvedValue('0xabc'),
};

Object.defineProperty(global, 'window', {
  value: {
    YAAKO: mockYaako,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  writable: true,
});

// Mock walletConfig
jest.mock('./src/config', () => ({
  walletConfig: {
    uuid: 'fb9e4f6a-daf8-4b84-a8d3-e13a64e92ab1',
    name: 'Yaako Wallet',
    icon: 'https://static-s3.mtt.xyz/mtt-swap/20250423-142205_15cfe5ccd.png',
    rdns: 'com.yaako.wallet',
    description: 'Yaako Wallet - Secure Web3 Wallet',
    version: '1.0.0',
    rpcUrl: 'https://evm-rpc.mtt.network',
    defaultChainId: '0x1',
    getConfig: () => mockYaako,
  },
}));

Object.defineProperty(global, 'document', {
  value: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    createElement: jest.fn().mockReturnValue({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  },
  writable: true,
});

global.navigator = dom.window.navigator;
global.Node = dom.window.Node;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.ShadowRoot = dom.window.ShadowRoot;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;

global.fetch = jest.fn().mockImplementation((url) => {
  const params = JSON.parse(url.split('?')[1] || '{}');
  
  if (params.method === 'eth_getBalance') {
    return Promise.resolve({
      json: () => Promise.resolve({ result: '0x1' }),
    });
  }
  if (params.method === 'eth_getBlockByNumber') {
    return Promise.resolve({
      json: () => Promise.resolve({ result: { number: '0x1' } }),
    });
  }
  if (params.method === 'eth_getTransactionCount') {
    return Promise.resolve({
      json: () => Promise.resolve({ result: '0x0' }),
    });
  }
  if (params.method === 'eth_chainId') {
    return Promise.resolve({
      json: () => Promise.resolve({ result: '0x1' }),
    });
  }
  return Promise.resolve({
    json: () => Promise.resolve({ result: null }),
  });
});

global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock ethereum
global.ethereum = {
  isMetaMask: true,
  _metamask: {
    isUnlocked: jest.fn().mockResolvedValue(true),
  },
  request: jest.fn().mockResolvedValue(['0x1234567890123456789012345678901234567890']),
};

// Mock nodeRoot function
global.nodeRoot = (node) => {
  if (!node) return null;
  if (node.nodeType === 11) return node; // SHADOW_ROOT_NODE
  if (node.getRootNode) {
    const root = node.getRootNode();
    return root.nodeType === 11 ? root : null;
  }
  return null;
};

// Mock clearTargetsStruct
global.clearTargetsStruct = {
  target: document.createElement('div'),
};

// Mock isNode function
global.isNode = (obj) => {
  return obj && typeof obj === 'object' && 'nodeType' in obj;
};

// Mock isShadowRoot function
global.isShadowRoot = (obj) => {
  return obj && typeof obj === 'object' && obj.nodeType === 11;
};
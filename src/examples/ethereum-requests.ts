import { ethers } from 'ethers';

// 模拟发送交易
async function sendTransaction() {
  try {
    const tx = {
      to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      value: ethers.parseEther('0.1'),
      gasLimit: '21000',
      gasPrice: ethers.parseUnits('20', 'gwei'),
    };

    const hash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx],
    });

    console.log('Transaction hash:', hash);
  } catch (error) {
    console.error('Failed to send transaction:', error);
  }
}

// 模拟签名消息
async function signMessage() {
  try {
    const message = 'Hello, Ethereum!';
    const address = await window.ethereum.request({ method: 'eth_accounts' });
    
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address[0]],
    });

    console.log('Message signature:', signature);
  } catch (error) {
    console.error('Failed to sign message:', error);
  }
}

// 模拟签名 EIP-712 数据
async function signTypedData() {
  try {
    const typedData = {
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      types: {
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
      },
      primaryType: 'Mail',
      message: {
        from: {
          name: 'Cow',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
      },
    };

    const address = await window.ethereum.request({ method: 'eth_accounts' });
    const signature = await window.ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [address[0], typedData],
    });

    console.log('Typed data signature:', signature);
  } catch (error) {
    console.error('Failed to sign typed data:', error);
  }
}

// 模拟切换网络
async function switchNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }], // 切换到以太坊主网
    });
    console.log('Successfully switched to Ethereum Mainnet');
  } catch (error) {
    console.error('Failed to switch network:', error);
  }
}

// 模拟获取账户余额
async function getBalance() {
  try {
    const address = await window.ethereum.request({ method: 'eth_accounts' });
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address[0], 'latest'],
    });

    console.log('Account balance:', ethers.formatEther(balance));
  } catch (error) {
    console.error('Failed to get balance:', error);
  }
}

// 导出所有函数以便测试
export {
  sendTransaction,
  signMessage,
  signTypedData,
  switchNetwork,
  getBalance,
}; 
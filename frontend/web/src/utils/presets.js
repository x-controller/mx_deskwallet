/** 内置常用 EVM 网络预设，用户可在 RPC 配置中增删改 */
export const NETWORK_PRESETS = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    chainId: 1,
    symbol: 'ETH',
    tokens: [
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6 },
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
    ],
  },
  {
    id: 'bsc',
    name: 'BNB Chain',
    rpcUrl: 'https://bsc-rpc.publicnode.com',
    chainId: 56,
    symbol: 'BNB',
    tokens: [
      { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18 },
      { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 18 },
    ],
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
    chainId: 42161,
    symbol: 'ETH',
    tokens: [
      { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', decimals: 6 },
      { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6 },
    ],
  },
  {
    id: 'base',
    name: 'Base',
    rpcUrl: 'https://base-rpc.publicnode.com',
    chainId: 8453,
    symbol: 'ETH',
    tokens: [{ address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 }],
  },
  {
    id: 'polygon',
    name: 'Polygon',
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    chainId: 137,
    symbol: 'POL',
    tokens: [
      { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', decimals: 6 },
      { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', decimals: 6 },
    ],
  },
]

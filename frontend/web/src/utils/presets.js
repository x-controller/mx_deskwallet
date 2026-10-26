import { FEE_TIERS_PANCAKE, FEE_TIERS_UNISWAP } from './dex'

/**
 * 内置常用 EVM 网络预设，用户可在 RPC 配置中增删改
 * dexes：version v2 为 Uniswap V2 兼容路由；v3 为 Uniswap V3 SwapRouter02 + QuoterV2（PancakeSwap V3 同接口）
 * 地址来源：developers.uniswap.org、developer.pancakeswap.finance、docs.quickswap.exchange
 */
const UNISWAP_V2_MULTICHAIN_ROUTER = '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24'
const UNISWAP_V3_ROUTER = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
const UNISWAP_V3_QUOTER = '0x61fFE014bA17989E743c5F6cB21bF9697530B21e'
const PANCAKE_V2_L2_ROUTER = '0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb'
const PANCAKE_V3_ROUTER = '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4'
const PANCAKE_V3_QUOTER = '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997'

const WETH_ETHEREUM = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
const WETH_ARBITRUM = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
const WETH_BASE = '0x4200000000000000000000000000000000000006'
const WPOL = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'

const v2 = (id, name, router, wrappedNative) => ({ id, name, version: 'v2', router, wrappedNative })
const v3 = (id, name, router, quoter, wrappedNative, feeTiers) => ({ id, name, version: 'v3', router, quoter, wrappedNative, feeTiers: [...feeTiers] })

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
    dexes: [
      v3('uniswap-v3', 'Uniswap V3', UNISWAP_V3_ROUTER, UNISWAP_V3_QUOTER, WETH_ETHEREUM, FEE_TIERS_UNISWAP),
      v2('uniswap-v2', 'Uniswap V2', '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', WETH_ETHEREUM),
      v3('pancake-v3', 'PancakeSwap V3', PANCAKE_V3_ROUTER, PANCAKE_V3_QUOTER, WETH_ETHEREUM, FEE_TIERS_PANCAKE),
      v2('pancake-v2', 'PancakeSwap V2', '0xEfF92A263d31888d860bD50809A8D171709b7b1c', WETH_ETHEREUM),
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
    dexes: [
      v3('pancake-v3', 'PancakeSwap V3', PANCAKE_V3_ROUTER, PANCAKE_V3_QUOTER, WBNB, FEE_TIERS_PANCAKE),
      v2('pancake-v2', 'PancakeSwap V2', '0x10ED43C718714eb63d5aA57B78B54704E256024E', WBNB),
      v3('uniswap-v3', 'Uniswap V3', '0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2', '0x78D78E420Da98ad378D7799bE8f4AF69033EB077', WBNB, FEE_TIERS_UNISWAP),
      v2('uniswap-v2', 'Uniswap V2', UNISWAP_V2_MULTICHAIN_ROUTER, WBNB),
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
    dexes: [
      v3('uniswap-v3', 'Uniswap V3', UNISWAP_V3_ROUTER, UNISWAP_V3_QUOTER, WETH_ARBITRUM, FEE_TIERS_UNISWAP),
      v3('pancake-v3', 'PancakeSwap V3', '0x32226588378236Fd0c7c4053999F88aC0e5cAc77', PANCAKE_V3_QUOTER, WETH_ARBITRUM, FEE_TIERS_PANCAKE),
      v2('uniswap-v2', 'Uniswap V2', UNISWAP_V2_MULTICHAIN_ROUTER, WETH_ARBITRUM),
      v2('pancake-v2', 'PancakeSwap V2', PANCAKE_V2_L2_ROUTER, WETH_ARBITRUM),
    ],
  },
  {
    id: 'base',
    name: 'Base',
    rpcUrl: 'https://base-rpc.publicnode.com',
    chainId: 8453,
    symbol: 'ETH',
    tokens: [{ address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 }],
    dexes: [
      v3('uniswap-v3', 'Uniswap V3', '0x2626664c2603336E57B271c5C0b26F421741e481', '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a', WETH_BASE, FEE_TIERS_UNISWAP),
      v3('pancake-v3', 'PancakeSwap V3', '0x678Aa4bF4E210cf2166753e054d5b7c31cc7fa86', PANCAKE_V3_QUOTER, WETH_BASE, FEE_TIERS_PANCAKE),
      v2('uniswap-v2', 'Uniswap V2', UNISWAP_V2_MULTICHAIN_ROUTER, WETH_BASE),
      v2('pancake-v2', 'PancakeSwap V2', PANCAKE_V2_L2_ROUTER, WETH_BASE),
    ],
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
    dexes: [
      v3('uniswap-v3', 'Uniswap V3', UNISWAP_V3_ROUTER, UNISWAP_V3_QUOTER, WPOL, FEE_TIERS_UNISWAP),
      v2('quickswap-v2', 'QuickSwap V2', '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', WPOL),
      v2('uniswap-v2', 'Uniswap V2', '0xedf6066a2b290C185783862C7F4776A2C8077AD1', WPOL),
    ],
  },
]

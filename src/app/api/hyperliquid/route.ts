import { NextRequest, NextResponse } from 'next/server'

// Hyperliquid API endpoints
const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz'

// Types for Hyperliquid API
interface HyperliquidOrder {
  coin: string
  side: 'B' | 'A' // Buy or Ask
  sz: string
  px: string
  time: number
}

interface HyperliquidPosition {
  coin: string
  entryPx: string
  positionValue: string
  unrealizedPnl: string
  leverage: string
  marginUsed: string
  returnOnEquity: string
  szi: string // Size with sign
}

interface HyperliquidOrderBook {
  levels: [Array<{ px: string; sz: string; n: number }>, Array<{ px: string; sz: string; n: number }>] // [bids, asks]
}

interface HyperliquidMeta {
  universe: Array<{
    name: string
    szDecimals: number
    maxLeverage: number
    onlyIsolated?: boolean
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'getMeta':
        return await getHyperliquidMeta()
      
      case 'getOrderBook':
        return await getOrderBook(params.coin)
      
      case 'getPositions':
        return await getPositions(params.address)
      
      case 'getAccountValue':
        return await getAccountValue(params.address)
      
      case 'placeOrder':
        return await placeOrder(params)
      
      case 'getUserState':
        return await getUserState(params.address)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Hyperliquid API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'API error' },
      { status: 500 }
    )
  }
}

async function getHyperliquidMeta() {
  const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'meta' })
  })
  
  const data = await response.json() as HyperliquidMeta
  
  return NextResponse.json({
    success: true,
    universe: data.universe.map(asset => ({
      name: asset.name,
      maxLeverage: asset.maxLeverage,
      szDecimals: asset.szDecimals,
      onlyIsolated: asset.onlyIsolated
    }))
  })
}

async function getOrderBook(coin: string) {
  const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'l2Book',
      coin: coin || 'BTC'
    })
  })
  
  const data = await response.json() as { levels: HyperliquidOrderBook['levels'] }
  
  // Format order book
  const bids = data.levels[0]?.map((level) => ({
    price: parseFloat(level.px),
    size: parseFloat(level.sz),
    orders: level.n
  })) || []
  
  const asks = data.levels[1]?.map((level) => ({
    price: parseFloat(level.px),
    size: parseFloat(level.sz),
    orders: level.n
  })) || []
  
  return NextResponse.json({
    success: true,
    bids,
    asks,
    spread: asks.length > 0 && bids.length > 0 
      ? ((asks[0].price - bids[0].price) / bids[0].price * 100).toFixed(4)
      : null
  })
}

async function getPositions(address: string) {
  if (!address) {
    return NextResponse.json({ success: true, positions: [] })
  }
  
  const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'clearinghouseState',
      user: address
    })
  })
  
  const data = await response.json() as { assetPositions: Array<{ position: HyperliquidPosition }> }
  
  const positions = data.assetPositions
    ?.filter((p: { position: HyperliquidPosition }) => parseFloat(p.position.szi) !== 0)
    .map((p: { position: HyperliquidPosition }) => ({
      coin: p.position.coin,
      size: parseFloat(p.position.szi),
      entryPrice: parseFloat(p.position.entryPx),
      positionValue: parseFloat(p.position.positionValue),
      unrealizedPnl: parseFloat(p.position.unrealizedPnl),
      leverage: parseFloat(p.position.leverage),
      marginUsed: parseFloat(p.position.marginUsed),
      returnOnEquity: parseFloat(p.position.returnOnEquity) * 100
    })) || []
  
  return NextResponse.json({
    success: true,
    positions
  })
}

async function getAccountValue(address: string) {
  if (!address) {
    return NextResponse.json({ success: true, accountValue: 0 })
  }
  
  const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'clearinghouseState',
      user: address
    })
  })
  
  const data = await response.json() as { marginSummary: { accountValue: string } }
  
  return NextResponse.json({
    success: true,
    accountValue: parseFloat(data.marginSummary?.accountValue || '0')
  })
}

async function getUserState(address: string) {
  if (!address) {
    return NextResponse.json({ 
      success: true, 
      accountValue: 0,
      positions: [],
      availableBalance: 0
    })
  }
  
  const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'clearinghouseState',
      user: address
    })
  })
  
  const data = await response.json() as { 
    marginSummary: { 
      accountValue: string,
      totalMarginUsed: string,
      totalNtlPos: string
    },
    assetPositions: Array<{ position: HyperliquidPosition }>
  }
  
  const accountValue = parseFloat(data.marginSummary?.accountValue || '0')
  const totalMarginUsed = parseFloat(data.marginSummary?.totalMarginUsed || '0')
  const availableBalance = accountValue - totalMarginUsed
  
  const positions = data.assetPositions
    ?.filter((p: { position: HyperliquidPosition }) => parseFloat(p.position.szi) !== 0)
    .map((p: { position: HyperliquidPosition }) => ({
      coin: p.position.coin,
      size: parseFloat(p.position.szi),
      entryPrice: parseFloat(p.position.entryPx),
      positionValue: parseFloat(p.position.positionValue),
      unrealizedPnl: parseFloat(p.position.unrealizedPnl),
      leverage: parseFloat(p.position.leverage),
      marginUsed: parseFloat(p.position.marginUsed),
      returnOnEquity: parseFloat(p.position.returnOnEquity) * 100
    })) || []
  
  return NextResponse.json({
    success: true,
    accountValue,
    availableBalance,
    totalMarginUsed,
    positions
  })
}

async function placeOrder(params: {
  address: string
  coin: string
  isBuy: boolean
  size: number
  price?: number
  orderType: 'market' | 'limit'
  leverage?: number
}) {
  // Note: Real order placement requires EIP-712 signature from the user's wallet
  // This is a simplified version that shows the order structure
  
  const { address, coin, isBuy, size, price, orderType, leverage = 1 } = params
  
  if (!address) {
    return NextResponse.json({ 
      error: 'Wallet address required',
      requiresSignature: true,
      message: 'Please connect your wallet to place orders'
    }, { status: 400 })
  }
  
  // Order structure for Hyperliquid (requires signing)
  const orderRequest = {
    coin,
    isBuy,
    sz: size,
    limit_px: price || 0, // 0 for market orders
    order_type: orderType === 'market' ? 'market' : 'limit',
    reduce_only: false
  }
  
  return NextResponse.json({
    success: false,
    requiresSignature: true,
    message: 'Order requires wallet signature',
    orderRequest,
    instructions: {
      step1: 'Connect wallet (MetaMask, Trust Wallet, etc.)',
      step2: 'Sign the EIP-712 message to authorize the order',
      step3: 'Order will be submitted to Hyperliquid'
    },
    // EIP-712 typed data structure for signing
    typedData: {
      types: {
        'Agent': [
          { name: 'name', type: 'string' },
          { name: 'url', type: 'string' }
        ],
        'Order': [
          { name: 'coin', type: 'string' },
          { name: 'isBuy', type: 'bool' },
          { name: 'sz', type: 'float' },
          { name: 'limit_px', type: 'float' },
          { name: 'order_type', type: 'string' }
        ]
      },
      primaryType: 'Order',
      domain: {
        name: 'HyperliquidSignTransaction',
        chainId: 421614, // Arbitrum testnet, use 42161 for mainnet
        version: '1'
      },
      message: orderRequest
    }
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const coin = searchParams.get('coin') || 'BTC'
  const address = searchParams.get('address')
  
  if (action === 'orderbook') {
    return await getOrderBook(coin)
  }
  
  if (action === 'meta') {
    return await getHyperliquidMeta()
  }
  
  if (action === 'userState' && address) {
    return await getUserState(address)
  }
  
  if (action === 'allRates') {
    // Get all coin rates
    const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'allMids' })
    })
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      rates: data
    })
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

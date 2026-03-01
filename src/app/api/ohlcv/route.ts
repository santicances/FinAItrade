import { NextRequest, NextResponse } from 'next/server'

// CoinGecko API endpoint for OHLCV data (Crypto only)
const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Tickerbase API for non-crypto assets (stocks, forex, commodities, indices, ETFs)
const TICKERBASE_API = 'https://api.tickerbase.io'

// Map symbols to CoinGecko coin IDs (Crypto only)
const COIN_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'DOGE': 'dogecoin',
  'LINK': 'chainlink',
  'SUI': 'sui',
  'PEPE': 'pepe',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'SHIB': 'shiba-inu',
  'APT': 'aptos',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'NEAR': 'near',
  'FTM': 'fantom',
  'INJ': 'injective-protocol',
}

// Tickerbase symbol mappings for non-crypto assets
const TICKERBASE_SYMBOL_MAP: Record<string, { symbol: string; type: 'stocks' | 'forex' | 'commodities' | 'indices' | 'etfs' }> = {
  // Stocks
  'AAPL': { symbol: 'NASDAQ:AAPL', type: 'stocks' },
  'NVDA': { symbol: 'NASDAQ:NVDA', type: 'stocks' },
  'MSFT': { symbol: 'NASDAQ:MSFT', type: 'stocks' },
  'GOOGL': { symbol: 'NASDAQ:GOOGL', type: 'stocks' },
  'AMZN': { symbol: 'NASDAQ:AMZN', type: 'stocks' },
  'META': { symbol: 'NASDAQ:META', type: 'stocks' },
  'TSLA': { symbol: 'NASDAQ:TSLA', type: 'stocks' },
  'JPM': { symbol: 'NYSE:JPM', type: 'stocks' },
  'V': { symbol: 'NYSE:V', type: 'stocks' },
  'JNJ': { symbol: 'NYSE:JNJ', type: 'stocks' },
  // Forex
  'EURUSD': { symbol: 'FX:EURUSD', type: 'forex' },
  'GBPUSD': { symbol: 'FX:GBPUSD', type: 'forex' },
  'USDJPY': { symbol: 'FX:USDJPY', type: 'forex' },
  'USDCHF': { symbol: 'FX:USDCHF', type: 'forex' },
  'AUDUSD': { symbol: 'FX:AUDUSD', type: 'forex' },
  'USDCAD': { symbol: 'FX:USDCAD', type: 'forex' },
  'EURGBP': { symbol: 'FX:EURGBP', type: 'forex' },
  'EURJPY': { symbol: 'FX:EURJPY', type: 'forex' },
  'NZDUSD': { symbol: 'FX:NZDUSD', type: 'forex' },
  'EURAUD': { symbol: 'FX:EURAUD', type: 'forex' },
  // Commodities
  'GOLD': { symbol: 'COMEX:GC1!', type: 'commodities' },
  'SILVER': { symbol: 'COMEX:SI1!', type: 'commodities' },
  'CL': { symbol: 'NYMEX:CL1!', type: 'commodities' },
  'BZ': { symbol: 'NYMEX:BZ1!', type: 'commodities' },
  'NG': { symbol: 'NYMEX:NG1!', type: 'commodities' },
  'HG': { symbol: 'COMEX:HG1!', type: 'commodities' },
  'ZW': { symbol: 'CBOT:ZW1!', type: 'commodities' },
  'ZC': { symbol: 'CBOT:ZC1!', type: 'commodities' },
  'ZS': { symbol: 'CBOT:ZS1!', type: 'commodities' },
  'KC': { symbol: 'ICE:KC1!', type: 'commodities' },
  // Indices
  'SPX': { symbol: 'CME:SP1!', type: 'indices' },
  'DJI': { symbol: 'CME:YM1!', type: 'indices' },
  'NAS100': { symbol: 'CME:NQ1!', type: 'indices' },
  'RUT': { symbol: 'CME:RTY1!', type: 'indices' },
  'DAX': { symbol: 'EUREX:FDAX1!', type: 'indices' },
  'UK100': { symbol: 'ICE:FTSE1!', type: 'indices' },
  'CAC': { symbol: 'EUREX:FCE1!', type: 'indices' },
  'NI225': { symbol: 'OSE:NI2251!', type: 'indices' },
  'HSI': { symbol: 'HKEX:HSI1!', type: 'indices' },
  'SX5E': { symbol: 'EUREX:FSTX1!', type: 'indices' },
  // ETFs
  'SPY': { symbol: 'AMEX:SPY', type: 'etfs' },
  'QQQ': { symbol: 'NASDAQ:QQQ', type: 'etfs' },
  'GLD': { symbol: 'AMEX:GLD', type: 'etfs' },
  'IWM': { symbol: 'AMEX:IWM', type: 'etfs' },
  'EEM': { symbol: 'AMEX:EEM', type: 'etfs' },
  'VTI': { symbol: 'AMEX:VTI', type: 'etfs' },
  'TLT': { symbol: 'AMEX:TLT', type: 'etfs' },
  'SLV': { symbol: 'AMEX:SLV', type: 'etfs' },
  'VWO': { symbol: 'AMEX:VWO', type: 'etfs' },
  'UVXY': { symbol: 'AMEX:UVXY', type: 'etfs' },
}

// Timeframe to days mapping
const TIMEFRAME_DAYS: Record<string, number> = {
  '1': 1,
  '5': 1,
  '15': 1,
  '60': 7,
  '240': 30,
  'D': 90,
  'W': 365,
}

// Tickerbase timeframe mapping
const TICKERBASE_INTERVAL_MAP: Record<string, string> = {
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '60': '1h',
  '240': '4h',
  'D': '1d',
  'W': '1w',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol') || 'BTC'
    const timeframe = searchParams.get('timeframe') || '60'
    const days = searchParams.get('days') || TIMEFRAME_DAYS[timeframe] || 7

    // Extract base symbol
    const baseSymbol = symbol.replace('/USDT', '').replace('/USD', '').replace('/', '').split('-')[0].toUpperCase()
    
    // Check if it's a crypto symbol (in COIN_ID_MAP)
    const coinId = COIN_ID_MAP[baseSymbol]
    
    if (coinId) {
      // Use CoinGecko for crypto
      return await fetchFromCoinGecko(coinId, baseSymbol, timeframe, days)
    }
    
    // Check if it's a non-crypto symbol (in TICKERBASE_SYMBOL_MAP)
    const tickerbaseInfo = TICKERBASE_SYMBOL_MAP[baseSymbol] || TICKERBASE_SYMBOL_MAP[symbol]
    
    if (tickerbaseInfo) {
      // Use Tickerbase for non-crypto
      return await fetchFromTickerbase(tickerbaseInfo.symbol, baseSymbol, timeframe, days)
    }
    
    // Symbol not found in either map - try Tickerbase with original symbol
    return await fetchFromTickerbase(symbol, baseSymbol, timeframe, days)

  } catch (error) {
    console.error('OHLCV API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch OHLCV data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Fetch OHLCV data from CoinGecko (Crypto)
async function fetchFromCoinGecko(coinId: string, baseSymbol: string, timeframe: string, days: number) {
  const response = await fetch(
    `${COINGECKO_API}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
    {
      headers: { 'Accept': 'application/json' },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('CoinGecko API error:', errorText)
    
    const simulatedData = generateSimulatedOHLCV(days, 50000, 10000)
    return NextResponse.json({ 
      data: simulatedData,
      symbol: baseSymbol,
      simulated: true,
      message: 'Using simulated data (API rate limit or error)',
      source: 'coingecko-simulated'
    })
  }

  const rawData = await response.json()
  
  const ohlcvData = rawData.map((candle: number[]) => ({
    time: Math.floor(candle[0] / 1000) as unknown as string,
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
  }))

  // Fetch current price
  const priceResponse = await fetch(
    `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
  )

  let currentPrice = null
  let priceChange24h = null
  
  if (priceResponse.ok) {
    const priceData = await priceResponse.json()
    currentPrice = priceData.market_data?.current_price?.usd
    priceChange24h = priceData.market_data?.price_change_percentage_24h
  }

  return NextResponse.json({
    data: ohlcvData,
    symbol: baseSymbol,
    coinId,
    currentPrice,
    priceChange24h,
    timeframe,
    days,
    simulated: false,
    source: 'coingecko'
  })
}

// Fetch OHLCV data from Tickerbase (Non-crypto)
async function fetchFromTickerbase(tickerSymbol: string, baseSymbol: string, timeframe: string, days: number) {
  const interval = TICKERBASE_INTERVAL_MAP[timeframe] || '1h'
  const lookback = `${days}days`
  
  // Construct Tickerbase URL
  // Format: /v1/ohlc/{interval}/{symbol}?lookback={lookback}
  const url = `${TICKERBASE_API}/v1/ohlc/${interval}/${tickerSymbol}?lookback=${lookback}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // Add API key if available
        // 'X-API-Key': process.env.TICKERBASE_API_KEY || '',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      console.error('Tickerbase API error:', response.status, response.statusText)
      
      // Return simulated data for non-crypto
      const basePrice = getBasePriceForAsset(baseSymbol)
      const volatility = basePrice * 0.01
      const simulatedData = generateSimulatedOHLCV(days, basePrice, volatility)
      
      return NextResponse.json({ 
        data: simulatedData,
        symbol: baseSymbol,
        simulated: true,
        message: 'Using simulated data (Tickerbase API unavailable)',
        source: 'tickerbase-simulated'
      })
    }

    const rawData = await response.json()
    
    // Transform Tickerbase data to our format
    // Assuming Tickerbase returns array of [time, open, high, low, close, volume]
    let ohlcvData = []
    
    if (Array.isArray(rawData)) {
      ohlcvData = rawData.map((candle: number[]) => ({
        time: Math.floor(candle[0] / 1000) as unknown as string,
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
      }))
    } else if (rawData.data && Array.isArray(rawData.data)) {
      ohlcvData = rawData.data.map((candle: any) => ({
        time: Math.floor(new Date(candle.time || candle.timestamp).getTime() / 1000) as unknown as string,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))
    }

    if (ohlcvData.length === 0) {
      const basePrice = getBasePriceForAsset(baseSymbol)
      const volatility = basePrice * 0.01
      const simulatedData = generateSimulatedOHLCV(days, basePrice, volatility)
      
      return NextResponse.json({ 
        data: simulatedData,
        symbol: baseSymbol,
        simulated: true,
        message: 'Using simulated data (no data from Tickerbase)',
        source: 'tickerbase-simulated'
      })
    }

    const currentPrice = ohlcvData[ohlcvData.length - 1]?.close || null
    const previousPrice = ohlcvData[ohlcvData.length - 2]?.close || currentPrice
    const priceChange24h = previousPrice && currentPrice 
      ? ((currentPrice - previousPrice) / previousPrice) * 100 
      : null

    return NextResponse.json({
      data: ohlcvData,
      symbol: baseSymbol,
      tickerSymbol,
      currentPrice,
      priceChange24h,
      timeframe,
      days,
      simulated: false,
      source: 'tickerbase'
    })
    
  } catch (error) {
    console.error('Tickerbase fetch error:', error)
    
    // Return simulated data
    const basePrice = getBasePriceForAsset(baseSymbol)
    const volatility = basePrice * 0.01
    const simulatedData = generateSimulatedOHLCV(days, basePrice, volatility)
    
    return NextResponse.json({ 
      data: simulatedData,
      symbol: baseSymbol,
      simulated: true,
      message: 'Using simulated data (Tickerbase request failed)',
      source: 'tickerbase-simulated',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Get base price for simulated data based on asset type
function getBasePriceForAsset(symbol: string): number {
  const priceMap: Record<string, number> = {
    // Stocks
    'AAPL': 180, 'NVDA': 450, 'MSFT': 380, 'GOOGL': 140, 'AMZN': 175,
    'META': 480, 'TSLA': 250, 'JPM': 195, 'V': 280, 'JNJ': 160,
    // Forex
    'EURUSD': 1.08, 'GBPUSD': 1.26, 'USDJPY': 150, 'USDCHF': 0.88,
    'AUDUSD': 0.65, 'USDCAD': 1.36, 'EURGBP': 0.86, 'EURJPY': 162,
    'NZDUSD': 0.60, 'EURAUD': 1.66,
    // Commodities
    'GOLD': 2000, 'SILVER': 23, 'CL': 75, 'BZ': 80, 'NG': 2.5,
    'HG': 3.8, 'ZW': 6.5, 'ZC': 4.8, 'ZS': 12.5, 'KC': 185,
    // Indices
    'SPX': 5200, 'DJI': 39000, 'NAS100': 18500, 'RUT': 2050,
    'DAX': 18500, 'UK100': 7800, 'CAC': 7800, 'NI225': 38000,
    'HSI': 17500, 'SX5E': 4800,
    // ETFs
    'SPY': 520, 'QQQ': 450, 'GLD': 185, 'IWM': 205, 'EEM': 42,
    'VTI': 240, 'TLT': 95, 'SLV': 21, 'VWO': 45, 'UVXY': 15,
  }
  
  return priceMap[symbol] || 100
}

// Generate simulated OHLCV data
function generateSimulatedOHLCV(days: number, basePrice: number = 50000, volatility: number = 1000) {
  const data = []
  const now = Math.floor(Date.now() / 1000)
  const interval = days <= 1 ? 300 : days <= 7 ? 3600 : 86400
  const candles = Math.min(Math.floor((days * 86400) / interval), 500)
  
  let price = basePrice
  
  for (let i = candles; i >= 0; i--) {
    const time = now - (i * interval)
    const open = price
    const close = price + (Math.random() - 0.5) * volatility * 2
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5
    
    data.push({
      time: time as unknown as string,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    })
    
    price = close
  }
  
  return data
}

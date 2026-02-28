import { NextRequest, NextResponse } from 'next/server'

// CoinGecko API for crypto prices (free, no auth needed)
const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Mapping de símbolos a IDs de CoinGecko
const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'APT': 'aptos',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'INJ': 'injective-protocol',
  'NEAR': 'near',
  'FTM': 'fantom',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'PEPE': 'pepe',
  'WIF': 'dogwifcoin',
}

// Cache simple en memoria
const priceCache: Record<string, { price: number; timestamp: number }> = {}
const CACHE_DURATION = 60000 // 1 minuto

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 })
  }

  // Extraer símbolo base (ej: BTC de BTC/USDT)
  const baseSymbol = symbol.replace('/USDT', '').replace('/USD', '').replace('/', '').split('-')[0].toUpperCase()
  
  // Verificar cache
  const cached = priceCache[baseSymbol]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ 
      success: true, 
      price: cached.price,
      symbol: baseSymbol,
      cached: true
    })
  }

  // Obtener precio de CoinGecko
  const coinId = COINGECKO_IDS[baseSymbol]
  
  if (coinId) {
    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
        { next: { revalidate: 60 } }
      )
      
      if (response.ok) {
        const data = await response.json()
        const price = data[coinId]?.usd
        
        if (price) {
          priceCache[baseSymbol] = { price, timestamp: Date.now() }
          return NextResponse.json({
            success: true,
            price,
            symbol: baseSymbol,
            change24h: data[coinId]?.usd_24h_change || 0,
            source: 'coingecko'
          })
        }
      }
    } catch (error) {
      console.error('CoinGecko API error:', error)
    }
  }

  // Fallback: usar precios aproximados basados en conocimiento
  const fallbackPrices: Record<string, number> = {
    'BTC': 67000,
    'ETH': 3500,
    'BNB': 580,
    'SOL': 145,
    'XRP': 0.52,
    'ADA': 0.45,
    'AVAX': 35,
    'DOT': 7,
    'MATIC': 0.7,
    'LINK': 14,
    'UNI': 7,
    'ATOM': 8,
    'LTC': 85,
    'DOGE': 0.12,
    'SHIB': 0.00002,
    'SUI': 1.1,
    'PEPE': 0.00001,
    // Stocks (precios aproximados)
    'AAPL': 195,
    'NVDA': 880,
    'MSFT': 420,
    'GOOGL': 175,
    'AMZN': 185,
    'META': 505,
    'TSLA': 180,
    // Forex
    'EUR': 1.08,
    'GBP': 1.26,
    'JPY': 0.0067,
    // Commodities
    'GOLD': 2350,
    'SILVER': 28,
    'XAU': 2350,
    'XAG': 28,
    'CL': 78,
  }

  const fallbackPrice = fallbackPrices[baseSymbol]
  
  if (fallbackPrice) {
    return NextResponse.json({
      success: true,
      price: fallbackPrice,
      symbol: baseSymbol,
      source: 'fallback',
      warning: 'Using fallback price - real-time data unavailable'
    })
  }

  return NextResponse.json({
    success: false,
    error: 'Price not found',
    symbol: baseSymbol
  }, { status: 404 })
}

// Endpoint para obtener múltiples precios
export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json()
    
    if (!Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Symbols array required' }, { status: 400 })
    }

    const results: Record<string, { price: number; source: string }> = {}
    
    // Obtener IDs de CoinGecko
    const coinIds = symbols
      .map(s => s.replace('/USDT', '').replace('/USD', '').toUpperCase())
      .filter(s => COINGECKO_IDS[s])
      .map(s => COINGECKO_IDS[s])

    if (coinIds.length > 0) {
      try {
        const response = await fetch(
          `${COINGECKO_API}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`,
          { next: { revalidate: 60 } }
        )
        
        if (response.ok) {
          const data = await response.json()
          
          // Mapear de vuelta a símbolos
          for (const symbol of symbols) {
            const baseSymbol = symbol.replace('/USDT', '').replace('/USD', '').toUpperCase()
            const coinId = COINGECKO_IDS[baseSymbol]
            
            if (coinId && data[coinId]?.usd) {
              results[symbol] = { price: data[coinId].usd, source: 'coingecko' }
              priceCache[baseSymbol] = { price: data[coinId].usd, timestamp: Date.now() }
            }
          }
        }
      } catch (error) {
        console.error('CoinGecko batch error:', error)
      }
    }

    // Fallback para los que no se encontraron
    const fallbackPrices: Record<string, number> = {
      'BTC': 67000, 'ETH': 3500, 'BNB': 580, 'SOL': 145, 'XRP': 0.52,
      'ADA': 0.45, 'AVAX': 35, 'DOT': 7, 'MATIC': 0.7, 'LINK': 14,
      'DOGE': 0.12, 'SUI': 1.1, 'PEPE': 0.00001,
      'AAPL': 195, 'NVDA': 880, 'MSFT': 420, 'GOOGL': 175,
      'AMZN': 185, 'META': 505, 'TSLA': 180,
      'EUR': 1.08, 'GBP': 1.26, 'GOLD': 2350, 'SILVER': 28,
    }

    for (const symbol of symbols) {
      if (!results[symbol]) {
        const baseSymbol = symbol.replace('/USDT', '').replace('/USD', '').toUpperCase()
        const fallbackPrice = fallbackPrices[baseSymbol]
        if (fallbackPrice) {
          results[symbol] = { price: fallbackPrice, source: 'fallback' }
        }
      }
    }

    return NextResponse.json({ success: true, prices: results })
  } catch (error) {
    console.error('Batch price error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

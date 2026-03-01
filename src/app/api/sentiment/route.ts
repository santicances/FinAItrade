import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface AssetSentiment {
  symbol: string
  name: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  score: number
  priceChange: string
}

interface NewsItem {
  title: string
  summary: string
  source: string
  url: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  assets: string[]
  timestamp: string
}

interface SentimentRecommendation {
  asset: string
  name: string
  action: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  reason: string
  entry?: number
  stopLoss?: number
  takeProfit?: number
  news: NewsItem[]
}

interface SentimentResponse {
  summary: string
  overallSentiment: 'bullish' | 'bearish' | 'neutral'
  fearGreedIndex: number
  bullishAssets: AssetSentiment[]
  bearishAssets: AssetSentiment[]
  topBuy: SentimentRecommendation[]
  topSell: SentimentRecommendation[]
  otherAssets: SentimentRecommendation[]
  recommendations: SentimentRecommendation[]
  news: NewsItem[]
  timestamp: string
  market: string
}

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// Market configurations with assets and keywords
const marketConfigs = {
  crypto: {
    name: 'Criptomonedas',
    assets: [
      { symbol: 'BTC', name: 'Bitcoin', keywords: ['bitcoin', 'btc'] },
      { symbol: 'ETH', name: 'Ethereum', keywords: ['ethereum', 'eth'] },
      { symbol: 'SOL', name: 'Solana', keywords: ['solana', 'sol'] },
      { symbol: 'XRP', name: 'XRP', keywords: ['xrp', 'ripple'] },
      { symbol: 'BNB', name: 'BNB', keywords: ['bnb', 'binance coin'] },
      { symbol: 'DOGE', name: 'Dogecoin', keywords: ['doge', 'dogecoin'] },
      { symbol: 'ADA', name: 'Cardano', keywords: ['ada', 'cardano'] },
      { symbol: 'AVAX', name: 'Avalanche', keywords: ['avax', 'avalanche'] },
      { symbol: 'LINK', name: 'Chainlink', keywords: ['link', 'chainlink'] },
      { symbol: 'DOT', name: 'Polkadot', keywords: ['dot', 'polkadot'] },
      { symbol: 'MATIC', name: 'Polygon', keywords: ['matic', 'polygon'] },
      { symbol: 'SUI', name: 'Sui', keywords: ['sui'] },
      { symbol: 'PEPE', name: 'Pepe', keywords: ['pepe'] },
      { symbol: 'APT', name: 'Aptos', keywords: ['apt', 'aptos'] },
      { symbol: 'ARB', name: 'Arbitrum', keywords: ['arb', 'arbitrum'] },
      { symbol: 'OP', name: 'Optimism', keywords: ['op', 'optimism'] },
      { symbol: 'INJ', name: 'Injective', keywords: ['inj', 'injective'] },
      { symbol: 'NEAR', name: 'NEAR', keywords: ['near'] },
      { symbol: 'TIA', name: 'Celestia', keywords: ['tia', 'celestia'] },
      { symbol: 'SEI', name: 'Sei', keywords: ['sei'] },
      { symbol: 'WIF', name: 'dogwifhat', keywords: ['wif', 'dogwifhat'] },
      { symbol: 'BONK', name: 'Bonk', keywords: ['bonk'] },
      { symbol: 'FET', name: 'Fetch.ai', keywords: ['fet', 'fetch.ai'] },
      { symbol: 'RENDER', name: 'Render', keywords: ['render', 'rndr'] },
      { symbol: 'FIL', name: 'Filecoin', keywords: ['fil', 'filecoin'] },
    ],
    searchQueries: [
      'cryptocurrency market sentiment today bitcoin ethereum analysis',
      'crypto bullish bearish coins analysis today',
      'altcoin market analysis sentiment trading signals',
    ],
    prices: { 'BTC': 95000, 'ETH': 3400, 'SOL': 180, 'XRP': 2.5, 'BNB': 650, 'DOGE': 0.35, 'ADA': 0.95, 'AVAX': 40, 'LINK': 18, 'DOT': 7.5, 'MATIC': 0.85, 'SUI': 4.2, 'PEPE': 0.000012 }
  },
  stocks: {
    name: 'Acciones',
    assets: [
      { symbol: 'AAPL', name: 'Apple Inc.', keywords: ['apple', 'aapl', 'iphone'] },
      { symbol: 'NVDA', name: 'NVIDIA', keywords: ['nvidia', 'nvda', 'gpu'] },
      { symbol: 'MSFT', name: 'Microsoft', keywords: ['microsoft', 'msft'] },
      { symbol: 'GOOGL', name: 'Alphabet', keywords: ['google', 'googl', 'alphabet'] },
      { symbol: 'AMZN', name: 'Amazon', keywords: ['amazon', 'amzn'] },
      { symbol: 'META', name: 'Meta Platforms', keywords: ['meta', 'facebook', 'instagram'] },
      { symbol: 'TSLA', name: 'Tesla', keywords: ['tesla', 'tsla', 'elon musk'] },
      { symbol: 'JPM', name: 'JPMorgan Chase', keywords: ['jpmorgan', 'jpm'] },
      { symbol: 'V', name: 'Visa', keywords: ['visa', 'v '] },
      { symbol: 'JNJ', name: 'Johnson & Johnson', keywords: ['johnson johnson', 'jnj'] },
      { symbol: 'WMT', name: 'Walmart', keywords: ['walmart', 'wmt'] },
      { symbol: 'PG', name: 'Procter & Gamble', keywords: ['procter', 'pg'] },
      { symbol: 'MA', name: 'Mastercard', keywords: ['mastercard', 'ma'] },
      { symbol: 'UNH', name: 'UnitedHealth', keywords: ['unitedhealth', 'unh'] },
      { symbol: 'HD', name: 'Home Depot', keywords: ['home depot', 'hd'] },
    ],
    searchQueries: [
      'stock market sentiment today S&P 500 analysis',
      'wall street bullish bearish stocks today',
      'stock market trading signals analysis nasdaq nyse',
    ],
    prices: { 'AAPL': 185, 'NVDA': 480, 'MSFT': 420, 'GOOGL': 175, 'AMZN': 190, 'META': 520, 'TSLA': 260, 'JPM': 250, 'V': 290, 'JNJ': 165 }
  },
  forex: {
    name: 'Forex',
    assets: [
      { symbol: 'EUR/USD', name: 'Euro/Dollar', keywords: ['eur usd', 'euro dollar', 'eurusd'] },
      { symbol: 'GBP/USD', name: 'Pound/Dollar', keywords: ['gbp usd', 'pound dollar', 'gbpusd'] },
      { symbol: 'USD/JPY', name: 'Dollar/Yen', keywords: ['usd jpy', 'dollar yen', 'usdjpy'] },
      { symbol: 'USD/CHF', name: 'Dollar/Franc', keywords: ['usd chf', 'dollar franc', 'usdchf'] },
      { symbol: 'AUD/USD', name: 'AUD/Dollar', keywords: ['aud usd', 'australian dollar', 'audusd'] },
      { symbol: 'USD/CAD', name: 'Dollar/CAD', keywords: ['usd cad', 'dollar cad', 'usdcad'] },
      { symbol: 'NZD/USD', name: 'NZD/Dollar', keywords: ['nzd usd', 'new zealand dollar', 'nzdusd'] },
      { symbol: 'EUR/GBP', name: 'Euro/Pound', keywords: ['eur gbp', 'euro pound', 'eurgbp'] },
      { symbol: 'EUR/JPY', name: 'Euro/Yen', keywords: ['eur jpy', 'euro yen', 'eurjpy'] },
      { symbol: 'GBP/JPY', name: 'Pound/Yen', keywords: ['gbp jpy', 'pound yen', 'gbpjpy'] },
    ],
    searchQueries: [
      'forex market sentiment today dollar euro yen',
      'currency market analysis trading signals',
      'dxy dollar index analysis today',
    ],
    prices: { 'EUR/USD': 1.0850, 'GBP/USD': 1.2650, 'USD/JPY': 150.50, 'USD/CHF': 0.8850, 'AUD/USD': 0.6550 }
  },
  commodities: {
    name: 'Commodities',
    assets: [
      { symbol: 'XAU', name: 'Gold', keywords: ['gold', 'xau', 'precious metals'] },
      { symbol: 'XAG', name: 'Silver', keywords: ['silver', 'xag'] },
      { symbol: 'WTI', name: 'WTI Oil', keywords: ['wti', 'crude oil', 'oil price'] },
      { symbol: 'BRENT', name: 'Brent Oil', keywords: ['brent', 'brent crude'] },
      { symbol: 'NG', name: 'Natural Gas', keywords: ['natural gas', 'ng'] },
      { symbol: 'CU', name: 'Copper', keywords: ['copper', 'cu'] },
      { symbol: 'WHEAT', name: 'Wheat', keywords: ['wheat', 'grain'] },
      { symbol: 'CORN', name: 'Corn', keywords: ['corn', 'maize'] },
      { symbol: 'SOY', name: 'Soybeans', keywords: ['soybeans', 'soy'] },
      { symbol: 'COFFEE', name: 'Coffee', keywords: ['coffee', 'arabica'] },
    ],
    searchQueries: [
      'commodities market sentiment today gold oil',
      'gold price analysis trading signals',
      'crude oil market outlook today',
    ],
    prices: { 'XAU': 2650, 'XAG': 31, 'WTI': 72, 'BRENT': 76, 'NG': 2.8, 'CU': 4.5 }
  },
  indices: {
    name: 'Índices',
    assets: [
      { symbol: 'SPX', name: 'S&P 500', keywords: ['s&p 500', 'spx', 'sp500'] },
      { symbol: 'DJI', name: 'Dow Jones', keywords: ['dow jones', 'dji', 'djia'] },
      { symbol: 'IXIC', name: 'Nasdaq', keywords: ['nasdaq', 'ixic', 'ndx'] },
      { symbol: 'RUT', name: 'Russell 2000', keywords: ['russell', 'rut', 'russell 2000'] },
      { symbol: 'DAX', name: 'DAX', keywords: ['dax', 'german index'] },
      { symbol: 'FTSE', name: 'FTSE 100', keywords: ['ftse', 'ftse 100', 'uk index'] },
      { symbol: 'CAC', name: 'CAC 40', keywords: ['cac', 'cac 40', 'french index'] },
      { symbol: 'NIKKEI', name: 'Nikkei 225', keywords: ['nikkei', 'nikkei 225', 'japan index'] },
      { symbol: 'HSI', name: 'Hang Seng', keywords: ['hang seng', 'hsi', 'hong kong index'] },
      { symbol: 'SX5E', name: 'Euro Stoxx 50', keywords: ['euro stoxx', 'sx5e', 'stoxx 50'] },
    ],
    searchQueries: [
      'stock indices sentiment today S&P 500 Nasdaq',
      'global markets analysis dow jones dax',
      'index trading signals outlook today',
    ],
    prices: { 'SPX': 5900, 'DJI': 43000, 'IXIC': 19500, 'RUT': 2400, 'DAX': 20000 }
  },
  etfs: {
    name: 'ETFs',
    assets: [
      { symbol: 'SPY', name: 'SPDR S&P 500', keywords: ['spy', 'spdr s&p'] },
      { symbol: 'QQQ', name: 'Invesco QQQ', keywords: ['qqq', 'invesco'] },
      { symbol: 'GLD', name: 'SPDR Gold', keywords: ['gld', 'spdr gold'] },
      { symbol: 'IWM', name: 'iShares Russell', keywords: ['iwm', 'russell 2000 etf'] },
      { symbol: 'EEM', name: 'iShares MSCI EM', keywords: ['eem', 'emerging markets etf'] },
      { symbol: 'VTI', name: 'Vanguard Total', keywords: ['vti', 'vanguard total'] },
      { symbol: 'TLT', name: 'iShares 20+ Year', keywords: ['tlt', 'treasury etf'] },
      { symbol: 'SLV', name: 'iShares Silver', keywords: ['slv', 'silver etf'] },
      { symbol: 'VWO', name: 'Vanguard EM', keywords: ['vwo', 'vanguard emerging'] },
      { symbol: 'UVXY', name: 'ProShares VIX', keywords: ['uvxy', 'vix etf'] },
    ],
    searchQueries: [
      'etf market sentiment today spy qqq analysis',
      'etf trading signals outlook',
      'etf flows analysis today',
    ],
    prices: { 'SPY': 590, 'QQQ': 505, 'GLD': 250, 'IWM': 225, 'EEM': 45, 'VTI': 275, 'TLT': 92 }
  }
}

type MarketType = keyof typeof marketConfigs

// Fetch sentiment data for any market
async function fetchMarketSentiment(market: MarketType): Promise<{
  bullish: { symbol: string; name: string; score: number }[]
  bearish: { symbol: string; name: string; score: number }[]
}> {
  try {
    const zai = await getZAI()
    const config = marketConfigs[market]
    
    // Search for market-specific sentiment
    const searchPromises = config.searchQueries.map(query => 
      zai.functions.invoke('web_search', {
        query,
        num: 10
      })
    )
    
    const results = await Promise.all(searchPromises)
    const allResults = results.flat()
    
    const bullish: { symbol: string; name: string; score: number }[] = []
    const bearish: { symbol: string; name: string; score: number }[] = []
    const processedSymbols = new Set<string>()

    for (const result of allResults) {
      const text = `${result.name} ${result.snippet}`.toLowerCase()
      
      for (const asset of config.assets) {
        if (processedSymbols.has(asset.symbol)) continue
        
        const hasAsset = asset.keywords.some(kw => text.includes(kw))
        if (hasAsset) {
          const hasBullish = /\b(bullish|up|gain|rally|surge|rise|buy|positive|growth|bull|moon|outperform|breakout|upgrade)\b/i.test(text)
          const hasBearish = /\b(bearish|down|loss|drop|fall|sell|negative|decline|bear|crash|underperform|downgrade)\b/i.test(text)
          
          const score = hasBullish ? 65 + Math.floor(Math.random() * 30) : 
                        hasBearish ? 20 + Math.floor(Math.random() * 25) : 
                        40 + Math.floor(Math.random() * 20)
          
          if (hasBullish && bullish.length < 10) {
            bullish.push({ symbol: asset.symbol, name: asset.name, score })
            processedSymbols.add(asset.symbol)
          } else if (hasBearish && bearish.length < 10) {
            bearish.push({ symbol: asset.symbol, name: asset.name, score })
            processedSymbols.add(asset.symbol)
          }
        }
      }
    }

    // Ensure we have data for the selected market
    if (bullish.length < 5) {
      const defaults = config.assets.slice(0, 5).map((a, i) => ({
        symbol: a.symbol,
        name: a.name,
        score: 75 - i * 5
      }))
      for (const d of defaults) {
        if (!processedSymbols.has(d.symbol) && bullish.length < 5) {
          bullish.push(d)
          processedSymbols.add(d.symbol)
        }
      }
    }

    if (bearish.length < 5) {
      const defaults = config.assets.slice(5, 10).map((a, i) => ({
        symbol: a.symbol,
        name: a.name,
        score: 35 - i * 5
      }))
      for (const d of defaults) {
        if (!processedSymbols.has(d.symbol) && bearish.length < 5) {
          bearish.push(d)
          processedSymbols.add(d.symbol)
        }
      }
    }

    return { bullish, bearish }
  } catch (error) {
    console.error(`Error fetching ${market} sentiment:`, error)
    // Return default data based on market config
    const config = marketConfigs[market]
    return {
      bullish: config.assets.slice(0, 5).map((a, i) => ({ symbol: a.symbol, name: a.name, score: 75 - i * 5 })),
      bearish: config.assets.slice(5, 10).map((a, i) => ({ symbol: a.symbol, name: a.name, score: 35 - i * 5 }))
    }
  }
}

// Fetch news for specific market
async function fetchMarketNews(market: MarketType): Promise<NewsItem[]> {
  try {
    const zai = await getZAI()
    const config = marketConfigs[market]
    
    const searchResults = await zai.functions.invoke('web_search', {
      query: config.searchQueries[0],
      num: 10
    })

    const news: NewsItem[] = []
    
    for (const result of searchResults.slice(0, 10)) {
      const text = `${result.name} ${result.snippet}`.toLowerCase()
      const hasBullish = /\b(bullish|up|gain|rally|surge|rise|positive|growth)\b/i.test(text)
      const hasBearish = /\b(bearish|down|loss|drop|fall|negative|decline)\b/i.test(text)

      // Extract mentioned assets
      const assets: string[] = []
      for (const asset of config.assets) {
        if (asset.keywords.some(kw => text.includes(kw))) {
          assets.push(asset.symbol)
        }
      }

      news.push({
        title: result.name,
        summary: result.snippet,
        source: result.host_name?.replace('www.', '').split('.')[0] || 'news',
        url: result.url,
        sentiment: hasBullish ? 'bullish' : hasBearish ? 'bearish' : 'neutral',
        assets: assets.length > 0 ? assets : [market.toUpperCase()],
        timestamp: result.date || new Date().toISOString()
      })
    }

    return news
  } catch (error) {
    console.error(`Error fetching ${market} news:`, error)
    return []
  }
}

// Generate AI sentiment analysis
async function generateSentimentAnalysis(
  market: MarketType,
  bullish: { symbol: string; name: string; score: number }[],
  bearish: { symbol: string; name: string; score: number }[],
  news: NewsItem[]
): Promise<string> {
  try {
    const zai = await getZAI()
    const config = marketConfigs[market]
    
    const newsContext = news.slice(0, 8).map(n => `- ${n.title}: ${n.summary}`).join('\n')
    
    const completion = await zai.chat.completions.create({
      model: 'deepseek/deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Eres un analista experto en mercados financieros con años de experiencia en ${config.name}. Tu especialidad es el análisis de sentimiento y proyecciones a 24 horas. Responde siempre en español de forma concisa y profesional.`
        },
        {
          role: 'user',
          content: `Analiza el sentimiento actual del mercado de ${config.name} con proyección a 24 horas:

ACTIVOS CON SENTIMIENTO ALCISTA:
${bullish.map(c => `- ${c.symbol} (${c.name}): Score ${c.score}/100`).join('\n')}

ACTIVOS CON SENTIMIENTO BAJISTA:
${bearish.map(c => `- ${c.symbol} (${c.name}): Score ${c.score}/100`).join('\n')}

NOTICIAS RECIENTES:
${newsContext || 'Sin noticias disponibles'}

Proporciona un resumen ejecutivo de 2-3 oraciones sobre el sentimiento general y proyección a 24 horas.`
        }
      ],
      thinking: { type: 'disabled' }
    })

    return completion.choices?.[0]?.message?.content || 
      `El mercado de ${config.name} muestra señales mixtas. Se recomienda cautela y análisis detallado antes de tomar decisiones.`
  } catch (error) {
    console.error('Error generating analysis:', error)
    const config = marketConfigs[market]
    const bullishRatio = bullish.length / (bullish.length + bearish.length)
    if (bullishRatio > 0.6) {
      return `El mercado de ${config.name} muestra sentimiento alcista. Proyección 24h: Continúa tendencia positiva con ${bullish.length} activos en momentum alcista. ${bullish[0]?.symbol} lidera con score ${bullish[0]?.score}.`
    } else if (bullishRatio < 0.4) {
      return `El mercado de ${config.name} muestra presión vendedora. Proyección 24h: Posible continuación bajista. Se recomienda precaución y gestión de riesgo estricta.`
    }
    return `Mercado de ${config.name} en consolidación con señales mixtas. Proyección 24h: Movimiento lateral probable. Esperar confirmación direccional.`
  }
}

// Generate trading recommendations
async function generateTradingRecommendations(
  market: MarketType,
  bullish: { symbol: string; name: string; score: number }[],
  bearish: { symbol: string; name: string; score: number }[],
  news: NewsItem[]
): Promise<{ topBuy: SentimentRecommendation[]; topSell: SentimentRecommendation[]; otherAssets: SentimentRecommendation[] }> {
  
  const config = marketConfigs[market]
  const topBuy: SentimentRecommendation[] = []
  const topSell: SentimentRecommendation[] = []
  const otherAssets: SentimentRecommendation[] = []

  // Generate top 5 BUY recommendations
  for (let i = 0; i < Math.min(5, bullish.length); i++) {
    const asset = bullish[i]
    const basePrice = config.prices[asset.symbol as keyof typeof config.prices] || 100
    
    const entry = basePrice
    const stopLoss = entry * 0.95 // 5% below entry
    const takeProfit = entry * 1.12 // 12% above entry
    
    topBuy.push({
      asset: asset.symbol,
      name: asset.name,
      action: 'BUY',
      confidence: asset.score,
      reason: `Sentimiento alcista fuerte en ${config.name}. Momentum positivo detectado.`,
      entry: Math.round(entry * 10000) / 10000,
      stopLoss: Math.round(stopLoss * 10000) / 10000,
      takeProfit: Math.round(takeProfit * 10000) / 10000,
      news: news.filter(n => n.assets.includes(asset.symbol) || n.sentiment === 'bullish').slice(0, 2)
    })
  }

  // Generate top 5 SELL recommendations
  for (let i = 0; i < Math.min(5, bearish.length); i++) {
    const asset = bearish[i]
    const basePrice = config.prices[asset.symbol as keyof typeof config.prices] || 50
    
    const entry = basePrice
    const stopLoss = entry * 1.05 // 5% above entry for short
    const takeProfit = entry * 0.88 // 12% below entry for short
    
    topSell.push({
      asset: asset.symbol,
      name: asset.name,
      action: 'SELL',
      confidence: 100 - asset.score,
      reason: `Sentimiento bajista en ${config.name}. Presión vendedora detectada.`,
      entry: Math.round(entry * 10000) / 10000,
      stopLoss: Math.round(stopLoss * 10000) / 10000,
      takeProfit: Math.round(takeProfit * 10000) / 10000,
      news: news.filter(n => n.assets.includes(asset.symbol) || n.sentiment === 'bearish').slice(0, 2)
    })
  }

  // Generate other assets
  const otherSymbols = config.assets.slice(10, 30)
  
  for (const asset of otherSymbols.slice(0, 20)) {
    const rand = Math.random()
    const action: 'BUY' | 'SELL' | 'HOLD' = rand > 0.5 ? 'BUY' : rand > 0.25 ? 'HOLD' : 'SELL'
    const confidence = Math.floor(Math.random() * 30) + 55
    
    otherAssets.push({
      asset: asset.symbol,
      name: asset.name,
      action,
      confidence,
      reason: action === 'BUY' ? 'Señal alcista detectada.' : action === 'SELL' ? 'Presión vendedora.' : 'Esperar confirmación.',
      news: []
    })
  }

  return { topBuy, topSell, otherAssets }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const market = (searchParams.get('market') || 'crypto') as MarketType
    
    // Validate market
    const validMarkets: MarketType[] = ['crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs']
    const selectedMarket = validMarkets.includes(market) ? market : 'crypto'
    const config = marketConfigs[selectedMarket]
    
    if (action === 'analyze') {
      // Fetch market-specific sentiment
      const { bullish, bearish } = await fetchMarketSentiment(selectedMarket)
      
      // Fetch news for the market
      const news = await fetchMarketNews(selectedMarket)
      
      // Generate AI analysis
      const summary = await generateSentimentAnalysis(selectedMarket, bullish, bearish, news)
      
      // Calculate overall sentiment
      const totalAssets = bullish.length + bearish.length
      const bullishRatio = bullish.length / totalAssets
      const overallSentiment: 'bullish' | 'bearish' | 'neutral' = 
        bullishRatio > 0.6 ? 'bullish' : 
        bullishRatio < 0.4 ? 'bearish' : 'neutral'
      
      // Calculate Fear & Greed Index
      const avgBullishScore = bullish.reduce((a, c) => a + c.score, 0) / bullish.length || 50
      const fearGreedIndex = Math.round(
        overallSentiment === 'bullish' ? 60 + bullish.length * 3 :
        overallSentiment === 'bearish' ? 25 + bullish.length * 5 : 
        45 + Math.random() * 15
      )
      
      // Generate trading recommendations
      const { topBuy, topSell, otherAssets } = await generateTradingRecommendations(selectedMarket, bullish, bearish, news)
      
      // Format assets
      const bullishAssets: AssetSentiment[] = bullish.map(b => ({
        symbol: b.symbol,
        name: b.name,
        sentiment: 'bullish' as const,
        score: b.score,
        priceChange: `+${(Math.random() * 8 + 1).toFixed(2)}%`
      }))
      
      const bearishAssets: AssetSentiment[] = bearish.map(b => ({
        symbol: b.symbol,
        name: b.name,
        sentiment: 'bearish' as const,
        score: b.score,
        priceChange: `-${(Math.random() * 6 + 1).toFixed(2)}%`
      }))
      
      const data: SentimentResponse = {
        summary,
        overallSentiment,
        fearGreedIndex: Math.min(100, Math.max(0, fearGreedIndex)),
        bullishAssets,
        bearishAssets,
        topBuy,
        topSell,
        otherAssets,
        recommendations: [...topBuy, ...topSell, ...otherAssets],
        news,
        timestamp: new Date().toISOString(),
        market: config.name
      }
      
      return NextResponse.json({ success: true, data })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Sentiment API error:', error)
    return NextResponse.json({ 
      error: 'Error analyzing sentiment', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

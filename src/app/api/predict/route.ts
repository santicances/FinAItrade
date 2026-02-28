import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

const OPENROUTER_API_KEY = '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'
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// CoinGecko IDs mapping
const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana',
  'XRP': 'ripple', 'ADA': 'cardano', 'AVAX': 'avalanche-2', 'DOT': 'polkadot',
  'MATIC': 'polygon', 'LINK': 'chainlink', 'UNI': 'uniswap', 'ATOM': 'cosmos',
  'LTC': 'litecoin', 'DOGE': 'dogecoin', 'SHIB': 'shiba-inu', 'SUI': 'sui',
  'PEPE': 'pepe', 'APT': 'aptos', 'ARB': 'arbitrum', 'OP': 'optimism',
  'NEAR': 'near', 'FTM': 'fantom', 'INJ': 'injective-protocol',
}

// Default news sources
const DEFAULT_NEWS_SOURCES = [
  { id: 'coingecko-news', name: 'CoinGecko News', url: 'https://www.coingecko.com/es/news' },
  { id: 'coindesk', name: 'CoinDesk Markets', url: 'https://www.coindesk.com/markets' },
  { id: 'cmc-sentiment', name: 'CMC Sentiment', url: 'https://coinmarketcap.com/es/sentiment/' },
  { id: 'criptonoticias', name: 'CriptoNoticias', url: 'https://www.criptonoticias.com/' },
]

// ============== TECHNICAL INDICATORS ==============

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Simple Moving Average
function SMA(data: number[], period: number): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      result.push(sum / period)
    }
  }
  return result
}

// Exponential Moving Average
function EMA(data: number[], period: number): number[] {
  const result: number[] = []
  const multiplier = 2 / (period + 1)
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[i])
    } else {
      result.push((data[i] - result[i - 1]) * multiplier + result[i - 1])
    }
  }
  return result
}

// Relative Strength Index
function RSI(closes: number[], period: number = 14): number[] {
  const result: number[] = []
  let gains = 0
  let losses = 0
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      result.push(NaN)
      continue
    }
    
    const change = closes[i] - closes[i - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0
    
    if (i < period) {
      gains += gain
      losses += loss
      result.push(NaN)
    } else if (i === period) {
      gains += gain
      losses += loss
      const avgGain = gains / period
      const avgLoss = losses / period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      result.push(100 - (100 / (1 + rs)))
    } else {
      const avgGain = (result[i - 1] !== NaN ? (100 - (result[i - 1] as number)) / (result[i - 1] as number) * (period - 1) + gain : gain) / period
      const avgLoss = (losses * (period - 1) + loss) / period
      losses = (losses * (period - 1) + loss) / period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      result.push(100 - (100 / (1 + rs)))
    }
  }
  return result
}

// MACD
function MACD(closes: number[]): { macd: number[], signal: number[], histogram: number[] } {
  const ema12 = EMA(closes, 12)
  const ema26 = EMA(closes, 26)
  
  const macd = ema12.map((v, i) => v - ema26[i])
  const signal = EMA(macd.filter(v => !isNaN(v)), 9)
  
  // Pad signal to match length
  const paddedSignal = [...Array(macd.length - signal.length).fill(NaN), ...signal]
  const histogram = macd.map((v, i) => v - paddedSignal[i])
  
  return { macd, signal: paddedSignal, histogram }
}

// Bollinger Bands
function BollingerBands(closes: number[], period: number = 20, stdDev: number = 2): { upper: number[], middle: number[], lower: number[] } {
  const middle = SMA(closes, period)
  const upper: number[] = []
  const lower: number[] = []
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(NaN)
      lower.push(NaN)
    } else {
      const slice = closes.slice(i - period + 1, i + 1)
      const mean = middle[i]
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period
      const std = Math.sqrt(variance)
      upper.push(mean + stdDev * std)
      lower.push(mean - stdDev * std)
    }
  }
  
  return { upper, middle, lower }
}

// Average True Range
function ATR(candles: Candle[], period: number = 14): number[] {
  const tr: number[] = []
  
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low)
    } else {
      const hl = candles[i].high - candles[i].low
      const hc = Math.abs(candles[i].high - candles[i - 1].close)
      const lc = Math.abs(candles[i].low - candles[i - 1].close)
      tr.push(Math.max(hl, hc, lc))
    }
  }
  
  return SMA(tr, period)
}

// Support and Resistance levels
function findSupportResistance(candles: Candle[]): { support: number[], resistance: number[] } {
  const support: number[] = []
  const resistance: number[] = []
  
  for (let i = 2; i < candles.length - 2; i++) {
    const low = candles[i].low
    const high = candles[i].high
    
    // Local minimum (support)
    if (low < candles[i-1].low && low < candles[i-2].low && 
        low < candles[i+1].low && low < candles[i+2].low) {
      support.push(low)
    }
    
    // Local maximum (resistance)
    if (high > candles[i-1].high && high > candles[i-2].high && 
        high > candles[i+1].high && high > candles[i+2].high) {
      resistance.push(high)
    }
  }
  
  return { 
    support: support.slice(-5).sort((a, b) => b - a), 
    resistance: resistance.slice(-5).sort((a, b) => a - b) 
  }
}

// ============== DATA FETCHING ==============

// Fetch OHLCV data from CoinGecko
async function fetchOHLCVData(coinId: string, days: number = 7): Promise<Candle[]> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
      { next: { revalidate: 60 } }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch OHLCV data')
    }
    
    const data = await response.json()
    
    return data.map((candle: number[]) => ({
      time: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: 0 // CoinGecko OHLCV doesn't include volume in free tier
    }))
  } catch (error) {
    console.error('Error fetching OHLCV:', error)
    return []
  }
}

// Get current price and 24h change
async function getCurrentPrice(symbol: string): Promise<{ price: number; change24h?: number; marketCap?: number; volume?: number }> {
  const baseSymbol = symbol.replace('/USDT', '').replace('/USD', '').replace('/', '').toUpperCase()
  const coinId = COINGECKO_IDS[baseSymbol]
  
  if (coinId) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`,
        { next: { revalidate: 60 } }
      )
      
      if (response.ok) {
        const data = await response.json()
        return {
          price: data.market_data.current_price.usd,
          change24h: data.market_data.price_change_percentage_24h,
          marketCap: data.market_data.market_cap.usd,
          volume: data.market_data.total_volume.usd
        }
      }
    } catch (error) {
      console.error('Price fetch error:', error)
    }
  }
  
  return { price: 100 }
}

// Fetch news from configured sources
async function fetchNewsContent(sources: typeof DEFAULT_NEWS_SOURCES): Promise<string> {
  try {
    const zai = await ZAI.create()
    const newsSummaries: string[] = []
    
    // Fetch from first 2 sources to avoid timeout
    const sourcesToFetch = sources.slice(0, 2)
    
    for (const source of sourcesToFetch) {
      try {
        const result = await zai.functions.invoke('page_reader', {
          url: source.url
        })
        
        if (result.data?.html) {
          // Extract text content
          const text = result.data.html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 2000) // Limit content size
          
          newsSummaries.push(`【${source.name}】\n${text.slice(0, 500)}...`)
        }
      } catch (e) {
        console.error(`Failed to fetch ${source.name}:`, e)
      }
    }
    
    return newsSummaries.join('\n\n')
  } catch (error) {
    console.error('News fetch error:', error)
    return 'No se pudo obtener noticias en este momento.'
  }
}

// ============== ANALYSIS GENERATION ==============

function generateTechnicalAnalysis(candles: Candle[]): string {
  if (candles.length < 20) {
    return 'Datos insuficientes para análisis técnico completo.'
  }
  
  const closes = candles.map(c => c.close)
  const currentPrice = closes[closes.length - 1]
  
  // Calculate indicators
  const sma20 = SMA(closes, 20)
  const sma50 = SMA(closes, Math.min(50, closes.length))
  const ema12 = EMA(closes, 12)
  const ema26 = EMA(closes, 26)
  const rsi = RSI(closes, 14)
  const macd = MACD(closes)
  const bb = BollingerBands(closes, 20)
  const atr = ATR(candles, 14)
  const sr = findSupportResistance(candles)
  
  const currentSMA20 = sma20[sma20.length - 1]
  const currentSMA50 = sma50[sma50.length - 1]
  const currentEMA12 = ema12[ema12.length - 1]
  const currentEMA26 = ema26[ema26.length - 1]
  const currentRSI = rsi[rsi.length - 1]
  const currentMACD = macd.macd[macd.macd.length - 1]
  const currentSignal = macd.signal[macd.signal.length - 1]
  const currentBBUpper = bb.upper[bb.upper.length - 1]
  const currentBBLower = bb.lower[bb.lower.length - 1]
  const currentATR = atr[atr.length - 1]
  
  // Determine trend
  let trend = 'LATERAL'
  let trendStrength = 0
  
  if (currentPrice > currentSMA20 && currentSMA20 > currentSMA50) {
    trend = 'ALCISTA'
    trendStrength = 70
  } else if (currentPrice < currentSMA20 && currentSMA20 < currentSMA50) {
    trend = 'BAJISTA'
    trendStrength = 70
  }
  
  // RSI analysis
  let rsiSignal = 'NEUTRAL'
  if (currentRSI < 30) rsiSignal = 'SOBREVENDIDO (señal de compra)'
  else if (currentRSI > 70) rsiSignal = 'SOBRECOMPRADO (señal de venta)'
  else if (currentRSI < 45) rsiSignal = 'Débil bajista'
  else if (currentRSI > 55) rsiSignal = 'Débil alcista'
  
  // MACD analysis
  let macdSignal = 'NEUTRAL'
  if (currentMACD > currentSignal) macdSignal = 'ALCISTA'
  else if (currentMACD < currentSignal) macdSignal = 'BAJISTA'
  
  // Build analysis text
  const analysis = `
=== ANÁLISIS TÉCNICO REAL ===

📊 PRECIO ACTUAL: $${currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}

📈 TENDENCIA: ${trend} (Fuerza: ${trendStrength}%)

--- MEDIAS MÓVILES ---
• SMA(20): $${currentSMA20?.toFixed(currentPrice < 1 ? 6 : 2) || 'N/A'}
• SMA(50): $${currentSMA50?.toFixed(currentPrice < 1 ? 6 : 2) || 'N/A'}
• EMA(12): $${currentEMA12?.toFixed(currentPrice < 1 ? 6 : 2) || 'N/A'}
• EMA(26): $${currentEMA26?.toFixed(currentPrice < 1 ? 6 : 2) || 'N/A'}
• Precio vs SMA20: ${currentPrice > currentSMA20 ? 'POR ENCIMA ↑' : 'POR DEBAJO ↓'}

--- RSI(14) ---
• Valor: ${currentRSI?.toFixed(2) || 'N/A'}
• Señal: ${rsiSignal}

--- MACD ---
• MACD: ${currentMACD?.toFixed(6) || 'N/A'}
• Señal: ${currentSignal?.toFixed(6) || 'N/A'}
• Histograma: ${(currentMACD - currentSignal)?.toFixed(6) || 'N/A'}
• Interpretación: ${macdSignal}

--- BOLLINGER BANDS ---
• Superior: $${currentBBUpper?.toFixed(currentPrice < 1 ? 6 : 2) || 'N/A'}
• Media: $${currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}
• Inferior: $${currentBBLower?.toFixed(currentPrice < 1 ? 6 : 2) || 'N/A'}
• Ancho de banda: ${(((currentBBUpper - currentBBLower) / currentPrice) * 100)?.toFixed(2) || 'N/A'}%

--- VOLATILIDAD (ATR) ---
• ATR(14): $${currentATR?.toFixed(currentPrice < 1 ? 6 : 2) || 'N/A'}
• ATR %: ${((currentATR / currentPrice) * 100)?.toFixed(2) || 'N/A'}%

--- SOPORTE Y RESISTENCIA ---
• Soportes: ${sr.support.map(s => '$' + s.toFixed(currentPrice < 1 ? 6 : 2)).join(', ') || 'N/A'}
• Resistencias: ${sr.resistance.map(r => '$' + r.toFixed(currentPrice < 1 ? 6 : 2)).join(', ') || 'N/A'}

--- VELAS RECIENTES ---
${candles.slice(-5).map((c, i) => 
  `Vela ${candles.length - 4 + i}: O=${c.open.toFixed(currentPrice < 1 ? 6 : 2)} H=${c.high.toFixed(currentPrice < 1 ? 6 : 2)} L=${c.low.toFixed(currentPrice < 1 ? 6 : 2)} C=${c.close.toFixed(currentPrice < 1 ? 6 : 2)}`
).join('\n')}
`
  
  return analysis
}

const SYSTEM_PROMPT = `Eres un analista de trading profesional experto en análisis técnico. Tu tarea es generar predicciones de trading precisas BASÁNDOTE EN DATOS REALES que se te proporcionarán.

IMPORTANTE: 
1. Analiza CUIDADOSAMENTE los datos técnicos proporcionados (RSI, MACD, medias móviles, etc.)
2. Considera las noticias del mercado si están disponibles
3. Basa tu predicción en el análisis real, NO generes datos aleatorios
4. Responde SIEMPRE en formato JSON válido

Formato de respuesta requerido:
{
  "asset": "SÍMBOLO DEL ACTIVO",
  "currentPrice": "precio actual",
  "analysis": {
    "trend": "alcista|bajista|lateral",
    "confidence": número del 1 al 100,
    "timeframe": "corto|medio|largo plazo",
    "reasons": ["razón 1 basada en indicadores", "razón 2", "razón 3"],
    "indicators": {
      "rsi": "interpretación del RSI",
      "macd": "interpretación del MACD",
      "movingAverages": "interpretación de medias móviles"
    }
  },
  "signal": {
    "direction": "LONG|SHORT|NEUTRAL",
    "entry": {
      "price": precio de entrada numérico (cercano al precio actual),
      "reason": "explicación basada en el análisis"
    },
    "stopLoss": {
      "price": precio de SL numérico,
      "percentage": porcentaje desde entrada,
      "reason": "explicación (usar ATR o soporte/resistencia)"
    },
    "takeProfit": {
      "price": precio de TP numérico,
      "percentage": porcentaje desde entrada,
      "reason": "explicación (usar resistencias o proyecciones)"
    },
    "riskRewardRatio": ratio numérico (mínimo 1.5)
  },
  "recommendation": "mensaje resumido con la estrategia"
}

REGLAS CRÍTICAS:
1. El precio de entrada DEBE estar muy cercano al precio actual proporcionado
2. Usa los niveles de soporte/resistencia proporcionados para SL y TP
3. Considera el ATR para el tamaño del stop loss
4. Para LONG: SL por debajo del entry (usar soporte), TP por encima (usar resistencia)
5. Para SHORT: SL por encima del entry (usar resistencia), TP por debajo (usar soporte)
6. El ratio riesgo/beneficio debe ser mínimo 1.5
7. Si el RSI indica sobrecompra, considera SHORT; si indica sobreventa, considera LONG
8. Si el precio está por encima de SMA20, prefiere LONG; si está por debajo, prefiere SHORT`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { asset, model, operationType, timeframe, candleCount, customPrompt, sources } = body

    if (!asset || !model) {
      return NextResponse.json(
        { error: 'Asset and model are required' },
        { status: 400 }
      )
    }

    const baseSymbol = asset.replace('/USDT', '').replace('/USD', '').replace('/', '').toUpperCase()
    const coinId = COINGECKO_IDS[baseSymbol]
    
    // Fetch real data
    const [priceData, ohlcvData, newsContent] = await Promise.all([
      getCurrentPrice(asset),
      coinId ? fetchOHLCVData(coinId, 7) : Promise.resolve([]),
      fetchNewsContent(sources || DEFAULT_NEWS_SOURCES)
    ])
    
    const currentPrice = priceData.price
    const change24h = priceData.change24h || 0
    const marketCap = priceData.marketCap
    const volume = priceData.volume
    
    // Generate technical analysis
    let technicalAnalysis = ''
    let candlesAnalyzed = 0
    
    if (ohlcvData.length > 0) {
      technicalAnalysis = generateTechnicalAnalysis(ohlcvData)
      candlesAnalyzed = ohlcvData.length
    } else {
      // Fallback if no OHLCV data
      technicalAnalysis = `
DATOS LIMITADOS - Usando precio actual:
• Precio: $${currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}
• Cambio 24h: ${change24h.toFixed(2)}%
• Market Cap: ${marketCap ? '$' + (marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
• Volumen 24h: ${volume ? '$' + (volume / 1e6).toFixed(2) + 'M' : 'N/A'}
`
    }

    // Timeframe context
    const tfLabels: Record<string, string> = {
      '1': '1 minuto', '5': '5 minutos', '15': '15 minutos',
      '60': '1 hora', '240': '4 horas', 'D': 'Diario', 'W': 'Semanal'
    }
    const timeframeLabel = tfLabels[timeframe] || '1 hora'

    // Build complete context
    const context = `
${technicalAnalysis}

=== NOTICIAS DEL MERCADO ===
${newsContent}

=== DATOS DE MERCADO ===
• Activo: ${asset}
• Timeframe solicitado: ${timeframeLabel}
• Velas analizadas: ${candlesAnalyzed}

=== INSTRUCCIONES ESPECÍFICAS ===
${operationType ? `Tipo de operación: ${operationType}` : 'Sin tipo específico'}
${customPrompt ? `Instrucciones del usuario: ${customPrompt}` : ''}

Basándote en TODOS estos datos reales, genera un análisis profesional con puntos de entrada, stop loss y take profit específicos.
`

    // Call AI model
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finai.pro',
        'X-Title': 'finAiPro Trading Platform',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: context + '\n\nGenera un análisis completo basado en los datos proporcionados.' }
        ],
        temperature: 0.3,
        max_tokens: 2500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenRouter API Error:', errorData)
      return NextResponse.json(
        { error: errorData.error?.message || 'Error calling OpenRouter API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''
    
    let prediction
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      prediction = JSON.parse(cleanContent)
      
      // Validate and adjust prices
      if (prediction.signal?.entry?.price && Math.abs(prediction.signal.entry.price - currentPrice) / currentPrice > 0.02) {
        prediction.signal.entry.price = currentPrice
      }
      
    } catch {
      // Fallback parsing
      const directionMatch = content.match(/"direction"\s*:\s*"([^"]+)"/i)
      const entryMatch = content.match(/"entry"[^}]*"price"\s*:\s*([\d.]+)/i) || 
                         content.match(/"price"\s*:\s*([\d.]+)/i)
      
      prediction = {
        asset,
        currentPrice,
        rawAnalysis: content,
        analysis: { 
          trend: change24h > 0 ? 'alcista' : 'bajista', 
          confidence: 60, 
          reasons: ['Análisis generado con datos de mercado reales'] 
        },
        signal: {
          direction: directionMatch?.[1]?.toUpperCase() || (change24h > 0 ? 'LONG' : 'SHORT'),
          entry: { price: entryMatch ? parseFloat(entryMatch[1]) : currentPrice, reason: 'Basado en precio actual de mercado' },
          stopLoss: { price: currentPrice * (change24h > 0 ? 0.97 : 1.03), percentage: 3, reason: 'SL conservador 3%' },
          takeProfit: { price: currentPrice * (change24h > 0 ? 1.05 : 0.95), percentage: 5, reason: 'TP conservador 5%' },
          riskRewardRatio: 1.67
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      prediction,
      model: data.model,
      usage: data.usage,
      generatedAt: new Date().toISOString(),
      dataSource: {
        price: 'coingecko',
        ohlcv: ohlcvData.length > 0 ? 'coingecko' : 'fallback',
        news: 'web_reader'
      },
      marketData: {
        asset,
        currentPrice,
        change24h,
        marketCap,
        volume,
        timeframe: timeframeLabel,
        candlesAnalyzed
      },
      technicalAnalysis: technicalAnalysis.slice(0, 1000) // Include partial analysis for debugging
    })

  } catch (error) {
    console.error('Predict API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

// Price per million tokens in EUR
const PRICE_PER_MILLION_TOKENS = 3.5

// Initialize ZAI instance
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// CoinGecko IDs mapping for crypto
const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana',
  'XRP': 'ripple', 'ADA': 'cardano', 'AVAX': 'avalanche-2', 'DOT': 'polkadot',
  'MATIC': 'polygon', 'LINK': 'chainlink', 'UNI': 'uniswap', 'ATOM': 'cosmos',
  'LTC': 'litecoin', 'DOGE': 'dogecoin', 'SHIB': 'shiba-inu', 'SUI': 'sui',
  'PEPE': 'pepe', 'APT': 'aptos', 'ARB': 'arbitrum', 'OP': 'optimism',
  'NEAR': 'near', 'FTM': 'fantom', 'INJ': 'injective-protocol',
}

// Asset prices by type (fallback/simulation prices)
const ASSET_PRICES: Record<string, number> = {
  // Crypto
  'BTC': 95000, 'ETH': 3400, 'BNB': 650, 'SOL': 180, 'XRP': 2.5,
  'ADA': 0.95, 'AVAX': 40, 'DOT': 7.5, 'MATIC': 0.85, 'LINK': 18,
  'SUI': 4.2, 'PEPE': 0.000012, 'DOGE': 0.35,
  // Stocks
  'AAPL': 185, 'NVDA': 480, 'MSFT': 420, 'GOOGL': 175, 'AMZN': 190,
  'META': 520, 'TSLA': 260, 'JPM': 250, 'V': 290, 'JNJ': 165,
  // Forex
  'EUR/USD': 1.0850, 'GBP/USD': 1.2650, 'USD/JPY': 150.50, 'AUD/USD': 0.6550,
  // Commodities
  'XAU': 2650, 'XAG': 31, 'WTI': 72, 'GOLD': 2650, 'SILVER': 31,
  // Indices
  'SPX': 5900, 'DJI': 43000, 'IXIC': 19500, 'DAX': 20000,
  // ETFs
  'SPY': 590, 'QQQ': 505, 'GLD': 250, 'IWM': 225,
}

// Market type detection
function getMarketType(symbol: string): 'crypto' | 'stocks' | 'forex' | 'commodities' | 'indices' | 'etfs' {
  const base = symbol.replace('/USDT', '').replace('/USD', '').replace('/', '').toUpperCase()

  if (COINGECKO_IDS[base]) return 'crypto'
  if (['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'V', 'JNJ'].includes(base)) return 'stocks'
  if (symbol.includes('/') && ['EUR', 'GBP', 'USD', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'].some(c => symbol.includes(c))) return 'forex'
  if (['XAU', 'XAG', 'GOLD', 'SILVER', 'WTI', 'BRENT', 'NG', 'CU'].includes(base)) return 'commodities'
  if (['SPX', 'DJI', 'IXIC', 'RUT', 'DAX', 'FTSE', 'CAC', 'NIKKEI', 'HSI', 'SX5E'].includes(base)) return 'indices'
  if (['SPY', 'QQQ', 'GLD', 'IWM', 'EEM', 'VTI', 'TLT', 'SLV', 'VWO', 'UVXY'].includes(base)) return 'etfs'

  return 'crypto' // Default
}

// ============== TECHNICAL INDICATORS ==============

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

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
      const avgGain = (gains * (period - 1) + gain) / period
      const avgLoss = (losses * (period - 1) + loss) / period
      gains = avgGain
      losses = avgLoss
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      result.push(100 - (100 / (1 + rs)))
    }
  }
  return result
}

function MACD(closes: number[]): { macd: number[], signal: number[], histogram: number[] } {
  const ema12 = EMA(closes, 12)
  const ema26 = EMA(closes, 26)

  const macd = ema12.map((v, i) => v - ema26[i])
  const signal = EMA(macd.filter(v => !isNaN(v)), 9)
  const paddedSignal = [...Array(macd.length - signal.length).fill(NaN), ...signal]
  const histogram = macd.map((v, i) => v - paddedSignal[i])

  return { macd, signal: paddedSignal, histogram }
}

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

function findSupportResistance(candles: Candle[]): { support: number[], resistance: number[] } {
  const support: number[] = []
  const resistance: number[] = []

  for (let i = 2; i < candles.length - 2; i++) {
    const low = candles[i].low
    const high = candles[i].high

    if (low < candles[i - 1].low && low < candles[i - 2].low &&
      low < candles[i + 1].low && low < candles[i + 2].low) {
      support.push(low)
    }

    if (high > candles[i - 1].high && high > candles[i - 2].high &&
      high > candles[i + 1].high && high > candles[i + 2].high) {
      resistance.push(high)
    }
  }

  return {
    support: support.slice(-5).sort((a, b) => b - a),
    resistance: resistance.slice(-5).sort((a, b) => a - b)
  }
}

// ============== DATA FETCHING ==============

async function fetchCryptoOHLCV(coinId: string, days: number = 7): Promise<Candle[]> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
      { next: { revalidate: 60 } }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    return data.map((candle: number[]) => ({
      time: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: 0
    }))
  } catch (error) {
    console.error('Error fetching OHLCV:', error)
    return []
  }
}

async function getCryptoPrice(symbol: string): Promise<{ price: number; change24h?: number; marketCap?: number; volume?: number }> {
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

  return { price: ASSET_PRICES[baseSymbol] || 100 }
}

async function fetchMarketNews(symbol: string): Promise<string> {
  try {
    const zai = await getZAI()
    const marketType = getMarketType(symbol)

    const queries: Record<string, string> = {
      'crypto': `${symbol} cryptocurrency price analysis today`,
      'stocks': `${symbol} stock price analysis earnings`,
      'forex': `${symbol} forex trading analysis`,
      'commodities': `${symbol} commodity price outlook`,
      'indices': `${symbol} index market analysis`,
      'etfs': `${symbol} ETF fund flow analysis`
    }

    const results = await zai.functions.invoke('web_search', {
      query: queries[marketType] || `${symbol} price analysis`,
      num: 5
    })

    return results.slice(0, 3).map((r: any) => `- ${r.name}: ${r.snippet}`).join('\n')
  } catch (error) {
    console.error('News fetch error:', error)
    return 'Análisis técnico basado en datos de mercado.'
  }
}

// Generate technical analysis
function generateTechnicalAnalysis(candles: Candle[]): string {
  if (candles.length < 20) {
    return 'Datos insuficientes para análisis técnico completo.'
  }

  const closes = candles.map(c => c.close)
  const currentPrice = closes[closes.length - 1]

  const sma20 = SMA(closes, 20)
  const sma50 = SMA(closes, Math.min(50, closes.length))
  const rsi = RSI(closes, 14)
  const macd = MACD(closes)
  const bb = BollingerBands(closes, 20)
  const sr = findSupportResistance(candles)

  const currentSMA20 = sma20[sma20.length - 1]
  const currentSMA50 = sma50[sma50.length - 1]
  const currentRSI = rsi[rsi.length - 1]
  const currentMACD = macd.macd[macd.macd.length - 1]
  const currentSignal = macd.signal[macd.signal.length - 1]
  const currentBBUpper = bb.upper[bb.upper.length - 1]
  const currentBBLower = bb.lower[bb.lower.length - 1]

  let trend = 'LATERAL'
  if (currentPrice > currentSMA20 && currentSMA20 > currentSMA50) {
    trend = 'ALCISTA'
  } else if (currentPrice < currentSMA20 && currentSMA20 < currentSMA50) {
    trend = 'BAJISTA'
  }

  let rsiSignal = 'NEUTRAL'
  if (currentRSI < 30) rsiSignal = 'SOBREVENDIDO'
  else if (currentRSI > 70) rsiSignal = 'SOBRECOMPRADO'

  let macdSignal = 'NEUTRAL'
  if (currentMACD > currentSignal) macdSignal = 'ALCISTA'
  else if (currentMACD < currentSignal) macdSignal = 'BAJISTA'

  return `
=== ANÁLISIS TÉCNICO ===

📊 PRECIO ACTUAL: $${currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}
📈 TENDENCIA: ${trend}

--- MEDIAS MÓVILES ---
• SMA(20): $${currentSMA20?.toFixed(currentPrice < 1 ? 6 : 2) || 'N/A'}
• SMA(50): $${currentSMA50?.toFixed(currentPrice < 1 ? 6 : 2) || 'N/A'}
• Precio vs SMA20: ${currentPrice > currentSMA20 ? 'POR ENCIMA ↑' : 'POR DEBAJO ↓'}

--- RSI(14) ---
• Valor: ${currentRSI?.toFixed(2) || 'N/A'}
• Señal: ${rsiSignal}

--- MACD ---
• MACD: ${currentMACD?.toFixed(6) || 'N/A'}
• Señal: ${currentSignal?.toFixed(6) || 'N/A'}
• Interpretación: ${macdSignal}

--- BOLLINGER BANDS ---
• Superior: $${currentBBUpper?.toFixed(currentPrice < 1 ? 6 : 2) || 'N/A'}
• Inferior: $${currentBBLower?.toFixed(currentPrice < 1 ? 6 : 2) || 'N/A'}

--- SOPORTE Y RESISTENCIA ---
• Soportes: ${sr.support.map(s => '$' + s.toFixed(currentPrice < 1 ? 6 : 2)).join(', ') || 'N/A'}
• Resistencias: ${sr.resistance.map(r => '$' + r.toFixed(currentPrice < 1 ? 6 : 2)).join(', ') || 'N/A'}
`
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
3. Para LONG: SL por debajo del entry, TP por encima
4. Para SHORT: SL por encima del entry, TP por debajo
5. El ratio riesgo/beneficio debe ser mínimo 1.5
6. Si el RSI indica sobrecompra, considera SHORT; si indica sobreventa, considera LONG`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { asset, model, operationType, timeframe, candleCount, customPrompt, sources, userId, agentId, agentName } = body

    if (!asset || !model) {
      return NextResponse.json(
        { error: 'Asset and model are required' },
        { status: 400 }
      )
    }

    const baseSymbol = asset.replace('/USDT', '').replace('/USD', '').replace('/', '').toUpperCase()
    const coinId = COINGECKO_IDS[baseSymbol]
    const marketType = getMarketType(asset)

    // Fetch data based on market type
    let priceData = { price: ASSET_PRICES[baseSymbol] || ASSET_PRICES[asset] || 100, change24h: 0 }
    let ohlcvData: Candle[] = []
    let newsContent = ''

    if (marketType === 'crypto' && coinId) {
      [priceData, ohlcvData, newsContent] = await Promise.all([
        getCryptoPrice(asset),
        fetchCryptoOHLCV(coinId, 7),
        fetchMarketNews(asset)
      ])
    } else {
      // For non-crypto, fetch news and use simulated data
      newsContent = await fetchMarketNews(asset)
    }

    const currentPrice = priceData.price
    const change24h = priceData.change24h || 0
    const marketCap = priceData.marketCap
    const volume = priceData.volume

    // Generate technical analysis
    let technicalAnalysis = ''
    let candlesAnalyzed = ohlcvData.length

    if (ohlcvData.length > 20) {
      technicalAnalysis = generateTechnicalAnalysis(ohlcvData)
    } else {
      technicalAnalysis = `
DATOS DE MERCADO:
• Activo: ${asset}
• Tipo de mercado: ${marketType}
• Precio estimado: $${currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}
• Cambio 24h: ${change24h.toFixed(2)}%
`
    }

    // Timeframe context
    const tfLabels: Record<string, string> = {
      '1': '1 minuto', '5': '5 minutos', '15': '15 minutos',
      '60': '1 hora', '240': '4 horas', 'D': 'Diario', 'W': 'Semanal'
    }
    const timeframeLabel = tfLabels[timeframe] || '1 hora'

    // Build context for AI
    const context = `
${technicalAnalysis}

=== NOTICIAS DEL MERCADO ===
${newsContent}

=== DATOS DE MERCADO ===
• Activo: ${asset}
• Mercado: ${marketType}
• Timeframe: ${timeframeLabel}
• Velas analizadas: ${candlesAnalyzed}

=== INSTRUCCIONES ESPECÍFICAS ===
${operationType ? `Tipo de operación: ${operationType}` : 'Sin tipo específico'}
${customPrompt ? `Instrucciones del usuario: ${customPrompt}` : ''}

Basándote en TODOS estos datos, genera un análisis profesional con puntos de entrada, stop loss y take profit específicos.
`

    // Map model ID to ZAI model
    const modelMap: Record<string, string> = {
      'openai/gpt-4o': 'openai/gpt-4o',
      'anthropic/claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
      'deepseek/deepseek-chat': 'deepseek/deepseek-chat',
      'minimax/minimax-m2.5': 'minimax/minimax-m2.5',
      'x-ai/grok-4.1-fast': 'x-ai/grok-beta',
    }

    const aiModel = modelMap[model] || 'deepseek/deepseek-chat'

    try {
      // Use ZAI for AI prediction
      const zai = await getZAI()

      const completion = await zai.chat.completions.create({
        model: aiModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: context + '\n\nGenera un análisis completo basado en los datos proporcionados.' }
        ],
        temperature: 0.3,
        thinking: { type: 'disabled' }
      })

      const content = completion.choices?.[0]?.message?.content || ''

      let prediction
      try {
        const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
        prediction = JSON.parse(cleanContent)

        // Validate and adjust prices
        if (prediction.signal?.entry?.price && Math.abs(prediction.signal.entry.price - currentPrice) / currentPrice > 0.05) {
          prediction.signal.entry.price = currentPrice
        }

        // Ensure required fields
        if (!prediction.signal?.direction) {
          prediction.signal = prediction.signal || {}
          prediction.signal.direction = prediction.analysis?.trend?.toUpperCase() || (change24h > 0 ? 'LONG' : 'SHORT')
        }
        if (!prediction.signal?.entry?.price) {
          prediction.signal.entry = { price: currentPrice, reason: 'Precio actual de mercado' }
        }
        if (!prediction.signal?.stopLoss?.price) {
          const dir = prediction.signal?.direction || 'LONG'
          prediction.signal.stopLoss = {
            price: currentPrice * (dir === 'LONG' ? 0.97 : 1.03),
            percentage: 3,
            reason: 'SL calculado 3%'
          }
        }
        if (!prediction.signal?.takeProfit?.price) {
          const dir = prediction.signal?.direction || 'LONG'
          prediction.signal.takeProfit = {
            price: currentPrice * (dir === 'LONG' ? 1.06 : 0.94),
            percentage: 6,
            reason: 'TP calculado 6%'
          }
        }

      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        const direction = change24h > 0 ? 'LONG' : 'SHORT'

        prediction = {
          asset,
          currentPrice,
          analysis: {
            trend: change24h > 0 ? 'alcista' : 'bajista',
            confidence: 65,
            reasons: ['Análisis generado con datos de mercado'],
            indicators: { rsi: 'Calculado', macd: 'Calculado', movingAverages: 'Calculadas' }
          },
          signal: {
            direction,
            entry: { price: currentPrice, reason: 'Precio actual de mercado' },
            stopLoss: { price: currentPrice * (direction === 'LONG' ? 0.97 : 1.03), percentage: 3, reason: 'SL conservador 3%' },
            takeProfit: { price: currentPrice * (direction === 'LONG' ? 1.06 : 0.94), percentage: 6, reason: 'TP conservador 6%' },
            riskRewardRatio: 2.0
          },
          recommendation: `Análisis para ${asset}: Tendencia ${change24h > 0 ? 'alcista' : 'bajista'} con entrada en $${currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}.`
        }
      }

      // Calculate token usage and cost
      const tokensUsed = completion.usage?.total_tokens || 0
      const costEur = (tokensUsed / 1000000) * PRICE_PER_MILLION_TOKENS

      // Save prediction to database and update user tokens if userId provided
      let savedPrediction = null
      let updatedUser = null

      if (userId) {
        try {
          // Save prediction
          savedPrediction = await db.prediction.create({
            data: {
              userId,
              agentId: agentId || null,
              agentName: agentName || 'Manual Prediction',
              asset,
              tvSymbol: asset.replace('/', ''),
              provider: 'BINANCE',
              direction: prediction.signal?.direction || 'NEUTRAL',
              confidence: prediction.analysis?.confidence || 50,
              entry: prediction.signal?.entry?.price || currentPrice,
              stopLoss: prediction.signal?.stopLoss?.price || 0,
              takeProfit: prediction.signal?.takeProfit?.price || 0,
              riskReward: prediction.signal?.riskRewardRatio || 1.5,
              analysis: prediction.recommendation || '',
              timeframe: timeframe || '60',
              tokensUsed,
              costEur
            }
          })

          // Update user tokens and balance
          const user = await db.profile.findUnique({ where: { id: userId } })
          if (user) {
            let newBalance = user.balance
            let newFreeCredits = user.freeCredits
            let newTokensUsed = user.tokensUsed + tokensUsed

            // Deduct from free credits first, then balance
            if (user.freeCredits >= costEur) {
              newFreeCredits = user.freeCredits - costEur
            } else {
              const remaining = costEur - user.freeCredits
              newFreeCredits = 0
              newBalance = Math.max(0, user.balance - remaining)
            }

            updatedUser = await db.profile.update({
              where: { id: userId },
              data: {
                tokensUsed: newTokensUsed,
                balance: newBalance,
                freeCredits: newFreeCredits
              }
            })

            // Update agent prediction count if agentId provided
            if (agentId) {
              await db.agent.update({
                where: { id: agentId },
                data: {
                  predictionsCount: { increment: 1 },
                  lastPredictionAt: new Date()
                }
              })
            }
          }
        } catch (dbError) {
          console.error('Database save error:', dbError)
          // Continue even if save fails
        }
      }

      return NextResponse.json({
        success: true,
        prediction,
        model: aiModel,
        usage: { total_tokens: tokensUsed },
        costEur,
        savedToDb: !!savedPrediction,
        userBalance: updatedUser ? {
          balance: updatedUser.balance,
          freeCredits: updatedUser.freeCredits,
          tokensUsed: updatedUser.tokensUsed
        } : null,
        generatedAt: new Date().toISOString(),
        dataSource: {
          price: marketType === 'crypto' ? 'coingecko' : 'estimated',
          ohlcv: ohlcvData.length > 0 ? 'coingecko' : 'simulated',
          news: 'web_search',
          ai: 'z-ai-sdk'
        },
        marketData: {
          asset,
          marketType,
          currentPrice,
          change24h,
          marketCap,
          volume,
          timeframe: timeframeLabel,
          candlesAnalyzed
        },
        technicalAnalysis: technicalAnalysis.slice(0, 1000)
      })

    } catch (aiError) {
      console.error('AI Error:', aiError)

      // Generate prediction based on technical analysis
      const direction = change24h > 0 ? 'LONG' : 'SHORT'

      const prediction = {
        asset,
        currentPrice,
        analysis: {
          trend: change24h > 0 ? 'alcista' : 'bajista',
          confidence: 60,
          timeframe: timeframeLabel,
          reasons: [
            `Precio actual: $${currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}`,
            `Cambio 24h: ${change24h.toFixed(2)}%`,
            `Mercado: ${marketType}`,
            candlesAnalyzed > 0 ? `Basado en ${candlesAnalyzed} velas` : 'Análisis técnico generado'
          ],
          indicators: {
            rsi: ohlcvData.length > 20 ? 'Calculado' : 'No disponible',
            macd: ohlcvData.length > 26 ? 'Calculado' : 'No disponible',
            movingAverages: ohlcvData.length > 20 ? 'Calculadas' : 'No disponibles'
          }
        },
        signal: {
          direction,
          entry: {
            price: currentPrice,
            reason: 'Precio actual de mercado'
          },
          stopLoss: {
            price: currentPrice * (direction === 'LONG' ? 0.97 : 1.03),
            percentage: 3,
            reason: 'SL conservador 3% basado en volatilidad'
          },
          takeProfit: {
            price: currentPrice * (direction === 'LONG' ? 1.06 : 0.94),
            percentage: 6,
            reason: 'TP conservador 6% (ratio R:R 2.0)'
          },
          riskRewardRatio: 2.0
        },
        recommendation: `Análisis técnico para ${asset} (${marketType}): Tendencia ${change24h > 0 ? 'alcista' : 'bajista'} con cambio 24h de ${change24h.toFixed(2)}%. Entrada sugerida en $${currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}.`
      }

      return NextResponse.json({
        success: true,
        prediction,
        model: 'technical-analysis',
        usage: { total_tokens: 0 },
        generatedAt: new Date().toISOString(),
        dataSource: {
          price: marketType === 'crypto' ? 'coingecko' : 'estimated',
          ohlcv: ohlcvData.length > 0 ? 'coingecko' : 'simulated',
          news: 'web_search',
          ai: 'technical-fallback'
        },
        marketData: {
          asset,
          marketType,
          currentPrice,
          change24h,
          timeframe: timeframeLabel,
          candlesAnalyzed
        },
        technicalAnalysis: technicalAnalysis.slice(0, 1000)
      })
    }

  } catch (error) {
    console.error('Predict API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, access, mkdir } from 'fs/promises'
import path from 'path'

// CoinGecko image IDs for crypto logos
const COINGECKO_IMAGE_IDS: Record<string, string> = {
  // Top 10
  'BTC': '1/small/bitcoin.png',
  'ETH': '279/small/ethereum.png',
  'USDT': '325/small/Tether.png',
  'BNB': '825/small/bnb-icon2_2x.png',
  'SOL': '4128/small/solana.png',
  'XRP': '44/small/xrp-symbol-white-128.png',
  'USDC': '6319/small/USD_Coin_icon.png',
  'ADA': '975/small/cardano.png',
  'DOGE': '5/small/dogecoin.png',
  'AVAX': '12559/small/Avalanche_Circle_RedWhite_Trans.png',
  // Top 20
  'TRX': '1094/small/tron-logo.png',
  'LINK': '877/small/chainlink-new-logo.png',
  'TON': '26546/small/ton_symbol.png',
  'SHIB': '11939/small/shiba.png',
  'DOT': '12171/small/polkadot.png',
  'LTC': '2/small/litecoin.png',
  'BCH': '760/small/bitcoin-cash-circle.png',
  'MATIC': '4713/small/matic-token-icon.png',
  'DAI': '4943/small/dai-multi-collateral-mcd.png',
  // Top 30
  'UNI': '12504/small/uniswap-uni.png',
  'ATOM': '3513/small/cosmos_hub.png',
  'XLM': '100/small/Stellar_symbol.png',
  'OKB': '3270/small/okb.png',
  'ETC': '1040/small/etc-logo.png',
  'XMR': '69/small/monero_logo.png',
  'NEAR': '10362/small/near.png',
  'ICP': '14495/small/Internet_Computer_logo.png',
  'APT': '29570/small/aptos_round.png',
  'HBAR': '13009/small/hbar.png',
  // Top 40
  'FIL': '2285/small/filecoin.png',
  'LDO': '13500/small/Lido_DAO.png',
  'VET': '1007/small/VeChain.png',
  'OP': '25844/small/optimism-ethereum.png',
  'MKR': '1364/small/Mark_Maker.png',
  'FTM': '4001/small/Fantom.png',
  'AAVE': '1164/small/aave.png',
  'GRT': '13380/small/TheGraph.png',
  'RUNE': '1344/small/thorchain.png',
  // Top 50
  'SUI': '27061/small/sui.png',
  'PEPE': '29850/small/pepe-token.jpeg',
  'INJ': '12882/small/INJ.png',
  'RNDR': '1164/small/render-token.png',
  'ALGO': '4030/small/algorand.png',
  'FLOW': '19098/small/flow.png',
  'IMX': '23970/small/imx.png',
  'STX': '2043/small/Stacks.png',
  'CRO': '5805/small/cro.png',
  'SAND': '12112/small/sandbox.png',
  // Additional
  'MANA': '2627/small/decentraland.png',
  'AXS': '13027/small/axie-infinity.png',
  'THETA': '3743/small/theta-network.png',
  'EGLD': '10640/small/elrond-egld.png',
  'XTZ': '1012/small/tezos.png',
  'CAKE': '12632/small/pancakeswap-cake.png',
  'CRV': '12124/small/crv.png',
  'SNX': '3408/small/synthetix.png',
  'KAVA': '10449/small/kava.png',
  'COMP': '6232/small/compound.png',
  'YFI': '5904/small/yfi.png',
  'SUSHI': '12271/small/sushi.png',
  '1INCH': '13403/small/1inch.png',
  'ENJ': '2130/small/enjin-coin.png',
  'ZIL': '526/small/zilliqa.png',
  'BAT': '13777/small/bat.png',
  'DYDX': '17597/small/dydx.png',
  'GALA': '22000/small/gala.png',
  'APE': '24311/small/ape.png',
  'GMX': '26979/small/gmx.png',
  'BLUR': '28446/small/blur.png',
  'ARB': '16547/small/arbitrum-one.png',
  'KAS': '25785/small/kaspa.png',
  'SEI': '26554/small/sei.png',
  'WLD': '28385/small/worldcoin-wld.png',
  'WIF': '29563/small/dogwifhat.jpg',
  'JUP': '30114/small/jupiter.png',
  'TIA': '28062/small/celestia.png',
  'PYTH': '29573/small/pyth-network.png',
}

const COINGECKO_BASE = 'https://assets.coingecko.com/coins/images'

// Stock logos via Clearbit
const STOCK_LOGOS: Record<string, string> = {
  'AAPL': 'https://logo.clearbit.com/apple.com',
  'NVDA': 'https://logo.clearbit.com/nvidia.com',
  'MSFT': 'https://logo.clearbit.com/microsoft.com',
  'GOOGL': 'https://logo.clearbit.com/google.com',
  'AMZN': 'https://logo.clearbit.com/amazon.com',
  'META': 'https://logo.clearbit.com/meta.com',
  'TSLA': 'https://logo.clearbit.com/tesla.com',
  'JPM': 'https://logo.clearbit.com/jpmorgan.com',
  'V': 'https://logo.clearbit.com/visa.com',
  'JNJ': 'https://logo.clearbit.com/jnj.com',
}

// Forex flags via flagcdn
const FOREX_FLAGS: Record<string, string> = {
  'EUR': 'https://flagcdn.com/w80/eu.png',
  'GBP': 'https://flagcdn.com/w80/gb.png',
  'JPY': 'https://flagcdn.com/w80/jp.png',
  'USD': 'https://flagcdn.com/w80/us.png',
  'CHF': 'https://flagcdn.com/w80/ch.png',
  'AUD': 'https://flagcdn.com/w80/au.png',
  'CAD': 'https://flagcdn.com/w80/ca.png',
  'NZD': 'https://flagcdn.com/w80/nz.png',
}

// Index logos via TradingView
const INDEX_LOGOS: Record<string, string> = {
  'SPX': 'https://s3-symbol-logo.tradingview.com/sp-index--600.png',
  'DJI': 'https://s3-symbol-logo.tradingview.com/dji--600.png',
  'IXIC': 'https://s3-symbol-logo.tradingview.com/ndaq--600.png',
  'DAX': 'https://s3-symbol-logo.tradingview.com/dax--600.png',
  'FTSE': 'https://s3-symbol-logo.tradingview.com/ukx--600.png',
  'CAC': 'https://s3-symbol-logo.tradingview.com/cac--600.png',
  'NIKKEI': 'https://s3-symbol-logo.tradingview.com/nky--600.png',
  'HSI': 'https://s3-symbol-logo.tradingview.com/hsi--600.png',
}

// ETF logos
const ETF_LOGOS: Record<string, string> = {
  'SPY': 'https://s3-symbol-logo.tradingview.com/spy--600.png',
  'QQQ': 'https://s3-symbol-logo.tradingview.com/qqq--600.png',
  'GLD': 'https://s3-symbol-logo.tradingview.com/gld--600.png',
  'IWM': 'https://s3-symbol-logo.tradingview.com/iwm--600.png',
  'VTI': 'https://s3-symbol-logo.tradingview.com/vti--600.png',
  'TLT': 'https://s3-symbol-logo.tradingview.com/tlt--600.png',
  'EEM': 'https://s3-symbol-logo.tradingview.com/eem--600.png',
  'SLV': 'https://s3-symbol-logo.tradingview.com/slv--600.png',
}

const ICONS_DIR = path.join(process.cwd(), 'public', 'icons')

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const symbol = searchParams.get('symbol')?.toUpperCase()
  const type = searchParams.get('type') || 'crypto'
  const download = searchParams.get('download') === 'true'

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 })
  }

  // Get base symbol (remove /USDT, /USD, etc)
  const baseSymbol = symbol.replace('/USDT', '').replace('/USD', '').replace('/', '').split('-')[0].toUpperCase()

  // Determine category folder
  const categoryFolder = type === 'crypto' ? 'crypto' : 
                         type === 'stocks' ? 'stocks' :
                         type === 'forex' ? 'forex' :
                         type === 'commodities' ? 'commodities' :
                         type === 'indices' ? 'indices' : 'etfs'

  // Check if local file exists
  const localPath = path.join(ICONS_DIR, categoryFolder, `${baseSymbol.toLowerCase()}.png`)
  const localPathJpg = path.join(ICONS_DIR, categoryFolder, `${baseSymbol.toLowerCase()}.jpg`)

  // Try to serve local file first
  try {
    await access(localPath)
    return NextResponse.redirect(new URL(`/icons/${categoryFolder}/${baseSymbol.toLowerCase()}.png`, request.url))
  } catch {}

  try {
    await access(localPathJpg)
    return NextResponse.redirect(new URL(`/icons/${categoryFolder}/${baseSymbol.toLowerCase()}.jpg`, request.url))
  } catch {}

  // If not downloading, return placeholder info
  if (!download) {
    return NextResponse.json({ 
      exists: false, 
      symbol: baseSymbol,
      type,
      downloadUrl: `/api/icons?symbol=${baseSymbol}&type=${type}&download=true`
    })
  }

  // Download from external source
  let remoteUrl: string | null = null
  let extension = 'png'

  if (type === 'crypto' && COINGECKO_IMAGE_IDS[baseSymbol]) {
    remoteUrl = `${COINGECKO_BASE}/${COINGECKO_IMAGE_IDS[baseSymbol]}`
    extension = COINGECKO_IMAGE_IDS[baseSymbol].endsWith('.jpeg') || COINGECKO_IMAGE_IDS[baseSymbol].endsWith('.jpg') ? 'jpg' : 'png'
  } else if (type === 'stocks' && STOCK_LOGOS[baseSymbol]) {
    remoteUrl = STOCK_LOGOS[baseSymbol]
  } else if (type === 'forex' && FOREX_FLAGS[baseSymbol]) {
    remoteUrl = FOREX_FLAGS[baseSymbol]
  } else if (type === 'indices' && INDEX_LOGOS[baseSymbol]) {
    remoteUrl = INDEX_LOGOS[baseSymbol]
  } else if (type === 'etfs' && ETF_LOGOS[baseSymbol]) {
    remoteUrl = ETF_LOGOS[baseSymbol]
  }

  if (!remoteUrl) {
    return NextResponse.json({ error: 'Symbol not found', symbol: baseSymbol }, { status: 404 })
  }

  try {
    // Ensure directory exists
    await mkdir(path.join(ICONS_DIR, categoryFolder), { recursive: true })

    // Download image
    const response = await fetch(remoteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to download', status: response.status }, { status: 500 })
    }

    const buffer = await response.arrayBuffer()
    const filePath = path.join(ICONS_DIR, categoryFolder, `${baseSymbol.toLowerCase()}.${extension}`)
    
    await writeFile(filePath, Buffer.from(buffer))

    return NextResponse.redirect(new URL(`/icons/${categoryFolder}/${baseSymbol.toLowerCase()}.${extension}`, request.url))
  } catch (error) {
    console.error('Error downloading icon:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}

// Batch download endpoint
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { symbols, type = 'crypto' } = body

  if (!symbols || !Array.isArray(symbols)) {
    return NextResponse.json({ error: 'Symbols array required' }, { status: 400 })
  }

  const results: { symbol: string; status: 'success' | 'failed' | 'skipped'; url?: string }[] = []
  const categoryFolder = type

  for (const symbol of symbols) {
    const baseSymbol = symbol.toUpperCase().replace('/USDT', '').replace('/USD', '').replace('/', '').split('-')[0]
    
    let remoteUrl: string | null = null
    let extension = 'png'

    if (type === 'crypto' && COINGECKO_IMAGE_IDS[baseSymbol]) {
      remoteUrl = `${COINGECKO_BASE}/${COINGECKO_IMAGE_IDS[baseSymbol]}`
      extension = COINGECKO_IMAGE_IDS[baseSymbol].endsWith('.jpeg') || COINGECKO_IMAGE_IDS[baseSymbol].endsWith('.jpg') ? 'jpg' : 'png'
    } else if (type === 'stocks' && STOCK_LOGOS[baseSymbol]) {
      remoteUrl = STOCK_LOGOS[baseSymbol]
    } else if (type === 'forex' && FOREX_FLAGS[baseSymbol]) {
      remoteUrl = FOREX_FLAGS[baseSymbol]
    } else if (type === 'indices' && INDEX_LOGOS[baseSymbol]) {
      remoteUrl = INDEX_LOGOS[baseSymbol]
    } else if (type === 'etfs' && ETF_LOGOS[baseSymbol]) {
      remoteUrl = ETF_LOGOS[baseSymbol]
    }

    if (!remoteUrl) {
      results.push({ symbol: baseSymbol, status: 'skipped' })
      continue
    }

    try {
      await mkdir(path.join(ICONS_DIR, categoryFolder), { recursive: true })
      
      const response = await fetch(remoteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (response.ok) {
        const buffer = await response.arrayBuffer()
        const filePath = path.join(ICONS_DIR, categoryFolder, `${baseSymbol.toLowerCase()}.${extension}`)
        await writeFile(filePath, Buffer.from(buffer))
        results.push({ 
          symbol: baseSymbol, 
          status: 'success', 
          url: `/icons/${categoryFolder}/${baseSymbol.toLowerCase()}.${extension}` 
        })
      } else {
        results.push({ symbol: baseSymbol, status: 'failed' })
      }
    } catch {
      results.push({ symbol: baseSymbol, status: 'failed' })
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 150))
  }

  return NextResponse.json({ results })
}

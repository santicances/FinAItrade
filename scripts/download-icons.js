// Script rápido para descargar logos
const https = require('https')
const fs = require('fs')
const path = require('path')

const COINGECKO_IMAGE_IDS = {
  'BTC': '1/small/bitcoin.png', 'ETH': '279/small/ethereum.png',
  'USDT': '325/small/Tether.png', 'BNB': '825/small/bnb-icon2_2x.png',
  'SOL': '4128/small/solana.png', 'XRP': '44/small/xrp-symbol-white-128.png',
  'USDC': '6319/small/USD_Coin_icon.png', 'ADA': '975/small/cardano.png',
  'DOGE': '5/small/dogecoin.png', 'AVAX': '12559/small/Avalanche_Circle_RedWhite_Trans.png',
  'TRX': '1094/small/tron-logo.png', 'LINK': '877/small/chainlink-new-logo.png',
  'TON': '26546/small/ton_symbol.png', 'SHIB': '11939/small/shiba.png',
  'DOT': '12171/small/polkadot.png', 'LTC': '2/small/litecoin.png',
  'BCH': '760/small/bitcoin-cash-circle.png', 'MATIC': '4713/small/matic-token-icon.png',
  'DAI': '4943/small/dai-multi-collateral-mcd.png', 'UNI': '12504/small/uniswap-uni.png',
  'ATOM': '3513/small/cosmos_hub.png', 'XLM': '100/small/Stellar_symbol.png',
  'ETC': '1040/small/etc-logo.png', 'XMR': '69/small/monero_logo.png',
  'NEAR': '10362/small/near.png', 'ICP': '14495/small/Internet_Computer_logo.png',
  'APT': '29570/small/aptos_round.png', 'HBAR': '13009/small/hbar.png',
  'FIL': '2285/small/filecoin.png', 'LDO': '13500/small/Lido_DAO.png',
  'VET': '1007/small/VeChain.png', 'OP': '25844/small/optimism-ethereum.png',
  'MKR': '1364/small/Mark_Maker.png', 'FTM': '4001/small/Fantom.png',
  'AAVE': '1164/small/aave.png', 'GRT': '13380/small/TheGraph.png',
  'RUNE': '1344/small/thorchain.png', 'SUI': '27061/small/sui.png',
  'PEPE': '29850/small/pepe-token.jpeg', 'INJ': '12882/small/INJ.png',
  'ALGO': '4030/small/algorand.png', 'FLOW': '19098/small/flow.png',
  'IMX': '23970/small/imx.png', 'STX': '2043/small/Stacks.png',
  'SAND': '12112/small/sandbox.png', 'MANA': '2627/small/decentraland.png',
  'AXS': '13027/small/axie-infinity.png', 'THETA': '3743/small/theta-network.png',
  'EGLD': '10640/small/elrond-egld.png', 'XTZ': '1012/small/tezos.png',
  'CAKE': '12632/small/pancakeswap-cake.png', 'CRV': '12124/small/crv.png',
  'SNX': '3408/small/synthetix.png', 'KAVA': '10449/small/kava.png',
  'COMP': '6232/small/compound.png', 'YFI': '5904/small/yfi.png',
  'SUSHI': '12271/small/sushi.png', '1INCH': '13403/small/1inch.png',
  'ENJ': '2130/small/enjin-coin.png', 'ZIL': '526/small/zilliqa.png',
  'BAT': '13777/small/bat.png', 'DYDX': '17597/small/dydx.png',
  'GALA': '22000/small/gala.png', 'APE': '24311/small/ape.png',
  'GMX': '26979/small/gmx.png', 'BLUR': '28446/small/blur.png',
  'ARB': '16547/small/arbitrum-one.png', 'KAS': '25785/small/kaspa.png',
  'SEI': '26554/small/sei.png', 'WLD': '28385/small/worldcoin-wld.png',
  'WIF': '29563/small/dogwifhat.jpg', 'JUP': '30114/small/jupiter.png',
  'TIA': '28062/small/celestia.png', 'PYTH': '29573/small/pyth-network.png',
}

const FOREX_FLAGS = { 'EUR': 'eu', 'GBP': 'gb', 'JPY': 'jp', 'USD': 'us', 'CHF': 'ch', 'AUD': 'au', 'CAD': 'ca', 'NZD': 'nz' }
const COINGECKO_BASE = 'https://assets.coingecko.com/coins/images'
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons')

function download(url, outputPath) {
  return new Promise((resolve) => {
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    
    const file = fs.createWriteStream(outputPath)
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close(); fs.unlinkSync(outputPath)
        download(res.headers.location, outputPath).then(resolve)
        return
      }
      if (res.statusCode !== 200) { file.close(); fs.unlinkSync(outputPath); resolve(false); return }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve(true) })
    }).on('error', () => { file.close(); resolve(false) })
  })
}

async function main() {
  console.log('🚀 Downloading icons...')
  let s = 0, f = 0
  
  // Crypto
  for (const [sym, imgId] of Object.entries(COINGECKO_IMAGE_IDS)) {
    const ext = imgId.endsWith('.jpg') || imgId.endsWith('.jpeg') ? 'jpg' : 'png'
    const out = path.join(OUTPUT_DIR, 'crypto', `${sym.toLowerCase()}.${ext}`)
    if (fs.existsSync(out)) { console.log(`  ⏭️ ${sym} (exists)`); continue }
    if (await download(`${COINGECKO_BASE}/${imgId}`, out)) { console.log(`  ✅ ${sym}`); s++ }
    else { console.log(`  ❌ ${sym}`); f++ }
  }
  
  // Forex
  for (const [cur, cc] of Object.entries(FOREX_FLAGS)) {
    const out = path.join(OUTPUT_DIR, 'forex', `${cur.toLowerCase()}.png`)
    if (fs.existsSync(out)) { console.log(`  ⏭️ ${cur} (exists)`); continue }
    if (await download(`https://flagcdn.com/w80/${cc}.png`, out)) { console.log(`  ✅ ${cur}`); s++ }
    else { console.log(`  ❌ ${cur}`); f++ }
  }
  
  // Stocks as SVG
  const stocks = { 'AAPL': '#555', 'NVDA': '#76B900', 'MSFT': '#00A4EF', 'GOOGL': '#4285F4', 'AMZN': '#F90', 'META': '#0668E1', 'TSLA': '#C00' }
  for (const [sym, color] of Object.entries(stocks)) {
    const out = path.join(OUTPUT_DIR, 'stocks', `${sym.toLowerCase()}.svg`)
    if (fs.existsSync(out)) continue
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="${color}"/><text x="16" y="20" font-family="Arial" font-size="10" font-weight="bold" fill="white" text-anchor="middle">${sym.slice(0,2)}</text></svg>`
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, svg); console.log(`  ✅ ${sym}`); s++
  }
  
  console.log(`\n✨ Done! ✅${s} ❌${f}`)
}
main()

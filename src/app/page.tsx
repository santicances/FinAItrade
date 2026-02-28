'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Bot,
  PieChart,
  Database,
  TrendingUp,
  Menu,
  X,
  Target,
  BarChart3,
  Coins,
  DollarSign,
  Activity,
  Shield,
  Zap,
  User,
  Building2,
  ArrowRight,
  Sparkles,
  LineChart,
  CandlestickChart,
  Wallet,
  Send,
  MessageSquare,
  Plus,
  Settings,
  Cpu,
  Bitcoin,
  Loader2,
  Clock,
  Trash2,
  LogOut,
  CreditCard,
  Timer,
  Coins as TokenIcon,
  Crown,
  Gift,
  AlertCircle,
  Download,
  Home as HomeIcon,
  Bell,
  Globe,
  ExternalLink,
  Edit2,
  Save,
  RefreshCw,
  Newspaper,
  Check,
  Play,
  Pause
} from 'lucide-react'

// Tipos
type UserMode = 'portfolio_manager' | 'retail' | null
type Section = 'agents' | 'portfolios' | 'datasources' | 'predictions'

// PWA Install Hook
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(() => {
    // Check if already installed on initial render
    if (typeof window !== 'undefined') {
      return window.matchMedia('(display-mode: standalone)').matches || 
             (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    }
    return false
  })

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false
    
    const promptEvent = deferredPrompt as BeforeInstallPromptEvent
    promptEvent.prompt()
    
    const result = await promptEvent.userChoice
    if (result.outcome === 'accepted') {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      return true
    }
    return false
  }, [deferredPrompt])

  return { isInstallable, isInstalled, installApp }
}

// BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// PWA Install Button Component
function PWAInstallButton() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall()
  const [installing, setInstalling] = useState(false)

  if (isInstalled) return null

  const handleInstall = async () => {
    setInstalling(true)
    await installApp()
    setInstalling(false)
  }

  if (!isInstallable) return null

  return (
    <Button
      onClick={handleInstall}
      disabled={installing}
      className="fixed bottom-20 left-4 right-4 lg:hidden z-50 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg animate-pulse"
    >
      {installing ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      Instalar App
    </Button>
  )
}
type AgentType = 'spot' | 'margin' | 'futures'
type OperationType = 'market' | 'sellStop' | 'buyStop'
type AgentStatus = 'active' | 'paused' | 'inactive'
type Timeframe = '1' | '5' | '15' | '60' | '240' | 'D' | 'W'

// Modelos de IA disponibles (sin Gemini)
const aiModels = [
  { id: 'minimax/minimax-m2.5', name: 'MiniMax M2.5', provider: 'MiniMax', badge: '🥇', description: 'Mejor rendimiento general', price: '0.15/1M tokens' },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI', badge: '🥈', description: 'Respuestas rápidas', price: '0.20/1M tokens' },
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek', badge: '⭐', description: 'Especializado en análisis', price: '0.08/1M tokens' },
]

// Timeframes disponibles
const timeframes = [
  { id: '1', label: '1 minuto', short: '1m' },
  { id: '5', label: '5 minutos', short: '5m' },
  { id: '15', label: '15 minutos', short: '15m' },
  { id: '60', label: '1 hora', short: '1h' },
  { id: '240', label: '4 horas', short: '4h' },
  { id: 'D', label: 'Diario', short: '1D' },
  { id: 'W', label: 'Semanal', short: '1W' },
]

// Logos usando CoinGecko CDN (más confiable)
const COINGECKO_IMAGE_BASE = 'https://assets.coingecko.com/coins/images'

const COINGECKO_IMAGE_IDS: Record<string, string> = {
  'BTC': '1/small/bitcoin.png',
  'ETH': '279/small/ethereum.png',
  'BNB': '825/small/bnb-icon2_2x.png',
  'SOL': '4128/small/solana.png',
  'XRP': '44/small/xrp-symbol-white-128.png',
  'ADA': '975/small/cardano.png',
  'AVAX': '12559/small/Avalanche_Circle_RedWhite_Trans.png',
  'DOT': '12171/small/polkadot.png',
  'MATIC': '4713/small/matic-token-icon.png',
  'LINK': '877/small/chainlink-new-logo.png',
  'UNI': '12504/small/uniswap-uni.png',
  'ATOM': '3513/small/cosmos_hub.png',
  'LTC': '2/small/litecoin.png',
  'DOGE': '5/small/dogecoin.png',
  'SHIB': '11939/small/shiba.png',
  'SUI': '27061/small/sui.png',
  'PEPE': '29850/small/pepe-token.jpeg',
  'APT': '29570/small/aptos_round.png',
  'ARB': '16547/small/arbitrum-one.png',
  'OP': '25844/small/optimism-ethereum.png',
  'NEAR': '10362/small/near.png',
  'FTM': '4001/small/Fantom.png',
  'INJ': '12882/small/INJ.png',
}

// Colores para fallback de logos
const ASSET_COLORS: Record<string, string> = {
  'BTC': '#F7931A', 'ETH': '#627EEA', 'BNB': '#F3BA2F', 'SOL': '#00FFA3',
  'XRP': '#23292F', 'ADA': '#0033AD', 'AVAX': '#E84142', 'DOT': '#E6007A',
  'MATIC': '#8247E5', 'LINK': '#2A5ADA', 'UNI': '#FF007A', 'ATOM': '#2E3148',
  'LTC': '#BFBBBB', 'DOGE': '#C3A634', 'SHIB': '#FFA409', 'SUI': '#6FBCF0',
  'PEPE': '#00A86B', 'AAPL': '#A2AAAD', 'NVDA': '#76B900', 'MSFT': '#00A4EF',
  'GOOGL': '#4285F4', 'AMZN': '#FF9900', 'META': '#0668E1', 'TSLA': '#CC0000',
  'EUR': '#003399', 'GBP': '#CF142B', 'JPY': '#BC002D', 'GOLD': '#FFD700',
  'SILVER': '#C0C0C0', 'XAU': '#FFD700', 'XAG': '#C0C0C0',
}

// Función para obtener URL del logo
function getAssetLogoUrl(symbol: string): string | null {
  const base = symbol.replace('/USDT', '').replace('/USD', '').replace('/', '').split('-')[0].toUpperCase()
  const imageId = COINGECKO_IMAGE_IDS[base]
  return imageId ? `${COINGECKO_IMAGE_BASE}/${imageId}` : null
}

// Función para obtener color del activo
function getAssetColor(symbol: string): string {
  const base = symbol.replace('/USDT', '').replace('/USD', '').replace('/', '').split('-')[0].toUpperCase()
  return ASSET_COLORS[base] || '#10B981'
}

// Componente de logo con fallback
function AssetLogo({ symbol, size = 32, className = '' }: { symbol: string; size?: number; className?: string }) {
  const [imgError, setImgError] = useState(false)
  const logoUrl = getAssetLogoUrl(symbol)
  const color = getAssetColor(symbol)
  const baseSymbol = symbol.replace('/USDT', '').replace('/USD', '').replace('/', '').split('-')[0].toUpperCase()
  
  if (!logoUrl || imgError) {
    return (
      <div 
        className={`rounded-full flex items-center justify-center text-white font-bold ${className}`}
        style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
      >
        {baseSymbol.slice(0, 2)}
      </div>
    )
  }
  
  return (
    <img 
      src={logoUrl} 
      alt={symbol}
      className={`rounded-full bg-slate-800 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  )
}

// Lista completa de activos por categoría con proveedor de gráficos
const availableAssets = {
  crypto: [
    { id: 'btc-usdt', symbol: 'BTC/USDT', name: 'Bitcoin', tvSymbol: 'BTCUSDT', provider: 'BINANCE' },
    { id: 'eth-usdt', symbol: 'ETH/USDT', name: 'Ethereum', tvSymbol: 'ETHUSDT', provider: 'BINANCE' },
    { id: 'bnb-usdt', symbol: 'BNB/USDT', name: 'Binance Coin', tvSymbol: 'BNBUSDT', provider: 'BINANCE' },
    { id: 'sol-usdt', symbol: 'SOL/USDT', name: 'Solana', tvSymbol: 'SOLUSDT', provider: 'BINANCE' },
    { id: 'xrp-usdt', symbol: 'XRP/USDT', name: 'XRP', tvSymbol: 'XRPUSDT', provider: 'BINANCE' },
    { id: 'ada-usdt', symbol: 'ADA/USDT', name: 'Cardano', tvSymbol: 'ADAUSDT', provider: 'BINANCE' },
    { id: 'avax-usdt', symbol: 'AVAX/USDT', name: 'Avalanche', tvSymbol: 'AVAXUSDT', provider: 'BINANCE' },
    { id: 'doge-usdt', symbol: 'DOGE/USDT', name: 'Dogecoin', tvSymbol: 'DOGEUSDT', provider: 'BINANCE' },
    { id: 'link-usdt', symbol: 'LINK/USDT', name: 'Chainlink', tvSymbol: 'LINKUSDT', provider: 'BINANCE' },
    { id: 'sui-usdt', symbol: 'SUI/USDT', name: 'Sui', tvSymbol: 'SUIUSDT', provider: 'BINANCE' },
    { id: 'pepe-usdt', symbol: 'PEPE/USDT', name: 'Pepe', tvSymbol: 'PEPEUSDT', provider: 'BINANCE' },
  ],
  stocks: [
    { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', tvSymbol: 'AAPL', provider: 'NASDAQ' },
    { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA Corporation', tvSymbol: 'NVDA', provider: 'NASDAQ' },
    { id: 'msft', symbol: 'MSFT', name: 'Microsoft Corporation', tvSymbol: 'MSFT', provider: 'NASDAQ' },
    { id: 'googl', symbol: 'GOOGL', name: 'Alphabet Inc.', tvSymbol: 'GOOGL', provider: 'NASDAQ' },
    { id: 'amzn', symbol: 'AMZN', name: 'Amazon.com Inc.', tvSymbol: 'AMZN', provider: 'NASDAQ' },
    { id: 'meta', symbol: 'META', name: 'Meta Platforms Inc.', tvSymbol: 'META', provider: 'NASDAQ' },
    { id: 'tsla', symbol: 'TSLA', name: 'Tesla Inc.', tvSymbol: 'TSLA', provider: 'NASDAQ' },
  ],
  forex: [
    { id: 'eur-usd', symbol: 'EUR/USD', name: 'Euro / Dólar', tvSymbol: 'EURUSD', provider: 'FX_IDC' },
    { id: 'gbp-usd', symbol: 'GBP/USD', name: 'Libra / Dólar', tvSymbol: 'GBPUSD', provider: 'FX_IDC' },
    { id: 'usd-jpy', symbol: 'USD/JPY', name: 'Dólar / Yen', tvSymbol: 'USDJPY', provider: 'FX_IDC' },
    { id: 'aud-usd', symbol: 'AUD/USD', name: 'AUD / USD', tvSymbol: 'AUDUSD', provider: 'FX_IDC' },
  ],
  commodities: [
    { id: 'xau-usd', symbol: 'XAU/USD', name: 'Oro', tvSymbol: 'GOLD', provider: 'TVC' },
    { id: 'xag-usd', symbol: 'XAG/USD', name: 'Plata', tvSymbol: 'SILVER', provider: 'TVC' },
    { id: 'cl', symbol: 'CL', name: 'Petróleo WTI', tvSymbol: 'CL', provider: 'TVC' },
  ],
  indices: [
    { id: 'spx', symbol: 'SPX', name: 'S&P 500', tvSymbol: 'SPX', provider: 'TVC' },
    { id: 'nasdaq', symbol: 'NDX', name: 'Nasdaq 100', tvSymbol: 'NDX', provider: 'TVC' },
    { id: 'dax', symbol: 'DAX', name: 'DAX 30', tvSymbol: 'DAX', provider: 'TVC' },
  ],
  etfs: [
    { id: 'spy', symbol: 'SPY', name: 'SPDR S&P 500', tvSymbol: 'SPY', provider: 'AMEX' },
    { id: 'qqq', symbol: 'QQQ', name: 'Invesco QQQ', tvSymbol: 'QQQ', provider: 'NASDAQ' },
    { id: 'gld', symbol: 'GLD', name: 'SPDR Gold', tvSymbol: 'GLD', provider: 'AMEX' },
  ],
}

// Datos de productos de inversión
const investmentProducts = [
  { id: 'crypto', label: 'Criptomonedas', icon: Coins, description: 'Activos digitales' },
  { id: 'stocks', label: 'Acciones', icon: TrendingUp, description: 'Mercado de valores' },
  { id: 'forex', label: 'Forex', icon: DollarSign, description: 'Mercado de divisas' },
  { id: 'commodities', label: 'Commodities', icon: BarChart3, description: 'Materias primas' },
  { id: 'indices', label: 'Índices', icon: LineChart, description: 'Índices bursátiles' },
  { id: 'etfs', label: 'ETFs', icon: PieChart, description: 'Fondos cotizados' },
]

// Fuentes de datos de noticias (configurables por el usuario)
interface NewsSource {
  id: string
  name: string
  url: string
  defaultUrl: string
  icon: string
  category: 'news' | 'sentiment' | 'indicators'
  enabled: boolean
}

const defaultNewsSources: NewsSource[] = [
  { id: 'coingecko-news', name: 'CoinGecko News', url: 'https://www.coingecko.com/es/news', defaultUrl: 'https://www.coingecko.com/es/news', icon: '🦎', category: 'news', enabled: true },
  { id: 'coindesk', name: 'CoinDesk Markets', url: 'https://www.coindesk.com/markets', defaultUrl: 'https://www.coindesk.com/markets', icon: '📰', category: 'news', enabled: true },
  { id: 'cmc-sentiment', name: 'CMC Sentiment', url: 'https://coinmarketcap.com/es/sentiment/', defaultUrl: 'https://coinmarketcap.com/es/sentiment/', icon: '📊', category: 'sentiment', enabled: true },
  { id: 'cmc-indicators', name: 'CMC Market Cycle', url: 'https://coinmarketcap.com/es/charts/crypto-market-cycle-indicators/', defaultUrl: 'https://coinmarketcap.com/es/charts/crypto-market-cycle-indicators/', icon: '📈', category: 'indicators', enabled: true },
  { id: 'criptonoticias', name: 'CriptoNoticias', url: 'https://www.criptonoticias.com/', defaultUrl: 'https://www.criptonoticias.com/', icon: '🚀', category: 'news', enabled: true },
]

// Fuentes de datos técnicas (APIs)
const technicalDataSources = [
  { id: 'openrouter', name: 'OpenRouter AI', icon: Cpu, status: 'connected' },
  { id: 'tradingview', name: 'TradingView', icon: LineChart, status: 'connected' },
  { id: 'coingecko-api', name: 'CoinGecko API', icon: Coins, status: 'connected' },
  { id: 'yahoo', name: 'Yahoo Finance', icon: BarChart3, status: 'connected' },
]

// Interfaz para Agente
interface Agent {
  id: string
  name: string
  type: AgentType
  operationType: OperationType
  status: AgentStatus
  model: string
  modelId: string
  asset: string
  assetId: string
  assetType: string
  prompt: string
  tvSymbol: string
  provider: string
  timeframe: Timeframe
  candleCount: number
  sources: string[] // IDs de fuentes seleccionadas
}

// Interfaz para Predicción
interface Prediction {
  id: string
  agentId: string
  agentName: string
  asset: string
  tvSymbol: string
  provider: string
  direction: string
  confidence: number
  entry: number
  stopLoss: number
  takeProfit: number
  riskReward: number
  analysis: string
  createdAt: string
  timeframe: Timeframe
}

// Interfaz para Usuario
interface UserInfo {
  id: string
  name: string
  email: string
  credits: number
  freeCredits: number
  tokensUsed: number
  balance: number
  mode: 'portfolio_manager' | 'retail'
  preferredProducts: string[]
  riskTolerance: string
}

// Componente de formulario de preferencias
function PreferencesForm({ onComplete }: { onComplete: (products: string[], risk: string) => void }) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium')

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSubmit = () => {
    onComplete(selectedProducts, riskTolerance)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-900/80 border-slate-800 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Target className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Personaliza tu experiencia</CardTitle>
          <CardDescription className="text-slate-400">
            Selecciona los mercados en los que deseas operar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {investmentProducts.map((product) => {
              const Icon = product.icon
              const isSelected = selectedProducts.includes(product.id)
              return (
                <button
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <p className="font-medium text-sm">{product.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{product.description}</p>
                </button>
              )
            })}
          </div>

          <div className="space-y-3">
            <Label className="text-slate-300 text-sm">Tolerancia al riesgo</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'low', label: 'Conservador', icon: Shield },
                { value: 'medium', label: 'Moderado', icon: BarChart3 },
                { value: 'high', label: 'Agresivo', icon: Zap },
              ].map((option) => {
                const Icon = option.icon
                const isSelected = riskTolerance === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setRiskTolerance(option.value as 'low' | 'medium' | 'high')}
                    className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/50 text-white'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-400' : ''}`} />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator className="bg-slate-800" />

          <Button
            onClick={handleSubmit}
            disabled={selectedProducts.length === 0}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crear {selectedProducts.length} agentes de trading
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente de Landing Page
function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Potenciado por IA avanzada</span>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Trading inteligente con
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"> Inteligencia Artificial</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Crea agentes de trading personalizados que analizan mercados en tiempo real y generan predicciones con puntos de entrada, stop loss y take profit.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={onGetStarted}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg px-8 py-6"
            >
              Comenzar ahora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {[
              { icon: Bot, title: 'Agentes IA', desc: 'Crea bots personalizados para cada activo' },
              { icon: Target, title: 'Predicciones', desc: 'Entry, SL y TP calculados por IA' },
              { icon: LineChart, title: 'Gráficos', desc: 'TradingView integrado en tiempo real' },
              { icon: Cpu, title: 'Modelos TOP', desc: 'MiniMax, Grok, DeepSeek' },
              { icon: Zap, title: 'Tiempo real', desc: 'Análisis de velas en vivo' },
              { icon: Shield, title: 'Seguro', desc: 'Sin custodia de fondos' },
            ].map((f, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-left">
                <f.icon className="w-8 h-8 text-emerald-400 mb-3" />
                <h3 className="text-white font-medium mb-1">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="p-4 border-t border-slate-800">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <CandlestickChart className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-white">finAiPro</span>
          </div>
          <p>© 2024 finAiPro. Trading con IA.</p>
        </div>
      </footer>
    </div>
  )
}

// Componente de Login
function LoginForm({ onLogin, onSwitchToRegister }: { 
  onLogin: (email: string, password: string) => Promise<void>
  onSwitchToRegister: () => void 
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onLogin(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <CandlestickChart className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Iniciar Sesión</CardTitle>
          <CardDescription className="text-slate-400">Accede a tu cuenta finAiPro</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-400">
            ¿No tienes cuenta?{' '}
            <button onClick={onSwitchToRegister} className="text-emerald-400 hover:underline">
              Registrarse
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente de Registro
function RegisterForm({ onRegister, onSwitchToLogin }: { 
  onRegister: (email: string, password: string, name: string) => Promise<void>
  onSwitchToLogin: () => void 
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      await onRegister(email, password, name)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <CandlestickChart className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Crear Cuenta</CardTitle>
          <CardDescription className="text-slate-400">Únete a finAiPro y empieza a tradear con IA</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-slate-300">Nombre (opcional)</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Confirmar contraseña</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-11"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <button onClick={onSwitchToLogin} className="text-emerald-400 hover:underline">
              Iniciar sesión
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente de selección de modo
function ModeSelection({ onSelect }: { onSelect: (mode: UserMode) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <CandlestickChart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">finAiPro</h1>
          <p className="text-slate-400">Inteligencia artificial para trading profesional</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className="bg-slate-900/80 border-slate-800 backdrop-blur-xl cursor-pointer hover:border-emerald-500/50 transition-all duration-300 group"
            onClick={() => onSelect('portfolio_manager')}
          >
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Building2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-white">Gestor de Carteras</h3>
                    <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">PRO</Badge>
                  </div>
                  <p className="text-slate-400 text-sm">Gestiona múltiples carteras de clientes.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-slate-900/80 border-slate-800 backdrop-blur-xl cursor-pointer hover:border-emerald-500/50 transition-all duration-300 group"
            onClick={() => onSelect('retail')}
          >
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-blue-500/30">
                  <User className="w-7 h-7 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Retail</h3>
                  <p className="text-slate-400 text-sm">Trading personal con agentes de IA.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Modal para crear/configurar agente
function CreateAgentModal({ onAddAgent, editAgent, trigger, newsSources }: { 
  onAddAgent: (agent: Agent) => void
  editAgent?: Agent | null
  trigger?: React.ReactNode
  newsSources?: NewsSource[]
}) {
  const [name, setName] = useState(editAgent?.name || '')
  const [type, setType] = useState<AgentType>(editAgent?.type || 'spot')
  const [operationType, setOperationType] = useState<OperationType>(editAgent?.operationType || 'market')
  const [model, setModel] = useState(editAgent?.modelId || '')
  const [assetCategory, setAssetCategory] = useState<string>(editAgent?.assetType || '')
  const [asset, setAsset] = useState(editAgent?.assetId || '')
  const [prompt, setPrompt] = useState(editAgent?.prompt || '')
  const [timeframe, setTimeframe] = useState<Timeframe>(editAgent?.timeframe || '60')
  const [candleCount, setCandleCount] = useState(editAgent?.candleCount || 50)
  const [selectedSources, setSelectedSources] = useState<string[]>(editAgent?.sources || newsSources?.filter(s => s.enabled).map(s => s.id) || [])
  const [open, setOpen] = useState(false)

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const handleCreate = () => {
    if (!model || !asset) return

    const selectedAsset = Object.values(availableAssets).flat().find(a => a.id === asset)
    const selectedModel = aiModels.find(m => m.id === model)
    
    // Use asset symbol as default name if no name provided
    const agentName = name.trim() || selectedAsset?.symbol || 'Agente'

    const newAgent: Agent = {
      id: editAgent?.id || Date.now().toString(),
      name: agentName,
      type,
      operationType,
      status: editAgent?.status || 'paused',
      model: selectedModel?.name || '',
      modelId: model,
      asset: selectedAsset?.symbol || '',
      assetId: asset,
      assetType: assetCategory,
      prompt,
      tvSymbol: selectedAsset?.tvSymbol || '',
      provider: (selectedAsset as { provider?: string })?.provider || 'BINANCE',
      timeframe,
      candleCount,
      sources: selectedSources,
    }

    onAddAgent(newAgent)
    setName('')
    setType('spot')
    setOperationType('market')
    setModel('')
    setAsset('')
    setAssetCategory('')
    setPrompt('')
    setTimeframe('60')
    setCandleCount(50)
    setSelectedSources(newsSources?.filter(s => s.enabled).map(s => s.id) || [])
    setOpen(false)
  }

  const isValid = model && asset
  const sourcesToUse = newsSources || defaultNewsSources

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Crear agente</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            {editAgent ? 'Configurar Agente' : 'Nuevo Agente de Trading'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Nombre - opcional */}
          <div className="space-y-2">
            <Label className="text-slate-300">Nombre del agente <span className="text-slate-500 text-xs">(opcional, por defecto usa el activo)</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Se usará el nombre del activo si está vacío"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-11"
            />
          </div>

          {/* Tipo de trading */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Tipo de cuenta</Label>
              <Select value={type} onValueChange={(v) => setType(v as AgentType)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="spot">Spot</SelectItem>
                  <SelectItem value="margin">Margin</SelectItem>
                  <SelectItem value="futures">Futuros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Tipo de orden</Label>
              <Select value={operationType} onValueChange={(v) => setOperationType(v as OperationType)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="buyStop">Buy Stop</SelectItem>
                  <SelectItem value="sellStop">Sell Stop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Modelo de IA */}
          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Modelo de IA
            </Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                <SelectValue placeholder="Selecciona un modelo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {aiModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      <span>{m.badge}</span>
                      <span>{m.name}</span>
                      <span className="text-xs text-slate-400">({m.price})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Activo */}
          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2">
              <Bitcoin className="w-4 h-4" /> Activo a operar
            </Label>
            
            <Select value={assetCategory} onValueChange={(v) => { setAssetCategory(v); setAsset(''); }}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="crypto">🪙 Criptomonedas</SelectItem>
                <SelectItem value="stocks">📈 Acciones</SelectItem>
                <SelectItem value="forex">💱 Forex</SelectItem>
                <SelectItem value="commodities">🥇 Commodities</SelectItem>
                <SelectItem value="indices">📊 Índices</SelectItem>
                <SelectItem value="etfs">📁 ETFs</SelectItem>
              </SelectContent>
            </Select>

            {assetCategory && (
              <Select value={asset} onValueChange={setAsset}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                  <SelectValue placeholder="Selecciona activo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                  {availableAssets[assetCategory as keyof typeof availableAssets]?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="font-medium">{a.symbol}</span>
                      <span className="text-slate-400 ml-2 text-xs">{a.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Timeframe y Velas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Timeframe</Label>
              <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {timeframes.map((tf) => (
                    <SelectItem key={tf.id} value={tf.id}>{tf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Nº de velas</Label>
              <Input
                type="number"
                value={candleCount}
                onChange={(e) => setCandleCount(Math.max(10, Math.min(500, parseInt(e.target.value) || 50)))}
                className="bg-slate-800 border-slate-700 text-white h-10"
                min={10}
                max={500}
              />
            </div>
          </div>

          {/* Fuentes de datos */}
          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2">
              <Newspaper className="w-4 h-4" /> Fuentes de análisis
            </Label>
            <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto bg-slate-800/50 rounded-lg p-2">
              {sourcesToUse.map((source) => {
                const isSelected = selectedSources.includes(source.id)
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => toggleSource(source.id)}
                    className={`flex items-center gap-2 p-2 rounded-md text-left text-sm transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-white'
                        : 'bg-slate-700/30 border border-slate-600/30 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-base">{source.icon}</span>
                    <span className="flex-1 truncate text-xs">{source.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-slate-500">{selectedSources.length} fuente{selectedSources.length !== 1 ? 's' : ''} seleccionada{selectedSources.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label className="text-slate-300">Prompt personalizado (opcional)</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Instrucciones específicas para el agente..."
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[80px]"
            />
          </div>

          <Separator className="bg-slate-700" />

          <Button
            onClick={handleCreate}
            disabled={!isValid}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {editAgent ? 'Guardar cambios' : 'Crear agente'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Panel de chat con el agente
function AgentChatPanel({ 
  agent, 
  onGeneratePrediction,
  onPredictionGenerated
}: { 
  agent: Agent | null
  onGeneratePrediction: () => Promise<Prediction | null>
  onPredictionGenerated: (prediction: Prediction) => void
}) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleSend = async () => {
    if (!message.trim() || !agent) return

    const userMessage = message
    setMessage('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }].map(m => ({
            role: m.role,
            content: m.content
          })),
          model: agent.modelId,
          systemPrompt: agent.prompt || `Eres un asistente de trading experto en ${agent.asset}.`
        })
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Respuesta inválida')
      }

      const data = await response.json()
      
      if (response.ok && data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error: ' + (data.error || 'No se pudo procesar') }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error de conexión' }])
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePrediction = async () => {
    if (!agent) return
    setGenerating(true)
    const tf = timeframes.find(t => t.id === agent.timeframe)
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: `🔮 **Analizando ${agent.asset}**\n\n⏳ Procesando ${agent.candleCount} velas (${tf?.short})...\n📊 Obteniendo precio en tiempo real...\n🤖 Generando análisis con ${agent.model}...` 
    }])

    try {
      const prediction = await onGeneratePrediction()
      if (prediction) {
        onPredictionGenerated(prediction)
        const entryStr = typeof prediction.entry === 'number' ? prediction.entry.toFixed(prediction.entry < 1 ? 6 : 2) : prediction.entry
        const slStr = typeof prediction.stopLoss === 'number' ? prediction.stopLoss.toFixed(prediction.stopLoss < 1 ? 6 : 2) : prediction.stopLoss
        const tpStr = typeof prediction.takeProfit === 'number' ? prediction.takeProfit.toFixed(prediction.takeProfit < 1 ? 6 : 2) : prediction.takeProfit
        
        setMessages(prev => [
          ...prev.slice(0, -1),
          { 
            role: 'assistant', 
            content: `✅ **Predicción generada**\n\n📌 **${prediction.asset}** | ${prediction.direction}\n\n📍 **Entry:** ${entryStr}\n🛑 **SL:** ${slStr}\n🎯 **TP:** ${tpStr}\n📊 **Confianza:** ${prediction.confidence}%\n\n💡 ${prediction.analysis?.slice(0, 150)}${prediction.analysis?.length > 150 ? '...' : ''}` 
          }
        ])
      } else {
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: '❌ No se pudo generar la predicción. Inténtalo de nuevo.' }])
      }
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: '❌ Error al generar predicción. Verifica tu conexión.' }])
    } finally {
      setGenerating(false)
    }
  }

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (agent) {
      setMessages([
        { role: 'assistant', content: `¡Hola! Soy tu agente para **${agent.asset}**.\n\nTimeframe: ${timeframes.find(t => t.id === agent.timeframe)?.label}\nVelas a analizar: ${agent.candleCount}\n\n¿En qué puedo ayudarte?` }
      ])
    }
  }, [agent?.id])

  if (!agent) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6">
        <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-center text-sm">Selecciona un agente</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AssetLogo symbol={agent.asset} size={32} />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white text-sm truncate">{agent.name}</h3>
            <p className="text-xs text-slate-500">{agent.asset} • {timeframes.find(t => t.id === agent.timeframe)?.short}</p>
          </div>
        </div>
        
        <Button
          onClick={handleGeneratePrediction}
          disabled={generating}
          className="w-full mt-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 h-8 text-xs"
          variant="outline"
          size="sm"
        >
          {generating ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 mr-1" />
              Generar predicción
            </>
          )}
        </Button>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-2 rounded-lg text-xs ${
                msg.role === 'user'
                  ? 'bg-emerald-500/20 text-white border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-300 border border-slate-700 p-2 rounded-lg flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs">Pensando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
            placeholder="Mensaje..."
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-8 text-sm"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 h-8 w-8 p-0"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Widget de TradingView con SL/TP - Responsive full width on mobile
function TradingViewWidget({ symbol, timeframe, provider, entry, stopLoss, takeProfit, direction }: { 
  symbol: string
  timeframe: Timeframe
  provider?: string
  entry?: number
  stopLoss?: number
  takeProfit?: number
  direction?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(() => !!symbol)
  
  // Construir símbolo con proveedor correcto
  const chartSymbol = provider ? `${provider}:${symbol}` : `BINANCE:${symbol}`

  useEffect(() => {
    const currentContainer = containerRef.current
    if (!currentContainer || !symbol) return

    currentContainer.innerHTML = ''

    const widgetContainer = document.createElement('div')
    widgetContainer.className = 'tradingview-widget-container'
    widgetContainer.style.width = '100%'
    widgetContainer.style.height = '100%'
    
    const widgetInner = document.createElement('div')
    widgetInner.className = 'tradingview-widget-container__widget'
    widgetInner.style.width = '100%'
    widgetInner.style.height = '100%'
    
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    
    script.addEventListener('load', () => setIsLoading(false))
    script.addEventListener('error', () => setIsLoading(false))
    
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: chartSymbol,
      interval: timeframe,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'es',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      backgroundColor: 'rgba(15, 23, 42, 1)',
      gridColor: 'rgba(51, 65, 85, 0.5)',
      support_host: 'https://www.tradingview.com',
      studies: [
        'MASimple@tv-basicstudies'
      ]
    })

    widgetContainer.appendChild(widgetInner)
    widgetContainer.appendChild(script)
    currentContainer.appendChild(widgetContainer)

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = ''
      }
    }
  }, [symbol, timeframe, chartSymbol])

  if (!symbol) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] rounded-lg border border-slate-700 bg-slate-800/50 flex items-center justify-center text-slate-500">
        <div className="text-center">
          <LineChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Selecciona una predicción</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      )}
      
      {/* Panel de niveles SL/TP - más pequeño en móvil */}
      {entry && stopLoss && takeProfit && (
        <div className="absolute top-2 right-2 z-20 bg-slate-900/95 rounded-lg p-1.5 sm:p-3 text-xs border border-slate-600 shadow-lg min-w-[100px] sm:min-w-[140px]">
          <div className="text-slate-400 text-[10px] sm:text-xs mb-1 sm:mb-2 font-medium">NIVELES</div>
          
          {/* Entry */}
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 p-1 sm:p-1.5 rounded bg-blue-500/10 border border-blue-500/30">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <div className="flex-1 text-[10px] sm:text-xs">
              <span className="text-blue-300">Entry</span>
              <span className="text-white font-mono ml-1 sm:ml-2">{typeof entry === 'number' ? entry.toFixed(entry < 1 ? 6 : 2) : entry}</span>
            </div>
          </div>
          
          {/* Stop Loss */}
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 p-1 sm:p-1.5 rounded bg-red-500/10 border border-red-500/30">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></div>
            <div className="flex-1 text-[10px] sm:text-xs">
              <span className="text-red-300">SL</span>
              <span className="text-red-400 font-mono ml-1 sm:ml-2">{typeof stopLoss === 'number' ? stopLoss.toFixed(stopLoss < 1 ? 6 : 2) : stopLoss}</span>
            </div>
          </div>
          
          {/* Take Profit */}
          <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"></div>
            <div className="flex-1 text-[10px] sm:text-xs">
              <span className="text-emerald-300">TP</span>
              <span className="text-emerald-400 font-mono ml-1 sm:ml-2">{typeof takeProfit === 'number' ? takeProfit.toFixed(takeProfit < 1 ? 6 : 2) : takeProfit}</span>
            </div>
          </div>
          
          {/* Direction badge */}
          {direction && (
            <div className={`mt-1 sm:mt-2 text-center py-0.5 sm:py-1 rounded font-bold text-[10px] sm:text-xs ${
              direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
              direction === 'SHORT' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {direction}
            </div>
          )}
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden border border-slate-700" />
    </div>
  )
}

// Panel de usuario
function UserPanel({ user, onLogout, onModeChange }: { user: UserInfo; onLogout: () => void; onModeChange?: (mode: UserMode) => void }) {
  const [open, setOpen] = useState(false)
  const [showModeDialog, setShowModeDialog] = useState(false)

  const handleModeChange = (newMode: UserMode) => {
    onModeChange?.(newMode)
    setShowModeDialog(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 px-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-[10px] text-slate-500">{user.mode === 'portfolio_manager' ? 'Gestor' : 'Retail'}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-slate-900 border-slate-800">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            
            {/* Account Type */}
            <div className="px-2 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Tipo de cuenta</span>
                <Badge className={`${user.mode === 'portfolio_manager' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                  {user.mode === 'portfolio_manager' ? '👑 Gestor' : '👤 Retail'}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 h-8 text-xs"
                onClick={() => setShowModeDialog(true)}
              >
                <Settings className="w-3 h-3 mr-1" />
                Cambiar modo
              </Button>
            </div>

            <DropdownMenuSeparator className="bg-slate-800" />

            {/* Balance */}
            <div className="px-2 py-2">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300">Saldo</span>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold text-lg">€{(user.balance || 0).toFixed(2)}</span>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 h-6 text-xs px-2" onClick={() => setOpen(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Añadir
                  </Button>
                </div>
              </div>
            </div>

            {/* Free Credits */}
            <div className="px-2 py-1">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-slate-300">Créditos gratis</span>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-2 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-semibold">€{(user.freeCredits || 0).toFixed(2)}</span>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                    Gratis
                  </Badge>
                </div>
                <Progress value={((user.freeCredits || 0) / 0.5) * 100} className="h-1 mt-2 bg-amber-900/30" />
              </div>
            </div>

            {/* Tokens Used */}
            <div className="px-2 py-1">
              <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TokenIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Tokens usados</span>
                </div>
                <span className="text-white font-medium">{(user.tokensUsed || 0).toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 px-1">Precio: €3.50 por millón de tokens</p>
            </div>

            <DropdownMenuSeparator className="bg-slate-800" />
            
            <DropdownMenuItem onClick={() => setOpen(true)} className="text-slate-300 hover:bg-slate-800 cursor-pointer">
              <CreditCard className="w-4 h-4 mr-2" />
              Recargar saldo
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={onLogout} className="text-red-400 hover:bg-red-500/10 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Recargar Saldo
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              El saldo se usa para generar predicciones con IA (€3.50/M tokens)
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 mt-4">
            {[
              { amount: 5, tokens: '~1.4M' },
              { amount: 10, tokens: '~2.9M', bonus: '+3%' },
              { amount: 25, tokens: '~7.1M', bonus: '+14%' },
              { amount: 50, tokens: '~14.3M', bonus: '+43%' },
              { amount: 100, tokens: '~28.6M', bonus: '+43%' },
            ].map((plan) => (
              <button
                key={plan.amount}
                className="p-3 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-white">€{plan.amount}</p>
                  <p className="text-xs text-slate-400">{plan.tokens} tokens aprox.</p>
                </div>
                {plan.bonus && <Badge className="bg-emerald-500/20 text-emerald-400">{plan.bonus}</Badge>}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mode Change Dialog */}
      <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Modo de Cuenta</DialogTitle>
            <DialogDescription className="text-slate-400">
              Selecciona el tipo de cuenta que mejor se adapte a tus necesidades
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 mt-4">
            <button
              onClick={() => handleModeChange('portfolio_manager')}
              className={`p-4 rounded-lg border transition-all text-left ${
                user.mode === 'portfolio_manager'
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">Gestor de Carteras</span>
                    <Badge className="bg-amber-500/20 text-amber-400 text-xs">PRO</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Gestiona múltiples carteras de clientes</p>
                </div>
                {user.mode === 'portfolio_manager' && <Check className="w-5 h-5 text-amber-400" />}
              </div>
            </button>
            <button
              onClick={() => handleModeChange('retail')}
              className={`p-4 rounded-lg border transition-all text-left ${
                user.mode === 'retail'
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-white">Retail</span>
                  <p className="text-xs text-slate-400 mt-0.5">Trading personal con agentes de IA</p>
                </div>
                {user.mode === 'retail' && <Check className="w-5 h-5 text-blue-400" />}
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Dashboard Principal
function Dashboard({ mode: initialMode, initialProducts, onLogout, user: propUser, token, onModeChange }: { 
  mode: UserMode; 
  initialProducts: string[]; 
  onLogout: () => void;
  user: UserInfo | null;
  token: string | null;
  onModeChange?: (mode: UserMode) => void;
}) {
  const [activeSection, setActiveSection] = useState<Section>('agents')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null)
  const [user, setUser] = useState<UserInfo>(propUser || {
    id: 'guest',
    name: 'Trader',
    email: 'user@finai.pro',
    credits: 0.50,
    freeCredits: 0.50,
    tokensUsed: 0,
    balance: 0,
    mode: 'retail',
    preferredProducts: [],
    riskTolerance: 'medium'
  })
  const [userMode, setUserMode] = useState<UserMode>(initialMode)
  const [loading, setLoading] = useState(true)
  const [showMobileChart, setShowMobileChart] = useState(false)
  const [newsSources, setNewsSources] = useState<NewsSource[]>(defaultNewsSources)
  const [editingSource, setEditingSource] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [predictingAgents, setPredictingAgents] = useState<Set<string>>(new Set())

  const sections = [
    { id: 'agents' as Section, label: 'Agentes', icon: Bot },
    { id: 'portfolios' as Section, label: 'Portafolios', icon: PieChart },
    { id: 'datasources' as Section, label: 'Fuentes', icon: Database },
    { id: 'predictions' as Section, label: 'Predicciones', icon: TrendingUp },
  ]

  // Handle source editing
  const handleEditSource = (sourceId: string) => {
    const source = newsSources.find(s => s.id === sourceId)
    if (source) {
      setEditingSource(sourceId)
      setEditUrl(source.url)
    }
  }

  const handleSaveSource = () => {
    if (editingSource) {
      setNewsSources(prev => prev.map(s => 
        s.id === editingSource ? { ...s, url: editUrl } : s
      ))
      setEditingSource(null)
      setEditUrl('')
    }
  }

  const handleResetSource = (sourceId: string) => {
    setNewsSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, url: s.defaultUrl } : s
    ))
  }

  const handleToggleSource = (sourceId: string) => {
    setNewsSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, enabled: !s.enabled } : s
    ))
  }

  // Load agents and predictions from storage
  useEffect(() => {
    const loadData = async () => {
      if (!token || !user) return
      
      setLoading(true)
      try {
        // Load agents
        const agentsRes = await fetch(`/api/storage?action=getAgents&userId=${user.id}`)
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json()
          setAgents(agentsData.agents || [])
        }
        
        // Load predictions
        const predsRes = await fetch(`/api/storage?action=getPredictions&userId=${user.id}`)
        if (predsRes.ok) {
          const predsData = await predsRes.json()
          setPredictions(predsData.predictions || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [token, user])

  useEffect(() => {
    if (initialProducts.length > 0 && agents.length === 0 && !loading && token && user) {
      const createInitialAgents = async () => {
        for (let index = 0; index < Math.min(4, initialProducts.length); index++) {
          const product = initialProducts[index]
          const assets = availableAssets[product as keyof typeof availableAssets] || []
          const randomAsset = assets[Math.floor(Math.random() * Math.min(5, assets.length))] || { 
            id: product, 
            symbol: product.toUpperCase(), 
            name: product, 
            tvSymbol: product.toUpperCase(),
            provider: 'BINANCE'
          }
          const randomModel = aiModels[index % aiModels.length]
          
          const agentData = {
            name: `${randomAsset.symbol} Trader`,
            type: 'spot' as AgentType,
            operationType: 'market' as OperationType,
            model: randomModel.name,
            modelId: randomModel.id,
            asset: randomAsset.symbol,
            assetId: randomAsset.id,
            assetType: product,
            prompt: '',
            tvSymbol: randomAsset.tvSymbol,
            provider: (randomAsset as { provider?: string })?.provider || 'BINANCE',
            timeframe: '60' as Timeframe,
            candleCount: 50,
            user_id: user.id
          }
          
          try {
            const res = await fetch('/api/storage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'saveAgent', agent: agentData })
            })
            if (res.ok) {
              const data = await res.json()
              setAgents(prev => [...prev, data.agent])
            }
          } catch (error) {
            console.error('Error creating agent:', error)
          }
        }
      }
      createInitialAgents()
    }
  }, [initialProducts, loading, token, user])

  const handleAddAgent = async (agent: Agent) => {
    if (token && user) {
      try {
        const res = await fetch('/api/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'saveAgent',
            agent: {
              ...agent,
              user_id: user.id
            }
          })
        })
        if (res.ok) {
          const data = await res.json()
          setAgents(prev => {
            const exists = prev.find(a => a.id === data.agent.id)
            if (exists) {
              return prev.map(a => a.id === data.agent.id ? data.agent : a)
            }
            return [...prev, data.agent]
          })
          setSelectedAgent(data.agent)
        }
      } catch (error) {
        console.error('Error saving agent:', error)
      }
    } else {
      // Fallback to local state if no token
      setAgents(prev => {
        const exists = prev.find(a => a.id === agent.id)
        if (exists) {
          return prev.map(a => a.id === agent.id ? agent : a)
        }
        return [...prev, agent]
      })
      setSelectedAgent(agent)
    }
  }

  const generatePrediction = async (agent?: Agent): Promise<Prediction | null> => {
    const targetAgent = agent || selectedAgent
    if (!targetAgent) return null

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: targetAgent.asset,
          model: targetAgent.modelId,
          operationType: targetAgent.operationType,
          timeframe: targetAgent.timeframe,
          candleCount: targetAgent.candleCount
        })
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return null
      }

      const data = await response.json()
      
      if (response.ok && data.success && data.prediction) {
        const pred = data.prediction
        const newPrediction: Prediction = {
          id: `pred-${Date.now()}`,
          agentId: targetAgent.id,
          agentName: targetAgent.name,
          asset: pred.asset || targetAgent.asset,
          tvSymbol: targetAgent.tvSymbol,
          provider: targetAgent.provider,
          direction: pred.signal?.direction || pred.analysis?.trend || 'NEUTRAL',
          confidence: pred.analysis?.confidence || 50,
          entry: pred.signal?.entry?.price || 0,
          stopLoss: pred.signal?.stopLoss?.price || 0,
          takeProfit: pred.signal?.takeProfit?.price || 0,
          riskReward: pred.signal?.riskRewardRatio || 0,
          analysis: pred.recommendation || pred.rawAnalysis || 'Análisis generado',
          createdAt: new Date().toISOString(),
          timeframe: targetAgent.timeframe,
        }
        
        setUser(prev => ({
          ...prev,
          tokensUsed: prev.tokensUsed + (data.usage?.total_tokens || 0)
        }))
        
        return newPrediction
      }
    } catch (error) {
      console.error('Prediction error:', error)
    }
    return null
  }

  const handlePredictionGenerated = async (prediction: Prediction) => {
    if (token && user) {
      try {
        await fetch('/api/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'savePrediction',
            prediction: {
              ...prediction,
              user_id: user.id
            }
          })
        })
      } catch (error) {
        console.error('Error saving prediction:', error)
      }
    }
    setPredictions(prev => [prediction, ...prev])
    setSelectedPrediction(prediction)
  }

  const deletePrediction = async (id: string) => {
    if (token) {
      try {
        await fetch('/api/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deletePrediction', predictionId: id })
        })
      } catch (error) {
        console.error('Error deleting prediction:', error)
      }
    }
    setPredictions(prev => prev.filter(p => p.id !== id))
    if (selectedPrediction?.id === id) {
      setSelectedPrediction(null)
    }
  }

  const getTypeBadge = (type: AgentType) => {
    const styles = { spot: 'bg-blue-500/10 text-blue-400 border-blue-500/30', margin: 'bg-purple-500/10 text-purple-400 border-purple-500/30', futures: 'bg-orange-500/10 text-orange-400 border-orange-500/30' }
    const labels = { spot: 'Spot', margin: 'Margin', futures: 'Futuros' }
    return <Badge variant="outline" className={styles[type]}>{labels[type]}</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* PWA Install Button */}
      <PWAInstallButton />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-12 sm:h-14 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 z-50">
        <div className="flex items-center justify-between h-full px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Logo - More attractive */}
            <div className="relative">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
                <CandlestickChart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-slate-900 animate-ping" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">finAiPro</h1>
              <p className="text-[9px] sm:text-[10px] text-slate-500 hidden sm:block">{userMode === 'portfolio_manager' ? 'Gestor' : 'Retail'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Add Button - Mobile */}
            <CreateAgentModal 
              onAddAgent={handleAddAgent}
              newsSources={newsSources}
              trigger={
                <Button size="icon" className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 lg:hidden">
                  <Plus className="w-4 h-4" />
                </Button>
              }
            />
            <UserPanel user={user} onLogout={onLogout} onModeChange={onModeChange} />
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop only */}
      <aside className="hidden lg:block fixed left-0 top-14 bottom-0 w-48 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 z-40">
        <nav className="p-3 space-y-1">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isActive ? 'bg-emerald-500/20 text-white border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : ''}`} />
                <span className="text-sm">{section.label}</span>
                {section.id === 'predictions' && predictions.length > 0 && (
                  <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 text-[10px]">{predictions.length}</Badge>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-12 sm:pt-14 pb-16 lg:pb-0 min-h-screen lg:ml-48 lg:mr-80">
        <div className="p-3 sm:p-4">
          {/* Agents */}
          {activeSection === 'agents' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white">Agentes</h2>
                <CreateAgentModal onAddAgent={handleAddAgent} newsSources={newsSources} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                {agents.map((agent) => {
                  const isPredicting = predictingAgents.has(agent.id)
                  const lastPred = predictions.find(p => p.agentId === agent.id)
                  
                  return (
                  <Card
                    key={agent.id}
                    className={`bg-slate-800/50 border-slate-700 cursor-pointer hover:border-slate-600 transition-all ${
                      selectedAgent?.id === agent.id ? 'ring-2 ring-emerald-500/50' : ''
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      {/* Header with status indicator */}
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="relative">
                          <AssetLogo symbol={agent.asset} size={36} className="sm:w-10 sm:h-10" />
                          {/* Status indicator */}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${
                            agent.status === 'active' ? 'bg-green-500 animate-pulse' : 
                            agent.status === 'paused' ? 'bg-amber-500' : 'bg-slate-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white text-sm truncate">{agent.name}</h3>
                            {getTypeBadge(agent.type)}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400">
                            <span>{agent.asset}</span>
                            <span>•</span>
                            <span>{timeframes.find(t => t.id === agent.timeframe)?.short}</span>
                            <span>•</span>
                            <span>{agent.candleCount} velas</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats grid - 4 improvements */}
                      <div className="grid grid-cols-2 gap-1.5 mb-2 sm:mb-3">
                        <div className="bg-slate-700/30 rounded p-1.5 text-center">
                          <p className="text-[9px] text-slate-500">Modelo</p>
                          <p className="text-[10px] sm:text-xs text-white truncate">{agent.model}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded p-1.5 text-center">
                          <p className="text-[9px] text-slate-500">Estado</p>
                          <p className={`text-[10px] sm:text-xs font-medium ${
                            agent.status === 'active' ? 'text-green-400' : 
                            agent.status === 'paused' ? 'text-amber-400' : 'text-slate-400'
                          }`}>
                            {agent.status === 'active' ? '● Activo' : agent.status === 'paused' ? '◐ Pausado' : '○ Inactivo'}
                          </p>
                        </div>
                        <div className="bg-slate-700/30 rounded p-1.5 text-center">
                          <p className="text-[9px] text-slate-500">Predicciones</p>
                          <p className="text-[10px] sm:text-xs text-white">{(agent as Agent & { predictionsCount?: number }).predictionsCount || 0}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded p-1.5 text-center">
                          <p className="text-[9px] text-slate-500">Última</p>
                          <p className="text-[10px] sm:text-xs text-slate-300">
                            {lastPred ? `${lastPred.direction}` : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-7 text-xs"
                          disabled={isPredicting}
                          onClick={async (e) => {
                            e.stopPropagation()
                            setSelectedAgent(agent)
                            setPredictingAgents(prev => new Set(prev).add(agent.id))
                            try {
                              const pred = await generatePrediction(agent)
                              if (pred) handlePredictionGenerated(pred)
                            } finally {
                              setPredictingAgents(prev => {
                                const next = new Set(prev)
                                next.delete(agent.id)
                                return next
                              })
                            }
                          }}
                        >
                          {isPredicting ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3 mr-1" />
                          )}
                          {isPredicting ? 'Analizando...' : 'Predecir'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-7 w-7 p-0 ${
                            agent.status === 'active' 
                              ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' 
                              : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            const newStatus = agent.status === 'active' ? 'paused' : 'active'
                            handleAddAgent({ ...agent, status: newStatus })
                          }}
                          title={agent.status === 'active' ? 'Pausar' : 'Activar'}
                        >
                          {agent.status === 'active' ? <Timer className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                        </Button>
                        <CreateAgentModal 
                          onAddAgent={handleAddAgent} 
                          editAgent={agent}
                          newsSources={newsSources}
                          trigger={
                            <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 hover:bg-slate-700 h-7 w-7 p-0">
                              <Settings className="w-3 h-3" />
                            </Button>
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                  )
                })}
              </div>

              {agents.length === 0 && (
                <Card className="bg-slate-800/30 border-slate-700 border-dashed">
                  <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                    <Bot className="w-10 h-10 text-slate-500 mb-3" />
                    <p className="text-slate-400 mb-3 text-sm">No tienes agentes</p>
                    <CreateAgentModal onAddAgent={handleAddAgent} newsSources={newsSources} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Portfolios */}
          {activeSection === 'portfolios' && (
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">Portafolios</h2>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                  <Wallet className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500 mb-3" />
                  <p className="text-slate-400 mb-1 text-sm">Conecta tu exchange</p>
                  <Button className="mt-3 bg-emerald-500 hover:bg-emerald-600">Conectar</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data Sources */}
          {activeSection === 'datasources' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white">Fuentes de Datos</h2>
              </div>

              {/* Technical Data Sources */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> APIs de Datos Técnicos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {technicalDataSources.map((source) => {
                    const Icon = source.icon
                    return (
                      <Card key={source.id} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-2 sm:p-3 flex items-center gap-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white text-[10px] sm:text-xs truncate">{source.name}</h3>
                            <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] sm:text-[9px]">Conectado</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* News Sources Editor */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Newspaper className="w-4 h-4" /> Fuentes de Noticias y Análisis
                </h3>
                <div className="space-y-2">
                  {newsSources.map((source) => (
                    <Card key={source.id} className={`bg-slate-800/50 border-slate-700 ${!source.enabled ? 'opacity-50' : ''}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Icon and name */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xl">{source.icon}</span>
                            <div>
                              <h3 className="font-medium text-white text-sm">{source.name}</h3>
                              <Badge className={`text-[9px] ${
                                source.category === 'news' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                source.category === 'sentiment' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}>
                                {source.category === 'news' ? 'Noticias' : source.category === 'sentiment' ? 'Sentimiento' : 'Indicadores'}
                              </Badge>
                            </div>
                          </div>

                          {/* URL Editor */}
                          <div className="flex-1 min-w-0">
                            {editingSource === source.id ? (
                              <div className="flex gap-2">
                                <Input
                                  value={editUrl}
                                  onChange={(e) => setEditUrl(e.target.value)}
                                  className="bg-slate-700 border-slate-600 text-white text-xs h-8"
                                  placeholder="URL..."
                                />
                                <Button
                                  size="sm"
                                  onClick={handleSaveSource}
                                  className="bg-emerald-500 hover:bg-emerald-600 h-8 px-2"
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingSource(null)}
                                  className="h-8 px-2 text-slate-400"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-slate-400 hover:text-emerald-400 truncate flex-1"
                                >
                                  {source.url}
                                </a>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditSource(source.id)}
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResetSource(source.id)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                              title="Restablecer URL"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-emerald-400"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleSource(source.id)}
                              className={`h-6 w-6 p-0 ${source.enabled ? 'text-emerald-400' : 'text-slate-500'}`}
                            >
                              {source.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Add Custom Source */}
              <Card className="bg-slate-800/30 border-slate-700 border-dashed">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <Globe className="w-8 h-8 text-slate-500 mb-2" />
                  <p className="text-slate-400 text-sm mb-2">Próximamente: Añadir fuentes personalizadas</p>
                  <p className="text-slate-500 text-xs">Podrás agregar tus propias URLs de noticias y análisis</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Predictions */}
          {activeSection === 'predictions' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white">Predicciones</h2>
                {predictions.length > 0 && (
                  <Button variant="outline" onClick={() => setPredictions([])} className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 sm:h-8 text-xs">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Borrar
                  </Button>
                )}
              </div>

              {predictions.length === 0 ? (
                <Card className="bg-slate-800/30 border-slate-700 border-dashed">
                  <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                    <TrendingUp className="w-10 h-10 text-slate-500 mb-3" />
                    <p className="text-slate-400 text-sm">No hay predicciones</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Chart Full Width on Mobile */}
                  {selectedPrediction && (
                    <Card className="bg-slate-800/50 border-slate-700 -mx-3 sm:mx-0 rounded-none sm:rounded-lg">
                      <CardHeader className="pb-2 py-2 sm:py-3 px-3 sm:px-6">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm sm:text-base text-white flex items-center gap-2">
                            <AssetLogo symbol={selectedPrediction.asset} size={18} className="sm:w-5 sm:h-5" />
                            {selectedPrediction.asset}
                          </CardTitle>
                          <Badge className={`text-[10px] sm:text-xs ${
                            selectedPrediction.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            selectedPrediction.direction === 'SHORT' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {selectedPrediction.direction}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 p-0 sm:p-6">
                        <TradingViewWidget 
                          symbol={selectedPrediction.tvSymbol}
                          timeframe={selectedPrediction.timeframe}
                          provider={selectedPrediction.provider}
                          entry={selectedPrediction.entry}
                          stopLoss={selectedPrediction.stopLoss}
                          takeProfit={selectedPrediction.takeProfit}
                          direction={selectedPrediction.direction}
                        />
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {predictions.map((pred) => (
                      <Card 
                        key={pred.id} 
                        className={`bg-slate-800/50 border-slate-700 cursor-pointer hover:border-slate-600 transition-all ${
                          selectedPrediction?.id === pred.id ? 'ring-2 ring-emerald-500/50' : ''
                        }`}
                        onClick={() => setSelectedPrediction(pred)}
                      >
                        <CardContent className="p-2 sm:p-4">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <AssetLogo symbol={pred.asset} size={20} className="sm:w-6 sm:h-6" />
                              <span className="font-medium text-white text-xs sm:text-sm">{pred.asset}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge className={`text-[9px] sm:text-[10px] ${
                                pred.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' :
                                pred.direction === 'SHORT' ? 'bg-red-500/10 text-red-400' :
                                'bg-slate-700 text-slate-400'
                              }`}>
                                {pred.direction}
                              </Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 hover:text-red-400"
                                onClick={(e) => { e.stopPropagation(); deletePrediction(pred.id); }}
                              >
                                <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-0.5 sm:gap-1 mb-1.5 sm:mb-2 text-[10px] sm:text-xs">
                            <div className="p-1 sm:p-1.5 bg-slate-800 rounded text-center">
                              <p className="text-[8px] sm:text-[10px] text-slate-500">Entry</p>
                              <p className="text-white font-medium truncate">{pred.entry || '—'}</p>
                            </div>
                            <div className="p-1 sm:p-1.5 bg-red-500/10 rounded text-center border border-red-500/20">
                              <p className="text-[8px] sm:text-[10px] text-red-400">SL</p>
                              <p className="text-red-400 font-medium truncate">{pred.stopLoss || '—'}</p>
                            </div>
                            <div className="p-1 sm:p-1.5 bg-emerald-500/10 rounded text-center border border-emerald-500/20">
                              <p className="text-[8px] sm:text-[10px] text-emerald-400">TP</p>
                              <p className="text-emerald-400 font-medium truncate">{pred.takeProfit || '—'}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500">
                            <span>{pred.confidence}% conf.</span>
                            <span>{timeframes.find(t => t.id === pred.timeframe)?.short}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Chat Panel - Desktop only */}
      <aside className="hidden lg:block fixed right-0 top-14 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-40">
        <AgentChatPanel 
          agent={selectedAgent} 
          onGeneratePrediction={generatePrediction}
          onPredictionGenerated={handlePredictionGenerated}
        />
      </aside>
      
      {/* Bottom Navigation - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 safe-area-pb">
        <div className="flex items-center justify-around h-full px-2">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                  isActive ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {section.id === 'predictions' && predictions.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                      {predictions.length > 9 ? '9+' : predictions.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{section.label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
              </button>
            )
          })}
        </div>
      </nav>
      
      {/* Mobile Chat Modal */}
      {selectedAgent && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-12 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <AssetLogo symbol={selectedAgent.asset} size={24} />
              <span className="font-medium text-white text-sm truncate">{selectedAgent.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedAgent(null)} className="text-slate-400 h-8 w-8">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="pt-12 pb-14 h-full">
            <AgentChatPanel 
              agent={selectedAgent} 
              onGeneratePrediction={generatePrediction}
              onPredictionGenerated={handlePredictionGenerated}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Main
export default function Home() {
  const [step, setStep] = useState<'landing' | 'auth' | 'login' | 'register' | 'mode' | 'preferences' | 'dashboard'>('landing')
  const [userMode, setUserMode] = useState<UserMode>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [user, setUser] = useState<UserInfo | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const handleGetStarted = () => {
    setStep('auth')
  }

  const handleShowLogin = () => setStep('login')
  const handleShowRegister = () => setStep('register')

  const handleLogin = async (email: string, password: string) => {
    const response = await fetch('/api/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al iniciar sesión')
    }
    
    setUser(data.user)
    setToken(data.session.access_token)
    setUserMode(data.user.mode as UserMode || 'retail')
    
    // If user has preferred products, go directly to dashboard
    if (data.user.preferredProducts && data.user.preferredProducts.length > 0) {
      setSelectedProducts(data.user.preferredProducts.split(',').filter(Boolean))
      setStep('dashboard')
    } else {
      setStep('mode')
    }
  }

  const handleRegister = async (email: string, password: string, name: string) => {
    const response = await fetch('/api/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', email, password, name })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al registrar')
    }
    
    // After registration, set user and go to mode selection
    setUser(data.user)
    setToken(data.session.access_token)
    setStep('mode')
  }

  const handleModeSelect = async (mode: UserMode) => {
    setUserMode(mode)
    
    // Save mode to database
    if (user?.id) {
      await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateProfile', 
          userId: user.id, 
          mode 
        })
      })
      setUser(prev => prev ? { ...prev, mode } : null)
    }
    
    setStep('preferences')
  }

  const handlePreferencesComplete = async (products: string[], risk?: string) => {
    setSelectedProducts(products)
    
    // Save preferences to database
    if (user?.id) {
      await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateProfile', 
          userId: user.id, 
          preferredProducts: products.join(','),
          riskTolerance: risk || 'medium'
        })
      })
      setUser(prev => prev ? { ...prev, preferredProducts: products, riskTolerance: risk || 'medium' } : null)
    }
    
    setStep('dashboard')
  }

  const handleModeChange = async (newMode: UserMode) => {
    setUserMode(newMode)
    
    // Update mode in database
    if (user?.id) {
      await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateProfile', 
          userId: user.id, 
          mode: newMode 
        })
      })
      setUser(prev => prev ? { ...prev, mode: newMode } : null)
    }
  }

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    }
    setUser(null)
    setToken(null)
    setStep('landing')
    setUserMode(null)
    setSelectedProducts([])
  }

  // Auth step shows choice between login and register
  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <CandlestickChart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Bienvenido a finAiPro</CardTitle>
            <CardDescription className="text-slate-400">Elige cómo continuar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleShowLogin}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-11"
            >
              Iniciar Sesión
            </Button>
            <Button
              onClick={handleShowRegister}
              variant="outline"
              className="w-full border-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500 h-11"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Cuenta Nueva
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'login') return <LoginForm onLogin={handleLogin} onSwitchToRegister={handleShowRegister} />
  if (step === 'register') return <RegisterForm onRegister={handleRegister} onSwitchToLogin={handleShowLogin} />
  if (step === 'landing') return <LandingPage onGetStarted={handleGetStarted} />
  if (step === 'mode') return <ModeSelection onSelect={handleModeSelect} />
  if (step === 'preferences') return <PreferencesForm onComplete={(products, risk) => handlePreferencesComplete(products, risk)} />
  return <Dashboard mode={userMode} initialProducts={selectedProducts} onLogout={handleLogout} user={user} token={token} onModeChange={handleModeChange} />
}

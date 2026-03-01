// Translation system for finAiPro
export type Language = 'es' | 'en' | 'pt'

export const translations = {
  es: {
    // Header
    connectWallet: 'Conectar Wallet',
    balance: 'Saldo',
    
    // Navigation
    agents: 'Agentes',
    portfolios: 'Portafolios',
    datasources: 'Fuentes',
    predictions: 'Predicciones',
    sentiment: 'Sentimiento',
    
    // Agent Types
    spot: 'Spot',
    margin: 'Margin',
    futures: 'Futuros',
    news_portfolio: 'News Portfolio',
    news_trading: 'News Trading',
    
    // Agent Status
    active: 'Activo',
    paused: 'Pausado',
    inactive: 'Inactivo',
    
    // Agent Creation
    createAgent: 'Crear Agente',
    configureAgent: 'Configurar Agente',
    agentName: 'Nombre del Agente',
    agentType: 'Tipo de Agente',
    selectModel: 'Seleccionar Modelo',
    selectAsset: 'Seleccionar Activo',
    selectMarket: 'Seleccionar Mercado',
    timeframe: 'Temporalidad',
    prompt: 'Prompt',
    candleCount: 'Número de Velas',
    
    // Predictions
    generatePrediction: 'Generar Predicción',
    placeOrder: 'Colocar Orden',
    entry: 'Entrada',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    confidence: 'Confianza',
    direction: 'Dirección',
    long: 'Largo',
    short: 'Corto',
    
    // Place Order Modal
    selectExchange: 'Seleccionar Exchange',
    orderPlaced: 'Orden Colocada',
    recommended: 'RECOMENDADO',
    otherExchanges: 'Otros Exchanges',
    cancel: 'Cancelar',
    connecting: 'Conectando...',
    
    // Hyperliquid
    hyperliquidConnection: 'Conexión a Hyperliquid',
    connectHyperliquid: 'Conectar Hyperliquid',
    orderBook: 'Libro de Órdenes',
    positionSize: 'Tamaño de Posición',
    leverage: 'Apalancamiento',
    margin: 'Margen',
    availableBalance: 'Balance Disponible',
    currentPrice: 'Precio Actual',
    orderType: 'Tipo de Orden',
    market: 'Mercado',
    limit: 'Límite',
    
    // News Agent
    newsAnalysis: 'Análisis de Noticias',
    marketRecommendation: 'Recomendación de Mercado',
    portfolioRecommendation: 'Recomendación de Portfolio',
    readingSources: 'Leyendo fuentes',
    analyzingNews: 'Analizando noticias',
    
    // Sentiment
    sentimentAnalysis: 'Análisis de Sentimiento',
    bullish: 'Alcista',
    bearish: 'Bajista',
    neutral: 'Neutral',
    fearGreed: 'Miedo/Codicia',
    
    // User Panel
    guestMode: 'Modo Invitado',
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    createAccount: 'Crear Cuenta',
    guestWarning: 'Los datos no se guardarán. Inicia sesión para guardar tus agentes y predicciones.',
    
    // Landing
    poweredByAI: 'Potenciado por IA Avanzada',
    intelligentTrading: 'Trading Inteligente con Inteligencia Artificial',
    startNow: 'Comenzar Ahora',
    startFree: 'Empezar Gratis',
    
    // Misc
    loading: 'Cargando',
    error: 'Error',
    success: 'Éxito',
    retry: 'Reintentar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
  },
  en: {
    // Header
    connectWallet: 'Connect Wallet',
    balance: 'Balance',
    
    // Navigation
    agents: 'Agents',
    portfolios: 'Portfolios',
    datasources: 'Sources',
    predictions: 'Predictions',
    sentiment: 'Sentiment',
    
    // Agent Types
    spot: 'Spot',
    margin: 'Margin',
    futures: 'Futures',
    news_portfolio: 'News Portfolio',
    news_trading: 'News Trading',
    
    // Agent Status
    active: 'Active',
    paused: 'Paused',
    inactive: 'Inactive',
    
    // Agent Creation
    createAgent: 'Create Agent',
    configureAgent: 'Configure Agent',
    agentName: 'Agent Name',
    agentType: 'Agent Type',
    selectModel: 'Select Model',
    selectAsset: 'Select Asset',
    selectMarket: 'Select Market',
    timeframe: 'Timeframe',
    prompt: 'Prompt',
    candleCount: 'Candle Count',
    
    // Predictions
    generatePrediction: 'Generate Prediction',
    placeOrder: 'Place Order',
    entry: 'Entry',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    confidence: 'Confidence',
    direction: 'Direction',
    long: 'Long',
    short: 'Short',
    
    // Place Order Modal
    selectExchange: 'Select Exchange',
    orderPlaced: 'Order Placed',
    recommended: 'RECOMMENDED',
    otherExchanges: 'Other Exchanges',
    cancel: 'Cancel',
    connecting: 'Connecting...',
    
    // Hyperliquid
    hyperliquidConnection: 'Hyperliquid Connection',
    connectHyperliquid: 'Connect Hyperliquid',
    orderBook: 'Order Book',
    positionSize: 'Position Size',
    leverage: 'Leverage',
    margin: 'Margin',
    availableBalance: 'Available Balance',
    currentPrice: 'Current Price',
    orderType: 'Order Type',
    market: 'Market',
    limit: 'Limit',
    
    // News Agent
    newsAnalysis: 'News Analysis',
    marketRecommendation: 'Market Recommendation',
    portfolioRecommendation: 'Portfolio Recommendation',
    readingSources: 'Reading sources',
    analyzingNews: 'Analyzing news',
    
    // Sentiment
    sentimentAnalysis: 'Sentiment Analysis',
    bullish: 'Bullish',
    bearish: 'Bearish',
    neutral: 'Neutral',
    fearGreed: 'Fear/Greed',
    
    // User Panel
    guestMode: 'Guest Mode',
    login: 'Login',
    logout: 'Logout',
    createAccount: 'Create Account',
    guestWarning: 'Data will not be saved. Login to save your agents and predictions.',
    
    // Landing
    poweredByAI: 'Powered by Advanced AI',
    intelligentTrading: 'Intelligent Trading with Artificial Intelligence',
    startNow: 'Start Now',
    startFree: 'Start Free',
    
    // Misc
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    retry: 'Retry',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
  },
  pt: {
    // Header
    connectWallet: 'Conectar Carteira',
    balance: 'Saldo',
    
    // Navigation
    agents: 'Agentes',
    portfolios: 'Portfólios',
    datasources: 'Fontes',
    predictions: 'Previsões',
    sentiment: 'Sentimento',
    
    // Agent Types
    spot: 'Spot',
    margin: 'Margem',
    futures: 'Futuros',
    news_portfolio: 'News Portfólio',
    news_trading: 'News Trading',
    
    // Agent Status
    active: 'Ativo',
    paused: 'Pausado',
    inactive: 'Inativo',
    
    // Agent Creation
    createAgent: 'Criar Agente',
    configureAgent: 'Configurar Agente',
    agentName: 'Nome do Agente',
    agentType: 'Tipo de Agente',
    selectModel: 'Selecionar Modelo',
    selectAsset: 'Selecionar Ativo',
    selectMarket: 'Selecionar Mercado',
    timeframe: 'Temporalidade',
    prompt: 'Prompt',
    candleCount: 'Número de Velas',
    
    // Predictions
    generatePrediction: 'Gerar Previsão',
    placeOrder: 'Colocar Ordem',
    entry: 'Entrada',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    confidence: 'Confiança',
    direction: 'Direção',
    long: 'Longo',
    short: 'Curto',
    
    // Place Order Modal
    selectExchange: 'Selecionar Exchange',
    orderPlaced: 'Ordem Colocada',
    recommended: 'RECOMENDADO',
    otherExchanges: 'Outras Exchanges',
    cancel: 'Cancelar',
    connecting: 'Conectando...',
    
    // Hyperliquid
    hyperliquidConnection: 'Conexão Hyperliquid',
    connectHyperliquid: 'Conectar Hyperliquid',
    orderBook: 'Livro de Ordens',
    positionSize: 'Tamanho da Posição',
    leverage: 'Alavancagem',
    margin: 'Margem',
    availableBalance: 'Saldo Disponível',
    currentPrice: 'Preço Atual',
    orderType: 'Tipo de Ordem',
    market: 'Mercado',
    limit: 'Limite',
    
    // News Agent
    newsAnalysis: 'Análise de Notícias',
    marketRecommendation: 'Recomendação de Mercado',
    portfolioRecommendation: 'Recomendação de Portfólio',
    readingSources: 'Lendo fontes',
    analyzingNews: 'Analisando notícias',
    
    // Sentiment
    sentimentAnalysis: 'Análise de Sentimento',
    bullish: 'Alta',
    bearish: 'Baixa',
    neutral: 'Neutro',
    fearGreed: 'Medo/Ganância',
    
    // User Panel
    guestMode: 'Modo Convidado',
    login: 'Entrar',
    logout: 'Sair',
    createAccount: 'Criar Conta',
    guestWarning: 'Os dados não serão salvos. Entre para salvar seus agentes e previsões.',
    
    // Landing
    poweredByAI: 'Alimentado por IA Avançada',
    intelligentTrading: 'Trading Inteligente com Inteligência Artificial',
    startNow: 'Começar Agora',
    startFree: 'Começar Grátis',
    
    // Misc
    loading: 'Carregando',
    error: 'Erro',
    success: 'Sucesso',
    retry: 'Tentar novamente',
    save: 'Salvar',
    delete: 'Excluir',
    edit: 'Editar',
  }
}

export type TranslationKey = keyof typeof translations.es

// Translation context hook will be created in the component

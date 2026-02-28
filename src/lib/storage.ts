// Simple localStorage-based auth and data storage
// Used as fallback when Supabase is not configured

export interface StoredUser {
  id: string
  email: string
  name: string
  credits: number
  freeCredits: number
  tokensUsed: number
  password: string // In real app, this would be hashed
}

export interface StoredAgent {
  id: string
  userId: string
  name: string
  type: string
  operationType: string
  status: string
  model: string
  modelId: string
  asset: string
  assetId: string
  assetType: string
  prompt: string
  tvSymbol: string
  provider: string
  timeframe: string
  candleCount: number
  createdAt: string
}

export interface StoredPrediction {
  id: string
  userId: string
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
  timeframe: string
  createdAt: string
}

const USERS_KEY = 'finaipro_users'
const CURRENT_USER_KEY = 'finaipro_current_user'
const AGENTS_KEY = 'finaipro_agents'
const PREDICTIONS_KEY = 'finaipro_predictions'

// Users
export function getUsers(): StoredUser[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(USERS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase())
}

export function createUser(email: string, password: string, name: string): StoredUser {
  const users = getUsers()
  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    email,
    name: name || email.split('@')[0],
    credits: 0,
    freeCredits: 0.5,
    tokensUsed: 0,
    password
  }
  users.push(newUser)
  saveUsers(users)
  return newUser
}

// Current user session
export function getCurrentUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(CURRENT_USER_KEY)
  return data ? JSON.parse(data) : null
}

export function setCurrentUser(user: StoredUser | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(CURRENT_USER_KEY)
  }
}

// Agents
export function getAgents(userId: string): StoredAgent[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(AGENTS_KEY)
  const allAgents: StoredAgent[] = data ? JSON.parse(data) : []
  return allAgents.filter(a => a.userId === userId)
}

export function saveAgent(agent: StoredAgent) {
  const data = localStorage.getItem(AGENTS_KEY)
  const agents: StoredAgent[] = data ? JSON.parse(data) : []
  const existingIndex = agents.findIndex(a => a.id === agent.id)
  if (existingIndex >= 0) {
    agents[existingIndex] = agent
  } else {
    agents.push(agent)
  }
  localStorage.setItem(AGENTS_KEY, JSON.stringify(agents))
}

export function deleteAgent(agentId: string) {
  const data = localStorage.getItem(AGENTS_KEY)
  const agents: StoredAgent[] = data ? JSON.parse(data) : []
  const filtered = agents.filter(a => a.id !== agentId)
  localStorage.setItem(AGENTS_KEY, JSON.stringify(filtered))
}

// Predictions
export function getPredictions(userId: string): StoredPrediction[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(PREDICTIONS_KEY)
  const allPredictions: StoredPrediction[] = data ? JSON.parse(data) : []
  return allPredictions.filter(p => p.userId === userId)
}

export function savePrediction(prediction: StoredPrediction) {
  const data = localStorage.getItem(PREDICTIONS_KEY)
  const predictions: StoredPrediction[] = data ? JSON.parse(data) : []
  predictions.unshift(prediction)
  // Keep only last 100 predictions
  const trimmed = predictions.slice(0, 100)
  localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(trimmed))
}

export function deletePrediction(predictionId: string) {
  const data = localStorage.getItem(PREDICTIONS_KEY)
  const predictions: StoredPrediction[] = data ? JSON.parse(data) : []
  const filtered = predictions.filter(p => p.id !== predictionId)
  localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(filtered))
}

// Update user tokens
export function updateUserTokens(userId: string, tokens: number) {
  const users = getUsers()
  const userIndex = users.findIndex(u => u.id === userId)
  if (userIndex >= 0) {
    users[userIndex].tokensUsed += tokens
    saveUsers(users)
    
    // Update current user if matches
    const current = getCurrentUser()
    if (current && current.id === userId) {
      current.tokensUsed = users[userIndex].tokensUsed
      setCurrentUser(current)
    }
  }
}

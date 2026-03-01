import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Storage API - handles all data operations with Supabase/PostgreSQL via Prisma

// Price per million tokens: €3.5
const PRICE_PER_MILLION_TOKENS = 3.5

// GET - Fetch data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const email = searchParams.get('email')
  const userId = searchParams.get('userId')

  try {
    if (action === 'getUser' && email) {
      const user = await db.profile.findUnique({
        where: { email: email.toLowerCase() }
      })
      if (!user) {
        return NextResponse.json({ user: null })
      }
      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({ user: userWithoutPassword })
    }

    if (action === 'getProfile' && userId) {
      const user = await db.profile.findUnique({
        where: { id: userId }
      })
      if (!user) {
        return NextResponse.json({ user: null })
      }
      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({ user: userWithoutPassword })
    }

    if (action === 'getAgents' && userId) {
      const agents = await db.agent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      // Parse comma-separated fields back into arrays
      const parsedAgents = agents.map(agent => ({
        ...agent,
        sources: agent.sources ? agent.sources.split(',').filter(Boolean) : [],
        multiAssets: agent.multiAssets ? agent.multiAssets.split(',').filter(Boolean) : []
      }))
      return NextResponse.json({ agents: parsedAgents })
    }

    if (action === 'getPredictions' && userId) {
      const predictions = await db.prediction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
      return NextResponse.json({ predictions })
    }

    if (action === 'getNewsSources' && userId) {
      const sources = await db.newsSource.findMany({
        where: { userId }
      })
      return NextResponse.json({ sources })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

// POST - Create/Update data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // REGISTER
    if (action === 'register') {
      const { email, password, name, mode, preferredProducts, riskTolerance } = body
      
      const existingUser = await db.profile.findUnique({
        where: { email: email.toLowerCase() }
      })
      
      if (existingUser) {
        return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      
      const newUser = await db.profile.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name || email.split('@')[0],
          mode: mode || 'retail',
          preferredProducts: preferredProducts || '',
          riskTolerance: riskTolerance || 'medium',
          balance: 0,
          tokensUsed: 0,
          freeCredits: 0.5 // €0.50 free credits
        }
      })

      const { password: _, ...userWithoutPassword } = newUser

      return NextResponse.json({ 
        success: true, 
        user: userWithoutPassword,
        session: { 
          access_token: `token-${newUser.id}`,
          refresh_token: `refresh-${newUser.id}`,
          expires_at: Math.floor(Date.now() / 1000) + 86400 * 7
        }
      })
    }

    // LOGIN
    if (action === 'login') {
      const { email, password } = body
      
      const user = await db.profile.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (!user) {
        return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
      }

      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
      }

      const { password: _, ...userWithoutPassword } = user

      return NextResponse.json({ 
        success: true, 
        user: userWithoutPassword,
        session: { 
          access_token: `token-${user.id}`,
          refresh_token: `refresh-${user.id}`,
          expires_at: Math.floor(Date.now() / 1000) + 86400 * 7
        }
      })
    }

    // UPDATE PROFILE
    if (action === 'updateProfile') {
      const { userId, name, mode, preferredProducts, riskTolerance } = body
      
      const updatedUser = await db.profile.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(mode !== undefined && { mode }),
          ...(preferredProducts !== undefined && { preferredProducts }),
          ...(riskTolerance !== undefined && { riskTolerance })
        }
      })

      const { password: _, ...userWithoutPassword } = updatedUser
      return NextResponse.json({ success: true, user: userWithoutPassword })
    }

    // ADD BALANCE
    if (action === 'addBalance') {
      const { userId, amount } = body
      
      const user = await db.profile.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }

      const updatedUser = await db.profile.update({
        where: { id: userId },
        data: { balance: user.balance + amount }
      })

      const { password: _, ...userWithoutPassword } = updatedUser
      return NextResponse.json({ success: true, user: userWithoutPassword })
    }

    // SAVE AGENT
    if (action === 'saveAgent') {
      const agentData = body.agent
      
      // Verify user exists
      const userProfile = await db.profile.findUnique({
        where: { id: agentData.user_id }
      })
      
      if (!userProfile) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }
      
      let agent
      // Check if this is an existing agent (has valid DB id, not a temp id)
      const isExistingAgent = agentData.id && 
        !agentData.id.startsWith('agent-') && 
        !agentData.id.startsWith('user-') &&
        !agentData.id.startsWith('temp-')
      
      if (isExistingAgent) {
        // Update existing agent
        agent = await db.agent.update({
          where: { id: agentData.id },
          data: {
            name: agentData.name,
            type: agentData.type,
            operationType: agentData.operationType,
            status: agentData.status || 'paused',
            model: agentData.model,
            modelId: agentData.modelId,
            asset: agentData.asset,
            assetId: agentData.assetId,
            assetType: agentData.assetType,
            prompt: agentData.prompt,
            sources: Array.isArray(agentData.sources) ? agentData.sources.join(',') : agentData.sources || '',
            tvSymbol: agentData.tvSymbol,
            provider: agentData.provider || 'BINANCE',
            timeframe: agentData.timeframe,
            candleCount: agentData.candleCount,
            predictionType: agentData.predictionType || 'swing',
            isMultiPrediction: agentData.isMultiPrediction || false,
            multiAssets: Array.isArray(agentData.multiAssets) ? agentData.multiAssets.join(',') : agentData.multiAssets || ''
          }
        })
      } else {
        // Create new agent
        agent = await db.agent.create({
          data: {
            userId: userProfile.id,
            name: agentData.name,
            type: agentData.type || 'spot',
            operationType: agentData.operationType || 'market',
            status: 'paused',
            model: agentData.model,
            modelId: agentData.modelId,
            asset: agentData.asset,
            assetId: agentData.assetId,
            assetType: agentData.assetType || '',
            prompt: agentData.prompt || '',
            sources: Array.isArray(agentData.sources) ? agentData.sources.join(',') : agentData.sources || '',
            tvSymbol: agentData.tvSymbol,
            provider: agentData.provider || 'BINANCE',
            timeframe: agentData.timeframe || '60',
            candleCount: agentData.candleCount || 50,
            predictionType: agentData.predictionType || 'swing',
            isMultiPrediction: agentData.isMultiPrediction || false,
            multiAssets: Array.isArray(agentData.multiAssets) ? agentData.multiAssets.join(',') : agentData.multiAssets || ''
          }
        })
      }
      
      return NextResponse.json({ success: true, agent })
    }

    // DELETE AGENT
    if (action === 'deleteAgent') {
      const { agentId } = body
      await db.agent.delete({ where: { id: agentId } })
      return NextResponse.json({ success: true })
    }

    // UPDATE AGENT STATUS
    if (action === 'updateAgentStatus') {
      const { agentId, status } = body
      const agent = await db.agent.update({
        where: { id: agentId },
        data: { status }
      })
      return NextResponse.json({ success: true, agent })
    }

    // SAVE PREDICTION
    if (action === 'savePrediction') {
      const predData = body.prediction
      
      // Verify user exists
      const userProfile = await db.profile.findUnique({
        where: { id: predData.user_id }
      })
      
      if (!userProfile) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }
      
      const prediction = await db.prediction.create({
        data: {
          userId: userProfile.id,
          agentId: predData.agentId || null,  // Optional
          agentName: predData.agentName || 'AI Prediction',
          asset: predData.asset,
          tvSymbol: predData.tvSymbol || predData.asset?.replace('/', ''),
          provider: predData.provider || 'BINANCE',
          direction: predData.direction,
          confidence: predData.confidence || 50,
          entry: predData.entry || 0,
          stopLoss: predData.stopLoss || 0,
          takeProfit: predData.takeProfit || 0,
          riskReward: predData.riskReward || 1.5,
          analysis: predData.analysis || '',
          timeframe: predData.timeframe || '60',
          tokensUsed: predData.tokensUsed || 0,
          costEur: predData.costEur || 0
        }
      })

      // Update agent prediction count if agentId provided
      if (predData.agentId) {
        try {
          await db.agent.update({
            where: { id: predData.agentId },
            data: {
              predictionsCount: { increment: 1 },
              lastPredictionAt: new Date()
            }
          })
        } catch {
          // Agent might not exist, ignore error
        }
      }

      return NextResponse.json({ success: true, prediction })
    }

    // DELETE PREDICTION
    if (action === 'deletePrediction') {
      const { predictionId } = body
      await db.prediction.delete({ where: { id: predictionId } })
      return NextResponse.json({ success: true })
    }

    // UPDATE TOKENS USED
    if (action === 'updateTokens') {
      const { userId, tokens } = body
      
      const user = await db.profile.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }

      // Calculate cost: €3.5 per million tokens
      const costEur = (tokens / 1000000) * PRICE_PER_MILLION_TOKENS

      // Deduct from balance or free credits
      let newBalance = user.balance
      let newFreeCredits = user.freeCredits
      let newTokensUsed = user.tokensUsed + tokens

      if (user.freeCredits >= costEur) {
        newFreeCredits = user.freeCredits - costEur
      } else {
        const remaining = costEur - user.freeCredits
        newFreeCredits = 0
        newBalance = Math.max(0, user.balance - remaining)
      }

      const updatedUser = await db.profile.update({
        where: { id: userId },
        data: {
          tokensUsed: newTokensUsed,
          balance: newBalance,
          freeCredits: newFreeCredits
        }
      })

      const { password: _, ...userWithoutPassword } = updatedUser
      return NextResponse.json({ success: true, user: userWithoutPassword, costEur })
    }

    // SAVE NEWS SOURCES
    if (action === 'saveNewsSources') {
      const { userId, sources } = body
      
      // Delete existing sources for user
      await db.newsSource.deleteMany({ where: { userId } })
      
      // Create new sources
      if (sources && sources.length > 0) {
        await db.newsSource.createMany({
          data: sources.map((s: { id: string; sourceId: string; name: string; url: string; category: string; enabled: boolean }) => ({
            userId,
            sourceId: s.sourceId || s.id,
            name: s.name,
            url: s.url,
            category: s.category,
            enabled: s.enabled ?? true
          }))
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: 'Internal error', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 })
  }
}

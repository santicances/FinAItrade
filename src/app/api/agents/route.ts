import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to extract user ID from token
function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  // Token format: local-{userId}-{timestamp}
  const parts = token.split('-')
  if (parts.length >= 2 && parts[0] === 'local') {
    return parts[1]
  }
  return null
}

// GET - Fetch all agents for user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'))
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const agents = await db.agent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match frontend interface
    const transformedAgents = agents.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      operationType: a.operationType,
      status: a.status,
      model: a.model,
      modelId: a.modelId,
      asset: a.asset,
      assetId: a.assetId,
      assetType: a.assetType,
      prompt: a.prompt || '',
      sources: a.sources,
      tvSymbol: a.tvSymbol,
      provider: a.provider,
      timeframe: a.timeframe,
      candleCount: a.candleCount,
      predictionType: a.predictionType,
      isMultiPrediction: a.isMultiPrediction,
      multiAssets: a.multiAssets,
      predictionsCount: a.predictionsCount,
      lastPredictionAt: a.lastPredictionAt,
      createdAt: a.createdAt
    }))

    return NextResponse.json({ agents: transformedAgents })
  } catch (error) {
    console.error('Get agents error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Create new agent
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'))
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verify user exists
    const user = await db.profile.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, type, operationType, model, modelId, asset, assetId, assetType, 
      prompt, sources, tvSymbol, provider, timeframe, candleCount,
      predictionType, isMultiPrediction, multiAssets
    } = body

    if (!asset || !model) {
      return NextResponse.json({ error: 'Activo y modelo son requeridos' }, { status: 400 })
    }

    // Use asset name as default if no name provided
    const agentName = name || asset

    const agent = await db.agent.create({
      data: {
        userId,
        name: agentName,
        type: type || 'spot',
        operationType: operationType || 'market',
        status: 'paused',
        model: model,
        modelId: modelId || model,
        asset: asset,
        assetId: assetId || '',
        assetType: assetType || 'crypto',
        prompt: prompt || '',
        sources: sources || '',
        tvSymbol: tvSymbol || asset.replace('/', ''),
        provider: provider || 'BINANCE',
        timeframe: timeframe || '60',
        candleCount: candleCount || 50,
        predictionType: predictionType || 'swing',
        isMultiPrediction: isMultiPrediction || false,
        multiAssets: multiAssets || ''
      }
    })

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        operationType: agent.operationType,
        status: agent.status,
        model: agent.model,
        modelId: agent.modelId,
        asset: agent.asset,
        assetId: agent.assetId,
        assetType: agent.assetType,
        prompt: agent.prompt,
        sources: agent.sources,
        tvSymbol: agent.tvSymbol,
        provider: agent.provider,
        timeframe: agent.timeframe,
        candleCount: agent.candleCount,
        predictionType: agent.predictionType,
        isMultiPrediction: agent.isMultiPrediction,
        multiAssets: agent.multiAssets,
        createdAt: agent.createdAt
      }
    })
  } catch (error) {
    console.error('Create agent error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT - Update agent
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'))
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Verify agent belongs to user
    const existingAgent = await db.agent.findFirst({
      where: { id, userId }
    })

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
    }

    // Update agent
    const agent = await db.agent.update({
      where: { id },
      data: {
        name: updateData.name,
        type: updateData.type,
        operationType: updateData.operationType,
        status: updateData.status,
        model: updateData.model,
        modelId: updateData.modelId,
        prompt: updateData.prompt,
        sources: updateData.sources,
        timeframe: updateData.timeframe,
        candleCount: updateData.candleCount,
        predictionType: updateData.predictionType,
        isMultiPrediction: updateData.isMultiPrediction,
        multiAssets: updateData.multiAssets
      }
    })

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        operationType: agent.operationType,
        status: agent.status,
        model: agent.model,
        modelId: agent.modelId,
        asset: agent.asset,
        assetId: agent.assetId,
        assetType: agent.assetType,
        prompt: agent.prompt,
        sources: agent.sources,
        tvSymbol: agent.tvSymbol,
        provider: agent.provider,
        timeframe: agent.timeframe,
        candleCount: agent.candleCount
      }
    })
  } catch (error) {
    console.error('Update agent error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Delete agent
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'))
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Verify agent belongs to user
    const existingAgent = await db.agent.findFirst({
      where: { id, userId }
    })

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
    }

    await db.agent.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete agent error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

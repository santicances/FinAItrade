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

// GET - Fetch all predictions for user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'))
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const predictions = await db.prediction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Transform to match frontend interface
    const transformedPredictions = predictions.map(p => ({
      id: p.id,
      agentId: p.agentId,
      agentName: p.agentName,
      asset: p.asset,
      tvSymbol: p.tvSymbol,
      provider: p.provider,
      direction: p.direction,
      confidence: p.confidence,
      entry: p.entry,
      stopLoss: p.stopLoss,
      takeProfit: p.takeProfit,
      riskReward: p.riskReward,
      analysis: p.analysis,
      timeframe: p.timeframe,
      tokensUsed: p.tokensUsed,
      costEur: p.costEur,
      createdAt: p.createdAt
    }))

    return NextResponse.json({ predictions: transformedPredictions })
  } catch (error) {
    console.error('Get predictions error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Save prediction
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get('authorization'))
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      agentId, agentName, asset, tvSymbol, provider, 
      direction, confidence, entry, stopLoss, takeProfit, 
      riskReward, analysis, timeframe, tokensUsed, costEur 
    } = body

    // Get pricing config
    const pricing = await db.pricingConfig.findFirst()
    const pricePerMillion = pricing?.pricePerMillion || 3.5
    const calculatedCostEur = costEur || ((tokensUsed || 0) / 1000000) * pricePerMillion

    const prediction = await db.prediction.create({
      data: {
        userId,
        agentId: agentId || null,
        agentName: agentName || 'Manual',
        asset: asset,
        tvSymbol: tvSymbol || asset?.replace('/', '') || '',
        provider: provider || 'BINANCE',
        direction: direction || 'NEUTRAL',
        confidence: confidence || 50,
        entry: entry || 0,
        stopLoss: stopLoss || 0,
        takeProfit: takeProfit || 0,
        riskReward: riskReward || 0,
        analysis: analysis || '',
        timeframe: timeframe || '60',
        tokensUsed: tokensUsed || 0,
        costEur: calculatedCostEur
      }
    })

    // Update user tokens used and balance if tokens were used
    if (tokensUsed && tokensUsed > 0) {
      await db.profile.update({
        where: { id: userId },
        data: {
          tokensUsed: {
            increment: tokensUsed
          }
        }
      })

      // Update agent prediction count if agentId provided
      if (agentId) {
        await db.agent.update({
          where: { id: agentId },
          data: {
            predictionsCount: {
              increment: 1
            },
            lastPredictionAt: new Date()
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      prediction: {
        id: prediction.id,
        agentId: prediction.agentId,
        agentName: prediction.agentName,
        asset: prediction.asset,
        tvSymbol: prediction.tvSymbol,
        provider: prediction.provider,
        direction: prediction.direction,
        confidence: prediction.confidence,
        entry: prediction.entry,
        stopLoss: prediction.stopLoss,
        takeProfit: prediction.takeProfit,
        riskReward: prediction.riskReward,
        analysis: prediction.analysis,
        timeframe: prediction.timeframe,
        tokensUsed: prediction.tokensUsed,
        costEur: prediction.costEur,
        createdAt: prediction.createdAt
      }
    })
  } catch (error) {
    console.error('Save prediction error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Delete prediction
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

    // Verify prediction belongs to user
    const existingPrediction = await db.prediction.findFirst({
      where: { id, userId }
    })

    if (!existingPrediction) {
      return NextResponse.json({ error: 'Predicción no encontrada' }, { status: 404 })
    }

    await db.prediction.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete prediction error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

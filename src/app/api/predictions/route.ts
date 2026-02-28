import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch all predictions for user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: predictions, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Fetch predictions error:', error)
      return NextResponse.json({ error: 'Error al obtener predicciones' }, { status: 500 })
    }

    // Transform to match frontend interface
    const transformedPredictions = predictions?.map(p => ({
      id: p.id,
      agentId: p.agent_id,
      agentName: p.agent_name,
      asset: p.asset,
      tvSymbol: p.tv_symbol,
      provider: p.provider,
      direction: p.direction,
      confidence: p.confidence,
      entry: p.entry,
      stopLoss: p.stop_loss,
      takeProfit: p.take_profit,
      riskReward: p.risk_reward,
      analysis: p.analysis,
      timeframe: p.timeframe,
      createdAt: p.created_at
    })) || []

    return NextResponse.json({ predictions: transformedPredictions })
  } catch (error) {
    console.error('Get predictions error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Save prediction
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { agentId, agentName, asset, tvSymbol, provider, direction, confidence, entry, stopLoss, takeProfit, riskReward, analysis, timeframe, tokensUsed } = body

    const { data: prediction, error } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        agent_name: agentName,
        asset: asset,
        tv_symbol: tvSymbol,
        provider: provider || 'BINANCE',
        direction: direction,
        confidence: confidence,
        entry: entry,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        risk_reward: riskReward,
        analysis: analysis,
        timeframe: timeframe
      })
      .select()
      .single()

    if (error) {
      console.error('Save prediction error:', error)
      return NextResponse.json({ error: 'Error al guardar predicción' }, { status: 500 })
    }

    // Update tokens used if provided
    if (tokensUsed) {
      await supabase.rpc('increment_tokens_used', {
        user_id: user.id,
        tokens: tokensUsed
      }).catch(() => {
        // Fallback: direct update
        supabase
          .from('profiles')
          .update({ 
            tokens_used: supabase.rpc('increment', { 
              column: 'tokens_used', 
              value: tokensUsed 
            })
          })
          .eq('user_id', user.id)
      })
    }

    return NextResponse.json({
      success: true,
      prediction: {
        id: prediction.id,
        agentId: prediction.agent_id,
        agentName: prediction.agent_name,
        asset: prediction.asset,
        tvSymbol: prediction.tv_symbol,
        provider: prediction.provider,
        direction: prediction.direction,
        confidence: prediction.confidence,
        entry: prediction.entry,
        stopLoss: prediction.stop_loss,
        takeProfit: prediction.take_profit,
        riskReward: prediction.risk_reward,
        analysis: prediction.analysis,
        timeframe: prediction.timeframe,
        createdAt: prediction.created_at
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
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete prediction error:', error)
      return NextResponse.json({ error: 'Error al eliminar predicción' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete prediction error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

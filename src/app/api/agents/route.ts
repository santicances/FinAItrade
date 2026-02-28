import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// GET - Fetch all agents for user
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

    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch agents error:', error)
      return NextResponse.json({ error: 'Error al obtener agentes' }, { status: 500 })
    }

    // Transform to match frontend interface
    const transformedAgents = agents?.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      operationType: a.operation_type,
      status: a.status,
      model: a.model,
      modelId: a.model_id,
      asset: a.asset,
      assetId: a.asset_id,
      assetType: a.asset_type,
      prompt: a.prompt || '',
      tvSymbol: a.tv_symbol,
      provider: a.provider,
      timeframe: a.timeframe,
      candleCount: a.candle_count
    })) || []

    return NextResponse.json({ agents: transformedAgents })
  } catch (error) {
    console.error('Get agents error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Create new agent
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
    const { name, type, operationType, model, modelId, asset, assetId, assetType, prompt, tvSymbol, provider, timeframe, candleCount } = body

    if (!asset || !model) {
      return NextResponse.json({ error: 'Activo y modelo son requeridos' }, { status: 400 })
    }

    // Use asset name as default if no name provided
    const agentName = name || asset

    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        name: agentName,
        type: type || 'spot',
        operation_type: operationType || 'market',
        status: 'paused',
        model: model,
        model_id: modelId,
        asset: asset,
        asset_id: assetId || '',
        asset_type: assetType || 'crypto',
        prompt: prompt || '',
        tv_symbol: tvSymbol || asset.replace('/', ''),
        provider: provider || 'BINANCE',
        timeframe: timeframe || '60',
        candle_count: candleCount || 50
      })
      .select()
      .single()

    if (error) {
      console.error('Create agent error:', error)
      return NextResponse.json({ error: 'Error al crear agente' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        operationType: agent.operation_type,
        status: agent.status,
        model: agent.model,
        modelId: agent.model_id,
        asset: agent.asset,
        assetId: agent.asset_id,
        assetType: agent.asset_type,
        prompt: agent.prompt,
        tvSymbol: agent.tv_symbol,
        provider: agent.provider,
        timeframe: agent.timeframe,
        candleCount: agent.candle_count
      }
    })
  } catch (error) {
    console.error('Create agent error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Delete agent
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
      .from('agents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete agent error:', error)
      return NextResponse.json({ error: 'Error al eliminar agente' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete agent error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

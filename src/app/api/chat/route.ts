import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_KEY = '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'
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// Modelos disponibles en OpenRouter - IDs verificados
export const AVAILABLE_MODELS = [
  { id: 'minimax/minimax-m2.5', name: 'MiniMax M2.5', provider: 'MiniMax', badge: '🥇' },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI', badge: '🥈' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'Google', badge: '🥉' },
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek', badge: '⭐' },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, model, systemPrompt } = body

    if (!messages || !model) {
      return NextResponse.json(
        { error: 'Messages and model are required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finai.pro',
        'X-Title': 'finAiPro Trading Platform',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenRouter API Error:', errorData)
      return NextResponse.json(
        { error: errorData.error?.message || 'Error calling OpenRouter API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage,
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

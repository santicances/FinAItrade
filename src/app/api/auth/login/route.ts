import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Find user in database
    const user = await db.profile.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        mode: user.mode,
        balance: user.balance,
        tokensUsed: user.tokensUsed,
        freeCredits: user.freeCredits,
        preferredProducts: user.preferredProducts,
        riskTolerance: user.riskTolerance
      },
      session: {
        access_token: `local-${user.id}-${Date.now()}`,
        refresh_token: `local-refresh-${user.id}`,
        expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7 // 7 days
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

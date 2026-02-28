import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Session is managed client-side with localStorage
  return NextResponse.json({ user: null })
}

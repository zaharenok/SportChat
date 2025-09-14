import { NextRequest, NextResponse } from 'next/server'
import { usersDb } from '@/lib/redis-db'
import { authUtils } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('Login attempt...')
    const { email } = await request.json()
    console.log('Login email:', email)
    
    if (!email) {
      console.log('No email provided')
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Ищем пользователя по email
    console.log('Looking up user by email...')
    const user = await usersDb.getByEmail(email)
    console.log('User found:', user ? 'Yes' : 'No')
    
    if (!user) {
      console.log('User not found for email:', email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Создаем сессию
    console.log('Creating session for user:', user.id)
    const token = await authUtils.createSession(user.id)
    console.log('Session created, token length:', token.length)

    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })

    // Устанавливаем cookie с токеном
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 дней
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
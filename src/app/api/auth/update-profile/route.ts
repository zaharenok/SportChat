import { NextRequest, NextResponse } from 'next/server'
import { authUtils } from '@/lib/auth'
import { usersDb, fileDb } from '@/lib/json-db'

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = authUtils.getSession(token)
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { name, email } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Получаем всех пользователей
    const users = await usersDb.getAll()
    
    // Проверяем, что email не занят другим пользователем
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== session.userId)
    if (existingUser) {
      return NextResponse.json({ error: 'Email already taken' }, { status: 409 })
    }

    // Обновляем пользователя
    const updatedUsers = users.map(user => 
      user.id === session.userId 
        ? { ...user, name, email, updated_at: new Date().toISOString() }
        : user
    )

    await fileDb.writeFile('users.json', updatedUsers)

    // Возвращаем обновленные данные
    const updatedUser = updatedUsers.find(u => u.id === session.userId)!
    
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      created_at: updatedUser.created_at
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
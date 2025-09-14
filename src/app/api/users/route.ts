import { NextRequest, NextResponse } from 'next/server'
import { usersDb } from '@/lib/redis-db'

export async function GET() {
  try {
    const users = await usersDb.getAll()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Creating new user...')
    const { name, email } = await request.json()
    console.log('Received data:', { name, email })
    
    if (!name || !email) {
      console.log('Missing required fields')
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    console.log('Attempting to create user in database...')
    const newUser = await usersDb.create(name, email)
    console.log('User created successfully:', newUser)
    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to create user: ${errorMessage}` }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { usersDb, goalsDb } from '@/lib/redis-db'

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
    
    // Создаём дефолтные цели для нового пользователя
    console.log('Creating default goals for new user...')
    const defaultGoals = [
      {
        title: 'Подтянуться 20 раз',
        description: 'Моя первая цель по подтягиваниям',
        targetValue: 20,
        currentValue: 0,
        unit: 'раз',
        category: 'strength'
      },
      {
        title: 'Пробежать 5 км',
        description: 'Начальная цель по бегу',
        targetValue: 5,
        currentValue: 0,
        unit: 'км',
        category: 'cardio'
      },
      {
        title: 'Тренироваться 3 раза в неделю',
        description: 'Регулярные тренировки для поддержания формы',
        targetValue: 12,
        currentValue: 0,
        unit: 'тренировок',
        category: 'fitness'
      }
    ]
    
    try {
      for (const goalData of defaultGoals) {
        await goalsDb.create(newUser.id, goalData)
        console.log('Created default goal:', goalData.title)
      }
      console.log('All default goals created successfully')
    } catch (goalError) {
      console.error('Error creating default goals:', goalError)
      // Не прерываем создание пользователя из-за ошибки с целями
    }
    
    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to create user: ${errorMessage}` }, { status: 500 })
  }
}
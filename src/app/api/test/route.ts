import { NextRequest, NextResponse } from 'next/server'
import { workoutsDb, redisDb } from '@/lib/redis-db'

export async function GET() {
  try {
    console.log('🧪 TEST: Running simple Redis test...')
    
    // Простой тест чтения
    console.log('🧪 TEST: Reading workouts array...')
    const workouts = await redisDb.readArray('workouts')
    console.log('🧪 TEST: Found workouts:', workouts.length)
    
    return NextResponse.json({
      success: true,
      redis_connection: 'OK',
      workouts_count: workouts.length,
      workouts_sample: workouts.slice(0, 3), // Показываем первые 3 тренировки
      timestamp: new Date().toISOString(),
      message: 'Redis test completed successfully!'
    })
  } catch (error) {
    console.error('❌ TEST: Redis test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
import { Redis } from '@upstash/redis'

// Проверяем переменные окружения
console.log('🔧 REDIS CONFIG CHECK:')
console.log('KV_REST_API_URL exists:', !!process.env.KV_REST_API_URL)
console.log('KV_REST_API_TOKEN exists:', !!process.env.KV_REST_API_TOKEN)
console.log('KV_REST_API_URL value:', process.env.KV_REST_API_URL?.substring(0, 30) + '...')

// Создаем инстанс Redis используя переменные окружения Vercel KV
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Тест подключения при инициализации
;(async () => {
  try {
    console.log('🔗 Testing Redis connection...')
    const testResult = await redis.ping()
    console.log('✅ Redis connection successful:', testResult)
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
})()

export { redis }
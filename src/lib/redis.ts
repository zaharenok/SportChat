import { Redis } from '@upstash/redis'

// Создаем инстанс Redis используя переменные окружения Vercel KV
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export { redis }
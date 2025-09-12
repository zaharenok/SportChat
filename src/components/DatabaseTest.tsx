'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DatabaseTest() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const testConnection = async () => {
    if (!supabase) {
      setStatus('error')
      setMessage('Supabase не настроен')
      return
    }

    setStatus('testing')
    setMessage('Проверяем подключение...')

    try {
      // Простой запрос для проверки подключения
      const { error } = await supabase
        .from('days')
        .select('count')
        .limit(1)

      if (error && error.code !== 'PGRST116') {
        // PGRST116 означает что таблица пустая, это нормально
        throw error
      }

      setStatus('success')
      setMessage('✅ Подключение к Supabase успешно!')
    } catch (error: unknown) {
      setStatus('error')
      if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
        setMessage('❌ Таблица "days" не найдена. Нужно создать схему базы данных.')
      } else if (error && typeof error === 'object' && 'message' in error) {
        setMessage(`❌ Ошибка: ${error.message}`)
      } else {
        setMessage('❌ Произошла неизвестная ошибка')
      }
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'testing': return 'text-yellow-600'
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-3">Тест подключения к базе данных</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Статус Supabase:</span>
          <span className={`text-sm ${supabase ? 'text-green-600' : 'text-red-600'}`}>
            {supabase ? '✅ Настроен' : '❌ Не настроен'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">URL:</span>
          <span className="text-sm text-gray-600">
            {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Не задан'}
          </span>
        </div>

        <button
          onClick={testConnection}
          disabled={!supabase || status === 'testing'}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {status === 'testing' ? 'Проверяем...' : 'Проверить подключение'}
        </button>

        {message && (
          <div className={`text-sm ${getStatusColor()}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
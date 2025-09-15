'use client'

import { useState, useEffect } from 'react'

interface WorkoutSummary {
  id: string
  created_at: string
  day_id: string
  exercises_count: number
}

interface WorkoutsByMonth {
  [month: string]: WorkoutSummary[]
}

export default function AdminPage() {
  const [workoutsByMonth, setWorkoutsByMonth] = useState<WorkoutsByMonth>({})
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadWorkouts()
  }, [])

  const loadWorkouts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/workouts?action=list-by-month')
      const data = await response.json()
      setWorkoutsByMonth(data)
    } catch (error) {
      console.error('Error loading workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteMonths = async (months: string[]) => {
    if (!confirm(`Удалить тренировки за ${months.join(', ')}?`)) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/admin/workouts?months=${months.join(',')}&userId=user-default`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        alert(`Удалено ${result.deleted_count} тренировок`)
        await loadWorkouts() // Перезагружаем данные
      } else {
        alert('Ошибка при удалении')
      }
    } catch (error) {
      console.error('Error deleting workouts:', error)
      alert('Ошибка при удалении')
    } finally {
      setDeleting(false)
    }
  }

  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const monthNames = [
      'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
      'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Управление тренировками</h1>
        <p>Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Управление тренировками</h1>
      
      <div className="mb-6">
        <button
          onClick={() => deleteMonths(['2024-06', '2024-07', '2024-08'])}
          disabled={deleting}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? 'Удаление...' : 'Удалить июнь, июль, август 2024'}
        </button>
      </div>

      <div className="space-y-4">
        {Object.keys(workoutsByMonth).length === 0 ? (
          <p>Тренировки не найдены</p>
        ) : (
          Object.entries(workoutsByMonth)
            .sort(([a], [b]) => b.localeCompare(a)) // Сортируем по убыванию (новые сверху)
            .map(([month, workouts]) => (
              <div key={month} className="border rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">
                    {getMonthName(month)} ({workouts.length} тренировок)
                  </h3>
                  <button
                    onClick={() => deleteMonths([month])}
                    disabled={deleting}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                  >
                    Удалить месяц
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                  {workouts.map(workout => (
                    <div key={workout.id} className="bg-gray-100 p-2 rounded">
                      <div>ID: {workout.id.slice(-8)}</div>
                      <div>Дата: {new Date(workout.created_at).toLocaleDateString('ru-RU')}</div>
                      <div>Упражнений: {workout.exercises_count}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
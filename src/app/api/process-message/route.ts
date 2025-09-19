import { NextRequest, NextResponse } from 'next/server'
import { chatDb, workoutsDb, goalsDb } from '@/lib/redis-db'
import type { Exercise, Goal } from '@/lib/redis-db'

export async function POST(request: NextRequest) {
  try {
    const { userId, dayId, message } = await request.json()
    
    if (!userId || !dayId || !message) {
      return NextResponse.json({ 
        error: 'userId, dayId, and message are required' 
      }, { status: 400 })
    }

    console.log('📨 Processing message:', { userId, dayId, message })

    // 1. Сохраняем пользовательское сообщение
    const userMessage = await chatDb.create(userId, dayId, message, true)
    console.log('💾 User message saved:', userMessage.id)

    // 2. Вызываем webhook для обработки сообщения
    const webhookUrl = process.env.WEBHOOK_URL
    if (!webhookUrl) {
      throw new Error('Webhook URL not configured')
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        message,
        user_email: "test@example.com", // TODO: получать из пользователя
        user_name: "Тестовый пользователь", // TODO: получать из пользователя
      }),
    })

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.status}`)
    }

    const webhookData = await webhookResponse.json()
    console.log('🎯 Webhook response:', webhookData)

    const output = webhookData.output
    if (!output) {
      throw new Error('Invalid webhook response structure')
    }

    // 3. Сохраняем ответ системы
    if (output.message) {
      const botMessage = await chatDb.create(userId, dayId, output.message, false)
      console.log('🤖 Bot message saved:', botMessage.id)
    }

    // 4. Обрабатываем тренировку и обновляем цели
    if (output.workout_logged && output.parsed_exercises && output.parsed_exercises.length > 0) {
      console.log('🏋️ Processing workout:', output.parsed_exercises)
      
      // Сохраняем тренировку
      const workout = await workoutsDb.create(
        userId,
        dayId,
        userMessage.id, // ID пользовательского сообщения
        output.parsed_exercises
      )
      console.log('✅ Workout saved:', workout.id)

      // Обновляем цели
      await updateGoalsFromExercises(output.parsed_exercises, userId)
    }

    // 5. Сохраняем рекомендации если есть
    if (output.suggestions && output.suggestions.length > 0) {
      const suggestionsText = "💡 Рекомендации:\n" + output.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")
      const suggestionsMessage = await chatDb.create(userId, dayId, suggestionsText, false)
      console.log('💡 Suggestions saved:', suggestionsMessage.id)
    }

    return NextResponse.json({
      success: true,
      userMessage,
      workout_logged: output.workout_logged,
      parsed_exercises: output.parsed_exercises || [],
      message: output.message
    })

  } catch (error) {
    console.error('❌ Error processing message:', error)
    return NextResponse.json({ 
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Функция для автоматического обновления целей на основе упражнений
async function updateGoalsFromExercises(exercises: Exercise[], userId: string) {
  try {
    console.log("🎯 Checking goals for exercise updates...")
    
    // Получаем все цели пользователя
    const goals = await goalsDb.getByUser(userId)
    console.log("📋 User goals:", goals.map((g: Goal) => ({ title: g.title, current: g.current_value, target: g.target_value })))
    
    for (const exercise of exercises) {
      const exerciseName = exercise.name.toLowerCase()
      const totalReps = exercise.reps * exercise.sets
      
      console.log(`🏋️ Processing exercise: ${exerciseName}, total reps: ${totalReps}`)
      
      // Ищем подходящие цели
      for (const goal of goals) {
        const goalTitle = goal.title.toLowerCase()
        console.log(`🔍 Comparing exercise "${exerciseName}" with goal "${goalTitle}"`)
        
        // Расширенная логика сопоставления упражнений и целей
        const isMatchingGoal = 
          // Подтягивания - различные формы
          ((exerciseName.includes("подтягивани") || exerciseName.includes("подтягива")) && 
           (goalTitle.includes("подтягива") || goalTitle.includes("подтягат") || goalTitle.includes("подтянут"))) ||
          // Приседания  
          ((exerciseName.includes("приседани") || exerciseName.includes("приседа")) && 
           (goalTitle.includes("приседа") || goalTitle.includes("присест"))) ||
          // Отжимания
          ((exerciseName.includes("отжимани") || exerciseName.includes("отжима")) && 
           (goalTitle.includes("отжима") || goalTitle.includes("отжат"))) ||
          // Планка
          (exerciseName.includes("планк") && goalTitle.includes("планк")) ||
          // Пресс
          (exerciseName.includes("пресс") && goalTitle.includes("пресс"))
        
        console.log(`🤔 Is matching goal? ${isMatchingGoal}`)
        
        if (isMatchingGoal) {
          const newValue = Math.max(0, goal.current_value - totalReps)
          console.log(`🎯 Updating goal "${goal.title}": ${goal.current_value} - ${totalReps} = ${newValue}`)
          
          try {
            // Обновляем цель
            const updatedGoal = await goalsDb.update(goal.id, {
              currentValue: newValue,
              isCompleted: newValue <= 0
            })
            
            console.log(`✅ Goal updated successfully:`, updatedGoal)
            console.log(`📊 Progress: ${newValue}/${goal.target_value} (${Math.round((newValue/goal.target_value)*100)}%)`)
          } catch (error) {
            console.error(`❌ Failed to update goal "${goal.title}":`, error)
          }
        } else {
          console.log(`⏭️ Goal "${goalTitle}" doesn't match exercise "${exerciseName}"`)
        }
      }
    }
  } catch (error) {
    console.error("❌ Error updating goals from exercises:", error)
  }
}
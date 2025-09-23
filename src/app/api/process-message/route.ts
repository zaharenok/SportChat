import { NextRequest, NextResponse } from 'next/server'
import { chatDb, workoutsDb, goalsDb, achievementsDb } from '@/lib/redis-db'
import type { Exercise, Goal } from '@/lib/redis-db'

// Функция для получения иконки достижения в зависимости от типа цели
function getGoalIcon(goalTitle: string): string {
  const title = goalTitle.toLowerCase()
  
  if (title.includes('подтягива') || title.includes('подтянут')) return '💪'
  if (title.includes('приседа') || title.includes('присест')) return '🦵'
  if (title.includes('отжима') || title.includes('отжат')) return '💥'
  if (title.includes('планк')) return '⏱️'
  if (title.includes('пресс')) return '🔥'
  if (title.includes('бег') || title.includes('кардио')) return '🏃'
  if (title.includes('йога') || title.includes('растяжк')) return '🧘'
  
  return '🏆' // дефолтная иконка
}

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

    // Webhook возвращает массив, берем первый элемент
    const firstResponse = Array.isArray(webhookData) ? webhookData[0] : webhookData
    const output = firstResponse?.output
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

      // Обновляем цели на основе упражнений И частоты тренировок
      const goalUpdates = await updateGoalsFromExercises(output.parsed_exercises, userId, message)
      const frequencyUpdates = await updateFrequencyGoals(userId)
      
      // Отправляем сообщения о прогрессе целей
      const allUpdates = [...goalUpdates, ...frequencyUpdates]
      if (allUpdates.length > 0) {
        for (const update of allUpdates) {
          const goalMessage = await chatDb.create(userId, dayId, update, false)
          console.log('🎯 Goal progress message saved:', goalMessage.id)
        }
      }
    }

    // 5. Сохраняем рекомендации если есть
    console.log('🔍 Checking suggestions:', {
      hasSuggestions: !!output.suggestions,
      suggestionsCount: output.suggestions?.length || 0,
      suggestions: output.suggestions
    })
    
    if (output.suggestions && output.suggestions.length > 0) {
      const suggestionsText = "💡 Рекомендации:\n" + output.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")
      console.log('💡 Creating suggestions message:', suggestionsText)
      const suggestionsMessage = await chatDb.create(userId, dayId, suggestionsText, false)
      console.log('💡 Suggestions saved:', suggestionsMessage.id)
    } else {
      console.log('⚠️ No suggestions to save')
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
async function updateGoalsFromExercises(exercises: Exercise[], userId: string, originalMessage: string): Promise<string[]> {
  const messages: string[] = []
  
  try {
    console.log("🎯 Checking goals for exercise updates...")
    
    // Получаем все цели пользователя
    const goals = await goalsDb.getByUser(userId)
    console.log("📋 User goals:", goals.map((g: Goal) => ({ title: g.title, current: g.current_value, target: g.target_value })))
    
    for (const exercise of exercises) {
      const exerciseName = exercise.name.toLowerCase()
      
      // Определяем тип упражнения и соответствующую единицу измерения
      const isCardio = exerciseName.includes("ходьб") || exerciseName.includes("прогул") || 
                      exerciseName.includes("гулял") || exerciseName.includes("шел") || 
                      exerciseName.includes("идти") || exerciseName.includes("бег") || 
                      exerciseName.includes("бежал") || exerciseName.includes("пробеж")
      
      // Для кардио используем reps как километры, для обычных упражнений - reps * sets
      let exerciseValue = isCardio ? exercise.reps : exercise.reps * exercise.sets
      
      // ФОЛЛБЭК: Если кардио упражнение и reps = 1, пытаемся извлечь расстояние из исходного сообщения
      if (isCardio && exercise.reps === 1) {
        console.log(`⚠️ Cardio exercise "${exerciseName}" has reps=1, parsing distance from: "${originalMessage}"`)
        
        // Ищем числа с км в исходном сообщении
        const distanceMatch = originalMessage.toLowerCase().match(/(\d+(?:\.\d+)?)\s*км/);
        if (distanceMatch) {
          const parsedDistance = parseFloat(distanceMatch[1]);
          console.log(`✅ Found distance in message: ${parsedDistance} км`);
          exerciseValue = parsedDistance;
        } else {
          console.log(`❌ Could not parse distance from message, using default: ${exerciseValue} км`);
        }
      }
      
      const unit = isCardio ? "км" : "раз"
      
      console.log(`🏋️ Processing exercise: ${exerciseName}, value: ${exerciseValue} ${unit} (cardio: ${isCardio})`)
      
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
          (exerciseName.includes("пресс") && goalTitle.includes("пресс")) ||
          // Кардио - ходьба/прогулки
          ((exerciseName.includes("ходьб") || exerciseName.includes("прогул") || exerciseName.includes("гулял") || exerciseName.includes("шел") || exerciseName.includes("идти")) && 
           (goalTitle.includes("ходьб") || goalTitle.includes("прогул") || goalTitle.includes("проходить") || goalTitle.includes("км"))) ||
          // Кардио - бег
          ((exerciseName.includes("бег") || exerciseName.includes("бежал") || exerciseName.includes("пробеж")) && 
           (goalTitle.includes("бег") || goalTitle.includes("бежать") || goalTitle.includes("пробежать") || goalTitle.includes("км")))
        
        console.log(`🤔 Is matching goal? ${isMatchingGoal}`)
        
        if (isMatchingGoal) {
          const newValue = Math.min(goal.target_value, goal.current_value + exerciseValue)
          console.log(`🎯 Updating goal "${goal.title}": ${goal.current_value} + ${exerciseValue} = ${newValue}`)
          
          try {
            // Обновляем цель
            const updatedGoal = await goalsDb.update(goal.id, {
              currentValue: newValue,
              isCompleted: newValue >= goal.target_value
            })
            
            console.log(`✅ Goal updated successfully:`, updatedGoal)
            console.log(`📊 Progress: ${newValue}/${goal.target_value} (${Math.round((newValue/goal.target_value)*100)}%)`)
            
            // Определяем единицу измерения для сообщений
            const goalUnit = isCardio ? "км" : (goal.unit || 'раз')
            
            // Если цель завершена, создаем достижение и удаляем цель
            if (newValue >= goal.target_value) {
              console.log(`🎉 Goal completed! Creating achievement...`)
              
              messages.push(`🎉 Цель "${goal.title}" завершена! Поздравляю, ты достиг результата ${goal.target_value} ${goalUnit}!`)
              
              try {
                // Создаем достижение
                const achievement = await achievementsDb.create(
                  userId,
                  `Выполнена цель: ${goal.title}`,
                  `Успешно завершена цель "${goal.title}" (${goal.target_value} ${goalUnit})`,
                  getGoalIcon(goal.title)
                )
                
                console.log(`🏆 Achievement created:`, achievement.title)
                
                // Удаляем завершенную цель
                await goalsDb.delete(goal.id)
                console.log(`🗑️ Completed goal deleted:`, goal.title)
                
              } catch (achievementError) {
                console.error(`❌ Failed to create achievement or delete goal:`, achievementError)
              }
            } else {
              // Цель обновлена, но не завершена
              const remaining = goal.target_value - newValue
              const progress = Math.round((newValue / goal.target_value) * 100)
              messages.push(`🎯 Обновлена цель "${goal.title}": ${newValue}/${goal.target_value} ${goalUnit} (${progress}%). Осталось: ${remaining} ${goalUnit}.`)
            }
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
  
  return messages
}

// Функция для обновления целей по частоте тренировок (например, "Тренироваться 3 раза в неделю")
async function updateFrequencyGoals(userId: string): Promise<string[]> {
  const messages: string[] = []
  
  try {
    console.log("📅 Checking frequency goals...")
    
    // Получаем все цели пользователя
    const goals = await goalsDb.getByUser(userId)
    console.log("📋 User goals:", goals.map((g: Goal) => ({ title: g.title, current: g.current_value, target: g.target_value })))
    
    // Получаем все тренировки пользователя
    const allWorkouts = await workoutsDb.getByUser(userId)
    
    // Подсчитываем тренировки за текущую неделю
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const weeklyTrainingDays = new Set(
      allWorkouts
        .filter(workout => new Date(workout.created_at) >= weekAgo)
        .map(workout => new Date(workout.created_at).toISOString().split('T')[0])
    ).size
    
    console.log(`📊 Training days this week: ${weeklyTrainingDays}`)
    
    // Ищем цели по частоте тренировок
    for (const goal of goals) {
      const goalTitle = goal.title.toLowerCase()
      
      // Проверяем, является ли цель целью по частоте тренировок
      const isFrequencyGoal = 
        (goalTitle.includes("тренирова") && goalTitle.includes("раз") && goalTitle.includes("недел")) ||
        (goalTitle.includes("заниматься") && goalTitle.includes("раз") && goalTitle.includes("недел")) ||
        (goalTitle.includes("тренировок") && goalTitle.includes("недел"))
      
      console.log(`🔍 Goal "${goal.title}" is frequency goal: ${isFrequencyGoal}`)
      
      if (isFrequencyGoal) {
        const oldValue = goal.current_value
        const newValue = Math.min(goal.target_value, weeklyTrainingDays)
        console.log(`📅 Updating frequency goal "${goal.title}": current days = ${newValue}`)
        
        // Обновляем только если значение изменилось
        if (newValue !== oldValue) {
          try {
            const updatedGoal = await goalsDb.update(goal.id, {
              currentValue: newValue,
              isCompleted: newValue >= goal.target_value
            })
            
            console.log(`✅ Frequency goal updated successfully:`, updatedGoal)
            console.log(`📊 Progress: ${newValue}/${goal.target_value} training days`)
            
            // Если цель завершена, создаем достижение и удаляем цель
            if (newValue >= goal.target_value) {
              console.log(`🎉 Frequency goal completed! Creating achievement...`)
              
              messages.push(`🎉 Цель "${goal.title}" завершена! Поздравляю, ты тренировался ${goal.target_value} раз в неделю!`)
              
              try {
                const achievement = await achievementsDb.create(
                  userId,
                  `Выполнена цель: ${goal.title}`,
                  `Успешно завершена цель "${goal.title}" (${goal.target_value} тренировок в неделю)`,
                  '🗓️'
                )
                
                console.log(`🏆 Frequency achievement created:`, achievement.title)
                
                // Удаляем завершенную цель
                await goalsDb.delete(goal.id)
                console.log(`🗑️ Completed frequency goal deleted:`, goal.title)
                
              } catch (achievementError) {
                console.error(`❌ Failed to create frequency achievement:`, achievementError)
              }
            } else {
              // Цель обновлена, но не завершена
              const remaining = goal.target_value - newValue
              const progress = Math.round((newValue / goal.target_value) * 100)
              messages.push(`📅 Обновлена цель "${goal.title}": ${newValue}/${goal.target_value} тренировок в неделю (${progress}%). Осталось: ${remaining} дней.`)
            }
          } catch (error) {
            console.error(`❌ Failed to update frequency goal "${goal.title}":`, error)
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error updating frequency goals:", error)
  }
  
  return messages
}
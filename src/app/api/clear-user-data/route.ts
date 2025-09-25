import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🗑️ Clearing all data for user: ${userId}`);

    // Получаем все ключи для пользователя
    const allKeys = await redis.keys('*');
    
    // Фильтруем ключи, связанные с пользователем
    const userKeys = allKeys.filter((key: string) => {
      return key.includes(userId) || 
             key.startsWith(`workouts:${userId}`) ||
             key.startsWith(`goals:${userId}`) ||
             key.startsWith(`achievements:${userId}`) ||
             key.startsWith(`days:${userId}`) ||
             key.startsWith(`messages:${userId}`);
    });

    console.log(`📋 Found ${userKeys.length} keys to delete:`, userKeys);

    // Удаляем все ключи пользователя
    if (userKeys.length > 0) {
      await redis.del(...userKeys);
      console.log(`✅ Deleted ${userKeys.length} keys for user ${userId}`);
    }

    // Дополнительно проверяем и удаляем тренировки по отдельности
    const workouts = await redis.keys(`workout:*`);
    const userWorkouts = [];
    
    for (const workoutKey of workouts) {
      try {
        const workout = await redis.get(workoutKey);
        if (workout && typeof workout === 'object' && 'user_id' in workout && workout.user_id === userId) {
          userWorkouts.push(workoutKey);
        }
      } catch (error) {
        console.log(`⚠️ Could not check workout ${workoutKey}:`, error);
      }
    }

    if (userWorkouts.length > 0) {
      await redis.del(...userWorkouts);
      console.log(`🏋️ Deleted ${userWorkouts.length} workout records`);
    }

    // Проверяем цели
    const goals = await redis.keys(`goal:*`);
    const userGoals = [];
    
    for (const goalKey of goals) {
      try {
        const goal = await redis.get(goalKey);
        if (goal && typeof goal === 'object' && 'user_id' in goal && goal.user_id === userId) {
          userGoals.push(goalKey);
        }
      } catch (error) {
        console.log(`⚠️ Could not check goal ${goalKey}:`, error);
      }
    }

    if (userGoals.length > 0) {
      await redis.del(...userGoals);
      console.log(`🎯 Deleted ${userGoals.length} goal records`);
    }

    // Проверяем достижения
    const achievements = await redis.keys(`achievement:*`);
    const userAchievements = [];
    
    for (const achievementKey of achievements) {
      try {
        const achievement = await redis.get(achievementKey);
        if (achievement && typeof achievement === 'object' && 'user_id' in achievement && achievement.user_id === userId) {
          userAchievements.push(achievementKey);
        }
      } catch (error) {
        console.log(`⚠️ Could not check achievement ${achievementKey}:`, error);
      }
    }

    if (userAchievements.length > 0) {
      await redis.del(...userAchievements);
      console.log(`🏆 Deleted ${userAchievements.length} achievement records`);
    }

    // Проверяем сообщения
    const messages = await redis.keys(`message:*`);
    const userMessages = [];
    
    for (const messageKey of messages) {
      try {
        const message = await redis.get(messageKey);
        if (message && typeof message === 'object' && 'dayId' in message) {
          // Проверяем день по dayId
          const dayKey = `day:${message.dayId}`;
          const day = await redis.get(dayKey);
          if (day && typeof day === 'object' && 'userId' in day && day.userId === userId) {
            userMessages.push(messageKey);
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not check message ${messageKey}:`, error);
      }
    }

    if (userMessages.length > 0) {
      await redis.del(...userMessages);
      console.log(`💬 Deleted ${userMessages.length} message records`);
    }

    const totalDeleted = userKeys.length + userWorkouts.length + userGoals.length + userAchievements.length + userMessages.length;

    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${totalDeleted} records for user ${userId}`,
      details: {
        userKeys: userKeys.length,
        workouts: userWorkouts.length,
        goals: userGoals.length,
        achievements: userAchievements.length,
        messages: userMessages.length
      }
    });

  } catch (error) {
    console.error('❌ Error clearing user data:', error);
    return NextResponse.json(
      { error: 'Failed to clear user data' },
      { status: 500 }
    );
  }
}
"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { workoutsApi, goalsApi, chatApi, Goal, Exercise } from './client-api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  dayId?: string; // Связываем с конкретным днем
  hasPhoto?: boolean; // Есть ли фото в сообщении
  photoPreview?: string; // Base64 превью фото для отображения
}

interface ChatContextType {
  // Сообщения для текущего дня
  messages: Message[];
  isLoading: boolean;
  
  // Методы
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setMessages: (messages: Message[]) => void;
  setLoading: (loading: boolean) => void;
  sendMessage: (text: string, userId: string, dayId: string, onWorkoutSaved?: () => void, userEmail?: string, userName?: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const addMessageWithDelay = useCallback((text: string, delay: number, dayId?: string, userId?: string) => {
    setTimeout(async () => {
      // Добавляем в локальное состояние
      addMessage({
        text,
        isUser: false,
        dayId
      });
      
      // Сохраняем в базу данных
      if (dayId && userId) {
        try {
          await chatApi.create(userId, dayId, text, false);
          console.log("💾 Message saved to database:", text.substring(0, 50) + "...");
        } catch (error) {
          console.error("❌ Error saving message to database:", error);
        }
      }
    }, delay);
  }, [addMessage]);

  // Функция для автоматического обновления целей на основе упражнений
  const updateGoalsFromExercises = useCallback(async (exercises: Exercise[], userId: string) => {
    try {
      console.log("🎯 Checking goals for exercise updates...");
      
      // Получаем все цели пользователя
      const goals = await goalsApi.getAll(userId);
      console.log("📋 User goals:", goals.map((g: Goal) => ({ title: g.title, current: g.current_value, target: g.target_value })));
      
      for (const exercise of exercises) {
        const exerciseName = exercise.name.toLowerCase();
        const totalReps = exercise.reps * exercise.sets;
        
        console.log(`🏋️ Processing exercise: ${exerciseName}, total reps: ${totalReps}`);
        
        // Ищем подходящие цели
        for (const goal of goals) {
          const goalTitle = goal.title.toLowerCase();
          console.log(`🔍 Comparing exercise "${exerciseName}" with goal "${goalTitle}"`);
          
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
            (exerciseName.includes("пресс") && goalTitle.includes("пресс"));
          
          console.log(`🤔 Is matching goal? ${isMatchingGoal}`);
          
          if (isMatchingGoal) {
            const newValue = Math.max(0, goal.current_value - totalReps);
            console.log(`🎯 Updating goal "${goal.title}": ${goal.current_value} - ${totalReps} = ${newValue}`);
            
            try {
              // Обновляем цель
              const updatedGoal = await goalsApi.update(goal.id, {
                currentValue: newValue,
                isCompleted: newValue <= 0
              });
              
              console.log(`✅ Goal updated successfully:`, updatedGoal);
              console.log(`📊 Progress: ${newValue}/${goal.target_value} (${Math.round((newValue/goal.target_value)*100)}%)`);
            } catch (error) {
              console.error(`❌ Failed to update goal "${goal.title}":`, error);
            }
          } else {
            console.log(`⏭️ Goal "${goalTitle}" doesn't match exercise "${exerciseName}"`);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error updating goals:", error);
    }
  }, []);

  const sendMessage = useCallback(async (text: string, userId: string, dayId: string, onWorkoutSaved?: () => void, userEmail?: string, userName?: string) => {
    // Добавляем пользовательское сообщение
    const userMessage = {
      text: text.trim(),
      isUser: true,
      dayId
    };
    
    addMessage(userMessage);
    setIsLoading(true);

    try {
      console.log("🌍 GLOBAL: Sending message to webhook:", text);

      const response = await fetch("/api/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          message: text,
          user_email: userEmail || "user@example.com",
          user_name: userName || "User",
        }),
      });

      if (!response.ok) {
        console.error("HTTP error:", response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("🌍 GLOBAL: Full webhook response:", JSON.stringify(data, null, 2));

      // Проверяем структуру ответа
      let output = null;
      
      if (data && Array.isArray(data) && data.length > 0 && data[0] && data[0].output) {
        output = data[0].output;
        console.log("🌍 GLOBAL: Found array response structure");
      } else if (data && !Array.isArray(data) && 'output' in data) {
        output = data.output;
        console.log("🌍 GLOBAL: Found object response structure");
      }

      if (output) {
        console.log("🌍 GLOBAL: Extracted output:", output);

        // Основное сообщение
        if (output.message) {
          console.log("🌍 GLOBAL: Adding main message with delay");
          addMessageWithDelay(output.message, 1000, dayId, userId);
        }

        // Сохраняем тренировку если она была распознана
        if (output.workout_logged && output.parsed_exercises && output.parsed_exercises.length > 0) {
          console.log("🏋️ GLOBAL: Saving workout data:", {
            userId,
            dayId,
            exercises: output.parsed_exercises
          });
          
          try {
            const savedWorkout = await workoutsApi.create(
              userId,
              dayId,
              Date.now().toString(), // ID пользовательского сообщения
              output.parsed_exercises
            );
            console.log("✅ GLOBAL: Workout saved successfully:", savedWorkout);
            
            // Обновляем цели на основе упражнений
            await updateGoalsFromExercises(output.parsed_exercises, userId);
            
            // Уведомляем об обновлении данных
            if (onWorkoutSaved) {
              onWorkoutSaved();
            }
          } catch (error) {
            console.error("❌ GLOBAL: Error saving workout:", error);
          }
        } else {
          console.log("ℹ️ GLOBAL: No workout to save:", {
            workout_logged: output.workout_logged,
            parsed_exercises: output.parsed_exercises
          });
        }

        // Рекомендации
        if (output.suggestions && output.suggestions.length > 0) {
          console.log("🌍 GLOBAL: Adding suggestions with delay");
          const suggestionsText = "💡 Рекомендации:\n" + output.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n");
          addMessageWithDelay(suggestionsText, 6000, dayId, userId);
        }
      } else {
        console.log("🌍 GLOBAL: No valid data structure found in response");
        addMessageWithDelay("Получен ответ в неожиданном формате. Проверьте настройки webhook.", 1000, dayId, userId);
      }

    } catch (error) {
      console.error("🌍 GLOBAL: Error sending message:", error);
      
      // Fallback для демонстрации
      if (text.toLowerCase().includes("тест")) {
        addMessageWithDelay("Отлично! Тестовое сообщение получено 💪", 1000, dayId, userId);
        addMessageWithDelay("💡 Рекомендации:\n1. Продолжай тренировки\n2. Следи за питанием\n3. Не забывай про отдых", 6000, dayId, userId);
      } else {
        addMessageWithDelay("Извини, произошла ошибка при подключении к серверу. Попробуй еще раз!", 1000, dayId, userId);
      }
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, addMessageWithDelay, updateGoalsFromExercises]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value: ChatContextType = {
    messages,
    isLoading,
    addMessage,
    setMessages,
    setLoading: setIsLoading,
    sendMessage,
    clearMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
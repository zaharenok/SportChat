"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Mic, Square, Camera, Image, X, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chatApi, Day, User, ChatMessage } from "@/lib/client-api";
import { useChatContext } from "@/lib/chat-context";
import { useLanguage } from "@/lib/language-context";
import { TypewriterText } from "./TypewriterText";

// Интерфейс для ответа API
interface ApiResponse {
  success: boolean;
  message?: string;
  suggestions?: string;
  next_workout_recommendation?: string;
  workout_logged?: boolean;
  parsed_exercises?: Array<{
    name: string;
    weight: number;
    sets: number;
    reps: number;
  }>;
  recognizedText?: string;
  isFirstAudioResponse?: boolean; // Флаг для первого ответа аудио
}

// Интерфейсы для разных форматов webhook ответов
interface WebhookResponseAudio {
  text: string;
  usage: {
    type: string;
    seconds: number;
  };
}

// Новый формат для n8n workflow (аудио)
interface WebhookResponseTranscription {
  text_transcribed: string;
}

// Новый формат для n8n workflow (фото)
interface WebhookResponsePhoto {
  photo_text: string;
}

interface WebhookResponseMain {
  output: {
    message: string;
    workout_logged?: boolean;
    parsed_exercises?: Array<{
      name: string;
      weight: number;
      sets: number;
      reps: number;
    }>;
    suggestions?: string | string[];
    next_workout_recommendation?: string;
  };
}

// Общий тип для webhook ответа
type WebhookResponse =
  | WebhookResponseAudio[]
  | WebhookResponseMain[]
  | WebhookResponseTranscription[]
  | WebhookResponsePhoto[]
  | (WebhookResponseTranscription | WebhookResponseMain)[] // Комбинированный ответ для аудио
  | (WebhookResponsePhoto | WebhookResponseMain)[] // Комбинированный ответ для фото
  | ApiResponse  // Fallback на старый формат


interface ChatProps {
  selectedDay: Day | null;
  selectedUser: User;
  onWorkoutSaved?: () => void; // Колбек для уведомления о сохранении тренировки
}

export function Chat({ selectedDay, selectedUser, onWorkoutSaved }: ChatProps) {
  const { messages, isLoading, setMessages, sendMessage, addMessage, setLoading } = useChatContext();
  const { t } = useLanguage();
  const [inputMessage, setInputMessage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [isNewMessage, setIsNewMessage] = useState(false);
  
  // Аудио запись состояния
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Счетчики времени для индикаторов
  const [processingTimer, setProcessingTimer] = useState(0);
  const [loadingTimer, setLoadingTimer] = useState(0);
  
  // Фото состояния
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Состояние выпадающего меню для вложений
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  // Состояние для обработки двухэтапных аудио ответов
  const [isWaitingForSecondResponse, setIsWaitingForSecondResponse] = useState(false);
  const [firstAudioResponse, setFirstAudioResponse] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [selectedDay]); // eslint-disable-line react-hooks/exhaustive-deps

  // Закрытие выпадающего меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isAttachmentMenuOpen) {
        const target = event.target as HTMLElement;
        const attachmentButton = target.closest('.attachment-menu-container');
        if (!attachmentButton) {
          setIsAttachmentMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAttachmentMenuOpen]);

  const loadChatHistory = async () => {
    if (!selectedDay) {
      setMessages([]);
      setIsInitialized(true);
      // Очищаем состояния эффекта печатания
      setTypingMessageId(null);
      setIsNewMessage(false);
      return;
    }

    try {
      const chatMessages = await chatApi.getByDay(selectedDay.id);
      
      if (chatMessages.length === 0) {
        // Если нет сообщений для этого дня, добавляем приветственное
        const dayDate = new Date(selectedDay.date + 'T00:00:00');
        const today = new Date();
        const isToday = selectedDay.date === today.toISOString().split('T')[0];
        
        const dayOfWeek = dayDate.toLocaleDateString('ru-RU', { weekday: 'long' });
        const dayMonth = dayDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        
        let welcomeText;
        if (isToday) {
          welcomeText = `Привет! 🌟 Сегодня ${dayOfWeek}, ${dayMonth}. Будет ли сегодня тренировка? Расскажи, что планируешь делать!`;
        } else {
          welcomeText = `Привет! 💪 Это ${dayOfWeek}, ${dayMonth}. Расскажи, как прошла тренировка или что планировал в этот день?`;
        }
        
        const welcomeMessage = {
          id: "welcome",
          text: welcomeText,
          isUser: false,
          timestamp: new Date(),
          dayId: selectedDay.id
        };
        setMessages([welcomeMessage]);

        // Сохраняем приветственное сообщение в базу
        await chatApi.create(selectedUser.id, selectedDay.id, welcomeMessage.text, false);
      } else {
        // Преобразуем сообщения из базы в локальный формат
        const localMessages = chatMessages.map((msg: ChatMessage) => ({
          id: msg.id,
          text: msg.message,
          isUser: msg.is_user,
          timestamp: new Date(msg.timestamp),
          dayId: selectedDay.id
        }));
        setMessages(localMessages);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории чата:', error);
      setMessages([]);
    } finally {
      setIsInitialized(true);
      // Очищаем состояния эффекта печатания при загрузке истории
      setTypingMessageId(null);
      setIsNewMessage(false);
    }
  };

  // Функция для парсинга разных форматов ответов от webhook
  const parseWebhookResponse = (data: WebhookResponse): ApiResponse => {
    console.log('🔄 parseWebhookResponse input:', JSON.stringify(data, null, 2));

    // НОВАЯ ЛОГИКА: Проверяем если пришел только первый ответ с text_transcribed
    if (data && typeof data === 'object' && 'text_transcribed' in data && !('output' in data) && !Array.isArray(data)) {
      const transcriptionData = data as WebhookResponseTranscription;
      console.log('🎤 First audio response detected:', transcriptionData.text_transcribed);
      return {
        success: true,
        recognizedText: transcriptionData.text_transcribed,
        message: undefined, // Нет AI ответа в первом запросе
        isFirstAudioResponse: true, // Флаг первого ответа
        workout_logged: false,
        parsed_exercises: []
      };
    }

    // Если пришел массив ответов
    if (Array.isArray(data)) {
      console.log('📋 Processing array response with', data.length, 'items');
      let recognizedText: string | undefined;
      let aiResponse: ApiResponse | undefined;

      // Ищем распознанный текст аудио и ответ ИИ в массиве
      for (const item of data) {
        console.log('🔍 Processing item:', typeof item, item);

        // Проверяем на новый формат с text_transcribed (из вашего n8n workflow)
        if (item && 'text_transcribed' in item) {
          recognizedText = (item as { text_transcribed: string }).text_transcribed;
          console.log('🎤 Found text_transcribed format:', recognizedText);
        }

        // Проверяем на формат с photo_text (из вашего n8n workflow для фото)
        if (item && 'photo_text' in item) {
          recognizedText = (item as { photo_text: string }).photo_text;
          console.log('📷 Found photo_text format:', recognizedText);
        }

        // Проверяем на старый Response audio формат (распознанный текст)
        if (item && 'text' in item && 'usage' in item) {
          const audioItem = item as WebhookResponseAudio;
          recognizedText = audioItem.text;
          console.log('🎤 Found Response audio format:', audioItem.text);
        }
        
        // Проверяем на ответ ИИ с output
        if (item && 'output' in item) {
          const output = (item as { output: { 
            message: string; 
            suggestions?: string | string[]; 
            next_workout_recommendation?: string; 
            workout_logged?: boolean; 
            parsed_exercises?: Array<{ name: string; weight: number; sets: number; reps: number }>;
            recognized_text?: string; // Добавляем поле для распознанного текста
          } }).output;
          console.log('🤖 Found AI response format:', output);
          
          // Если в output есть recognized_text, используем его
          if (output.recognized_text && !recognizedText) {
            recognizedText = output.recognized_text;
            console.log('🎤 Found recognized text in output:', output.recognized_text);
          }
          
          aiResponse = {
            success: true,
            message: output.message,
            suggestions: Array.isArray(output.suggestions) ? output.suggestions.join('\n\n') : output.suggestions,
            next_workout_recommendation: output.next_workout_recommendation,
            workout_logged: output.workout_logged || false,
            parsed_exercises: output.parsed_exercises || []
          };
          console.log('✅ Created aiResponse:', aiResponse);
        }
      }

      console.log('🔄 After processing all items:', { recognizedText, aiResponse });

      // Возвращаем результат с обоими данными
      if (aiResponse) {
        const finalResult = {
          ...aiResponse,
          recognizedText: recognizedText // Добавляем распознанный текст
        };
        console.log('✅ Returning aiResponse result:', finalResult);
        return finalResult;
      } else if (recognizedText) {
        // Если только распознанный текст без ответа ИИ
        return {
          success: true,
          recognizedText: recognizedText,
          message: undefined, // Не показываем сообщение от ИИ пока его нет
          suggestions: undefined,
          next_workout_recommendation: undefined,
          workout_logged: false,
          parsed_exercises: []
        };
      }
    }
    
    // Fallback на старый формат для совместимости
    const fallbackData = data as ApiResponse;
    return {
      success: fallbackData.success ?? true,
      recognizedText: fallbackData.recognizedText,
      message: fallbackData.message,
      suggestions: fallbackData.suggestions,
      next_workout_recommendation: fallbackData.next_workout_recommendation,
      workout_logged: fallbackData.workout_logged || false,
      parsed_exercises: fallbackData.parsed_exercises || []
    };
  };

  // Функции для работы с фото
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Задняя камера для фото тренажёров
      });
      setCameraStream(stream);
      setIsTakingPhoto(true);
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      alert('Не удалось получить доступ к камере');
    }
  };

  const capturePhoto = () => {
    if (!cameraStream) return;

    const video = document.getElementById('camera-video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (video && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedPhoto(file);
          setPhotoPreview(canvas.toDataURL());
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsTakingPhoto(false);
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const scrollToBottom = () => {
    // Улучшенный плавный скролл с несколькими попытками для полной прокрутки
    const scrollWithRetry = (attempt: number = 0) => {
      if (messagesEndRef.current && attempt < 3) {
        console.log(`🔄 Executing scroll to bottom (attempt ${attempt + 1})`);
        messagesEndRef.current.scrollIntoView({ 
          behavior: "smooth",
          block: "end",
          inline: "nearest"
        });
        
        // Дополнительная прокрутка через небольшой интервал для обеспечения полного скролла
        setTimeout(() => {
          if (messagesEndRef.current) {
            const container = messagesEndRef.current.parentElement;
            if (container) {
              const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
              if (!isAtBottom) {
                // Если не дошли до конца, делаем еще одну попытку
                console.log('🔄 Not fully scrolled, retrying...');
                scrollWithRetry(attempt + 1);
              } else {
                console.log('✅ Successfully scrolled to bottom');
              }
            }
          }
        }, 300);
      }
    };
    
    setTimeout(() => scrollWithRetry(), 100);
  };

  // Функция для обработки последовательности сообщений с задержками
  const processMessageSequence = (result: ApiResponse, recognizedText?: string) => {
    let currentDelay = 0;
    
    // Добавляем распознанный текст от пользователя для аудио сообщений
    if (recognizedText) {
      console.log('👤 Adding recognized user message to chat:', recognizedText);
      addMessage({
        text: recognizedText,
        isUser: true,
        dayId: selectedDay!.id
      });
      // Принудительный скролл после сообщения пользователя
      setTimeout(() => scrollToBottom(), 300);
      currentDelay += 500; // Небольшая задержка перед ответом системы
    } else if (result.message) {
      // Если нет распознанного текста, но есть ответ от ИИ, добавляем placeholder
      console.log('🎤 Adding voice message placeholder');
      addMessage({
        text: `🎤 ${t('chat.voiceMessage')}`,
        isUser: true,
        dayId: selectedDay!.id
      });
      setTimeout(() => scrollToBottom(), 300);
      currentDelay += 500;
    }
    
    // 1. Основной ответ системы (сразу)
    if (result.message) {
      setTimeout(() => {
        console.log('🤖 Adding main response to chat');
        const botMessage = {
          text: result.message!,
          isUser: false,
          dayId: selectedDay!.id
        };
        
        setIsNewMessage(true);
        addMessage(botMessage);
        
        // Плавный скролл после основного ответа
        setTimeout(() => scrollToBottom(), 300);
      }, currentDelay);
      currentDelay += 4000; // 4 секунды для следующего сообщения
    }
    
    // 2. Сообщения об обновлении целей (через 4 секунды после основного ответа)
    if (result.workout_logged && result.parsed_exercises && result.parsed_exercises.length > 0) {
      setTimeout(() => {
        console.log('🎯 Adding goal updates to chat');
        const goalUpdateMessage = {
          text: "🎯 Проверяю обновления ваших целей...",
          isUser: false,
          dayId: selectedDay!.id
        };
        
        setIsNewMessage(true);
        addMessage(goalUpdateMessage);
        
        // Плавный скролл после сообщения о целях
        setTimeout(() => scrollToBottom(), 300);
      }, currentDelay);
      currentDelay += 4000; // 4 секунды для следующего сообщения
    }
    
    // 3. Рекомендации (через 4 секунды после предыдущего)
    if (result.suggestions) {
      setTimeout(() => {
        console.log('💡 Adding suggestions to chat:', result.suggestions);
        const suggestionsMessage = {
          text: result.suggestions!,
          isUser: false,
          dayId: selectedDay!.id
        };
        
        setIsNewMessage(true);
        addMessage(suggestionsMessage);
        
        // Плавный скролл после рекомендаций
        setTimeout(() => scrollToBottom(), 300);
      }, currentDelay);
      currentDelay += 4000; // 4 секунды для следующего сообщения
    }
    
    // 4. Следующая тренировка (через 4 секунды после предыдущего)
    if (result.next_workout_recommendation) {
      setTimeout(() => {
        console.log('🏋️ Adding next workout to chat:', result.next_workout_recommendation);
        const nextWorkoutMessage = {
          text: result.next_workout_recommendation!,
          isUser: false,
          dayId: selectedDay!.id
        };
        
        setIsNewMessage(true);
        addMessage(nextWorkoutMessage);
        
        // Плавный скролл после следующей тренировки
        setTimeout(() => scrollToBottom(), 300);
      }, currentDelay);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Скролл при появлении индикатора "Печатает..."
  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  // Скролл при появлении индикатора "Распознаю речь..."
  useEffect(() => {
    if (isProcessingAudio) {
      console.log('🎤 Processing audio indicator appeared, scrolling to bottom');
      scrollToBottom();
    }
  }, [isProcessingAudio]);

  // Отслеживание новых сообщений бота для эффекта печатания
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.isUser && !isLoading && isNewMessage && isInitialized) {
      // Запускаем эффект печатания только для новых сообщений бота (не из истории)
      setTypingMessageId(lastMessage.id);
      setIsNewMessage(false); // Сбрасываем флаг
    }
  }, [messages, isLoading, isNewMessage, isInitialized]);

  // Дополнительный скролл после загрузки
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      scrollToBottom();
    }
  }, [isInitialized, messages.length]);

  // Счетчик времени для обработки аудио
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessingAudio) {
      setProcessingTimer(0);
      interval = setInterval(() => {
        setProcessingTimer(prev => prev + 1);
      }, 1000);
    } else {
      setProcessingTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessingAudio]);

  // Счетчик времени для обычной загрузки
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingTimer(0);
      interval = setInterval(() => {
        setLoadingTimer(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const handleSendMessage = async () => {
    // Проверяем что есть либо текст, либо фото
    if ((!inputMessage.trim() && !selectedPhoto) || isLoading || !selectedDay) return;

    const messageText = inputMessage.trim();
    const hasPhoto = !!selectedPhoto;
    const photoFile = selectedPhoto;
    
    setInputMessage("");
    removePhoto(); // Очищаем фото после отправки
    
    // СРАЗУ добавляем пользовательское сообщение в UI для мгновенного отображения
    const displayMessage = hasPhoto 
      ? (messageText ? `📷 ${messageText}` : '📷 Фото отправлено')
      : messageText;
    
    console.log('👤 Adding user message to chat immediately:', displayMessage);
    addMessage({
      text: displayMessage,
      isUser: true,
      dayId: selectedDay.id,
      hasPhoto: hasPhoto,
      photoPreview: photoPreview || undefined
    });
    
    // Принудительный скролл после пользовательского сообщения
    setTimeout(() => scrollToBottom(), 100);
    
    // Используем новый API endpoint для полной обработки сообщения
    setLoading(true);
    setIsProcessingAudio(false); // Сбрасываем индикатор аудио обработки при текстовом сообщении
    try {
      console.log('📨 Sending message via process-message API:', messageText, hasPhoto ? 'with photo' : '');
      
      let response: Response;
      
      // Создаем контроллер для отмены запроса при длительном ожидании
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

      try {
        if (hasPhoto && photoFile) {
          // Отправляем с фото как FormData
          const formData = new FormData();
          formData.append('userId', selectedUser.id);
          formData.append('dayId', selectedDay.id);
          formData.append('message', messageText);
          formData.append('photo', photoFile);
          formData.append('isPhoto', 'true');

          response = await fetch('/api/process-message', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });
        } else {
          // Отправляем как обычный JSON
          response = await fetch('/api/process-message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: selectedUser.id,
              dayId: selectedDay.id,
              message: messageText
            }),
            signal: controller.signal
          });
        }
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Превышено время ожидания ответа сервера (30 сек)');
        }
        throw fetchError;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawResult = await response.json();
      console.log('✅ Message processed successfully:', rawResult);
      
      // Парсим ответ webhook с помощью общей функции
      const result = parseWebhookResponse(rawResult);
      
      // Используем новую функцию для обработки последовательности сообщений
      processMessageSequence(result);
      
      // Уведомляем об обновлении данных если была тренировка или обновились цели
      if (onWorkoutSaved && (result.workout_logged || (result.parsed_exercises && result.parsed_exercises.length > 0))) {
        console.log('🔄 Notifying about data update (workout/goals)');
        onWorkoutSaved();
      }
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
      // Fallback - используем старый метод
      await sendMessage(messageText, selectedUser.id, selectedDay.id, onWorkoutSaved, selectedUser.email, selectedUser.name);
    } finally {
      setLoading(false);
    }
  };

  // Функция для ожидания второго ответа от webhook (полный AI ответ)
  const waitForSecondResponse = async (formData: FormData, signal: AbortSignal): Promise<void> => {
    if (!selectedDay) {
      throw new Error('No selected day for second response');
    }
    console.log('⏳ Starting to wait for second webhook response...');

    // Добавляем задержку перед повторным запросом (даем время n8n обработать AI ответ)
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 секунды задержки

    // Делаем повторный запрос к тому же endpoint для получения полного AI ответа
    const secondController = new AbortController();
    const secondTimeoutId = setTimeout(() => secondController.abort(), 25000); // 25 секунд для второго ответа

    try {
      console.log('📡 Making second request for AI response...');
      const secondResponse = await fetch('/api/process-message', {
        method: 'POST',
        body: formData,
        signal: secondController.signal
      });

      clearTimeout(secondTimeoutId);

      if (!secondResponse.ok) {
        throw new Error(`Second response error ${secondResponse.status}`);
      }

      const secondRawResult = await secondResponse.json();
      console.log('✅ Second response received:', JSON.stringify(secondRawResult, null, 2));

      const secondResult = parseWebhookResponse(secondRawResult);

      // Проверяем что получили полный AI ответ (не первый ответ снова)
      if (secondResult.isFirstAudioResponse) {
        console.log('⚠️ Received first response again, waiting more...');
        // Если снова пришел первый ответ, делаем еще одну попытку с большей задержкой
        await new Promise(resolve => setTimeout(resolve, 3000));
        return waitForSecondResponse(formData, signal);
      }

      if (secondResult.message) {
        console.log('🤖 Valid second AI response received');

        // Очищаем состояние ожидания
        setIsWaitingForSecondResponse(false);
        const savedRecognizedText = firstAudioResponse;
        setFirstAudioResponse(null);

        // СНАЧАЛА показываем распознанный текст как сообщение пользователя
        if (savedRecognizedText) {
          addMessage({
            text: savedRecognizedText,
            isUser: true,
            dayId: selectedDay.id
          });
        }

        // ПОТОМ обрабатываем полный AI ответ
        processMessageSequence({
          ...secondResult,
          recognizedText: savedRecognizedText || undefined
        });

        // Уведомляем об обновлении данных
        if (onWorkoutSaved && (secondResult.workout_logged || (secondResult.parsed_exercises && secondResult.parsed_exercises.length > 0))) {
          console.log('🔄 Notifying about workout data update...');
          onWorkoutSaved();
        }
        console.log('✅ Two-stage audio processing completed successfully');
      } else {
        throw new Error('Second response does not contain AI message');
      }

    } catch (error) {
      clearTimeout(secondTimeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Превышено время ожидания второго ответа сервера');
      }
      throw error;
    }
  };

  // Функции для работы с аудио записью
  const startRecording = async () => {
    try {
      console.log('🎤 Starting audio recording...');
      
      // Проверяем поддержку браузера
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Браузер не поддерживает запись аудио');
      }

      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      console.log('✅ Microphone access granted');

      console.log('🎤 Creating MediaRecorder...');
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav'
      });
      console.log('✅ MediaRecorder created with mimeType:', recorder.mimeType);
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        console.log('📊 Audio data chunk received:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        console.log('🎤 Recording stopped, total chunks:', chunks.length);
        setIsRecording(false);
        setIsProcessingAudio(true);
        
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/wav' });
        console.log('🎵 Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: chunks.length
        });
        
        handleAudioMessage(audioBlob);
        
        // Останавливаем все треки
        console.log('🎤 Stopping audio tracks...');
        stream.getTracks().forEach(track => {
          console.log('🎤 Stopping track:', track.kind, track.label);
          track.stop();
        });
      };

      recorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        setIsRecording(false);
        setIsProcessingAudio(false);
      };
      
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      recorder.start();
      console.log('✅ Recording started successfully');
      
    } catch (error) {
      console.error('❌ Error starting recording:');
      console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      
      setIsRecording(false);
      setIsProcessingAudio(false);
      
      // Показываем пользователю сообщение об ошибке
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      alert(`Не удалось получить доступ к микрофону: ${errorMsg}. Проверьте разрешения.`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('🎤 Stopping recording...');
      console.log('🎤 MediaRecorder state before stop:', mediaRecorder.state);
      mediaRecorder.stop();
      console.log('🎤 Stop command sent to MediaRecorder');
    } else {
      console.warn('⚠️ Cannot stop recording:', {
        hasMediaRecorder: !!mediaRecorder,
        state: mediaRecorder?.state || 'no recorder'
      });
    }
  };

  const handleAudioMessage = async (audioBlob: Blob) => {
    if (!selectedDay) {
      console.error('❌ Audio processing failed: No selected day');
      setIsProcessingAudio(false);
      return;
    }

    console.log('🎵 Starting audio processing...');
    console.log('📊 Audio details:', {
      size: audioBlob.size,
      type: audioBlob.type,
      userId: selectedUser.id,
      dayId: selectedDay.id
    });

    try {
      // Проверяем размер файла
      if (audioBlob.size === 0) {
        throw new Error('Аудио файл пустой');
      }

      if (audioBlob.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Аудио файл слишком большой (лимит 10MB)');
      }
      
      // Создаем FormData для отправки аудио файла
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.wav');
      formData.append('userId', selectedUser.id);
      formData.append('dayId', selectedDay.id);
      formData.append('isAudio', 'true'); // Флаг что это аудио сообщение
      
      console.log('📤 Sending audio to /api/process-message...');
      console.log('📋 FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (key === 'audio') {
          console.log(`  ${key}: [Blob ${(value as Blob).size} bytes]`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      // Создаем контроллер для отмены запроса при длительном ожидании
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

      let response: Response;
      try {
        response = await fetch('/api/process-message', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Превышено время ожидания ответа сервера (30 сек)');
        }
        throw error;
      }

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      console.log('📨 Reading response...');
      const rawResult = await response.json();
      console.log('✅ Raw server response:', JSON.stringify(rawResult, null, 2));
      
      // Парсим ответ webhook с помощью общей функции
      console.log('🔄 Parsing webhook response...');
      const result = parseWebhookResponse(rawResult);
      console.log('📋 Parsed result:', {
        recognizedText: result.recognizedText,
        hasMessage: !!result.message,
        isFirstAudioResponse: result.isFirstAudioResponse,
        messageLength: result.message?.length || 0,
        success: result.success
      });
      
      // Проверяем что есть минимальные данные для отображения
      if (!result.message && !result.recognizedText) {
        console.warn('⚠️ No message or recognized text in audio response');
        console.warn('⚠️ Raw result structure:', Object.keys(rawResult));
        console.warn('⚠️ Parsed result details:', {
          message: result.message,
          recognizedText: result.recognizedText,
          success: result.success
        });
        throw new Error('Пустой ответ от сервера');
      }

      // НОВАЯ ЛОГИКА: Обработка первого ответа аудио
      if (result.isFirstAudioResponse && result.recognizedText) {
        console.log('🎤 First audio response detected - NOT showing recognized text yet');

        // НЕ показываем распознанный текст пользователю сразу - покажем в конце с AI ответом

        // Сохраняем распознанный текст и ставим флаг ожидания второго ответа
        setFirstAudioResponse(result.recognizedText);
        setIsWaitingForSecondResponse(true);

        console.log('⏳ Waiting for second AI response...');

        // Начинаем ожидание второго ответа от того же webhook
        try {
          await waitForSecondResponse(formData, controller.signal);
        } catch (secondError) {
          console.error('❌ Error waiting for second response:', secondError);
          setIsWaitingForSecondResponse(false);
          setFirstAudioResponse(null);
          throw secondError;
        }
        return;
      }


      // СТАРАЯ ЛОГИКА: Если есть только распознанный текст без AI ответа (старый формат)
      if (result.recognizedText && !result.message && !result.isFirstAudioResponse) {
        console.log('🎤 Legacy: Only recognized text found, displaying it as user message');
        addMessage({
          text: result.recognizedText,
          isUser: true,
          dayId: selectedDay.id
        });
        return;
      }
      
      console.log('🔄 Processing message sequence...');
      // Используем новую функцию для обработки последовательности сообщений с распознанным текстом
      processMessageSequence(result, result.recognizedText);
      
      // Уведомляем об обновлении данных
      if (onWorkoutSaved && (result.workout_logged || (result.parsed_exercises && result.parsed_exercises.length > 0))) {
        console.log('🔄 Notifying about workout data update...');
        onWorkoutSaved();
      }

      console.log('✅ Audio processing completed successfully');
      
    } catch (error) {
      console.error('❌ Error processing audio:');
      console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      addMessage({
        text: t('chat.audioProcessingError'),
        isUser: false,
        dayId: selectedDay.id
      });
    } finally {
      console.log('🏁 Setting isProcessingAudio to false');
      setIsProcessingAudio(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-primary-200">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-primary-600">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header - фиксированная панель */}
      <div className="bg-white sm:rounded-t-lg sm:shadow-sm sm:border sm:border-gray-200 sm:border-b-0">
        <div className="flex items-center space-x-3 p-4 sm:p-6 border-b border-gray-200">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Чат с тренером</h2>
            <p className="text-sm text-gray-500">
              {selectedDay ? `${new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })}` : 'Выберите день'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Content - скроллящаяся область */}
      <div className="flex-1 bg-white sm:rounded-b-lg sm:shadow-sm sm:border sm:border-gray-200 sm:border-t-0 flex flex-col" style={{ minHeight: 0 }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4" style={{ minHeight: 0 }}>
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                  message.isUser
                    ? "text-white"
                    : "bg-primary-50 text-primary-900 border border-primary-200"
                }`}
                style={message.isUser ? { background: 'var(--gradient-accent)' } : {}}
              >
                {/* Отображение фото если есть */}
                {message.hasPhoto && message.photoPreview && (
                  <div className="mb-3">
                    <img 
                      src={message.photoPreview} 
                      alt="Attached photo"
                      className="max-w-full max-h-64 rounded-lg object-cover border border-gray-200"
                    />
                  </div>
                )}
                
                <div className="whitespace-pre-line text-sm leading-relaxed">
                  {!message.isUser && typingMessageId === message.id ? (
                    <TypewriterText 
                      text={message.text}
                      speed={15}
                      onComplete={() => setTypingMessageId(null)}
                    />
                  ) : (
                    message.text
                  )}
                </div>
                <p className={`text-xs mt-2 opacity-70 ${message.isUser ? "text-white" : "text-primary-500"}`}>
                  {message.timestamp.toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-primary-100 rounded-2xl px-4 py-3 flex items-center space-x-2">
              {/* Анимированные прыгающие точки */}
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-primary-600">
                Печатает... {loadingTimer > 5 && <span className="opacity-70">({loadingTimer}с)</span>}
              </span>
            </div>
          </motion.div>
        )}
        
        {isProcessingAudio && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-start"
          >
            <div className="bg-blue-100 rounded-2xl px-4 py-3 flex items-center space-x-3">
              {/* Звуковые волны анимация */}
              <div className="flex items-center space-x-1">
                <motion.div
                  className="w-1 bg-blue-600 rounded-full"
                  animate={{ height: [4, 12, 4] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                />
                <motion.div
                  className="w-1 bg-blue-600 rounded-full"
                  animate={{ height: [4, 16, 4] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.1 }}
                />
                <motion.div
                  className="w-1 bg-blue-600 rounded-full"
                  animate={{ height: [4, 10, 4] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                />
                <motion.div
                  className="w-1 bg-blue-600 rounded-full"
                  animate={{ height: [4, 14, 4] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }}
                />
                <motion.div
                  className="w-1 bg-blue-600 rounded-full"
                  animate={{ height: [4, 8, 4] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                />
              </div>
              <span className="text-sm text-blue-600">
                🎤 {isWaitingForSecondResponse ? 'Ожидаю ответ ИИ...' : t('chat.recording')} {processingTimer > 5 && <span className="opacity-70">({processingTimer}с)</span>}
              </span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-primary-200 p-3 sm:p-6 bg-gray-50/50">
        <div className="flex space-x-2 sm:space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                // Auto-resize textarea
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '48px';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
              onKeyPress={handleKeyPress}
              placeholder={t('chat.placeholder')}
              rows={1}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-primary-50 border border-primary-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm text-primary-900 placeholder:text-xs sm:placeholder:text-sm placeholder:text-primary-500"
              style={{
                minHeight: "48px",
                maxHeight: "120px",
                overflow: inputMessage.length > 50 ? 'auto' : 'hidden'
              }}
            />
          </div>
          
          {/* Скрытый input для загрузки файлов */}
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
            id="photo-upload"
          />

          {/* Кнопка-скрепка с выпадающим меню */}
          <div className="relative attachment-menu-container">
            <button
              onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
              disabled={isLoading || isRecording}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 text-primary-600 bg-white border-2 border-primary-200 rounded-2xl hover:bg-primary-50 hover:border-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Прикрепить файл"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Выпадающее меню */}
            <AnimatePresence>
              {isAttachmentMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-[160px] z-50"
                >
                  <button
                    onClick={() => {
                      document.getElementById('photo-upload')?.click();
                      setIsAttachmentMenuOpen(false);
                    }}
                    disabled={isLoading || isRecording}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                  >
                    <Image className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-700">{t('chat.selectPhoto')}</span>
                  </button>

                  <button
                    onClick={() => {
                      startCamera();
                      setIsAttachmentMenuOpen(false);
                    }}
                    disabled={isLoading || isRecording}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">{t('chat.takePhoto')}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Кнопка записи аудио */}
          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading || isProcessingAudio}
            className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 text-white rounded-2xl transition-all ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: isRecording ? Infinity : 0, duration: 1 }}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
          </motion.button>
          
          {/* Кнопка отправки текста/фото */}
          <button
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && !selectedPhoto) || isLoading || isRecording || isProcessingAudio}
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 text-white rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Превью выбранного фото */}
        {photoPreview && (
          <div className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <img 
                src={photoPreview} 
                alt="Selected photo preview"
                className="w-20 h-20 object-cover rounded-lg border border-gray-300"
              />
              <div className="flex-1">
                <p className="text-sm text-primary-700 font-medium">📷 {t('chat.photoReady')}</p>
                <p className="text-xs text-primary-500 mt-1">
                  {selectedPhoto && `${Math.round(selectedPhoto.size / 1024)}KB`}
                </p>
              </div>
              <button
                onClick={removePhoto}
                className="text-primary-500 hover:text-red-500 transition-colors"
                title={t('chat.removePhoto')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Модальное окно камеры */}
      {isTakingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('chat.takePhoto')}</h3>
              <button
                onClick={stopCamera}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="relative mb-4">
              {cameraStream && (
                <video
                  id="camera-video"
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover rounded-lg bg-gray-100"
                  ref={(video) => {
                    if (video && cameraStream) {
                      video.srcObject = cameraStream;
                    }
                  }}
                />
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={capturePhoto}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                📸 {t('chat.takePhoto')}
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
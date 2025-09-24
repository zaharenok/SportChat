"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Mic, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chatApi, Day, User, ChatMessage } from "@/lib/client-api";
import { useChatContext } from "@/lib/chat-context";
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
}


interface ChatProps {
  selectedDay: Day | null;
  selectedUser: User;
  onWorkoutSaved?: () => void; // Колбек для уведомления о сохранении тренировки
}

export function Chat({ selectedDay, selectedUser, onWorkoutSaved }: ChatProps) {
  const { messages, isLoading, setMessages, sendMessage, addMessage, setLoading } = useChatContext();
  const [inputMessage, setInputMessage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [isNewMessage, setIsNewMessage] = useState(false);
  
  // Аудио запись состояния
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [selectedDay]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !selectedDay) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    
    // Используем новый API endpoint для полной обработки сообщения
    setLoading(true);
    try {
      console.log('📨 Sending message via process-message API:', messageText);
      const response = await fetch('/api/process-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          dayId: selectedDay.id,
          message: messageText
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Message processed successfully:', result);
      
      // Добавляем пользовательское сообщение в UI
      addMessage({
        text: messageText,
        isUser: true,
        dayId: selectedDay.id
      });
      
      // Принудительный скролл после пользовательского сообщения
      setTimeout(() => scrollToBottom(), 100);
      
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

  // Функции для работы с аудио записью
  const startRecording = async () => {
    try {
      console.log('🎤 Starting audio recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        console.log('🎤 Recording stopped, processing audio...');
        setIsRecording(false);
        setIsProcessingAudio(true);
        
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        handleAudioMessage(audioBlob);
        
        // Останавливаем все треки
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      recorder.start();
      console.log('🎤 Recording started');
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      alert('Не удалось получить доступ к микрофону. Проверьте разрешения.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('🎤 Stopping recording...');
      mediaRecorder.stop();
    }
  };

  const handleAudioMessage = async (audioBlob: Blob) => {
    if (!selectedDay) {
      setIsProcessingAudio(false);
      return;
    }

    try {
      console.log('🎵 Processing audio message, size:', audioBlob.size);
      
      // Создаем FormData для отправки аудио файла
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.wav');
      formData.append('userId', selectedUser.id);
      formData.append('dayId', selectedDay.id);
      formData.append('isAudio', 'true'); // Флаг что это аудио сообщение
      
      console.log('📤 Sending audio to webhook...');
      
      const response = await fetch('/api/process-message', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Audio processed successfully:', result);
      
      // Для аудио сообщений извлекаем распознанный текст из ответа
      // Предполагаем, что webhook возвращает распознанный текст в поле recognizedText
      // Если recognizedText недоступен, используем основное сообщение как fallback
      const recognizedText = result.recognizedText || result.message || "🎤 [Голосовое сообщение]";
      
      // Используем новую функцию для обработки последовательности сообщений с распознанным текстом
      processMessageSequence(result, recognizedText);
      
      // Уведомляем об обновлении данных
      if (onWorkoutSaved && (result.workout_logged || (result.parsed_exercises && result.parsed_exercises.length > 0))) {
        onWorkoutSaved();
      }
      
    } catch (error) {
      console.error('❌ Error processing audio:', error);
      addMessage({
        text: 'Извините, не удалось обработать голосовое сообщение. Попробуйте еще раз.',
        isUser: false,
        dayId: selectedDay.id
      });
    } finally {
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
              <span className="text-sm text-primary-600">Печатает...</span>
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
              <span className="text-sm text-blue-600">🎤 Распознаю речь...</span>
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
              placeholder="Расскажи о тренировке..."
              rows={1}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-primary-50 border border-primary-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm text-primary-900 placeholder:text-xs sm:placeholder:text-sm placeholder:text-primary-500"
              style={{
                minHeight: "48px",
                maxHeight: "120px",
                overflow: inputMessage.length > 50 ? 'auto' : 'hidden'
              }}
            />
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
          
          {/* Кнопка отправки текста */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || isRecording || isProcessingAudio}
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 text-white rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
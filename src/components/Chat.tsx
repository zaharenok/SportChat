"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chatApi, Day, User, ChatMessage } from "@/lib/client-api";
import { useChatContext } from "@/lib/chat-context";


interface ChatProps {
  selectedDay: Day | null;
  selectedUser: User;
  onWorkoutSaved?: () => void; // Колбек для уведомления о сохранении тренировки
}

export function Chat({ selectedDay, selectedUser, onWorkoutSaved }: ChatProps) {
  const { messages, isLoading, setMessages, sendMessage, addMessage, setLoading } = useChatContext();
  const [inputMessage, setInputMessage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [selectedDay]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadChatHistory = async () => {
    if (!selectedDay) {
      setMessages([]);
      setIsInitialized(true);
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
    }
  };

  const scrollToBottom = () => {
    // Небольшая задержка для завершения анимаций
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: "smooth",
        block: "end",
        inline: "nearest"
      });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      
      // Добавляем ответ системы
      if (result.message) {
        addMessage({
          text: result.message,
          isUser: false,
          dayId: selectedDay.id
        });
      }
      
      // Уведомляем об обновлении данных если была тренировка или обновились цели
      if (onWorkoutSaved && (result.workout_logged || result.parsed_exercises?.length > 0)) {
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
      <div className="bg-white rounded-t-lg shadow-sm border border-gray-200 border-b-0">
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
      <div className="flex-1 bg-white rounded-b-lg shadow-sm border border-gray-200 border-t-0 flex flex-col" style={{ minHeight: 0 }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4" style={{ minHeight: 0 }}>
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {message.text}
                </p>
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
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              <span className="text-sm text-primary-600">Печатает...</span>
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
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
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
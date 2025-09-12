"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chatApi, Day, User, ChatMessage } from "@/lib/client-api";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatResponse {
  output: {
    message: string;
    workout_logged: boolean;
    parsed_exercises: string[];
    suggestions: string[];
    next_workout_recommendation: string;
  };
}

interface ChatProps {
  selectedDay: Day | null;
  selectedUser: User;
}

export function Chat({ selectedDay, selectedUser }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
        const welcomeMessage = {
          id: "welcome",
          text: `Привет! 💪 Это чат для ${new Date(selectedDay.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}. Расскажи, как прошла тренировка или что планируешь делать?`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);

        // Сохраняем приветственное сообщение в базу
        await chatApi.create(selectedUser.id, selectedDay.id, welcomeMessage.text, false);
      } else {
        // Преобразуем сообщения из базы в локальный формат
        const localMessages: Message[] = chatMessages.map((msg: ChatMessage) => ({
          id: msg.id,
          text: msg.message,
          isUser: msg.is_user,
          timestamp: new Date(msg.timestamp),
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessageWithDelay = async (text: string, delay: number) => {
    setTimeout(async () => {
      const newMessage = {
        id: Date.now().toString() + Math.random(),
        text,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);

      // Сохраняем сообщение в базу
      if (selectedDay) {
        try {
          await chatApi.create(selectedUser.id, selectedDay.id, text, false);
        } catch (error) {
          console.error('Ошибка сохранения сообщения:', error);
        }
      }
    }, delay);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !selectedDay) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    // Сохраняем пользовательское сообщение в базу
    try {
      await chatApi.create(selectedUser.id, selectedDay.id, userMessage.text, true);
    } catch (error) {
      console.error('Ошибка сохранения пользовательского сообщения:', error);
    }

    try {
      console.log("Sending message to webhook:", messageText);
      
      const response = await fetch("https://n8n.aaagency.at/webhook/ca45977e-cf5b-4b7b-a471-3a55da6bf356", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
        }),
      });

      if (!response.ok) {
        console.error("HTTP error:", response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse[] = await response.json();
      
      console.log("Full webhook response:", JSON.stringify(data, null, 2));
      
      if (data && data.length > 0 && data[0] && data[0].output) {
        const output = data[0].output;
        console.log("Extracted output:", output);
        console.log("Message:", output.message);
        console.log("Suggestions:", output.suggestions);
        
        // Основное сообщение сразу (через 1 секунду после загрузки)
        if (output.message) {
          console.log("Adding main message with delay");
          addMessageWithDelay(output.message, 1000);
        }
        
        // Рекомендации через 5 секунд после основного сообщения (если есть)
        if (output.suggestions && output.suggestions.length > 0) {
          console.log("Adding suggestions with delay");
          const suggestionsText = "💡 Рекомендации:\n" + output.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n");
          addMessageWithDelay(suggestionsText, 6000); // 1 сек на основное + 5 сек ожидания
        }
      } else {
        console.log("No valid data structure found in response");
        console.log("Data structure:", data);
        
        // Попробуем обработать другие возможные структуры ответа
        if (data && typeof data === 'object') {
          // Если ответ пришел не в массиве
          const singleResponse = data as { output?: { message?: string; suggestions?: string[] } };
          if (singleResponse.output) {
            console.log("Found single response with output");
            const output = singleResponse.output;
            if (output.message) {
              addMessageWithDelay(output.message, 1000);
            }
            if (output.suggestions && output.suggestions.length > 0) {
              const suggestionsText = "💡 Рекомендации:\n" + output.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n");
              addMessageWithDelay(suggestionsText, 6000);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Для демонстрации - если webhook недоступен, покажем тестовый ответ
      if (messageText.toLowerCase().includes("тест")) {
        addMessageWithDelay("Отлично! Тестовое сообщение получено 💪", 1000);
        addMessageWithDelay("💡 Рекомендации:\n1. Продолжай тренировки\n2. Следи за питанием\n3. Не забывай про отдых", 6000);
      } else {
        addMessageWithDelay("Извини, произошла ошибка при подключении к серверу. Попробуй еще раз!", 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-primary-200">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
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
      <div className="border-t border-primary-200 p-4">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Расскажи о своей тренировке..."
              rows={1}
              className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm text-primary-900"
              style={{
                minHeight: "48px",
                maxHeight: "120px",
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="flex items-center justify-center w-12 h-12 text-white rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
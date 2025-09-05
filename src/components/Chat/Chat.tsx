import React, { useState, useEffect, useRef } from 'react';
import { Send, RotateCcw, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { chatApi, ChatMessage, ChatResponse } from '../../api/api';
import QuickInputButtons from './QuickInputButtons';
import SuggestionButtons from './SuggestionButtons';
import EditMessageDialog from './EditMessageDialog';

interface ChatProps {
  userId?: number;
}

const Chat: React.FC<ChatProps> = ({ userId = 1 }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickButtons, setShowQuickButtons] = useState(true);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const history = await chatApi.getChatHistory(userId);
      setMessages(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      user_id: userId,
      message: inputMessage,
      is_user: true,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentSuggestions([]); // Очищаем предыдущие предложения
    setIsLoading(true);

    try {
      const response: ChatResponse = await chatApi.sendMessage(inputMessage, userId);
      
      // Сразу показываем основной ответ
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        user_id: userId,
        message: response.message,
        is_user: false,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Если есть отложенный контент, показываем индикатор "думает"
      if (response.has_delayed_content) {
        setIsThinking(true);
        setThinkingMessage(response.thinking_message || 'Анализирую и готовлю рекомендации...');
        
        // Задержка 2-3 секунды перед показом рекомендаций
        setTimeout(() => {
          setIsThinking(false);
          
          // Показываем suggestions и рекомендации
          if (response.suggestions && response.suggestions.length > 0) {
            setCurrentSuggestions(response.suggestions);
          }
          
          // Если есть рекомендация на следующую тренировку, добавляем как отдельное сообщение
          if (response.next_workout_recommendation) {
            const recommendationMessage: ChatMessage = {
              id: Date.now() + 2,
              user_id: userId,
              message: `💡 **Рекомендация на следующую тренировку:**\n${response.next_workout_recommendation}`,
              is_user: false,
              timestamp: new Date().toISOString(),
            };
            
            setMessages(prev => [...prev, recommendationMessage]);
          }
        }, 2500); // 2.5 секунды задержки
      } else {
        // Если нет отложенного контента, сразу показываем suggestions
        if (response.suggestions && response.suggestions.length > 0) {
          setCurrentSuggestions(response.suggestions);
        } else {
          setCurrentSuggestions([]);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        user_id: userId,
        message: 'Извините, произошла ошибка. Попробуйте еще раз.',
        is_user: false,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = async () => {
    try {
      await chatApi.clearChatHistory(userId);
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const handleQuickInput = (text: string) => {
    if (text.startsWith('📋')) {
      // Это шаблон - отправляем сразу
      const cleanText = text.replace(/^📋\s*/, '');
      setInputMessage(cleanText);
      setTimeout(() => sendMessage(), 100);
    } else {
      // Добавляем к текущему вводу
      const currentText = inputMessage;
      const newText = currentText ? `${currentText} ${text}` : text;
      setInputMessage(newText);
    }
  };

  const toggleQuickButtons = () => {
    setShowQuickButtons(!showQuickButtons);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setCurrentSuggestions([]);
    // Автоматически отправляем, если это полное упражнение
    if (suggestion.includes('кг') || suggestion.includes('х')) {
      setTimeout(() => sendMessage(), 100);
    }
  };

  const handleEditMessage = async (messageId: number, newText: string) => {
    try {
      // Отправляем запрос на редактирование
      const response = await chatApi.editMessage(messageId, newText);
      
      // Обновляем сообщение в локальном состоянии
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, message: newText } : msg
      ));
      
      // Если есть новый ответ от ИИ, добавляем его
      if (response.ai_response) {
        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          user_id: userId,
          message: response.ai_response,
          is_user: false,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error editing message:', error);
      // Можно показать уведомление об ошибке
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Вспомогательные функции для извлечения данных из сообщения
  const extractExercise = (message: string): string | undefined => {
    const exercises = ['жим', 'приседания', 'тяга', 'планка', 'отжимания'];
    const found = exercises.find(ex => message.toLowerCase().includes(ex));
    return found;
  };

  const extractWeight = (message: string): number | undefined => {
    const weightMatch = message.match(/(\d+)\s*кг/i);
    return weightMatch ? parseInt(weightMatch[1]) : undefined;
  };

  const extractSets = (message: string): number | undefined => {
    const setsMatch = message.match(/(\d+)\s*[хx]\s*(\d+)/i);
    return setsMatch ? parseInt(setsMatch[1]) : undefined;
  };

  const extractReps = (message: string): number | undefined => {
    const repsMatch = message.match(/(\d+)\s*[хx]\s*(\d+)/i);
    return repsMatch ? parseInt(repsMatch[2]) : undefined;
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Тренировочный чат</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={showQuickButtons ? "default" : "outline"}
                size="sm"
                onClick={toggleQuickButtons}
                aria-label="Переключить подсказки"
              >
                {showQuickButtons ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="ml-1 hidden sm:inline">Подсказки</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                aria-label="Очистить историю чата"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Очистить</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <ScrollArea className="h-96 px-6">
            {messages.length === 0 && (
              <div className="text-center py-8 px-4">
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-semibold mb-3">Добро пожаловать в SportChat! 👋</h3>
                  <p className="text-muted-foreground mb-6">Расскажите мне о своей тренировке!</p>
                  <Card className="p-4">
                    <p className="font-medium mb-3">Примеры сообщений:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 text-left">
                      <li>• Делал жим лежа 80кг 3х8</li>
                      <li>• Приседания 100кг 5 повторений</li>
                      <li>• Планка 60 секунд</li>
                      <li>• Как мой прогресс в жиме лежа?</li>
                    </ul>
                  </Card>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-4 group ${message.is_user ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.is_user ? 'order-2' : 'order-1'} relative`}>
                  <Card className={`${message.is_user ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{message.message}</p>
                          <p className={`text-xs mt-2 ${message.is_user ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatTimestamp(message.timestamp)}
                            {message.is_user && ' • Редактируемо'}
                          </p>
                        </div>
                        {message.is_user && (
                          <div className="flex-shrink-0">
                            <EditMessageDialog
                              messageId={message.id}
                              originalText={message.message}
                              onSave={handleEditMessage}
                              parsedData={{
                                exercise: extractExercise(message.message),
                                weight: extractWeight(message.message),
                                sets: extractSets(message.message),
                                reps: extractReps(message.message)
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start mb-4">
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Анализирую...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {isThinking && (
              <div className="flex justify-start mb-4">
                <Card className="bg-muted border-dashed border-2">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground italic">{thinkingMessage}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <QuickInputButtons 
          onQuickInput={handleQuickInput}
          isVisible={showQuickButtons && messages.length >= 0}
        />
        <SuggestionButtons 
          suggestions={currentSuggestions}
          onSuggestionClick={handleSuggestionClick}
        />
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Расскажите о своей тренировке..."
            disabled={isLoading}
            className="min-h-[44px] resize-none"
            rows={1}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
            className="h-11 w-11 shrink-0"
            aria-label="Отправить сообщение"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
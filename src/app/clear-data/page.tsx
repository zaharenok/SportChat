'use client';

import { useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';

export default function ClearDataPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    details?: {
      userKeys: number;
      workouts: number;
      goals: number;
      achievements: number;
      messages: number;
    };
  } | null>(null);
  const [error, setError] = useState('');

  const clearUserData = async () => {
    setIsClearing(true);
    setError('');
    setResult(null);

    try {
      // Получаем текущего пользователя из localStorage
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        throw new Error('Пользователь не авторизован');
      }

      // Получаем информацию о пользователе
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Не удалось получить информацию о пользователе');
      }

      const user = await userResponse.json();
      console.log('Current user:', user);

      // Очищаем данные пользователя
      const clearResponse = await fetch(`/api/clear-user-data?userId=${user.id}`, {
        method: 'DELETE'
      });

      if (!clearResponse.ok) {
        const errorData = await clearResponse.json();
        throw new Error(errorData.error || 'Не удалось очистить данные');
      }

      const clearResult = await clearResponse.json();
      setResult(clearResult);
      console.log('Clear result:', clearResult);

    } catch (err) {
      console.error('Error clearing data:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Очистка данных пользователя
          </h1>
          <p className="text-gray-600 text-sm">
            Это действие удалит все ваши тренировки, цели, достижения и сообщения из базы данных.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 font-medium mb-2">✅ Данные успешно очищены!</p>
            <div className="text-sm text-gray-600">
              <p>Удалено записей: <strong>{result.message}</strong></p>
              {result.details && (
                <div className="mt-2 space-y-1">
                  <p>• Ключи пользователя: {result.details.userKeys}</p>
                  <p>• Тренировки: {result.details.workouts}</p>
                  <p>• Цели: {result.details.goals}</p>
                  <p>• Достижения: {result.details.achievements}</p>
                  <p>• Сообщения: {result.details.messages}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={clearUserData}
            disabled={isClearing}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isClearing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Очистка данных...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Очистить все данные</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Вернуться в приложение
          </button>
        </div>

        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-xs">
            ⚠️ <strong>Внимание:</strong> Это действие необратимо. Убедитесь, что вы действительно хотите удалить все данные.
          </p>
        </div>
      </div>
    </div>
  );
}
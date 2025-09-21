"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Calendar, Eye, EyeOff, Star } from "lucide-react";

interface Achievement {
  id: string;
  user_id: string;
  title: string;
  description: string;
  icon: string;
  date: string;
  created_at: string;
  hidden?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface AchievementsProps {
  selectedUser: User;
}

export function Achievements({ selectedUser }: AchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenAchievements, setHiddenAchievements] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedUser) {
      fetchAchievements();
      loadHiddenAchievements();
    }
  }, [selectedUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/achievements?userId=${selectedUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setAchievements(data);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHiddenAchievements = () => {
    const hidden = localStorage.getItem(`hidden_achievements_${selectedUser.id}`);
    if (hidden) {
      setHiddenAchievements(new Set(JSON.parse(hidden)));
    }
  };

  const saveHiddenAchievements = (hiddenSet: Set<string>) => {
    localStorage.setItem(`hidden_achievements_${selectedUser.id}`, JSON.stringify([...hiddenSet]));
  };

  const toggleAchievementVisibility = (achievementId: string) => {
    const newHidden = new Set(hiddenAchievements);
    if (newHidden.has(achievementId)) {
      newHidden.delete(achievementId);
    } else {
      newHidden.add(achievementId);
    }
    setHiddenAchievements(newHidden);
    saveHiddenAchievements(newHidden);
  };

  const visibleAchievements = achievements.filter(achievement => !hiddenAchievements.has(achievement.id));
  const hiddenAchievementsCount = achievements.length - visibleAchievements.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка достижений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Достижения</h1>
            <p className="text-gray-600">Ваши спортивные успехи и завершенные цели</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Всего достижений</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-1">{achievements.length}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Видимых</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">{visibleAchievements.length}</p>
          </div>
        </div>

        {hiddenAchievementsCount > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <EyeOff className="w-4 h-4 inline mr-1" />
              {hiddenAchievementsCount} достижений скрыто
            </p>
          </div>
        )}
      </div>

      {/* Achievements Grid */}
      {achievements.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Trophy className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Пока нет достижений</h3>
          <p className="text-gray-600 mb-4">Завершите свои первые цели, чтобы получить достижения!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {achievements.map((achievement, index) => {
            const isHidden = hiddenAchievements.has(achievement.id);
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  bg-white rounded-xl p-6 border-2 transition-all duration-200
                  ${isHidden 
                    ? 'border-gray-200 opacity-50 bg-gray-50' 
                    : 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 hover:shadow-lg'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Achievement Icon */}
                    <div className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center text-2xl
                      ${isHidden 
                        ? 'bg-gray-200 text-gray-400' 
                        : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                      }
                    `}>
                      {achievement.icon}
                    </div>
                    
                    {/* Achievement Details */}
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-2 ${isHidden ? 'text-gray-500' : 'text-gray-900'}`}>
                        {achievement.title}
                      </h3>
                      <p className={`text-sm mb-3 ${isHidden ? 'text-gray-400' : 'text-gray-600'}`}>
                        {achievement.description}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Calendar className={`w-4 h-4 ${isHidden ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isHidden ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(achievement.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hide/Show Button */}
                  <button
                    onClick={() => toggleAchievementVisibility(achievement.id)}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${isHidden 
                        ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                      }
                    `}
                    title={isHidden ? 'Показать достижение' : 'Скрыть достижение'}
                  >
                    {isHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
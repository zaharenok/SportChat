"use client";

import { useState, useEffect } from "react";
import { Activity, TrendingUp, Target } from "lucide-react";
import { motion } from "framer-motion";
import { MuscleGroup as MuscleGroupType, muscleGroupsApi } from "@/lib/client-api";
import { useLanguage } from "@/lib/language-context";

// Используем тип из API
// type MuscleGroup уже импортирован как MuscleGroupType

interface MuscleGroupsProps {
  selectedUser: { id: string; name: string; email: string }; // User type
}

// Дефолтные данные для демонстрации
const defaultMuscleGroups: MuscleGroupType[] = [
  {
    id: '1',
    name: 'Грудные',
    english_name: 'chest',
    category: 'upper',
    workouts_count: 12,
    last_worked: '2024-01-15',
    total_volume: 8500,
    max_weight: 80,
    progress_trend: 'up',
    created_at: '2024-01-01',
    updated_at: '2024-01-15'
  },
  {
    id: '2',
    name: 'Спина',
    english_name: 'back',
    category: 'upper',
    workouts_count: 15,
    last_worked: '2024-01-14',
    total_volume: 9200,
    max_weight: 70,
    progress_trend: 'up',
    created_at: '2024-01-01',
    updated_at: '2024-01-15'
  },
  {
    id: '3',
    name: 'Плечи',
    english_name: 'shoulders',
    category: 'upper',
    workouts_count: 8,
    last_worked: '2024-01-13',
    total_volume: 4500,
    max_weight: 25,
    progress_trend: 'stable',
    created_at: '2024-01-01',
    updated_at: '2024-01-15'
  },
  {
    id: '4',
    name: 'Бицепс',
    english_name: 'biceps',
    category: 'upper',
    workouts_count: 10,
    last_worked: '2024-01-12',
    total_volume: 2800,
    max_weight: 25,
    progress_trend: 'up',
    created_at: '2024-01-01',
    updated_at: '2024-01-15'
  },
  {
    id: '5',
    name: 'Трицепс',
    english_name: 'triceps',
    category: 'upper',
    workouts_count: 9,
    last_worked: '2024-01-11',
    total_volume: 3200,
    max_weight: 30,
    progress_trend: 'down',
    created_at: '2024-01-01',
    updated_at: '2024-01-15'
  },
  {
    id: '6',
    name: 'Пресс',
    english_name: 'abs',
    category: 'core',
    workouts_count: 20,
    last_worked: '2024-01-15',
    total_volume: 0,
    max_weight: 0,
    progress_trend: 'up',
    created_at: '2024-01-01',
    updated_at: '2024-01-15'
  },
  {
    id: '7',
    name: 'Квадрицепс',
    english_name: 'quads',
    category: 'lower',
    workouts_count: 14,
    last_worked: '2024-01-10',
    total_volume: 12000,
    max_weight: 100,
    progress_trend: 'up',
    created_at: '2024-01-01',
    updated_at: '2024-01-15'
  },
  {
    id: '8',
    name: 'Бицепс бедра',
    english_name: 'hamstrings',
    category: 'lower',
    workouts_count: 8,
    last_worked: '2024-01-09',
    total_volume: 6800,
    max_weight: 60,
    progress_trend: 'stable',
    created_at: '2024-01-01',
    updated_at: '2024-01-15'
  }
];

// Category names are now handled dynamically with translations

const categoryColors = {
  upper: 'bg-blue-50 text-blue-700 border-blue-200',
  core: 'bg-green-50 text-green-700 border-green-200',
  lower: 'bg-orange-50 text-orange-700 border-orange-200'
};

const trendIcons = {
  up: '📈',
  down: '📉',
  stable: '➡️'
};

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-600'
};

export function MuscleGroups({ selectedUser: _selectedUser }: MuscleGroupsProps) {
  const { t } = useLanguage();
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroupType[]>(defaultMuscleGroups);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [highlightedMuscle, setHighlightedMuscle] = useState<string | null>(null);
  const [_isLoading, setIsLoading] = useState(true);

  // Dynamic category names using translations
  const categoryNames = {
    upper: t('muscles.upper'),
    core: t('muscles.core'),
    lower: t('muscles.lower')
  };

  // Загружаем данные мышечных групп
  useEffect(() => {
    loadMuscleGroups();
  }, []);

  const loadMuscleGroups = async () => {
    try {
      const data = await muscleGroupsApi.getAll();
      // Если база пустая, используем дефолтные данные для демонстрации
      setMuscleGroups(data.length > 0 ? data : defaultMuscleGroups);
    } catch (error) {
      console.error('Error loading muscle groups:', error);
      // При ошибке также используем дефолтные данные
      setMuscleGroups(defaultMuscleGroups);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMuscleGroups = selectedCategory === 'all' 
    ? muscleGroups 
    : muscleGroups.filter(mg => mg.category === selectedCategory);

  const totalWorkouts = muscleGroups.reduce((sum, mg) => sum + mg.workouts_count, 0);
  const totalVolume = muscleGroups.reduce((sum, mg) => sum + mg.total_volume, 0);
  const averageProgress = muscleGroups.filter(mg => mg.progress_trend === 'up').length / muscleGroups.length;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Заголовок */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('muscles.title')}</h1>
          </div>
          <p className="text-gray-600">{t('muscles.description')}</p>
        </div>

        {/* Общая статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('muscles.totalGroups')}</p>
                <p className="text-2xl font-bold text-gray-900">{muscleGroups.length}</p>
              </div>
              <Activity className="w-8 h-8 text-primary-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('muscles.totalWorkouts')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalWorkouts}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('muscles.totalVolume')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(totalVolume / 1000)}k {t('common.kg')}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('muscles.progressGrowth')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(averageProgress * 100)}%
                </p>
              </div>
              <div className="text-2xl">📈</div>
            </div>
          </motion.div>
        </div>

        {/* Фильтры категорий */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t('muscles.allGroups')}
            </button>
            {Object.entries(categoryNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedCategory === key
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Визуализация человеческого тела */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('muscles.visualization')}</h3>
            <div className="flex justify-center">
              {/* Простая схема человеческого тела */}
              <div className="relative w-64 h-96 mx-auto">
                <svg viewBox="0 0 200 300" className="w-full h-full">
                  {/* Голова */}
                  <circle cx="100" cy="30" r="20" className="fill-gray-200 stroke-gray-400" strokeWidth="2"/>
                  
                  {/* Торс */}
                  <rect x="70" y="50" width="60" height="80" className="fill-gray-200 stroke-gray-400" strokeWidth="2" rx="10"/>
                  
                  {/* Грудные мышцы */}
                  <rect 
                    x="80" y="60" width="40" height="30" 
                    className={`stroke-gray-400 ${
                      highlightedMuscle === 'chest' || (muscleGroups.find(mg => mg.english_name === 'chest')?.workouts_count || 0) > 10
                        ? 'fill-red-400' 
                        : 'fill-blue-200'
                    }`} 
                    strokeWidth="1" rx="5"
                    onMouseEnter={() => setHighlightedMuscle('chest')}
                    onMouseLeave={() => setHighlightedMuscle(null)}
                  />
                  
                  {/* Пресс */}
                  <rect 
                    x="85" y="100" width="30" height="25" 
                    className={`stroke-gray-400 ${
                      highlightedMuscle === 'abs' || (muscleGroups.find(mg => mg.english_name === 'abs')?.workouts_count || 0) > 15
                        ? 'fill-green-400' 
                        : 'fill-green-200'
                    }`} 
                    strokeWidth="1" rx="3"
                    onMouseEnter={() => setHighlightedMuscle('abs')}
                    onMouseLeave={() => setHighlightedMuscle(null)}
                  />
                  
                  {/* Руки - плечи */}
                  <circle 
                    cx="60" cy="65" r="12" 
                    className={`stroke-gray-400 ${
                      highlightedMuscle === 'shoulders' || (muscleGroups.find(mg => mg.english_name === 'shoulders')?.workouts_count || 0) > 5
                        ? 'fill-yellow-400' 
                        : 'fill-yellow-200'
                    }`} 
                    strokeWidth="1"
                    onMouseEnter={() => setHighlightedMuscle('shoulders')}
                    onMouseLeave={() => setHighlightedMuscle(null)}
                  />
                  <circle 
                    cx="140" cy="65" r="12" 
                    className={`stroke-gray-400 ${
                      highlightedMuscle === 'shoulders' || (muscleGroups.find(mg => mg.english_name === 'shoulders')?.workouts_count || 0) > 5
                        ? 'fill-yellow-400' 
                        : 'fill-yellow-200'
                    }`} 
                    strokeWidth="1"
                    onMouseEnter={() => setHighlightedMuscle('shoulders')}
                    onMouseLeave={() => setHighlightedMuscle(null)}
                  />
                  
                  {/* Бицепс/Трицепс */}
                  <ellipse 
                    cx="45" cy="90" rx="8" ry="15" 
                    className={`stroke-gray-400 ${
                      highlightedMuscle === 'biceps' || (muscleGroups.find(mg => mg.english_name === 'biceps')?.workouts_count || 0) > 8
                        ? 'fill-purple-400' 
                        : 'fill-purple-200'
                    }`} 
                    strokeWidth="1"
                    onMouseEnter={() => setHighlightedMuscle('biceps')}
                    onMouseLeave={() => setHighlightedMuscle(null)}
                  />
                  <ellipse 
                    cx="155" cy="90" rx="8" ry="15" 
                    className={`stroke-gray-400 ${
                      highlightedMuscle === 'biceps' || (muscleGroups.find(mg => mg.english_name === 'biceps')?.workouts_count || 0) > 8
                        ? 'fill-purple-400' 
                        : 'fill-purple-200'
                    }`} 
                    strokeWidth="1"
                    onMouseEnter={() => setHighlightedMuscle('biceps')}
                    onMouseLeave={() => setHighlightedMuscle(null)}
                  />
                  
                  {/* Ноги - квадрицепс */}
                  <rect 
                    x="75" y="150" width="20" height="60" 
                    className={`stroke-gray-400 ${
                      highlightedMuscle === 'quads' || (muscleGroups.find(mg => mg.english_name === 'quads')?.workouts_count || 0) > 10
                        ? 'fill-orange-400' 
                        : 'fill-orange-200'
                    }`} 
                    strokeWidth="1" rx="8"
                    onMouseEnter={() => setHighlightedMuscle('quads')}
                    onMouseLeave={() => setHighlightedMuscle(null)}
                  />
                  <rect 
                    x="105" y="150" width="20" height="60" 
                    className={`stroke-gray-400 ${
                      highlightedMuscle === 'quads' || (muscleGroups.find(mg => mg.english_name === 'quads')?.workouts_count || 0) > 10
                        ? 'fill-orange-400' 
                        : 'fill-orange-200'
                    }`} 
                    strokeWidth="1" rx="8"
                    onMouseEnter={() => setHighlightedMuscle('quads')}
                    onMouseLeave={() => setHighlightedMuscle(null)}
                  />
                  
                  {/* Икры */}
                  <ellipse 
                    cx="85" cy="240" rx="10" ry="25" 
                    className="fill-gray-200 stroke-gray-400" 
                    strokeWidth="1"
                  />
                  <ellipse 
                    cx="115" cy="240" rx="10" ry="25" 
                    className="fill-gray-200 stroke-gray-400" 
                    strokeWidth="1"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                {t('muscles.hoverHelp')}
              </p>
              <div className="flex justify-center space-x-4 mt-2 text-xs">
                <span className="flex items-center"><div className="w-3 h-3 bg-red-400 rounded mr-1"></div>{t('muscles.activeTraining')}</span>
                <span className="flex items-center"><div className="w-3 h-3 bg-blue-200 rounded mr-1"></div>{t('muscles.moderate')}</span>
                <span className="flex items-center"><div className="w-3 h-3 bg-gray-200 rounded mr-1"></div>{t('muscles.rarely')}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Список мышечных групп */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMuscleGroups.map((mg, index) => (
            <motion.div
              key={mg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              onMouseEnter={() => setHighlightedMuscle(mg.english_name)}
              onMouseLeave={() => setHighlightedMuscle(null)}
            >
              {/* Заголовок мышечной группы */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(`muscle.${mg.english_name}`)}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[mg.category]}`}>
                    {categoryNames[mg.category]}
                  </span>
                </div>
                <div className={`text-2xl ${trendColors[mg.progress_trend]}`}>
                  {trendIcons[mg.progress_trend]}
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">{t('muscles.workouts')}</p>
                  <p className="font-semibold text-gray-900">{mg.workouts_count}</p>
                </div>
                <div>
                  <p className="text-gray-600">{t('muscles.lastWorked')}</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(mg.last_worked).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                {mg.max_weight > 0 && (
                  <div>
                    <p className="text-gray-600">{t('muscles.maxWeight')}</p>
                    <p className="font-semibold text-gray-900">{mg.max_weight} {t('common.kg')}</p>
                  </div>
                )}
                {mg.total_volume > 0 && (
                  <div>
                    <p className="text-gray-600">{t('muscles.totalVolume')}</p>
                    <p className="font-semibold text-gray-900">
                      {Math.round(mg.total_volume / 1000)}k {t('common.kg')}
                    </p>
                  </div>
                )}
              </div>

              {/* Прогресс бар */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">{t('muscles.activity')}</span>
                  <span className="font-medium">
                    {Math.round((mg.workouts_count / Math.max(...muscleGroups.map(m => m.workouts_count))) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.round((mg.workouts_count / Math.max(...muscleGroups.map(m => m.workouts_count))) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredMuscleGroups.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedCategory === 'all' 
                ? t('muscles.noGroups') 
                : t('muscles.noGroupsCategory')
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
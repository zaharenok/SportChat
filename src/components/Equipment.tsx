"use client";

import { useState, useEffect } from "react";
import { Dumbbell, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Equipment as EquipmentType, equipmentApi } from "@/lib/client-api";

// Используем тип из API
// type Equipment уже импортирован как EquipmentType

interface EquipmentProps {
  selectedUser: { id: string; name: string; email: string }; // User type
}

// Заглушечные данные на случай пустой базы
const defaultEquipment: EquipmentType[] = [
  {
    id: 'default-1',
    name: 'Скамья для жима лёжа',
    category: 'strength',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    usage_count: 15,
    last_used: '2024-01-15',
    max_weight: 80,
    total_volume: 12000,
    created_at: '2024-01-01',
    updated_at: '2024-01-15'
  },
  {
    id: 'default-2',
    name: 'Гантели',
    category: 'free_weights',
    muscle_groups: ['chest', 'shoulders', 'biceps', 'triceps'],
    usage_count: 32,
    last_used: '2024-01-14',
    max_weight: 25,
    total_volume: 8500,
    created_at: '2024-01-01',
    updated_at: '2024-01-14'
  }
];

const categoryNames = {
  strength: 'Силовые тренажёры',
  cardio: 'Кардио тренажёры',
  functional: 'Функциональные',
  free_weights: 'Свободные веса'
};

const categoryColors = {
  strength: 'bg-red-50 text-red-700 border-red-200',
  cardio: 'bg-blue-50 text-blue-700 border-blue-200',
  functional: 'bg-green-50 text-green-700 border-green-200',
  free_weights: 'bg-purple-50 text-purple-700 border-purple-200'
};

export function Equipment({ selectedUser: _selectedUser }: EquipmentProps) {
  const [equipment, setEquipment] = useState<EquipmentType[]>(defaultEquipment);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [_isLoading, setIsLoading] = useState(true);

  // Загружаем данные тренажёров
  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await equipmentApi.getAll();
      // Если база пустая, используем дефолтные данные для демонстрации
      setEquipment(data.length > 0 ? data : defaultEquipment);
    } catch (error) {
      console.error('Error loading equipment:', error);
      // При ошибке также используем дефолтные данные
      setEquipment(defaultEquipment);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEquipment = selectedCategory === 'all' 
    ? equipment 
    : equipment.filter(eq => eq.category === selectedCategory);

  const totalUsage = equipment.reduce((sum, eq) => sum + eq.usage_count, 0);
  const totalVolume = equipment.reduce((sum, eq) => sum + (eq.total_volume || 0), 0);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Заголовок */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Dumbbell className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Тренажёры</h1>
          </div>
          <p className="text-gray-600">Отслеживание использования тренажёров и прогресса</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Всего тренажёров</p>
                <p className="text-2xl font-bold text-gray-900">{equipment.length}</p>
              </div>
              <Dumbbell className="w-8 h-8 text-primary-600" />
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
                <p className="text-sm text-gray-600 mb-1">Общие использования</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsage}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
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
                <p className="text-sm text-gray-600 mb-1">Общий объём</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(totalVolume / 1000)}k кг
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
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
              Все
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

        {/* Список тренажёров */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEquipment.map((eq, index) => (
            <motion.div
              key={eq.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              {/* Заголовок тренажёра */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{eq.name}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[eq.category]}`}>
                    {categoryNames[eq.category]}
                  </span>
                </div>
                <Dumbbell className="w-6 h-6 text-gray-400" />
              </div>

              {/* Мышечные группы */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Мышечные группы:</p>
                <div className="flex flex-wrap gap-1">
                  {eq.muscle_groups.map((muscle) => (
                    <span 
                      key={muscle}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Использований</p>
                  <p className="font-semibold text-gray-900">{eq.usage_count}</p>
                </div>
                <div>
                  <p className="text-gray-600">Последний раз</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(eq.last_used).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                {eq.max_weight && eq.max_weight > 0 && (
                  <div>
                    <p className="text-gray-600">Макс. вес</p>
                    <p className="font-semibold text-gray-900">{eq.max_weight} кг</p>
                  </div>
                )}
                {eq.total_volume && eq.total_volume > 0 && (
                  <div>
                    <p className="text-gray-600">Общий объём</p>
                    <p className="font-semibold text-gray-900">
                      {Math.round(eq.total_volume / 1000)}k кг
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredEquipment.length === 0 && (
          <div className="text-center py-12">
            <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedCategory === 'all' 
                ? 'Тренажёры пока не добавлены' 
                : 'Нет тренажёров в выбранной категории'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
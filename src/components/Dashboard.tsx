"use client";

import { useState, useEffect } from "react";
import { Target, Calendar, Trophy, TrendingUp, Dumbbell, Flame, Plus, Edit, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Day, User, goalsApi, achievementsApi, workoutsApi, Goal, Achievement, Workout } from "@/lib/client-api";

// Removed mock data - charts now use real workout data calculated below

// Removed mock data - using real workout data from API

interface DashboardProps {
  selectedDay: Day | null;
  selectedUser: User;
  updateTrigger?: number; // Триггер для принудительного обновления данных
}

export function Dashboard({ selectedUser, updateTrigger }: DashboardProps) {
  const [activeChart, setActiveChart] = useState<"weekly" | "monthly">("weekly");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  // Collapsible widgets state - reserved for future implementation
  // const [collapsedWidgets, setCollapsedWidgets] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedUser) {
      loadData();
    }
  }, [selectedUser, updateTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      console.log('📊 Dashboard: Loading data...')
      const [goalsData, achievementsData, workoutsData] = await Promise.all([
        goalsApi.getAll(selectedUser.id),
        achievementsApi.getAll(selectedUser.id),
        workoutsApi.getByUser(selectedUser.id)
      ]);
      console.log('📊 Dashboard: Loaded data:', {
        goals: goalsData.length,
        achievements: achievementsData.length,
        workouts: workoutsData.length
      })
      setGoals(goalsData);
      setAchievements(achievementsData);
      setWorkouts(workoutsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Collapsible widget functionality - reserved for future use
  // const toggleWidget = (widgetId: string) => {
  //   const newCollapsed = new Set(collapsedWidgets);
  //   if (newCollapsed.has(widgetId)) {
  //     newCollapsed.delete(widgetId);
  //   } else {
  //     newCollapsed.add(widgetId);
  //   }
  //   setCollapsedWidgets(newCollapsed);
  // };


  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await goalsApi.delete(goalId);
      setGoals(goals.filter(goal => goal.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleGoalSubmit = async (goalData: {
    title: string
    description?: string
    targetValue: number
    currentValue?: number
    unit?: string
    category?: string
    dueDate?: string
  }) => {
    try {
      if (editingGoal) {
        // Обновление существующей цели
        const updatedGoal = await goalsApi.update(editingGoal.id, goalData);
        setGoals(goals.map(goal => goal.id === editingGoal.id ? updatedGoal : goal));
      } else {
        // Создание новой цели
        const newGoal = await goalsApi.create(selectedUser.id, goalData);
        setGoals([...goals, newGoal]);
      }
      setShowGoalForm(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleGoalFormClose = () => {
    setShowGoalForm(false);
    setEditingGoal(null);
  };

  // Вычисляем динамическую статистику на основе реальных тренировок
  const calculateStats = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Всего уникальных дней с тренировками (за все время)
    const totalTrainingDays = new Set(
      workouts.map(workout => new Date(workout.created_at).toISOString().split('T')[0])
    ).size;
    
    // Уникальные дни с тренировками за последнюю неделю
    const weeklyTrainingDays = new Set(
      workouts
        .filter(workout => new Date(workout.created_at) >= weekAgo)
        .map(workout => new Date(workout.created_at).toISOString().split('T')[0])
    ).size;
    
    
    // Уникальные упражнения за все время
    const uniqueExercises = new Set(
      workouts.flatMap(workout => 
        workout.exercises?.map(ex => ex.name.toLowerCase()) || []
      )
    ).size;
    
    // Общий прогресс по активным целям
    const activeGoals = goals.filter(goal => !goal.is_completed);
    const totalProgress = activeGoals.length > 0 ? Math.round(
      activeGoals.reduce((sum, goal) => {
        // Нормальный прогресс: (current / target) * 100
        const progress = (goal.current_value / goal.target_value) * 100;
        return sum + Math.max(0, Math.min(progress, 100));
      }, 0) / activeGoals.length
    ) : 0;
    
    return {
      trainingDays: totalTrainingDays, // Всего дней с тренировками
      uniqueExercises: uniqueExercises, // Уникальные упражнения
      weeklyTrainingDays: weeklyTrainingDays, // Дни тренировок за неделю (0-7)
      avgRepsPerSet: Math.min(totalProgress, 100) // Общий прогресс целей %
    };
  };

  // Расчет недельной активности на основе реальных тренировок
  const calculateWeeklyStats = () => {
    const now = new Date();
    const weekdays = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = weekdays[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];
      
      // Находим тренировки за этот день
      const dayWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.created_at).toISOString().split('T')[0];
        return workoutDate === dateStr;
      });

      // Считаем общее количество повторений как "интенсивность"
      const totalReps = dayWorkouts.reduce((sum, workout) => 
        sum + (workout.exercises?.reduce((exSum, ex) => exSum + (ex.reps * ex.sets), 0) || 0), 0
      );

      weeklyData.push({
        day: dayName,
        workouts: dayWorkouts.length, // Количество тренировок
        duration: Math.min(totalReps, 100) // Интенсивность (ограничиваем 100 для графика)
      });
    }

    return weeklyData;
  };

  // Расчет месячной активности на основе реальных тренировок
  const calculateMonthlyStats = () => {
    const now = new Date();
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const monthlyData = [];

    for (let i = 3; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[monthDate.getMonth()];
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      
      // Находим тренировки за этот месяц
      const monthWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.created_at);
        return workoutDate.getFullYear() === year && workoutDate.getMonth() === month;
      });

      // Считаем среднее количество упражнений за тренировку
      const totalExercises = monthWorkouts.reduce((sum, workout) => 
        sum + (workout.exercises?.length || 0), 0
      );
      const avgExercisesPerWorkout = monthWorkouts.length > 0 
        ? Math.round(totalExercises / monthWorkouts.length) 
        : 0;

      monthlyData.push({
        month: monthName,
        workouts: monthWorkouts.length, // Количество тренировок в месяц
        avg: Math.min(avgExercisesPerWorkout * 10, 100) // Среднее * 10 для наглядности графика
      });
    }

    return monthlyData;
  };

  const stats = calculateStats();
  const weeklyStats = calculateWeeklyStats();
  const monthlyProgress = calculateMonthlyStats();

  const StatCard = ({ icon: Icon, title, value, change, color }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string;
    change?: number;
    color: string;
  }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? "text-green-600" : "text-red-600"}`}>
              {change > 0 ? "+" : ""}{change}% за неделю
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Статистические карточки */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Calendar}
          title="Дней с тренировками"
          value={stats.trainingDays.toString()}
          change={0}
          color="bg-primary-600"
        />
        <StatCard
          icon={Dumbbell}
          title="Уникальных упражнений"
          value={stats.uniqueExercises.toString()}
          change={0}
          color="bg-primary-500"
        />
        <StatCard
          icon={Flame}
          title="Дней тренировок за неделю"
          value={stats.weeklyTrainingDays.toString()}
          change={0}
          color="bg-primary-700"
        />
        <StatCard
          icon={TrendingUp}
          title="Прогресс целей %"
          value={stats.avgRepsPerSet.toString()}
          change={0}
          color="bg-primary-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* График активности */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Активность</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveChart("weekly")}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeChart === "weekly"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Неделя
              </button>
              <button
                onClick={() => setActiveChart("monthly")}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeChart === "monthly"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Месяц
              </button>
            </div>
          </div>
          
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === "weekly" ? (
                <BarChart data={weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="workouts" fill="#a96da3" radius={4} />
                </BarChart>
              ) : (
                <LineChart data={monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="workouts" 
                    stroke="#a96da3" 
                    strokeWidth={3}
                    dot={{ fill: "#a96da3", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Цели */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Цели</h3>
            </div>
            <button
              onClick={() => setShowGoalForm(true)}
              className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 bg-primary-600 text-white text-xs sm:text-sm rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Добавить</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {goals.filter(goal => !goal.is_completed).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Нет активных целей</p>
                <p className="text-xs">Нажмите &quot;Добавить&quot;, чтобы создать первую цель</p>
              </div>
            ) : (
              goals.filter(goal => !goal.is_completed).map((goal) => (
                <div key={goal.id} className="group space-y-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-700">{goal.title}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">
                        {goal.current_value >= goal.target_value ? `Завершено! 🎉` : `${goal.current_value}/${goal.target_value} ${goal.unit}`}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                        <button
                          onClick={() => handleEditGoal(goal)}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600"
                          title="Редактировать"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Удалить"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className={`h-2 rounded-full ${goal.current_value >= goal.target_value ? 'bg-green-600' : 'bg-primary-600'}`}
                    />
                  </div>
                  {goal.description && (
                    <p className="text-xs text-gray-500">{goal.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Достижения */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200"
      >
          <div className="flex items-center space-x-2 mb-6">
            <Trophy className="w-5 h-5 text-primary-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Достижения</h3>
          </div>
          
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(achievement.date).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Форма целей */}
        <AnimatePresence>
          {showGoalForm && (
            <GoalFormModal
              goal={editingGoal}
              onSubmit={handleGoalSubmit}
              onClose={handleGoalFormClose}
            />
          )}
        </AnimatePresence>
    </div>
  );
}

// Компонент формы для целей
interface GoalFormModalProps {
  goal?: Goal | null;
  onSubmit: (goalData: {
    title: string
    description?: string
    targetValue: number
    currentValue?: number
    unit?: string
    category?: string
    dueDate?: string
  }) => void;
  onClose: () => void;
}

function GoalFormModal({ goal, onSubmit, onClose }: GoalFormModalProps) {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    targetValue: goal?.target_value || '',
    currentValue: goal?.current_value || '',
    unit: goal?.unit || '',
    category: goal?.category || 'fitness',
    dueDate: goal?.due_date || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      description: formData.description,
      targetValue: Number(formData.targetValue),
      currentValue: Number(formData.currentValue),
      unit: formData.unit,
      category: formData.category,
      dueDate: formData.dueDate || undefined
    });
  };

  const categories = [
    { value: 'fitness', label: 'Фитнес' },
    { value: 'strength', label: 'Сила' },
    { value: 'cardio', label: 'Кардио' },
    { value: 'flexibility', label: 'Гибкость' },
    { value: 'weight', label: 'Вес' },
    { value: 'other', label: 'Другое' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full mx-auto shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {goal ? 'Редактировать цель' : 'Новая цель'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goal-title" className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              id="goal-title"
              name="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              placeholder="Например: Подтянуться 50 раз"
              required
            />
          </div>

          <div>
            <label htmlFor="goal-description" className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              id="goal-description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              placeholder="Описание цели..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-target" className="block text-sm font-medium text-gray-700 mb-1">
                Цель *
              </label>
              <input
                id="goal-target"
                name="targetValue"
                type="number"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="100"
                required
              />
            </div>
            <div>
              <label htmlFor="goal-current" className="block text-sm font-medium text-gray-700 mb-1">
                Текущий прогресс
              </label>
              <input
                id="goal-current"
                name="currentValue"
                type="number"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-unit" className="block text-sm font-medium text-gray-700 mb-1">
                Единица измерения
              </label>
              <input
                id="goal-unit"
                name="unit"
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="раз, кг, км..."
              />
            </div>
            <div>
              <label htmlFor="goal-category" className="block text-sm font-medium text-gray-700 mb-1">
                Категория
              </label>
              <select
                id="goal-category"
                name="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="goal-duedate" className="block text-sm font-medium text-gray-700 mb-1">
              Срок выполнения
            </label>
            <input
              id="goal-duedate"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              {goal ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
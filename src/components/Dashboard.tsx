"use client";

import { useState, useEffect } from "react";
import { Target, Calendar, Trophy, TrendingUp, Dumbbell, Clock, Flame, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Day, User, goalsApi, achievementsApi, workoutsApi, Goal, Achievement, Workout } from "@/lib/client-api";

// Removed mock data - charts now use real workout data calculated below

// Removed mock data - using real workout data from API

interface DashboardProps {
  selectedDay: Day | null;
  selectedUser: User;
}

export function Dashboard({ selectedUser }: DashboardProps) {
  const [activeChart, setActiveChart] = useState<"weekly" | "monthly">("weekly");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; workoutId: string | null }>({ 
    show: false, 
    workoutId: null 
  });
  // Collapsible widgets state - reserved for future implementation
  // const [collapsedWidgets, setCollapsedWidgets] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedUser) {
      loadData();
    }
  }, [selectedUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const [goalsData, achievementsData, workoutsData] = await Promise.all([
        goalsApi.getAll(selectedUser.id),
        achievementsApi.getAll(selectedUser.id),
        workoutsApi.getByUser(selectedUser.id)
      ]);
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

  const handleDeleteWorkout = (workoutId: string) => {
    setDeleteConfirmation({ show: true, workoutId });
  };

  const confirmDeleteWorkout = async () => {
    if (deleteConfirmation.workoutId) {
      try {
        await workoutsApi.delete(deleteConfirmation.workoutId);
        setWorkouts(workouts.filter(workout => workout.id !== deleteConfirmation.workoutId));
        setDeleteConfirmation({ show: false, workoutId: null });
      } catch (error) {
        console.error('Error deleting workout:', error);
      }
    }
  };

  const cancelDeleteWorkout = () => {
    setDeleteConfirmation({ show: false, workoutId: null });
  };

  // Вычисляем динамическую статистику на основе реальных данных
  const calculateStats = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentWorkouts = workouts.filter(w => new Date(w.created_at) >= weekAgo);
    const totalWorkouts = recentWorkouts.length;
    
    // Подсчет общего количества упражнений и их продолжительности
    let totalExercises = 0;
    let avgSets = 0;
    let totalReps = 0;
    
    recentWorkouts.forEach(workout => {
      totalExercises += workout.exercises.length;
      workout.exercises.forEach(exercise => {
        avgSets += exercise.sets;
        totalReps += exercise.reps * exercise.sets;
      });
    });

    const avgExercisesPerWorkout = totalWorkouts > 0 ? Math.round(totalExercises / totalWorkouts) : 0;
    const avgSetsPerWorkout = totalWorkouts > 0 ? Math.round(avgSets / totalWorkouts) : 0;
    
    return {
      weeklyWorkouts: totalWorkouts,
      avgExercises: avgExercisesPerWorkout,
      avgSets: avgSetsPerWorkout,
      totalReps: totalReps
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
      
      const dayWorkouts = workouts.filter(workout => 
        workout.created_at.startsWith(dateStr)
      );
      
      // Подсчитываем среднюю продолжительность на основе количества упражнений
      const avgDuration = dayWorkouts.length > 0 
        ? Math.round(dayWorkouts.reduce((sum, w) => sum + w.exercises.length * 10, 0) / dayWorkouts.length)
        : 0;

      weeklyData.push({
        day: dayName,
        workouts: dayWorkouts.length,
        duration: avgDuration
      });
    }

    return weeklyData;
  };

  // Расчет месячной активности
  const calculateMonthlyStats = () => {
    const now = new Date();
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const monthlyData = [];

    for (let i = 3; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[monthDate.getMonth()];
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.created_at);
        return workoutDate >= monthDate && workoutDate < nextMonth;
      });
      
      const avgDuration = monthWorkouts.length > 0
        ? Math.round(monthWorkouts.reduce((sum, w) => sum + w.exercises.length * 10, 0) / monthWorkouts.length)
        : 0;

      monthlyData.push({
        month: monthName,
        workouts: monthWorkouts.length,
        avg: avgDuration
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
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Dumbbell}
          title="Тренировок в неделю"
          value={stats.weeklyWorkouts.toString()}
          change={0}
          color="bg-primary-600"
        />
        <StatCard
          icon={Clock}
          title="Упражнений за тренировку"
          value={stats.avgExercises.toString()}
          change={0}
          color="bg-primary-500"
        />
        <StatCard
          icon={Flame}
          title="Подходов за тренировку"
          value={stats.avgSets.toString()}
          change={0}
          color="bg-primary-700"
        />
        <StatCard
          icon={TrendingUp}
          title="Всего повторов"
          value={stats.totalReps.toString()}
          change={0}
          color="bg-primary-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* График активности */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Активность</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveChart("weekly")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  activeChart === "weekly"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Неделя
              </button>
              <button
                onClick={() => setActiveChart("monthly")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  activeChart === "monthly"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Месяц
              </button>
            </div>
          </div>
          
          <div className="h-64">
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
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Target className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Цели</h3>
          </div>
          
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">{goal.title}</p>
                  <p className="text-sm text-gray-500">
                    {goal.current}/{goal.target} {goal.unit}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="bg-primary-600 h-2 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Последние тренировки */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Последние тренировки</h3>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
            {workouts.map((workout) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="group p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {new Date(workout.created_at).toLocaleDateString("ru-RU", { day: 'numeric', month: 'long' })}
                      </h4>
                      <p className="text-sm text-gray-500">{workout.exercises.length} упражнений</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWorkout(workout.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700"
                    title="Удалить тренировку"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {workout.exercises.map((exercise, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-800 text-sm capitalize">{exercise.name}</h5>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                          {exercise.weight > 0 && (
                            <span className="flex items-center space-x-1">
                              <span className="font-medium">Вес:</span>
                              <span>{exercise.weight} кг</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <span className="font-medium">Подходы:</span>
                            <span>{exercise.sets}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span className="font-medium">Повторы:</span>
                            <span>{exercise.reps}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
            
            {workouts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Пока нет записанных тренировок</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Достижения */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Trophy className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Достижения</h3>
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
      </div>

      {/* Диалог подтверждения удаления */}
      <AnimatePresence>
        {deleteConfirmation.show && (
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
              className="bg-white rounded-xl p-6 max-w-md w-full mx-auto shadow-xl"
            >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Удалить тренировку?</h3>
                <p className="text-sm text-gray-500">Это действие нельзя будет отменить</p>
              </div>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelDeleteWorkout}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Отмена
              </button>
              <button
                onClick={confirmDeleteWorkout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Удалить
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
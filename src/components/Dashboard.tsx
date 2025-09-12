"use client";

import { useState, useEffect } from "react";
import { Target, Calendar, Trophy, TrendingUp, Dumbbell, Clock, Flame, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Day, User, goalsApi, achievementsApi, Goal, Achievement } from "@/lib/client-api";

// Моковые данные для демонстрации
const weeklyStats = [
  { day: "ПН", workouts: 1, duration: 45 },
  { day: "ВТ", workouts: 0, duration: 0 },
  { day: "СР", workouts: 1, duration: 60 },
  { day: "ЧТ", workouts: 1, duration: 35 },
  { day: "ПТ", workouts: 0, duration: 0 },
  { day: "СБ", workouts: 1, duration: 75 },
  { day: "ВС", workouts: 0, duration: 0 },
];

const monthlyProgress = [
  { month: "Янв", workouts: 12, avg: 45 },
  { month: "Фев", workouts: 16, avg: 50 },
  { month: "Мар", workouts: 18, avg: 48 },
  { month: "Апр", workouts: 20, avg: 52 },
];

const recentWorkouts = [
  { id: 1, date: "2024-01-15", type: "Силовая", duration: 60, exercises: ["Приседания", "Жим лежа", "Становая"] },
  { id: 2, date: "2024-01-13", type: "Кардио", duration: 45, exercises: ["Бег", "Велосипед", "Эллипс"] },
  { id: 3, date: "2024-01-11", type: "Функциональная", duration: 50, exercises: ["Берпи", "Отжимания", "Планка"] },
];

interface DashboardProps {
  selectedDay: Day | null;
  selectedUser: User;
}

export function Dashboard({ selectedUser }: DashboardProps) {
  const [activeChart, setActiveChart] = useState<"weekly" | "monthly">("weekly");
  const [workouts, setWorkouts] = useState(recentWorkouts);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; workoutId: number | null }>({ 
    show: false, 
    workoutId: null 
  });

  useEffect(() => {
    if (selectedUser) {
      const loadData = async () => {
        const [goalsData, achievementsData] = await Promise.all([
          goalsApi.getAll(selectedUser.id),
          achievementsApi.getAll(selectedUser.id)
        ]);
        setGoals(goalsData);
        setAchievements(achievementsData);
      };

      loadData();
    }
  }, [selectedUser]);

  const handleDeleteWorkout = (workoutId: number) => {
    setDeleteConfirmation({ show: true, workoutId });
  };

  const confirmDeleteWorkout = () => {
    if (deleteConfirmation.workoutId) {
      setWorkouts(workouts.filter(workout => workout.id !== deleteConfirmation.workoutId));
      setDeleteConfirmation({ show: false, workoutId: null });
    }
  };

  const cancelDeleteWorkout = () => {
    setDeleteConfirmation({ show: false, workoutId: null });
  };

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
          value="4"
          change={25}
          color="bg-primary-600"
        />
        <StatCard
          icon={Clock}
          title="Среднее время"
          value="52 мин"
          change={8}
          color="bg-primary-500"
        />
        <StatCard
          icon={Flame}
          title="Калории за тренировку"
          value="380"
          change={-2}
          color="bg-primary-700"
        />
        <StatCard
          icon={TrendingUp}
          title="Стрик"
          value="7 дней"
          change={40}
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
                className="group flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{workout.type}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{workout.duration} мин</span>
                      <button
                        onClick={() => handleDeleteWorkout(workout.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700"
                        title="Удалить тренировку"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(workout.date).toLocaleDateString("ru-RU")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {workout.exercises.join(", ")}
                  </p>
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
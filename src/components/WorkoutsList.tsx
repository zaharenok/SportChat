"use client";

import { useState, useEffect } from "react";
import { Dumbbell, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { workoutsApi, User, Workout } from "@/lib/client-api";

interface WorkoutsListProps {
  selectedUser: User;
  updateTrigger?: number;
}

export function WorkoutsList({ selectedUser, updateTrigger }: WorkoutsListProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; workoutId: string | null }>({ 
    show: false, 
    workoutId: null 
  });

  useEffect(() => {
    if (selectedUser) {
      loadWorkouts();
    }
  }, [selectedUser, updateTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadWorkouts = async () => {
    try {
      console.log('📊 WorkoutsList: Loading workouts...')
      const workoutsData = await workoutsApi.getByUser(selectedUser.id);
      console.log('📊 WorkoutsList: Loaded workouts:', workoutsData.length)
      setWorkouts(workoutsData);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка тренировок...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 h-full flex flex-col"
      >
        <div className="flex items-center space-x-2 mb-6">
          <Dumbbell className="w-5 h-5 text-primary-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Последние тренировки</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
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
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                        {new Date(workout.created_at).toLocaleDateString("ru-RU", { day: 'numeric', month: 'long' })}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500">{workout.exercises.length} упражнений</p>
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
                        <h5 className="font-medium text-gray-800 text-xs sm:text-sm capitalize">{exercise.name}</h5>
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
              <div className="text-center py-12 text-gray-500">
                <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-sm sm:text-base mb-2">Пока нет записанных тренировок</p>
                <p className="text-xs sm:text-sm">Начните чатить с ИИ тренером, чтобы записать свою первую тренировку!</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

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
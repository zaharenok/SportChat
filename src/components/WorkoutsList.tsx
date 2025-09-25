"use client";

import { useState, useEffect } from "react";
import { Dumbbell, Trash2, Edit, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { workoutsApi, User, Workout } from "@/lib/client-api";
import { useLanguage } from "@/lib/language-context";

interface WorkoutsListProps {
  selectedUser: User;
  updateTrigger?: number;
}

interface GroupedWorkout {
  date: string;
  workouts: Workout[];
  totalExercises: number;
}

interface EditingExercise {
  workoutId: string;
  exerciseIndex: number;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export function WorkoutsList({ selectedUser, updateTrigger }: WorkoutsListProps) {
  const { language, t } = useLanguage();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; date: string | null }>({ 
    show: false, 
    date: null 
  });
  const [editingExercise, setEditingExercise] = useState<EditingExercise | null>(null);

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

  // Группируем тренировки по датам
  const groupedWorkouts: GroupedWorkout[] = workouts.reduce((groups: GroupedWorkout[], workout) => {
    const date = workout.created_at.split('T')[0]; // Получаем только дату без времени
    
    let existingGroup = groups.find(group => group.date === date);
    if (!existingGroup) {
      existingGroup = {
        date,
        workouts: [],
        totalExercises: 0
      };
      groups.push(existingGroup);
    }
    
    existingGroup.workouts.push(workout);
    existingGroup.totalExercises += workout.exercises.length;
    
    return groups;
  }, []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Сортируем по убыванию даты

  const handleDeleteWorkout = (date: string) => {
    setDeleteConfirmation({ show: true, date });
  };

  const confirmDeleteWorkout = async () => {
    if (deleteConfirmation.date) {
      try {
        // Найдем все тренировки за этот день и удалим их
        const workoutsToDelete = workouts.filter(w => w.created_at.split('T')[0] === deleteConfirmation.date);
        
        // Удаляем все тренировки за день
        await Promise.all(workoutsToDelete.map(workout => workoutsApi.delete(workout.id)));
        
        // Обновляем список, исключая удаленные тренировки
        setWorkouts(workouts.filter(w => w.created_at.split('T')[0] !== deleteConfirmation.date));
        setDeleteConfirmation({ show: false, date: null });
      } catch (error) {
        console.error('Error deleting workouts:', error);
      }
    }
  };

  const cancelDeleteWorkout = () => {
    setDeleteConfirmation({ show: false, date: null });
  };

  const handleEditExercise = (workoutId: string, exerciseIndex: number, exercise: { name: string; sets: number; reps: number; weight: number }) => {
    setEditingExercise({
      workoutId,
      exerciseIndex,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight
    });
  };

  const handleSaveExercise = async () => {
    if (!editingExercise) return;

    try {
      // Найдем тренировку для обновления
      const workoutToUpdate = workouts.find(w => w.id === editingExercise.workoutId);
      if (!workoutToUpdate) return;

      // Обновим упражнение
      const updatedExercises = [...workoutToUpdate.exercises];
      updatedExercises[editingExercise.exerciseIndex] = {
        name: editingExercise.name,
        sets: editingExercise.sets,
        reps: editingExercise.reps,
        weight: editingExercise.weight
      };

      // Обновим тренировку на сервере
      await workoutsApi.update(editingExercise.workoutId, {
        exercises: updatedExercises
      });

      // Обновим локальное состояние
      setWorkouts(workouts.map(w => 
        w.id === editingExercise.workoutId 
          ? { ...w, exercises: updatedExercises }
          : w
      ));

      setEditingExercise(null);
    } catch (error) {
      console.error('Error updating exercise:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingExercise(null);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('workouts.loading')}</p>
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
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('workouts.title')}</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
            {groupedWorkouts.map((groupedWorkout) => (
              <motion.div
                key={groupedWorkout.date}
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
                        {new Date(groupedWorkout.date).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { 
                          day: 'numeric', 
                          month: 'long',
                          weekday: 'short'
                        })}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500">{groupedWorkout.totalExercises} {t('workouts.exercises')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWorkout(groupedWorkout.date)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700"
                    title={t('workouts.deleteWorkout')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {/* Перебираем тренировки и их упражнения */}
                  {groupedWorkout.workouts.map(workout => 
                    workout.exercises.map((exercise, exerciseIndex) => {
                      const isEditing = editingExercise?.workoutId === workout.id && editingExercise?.exerciseIndex === exerciseIndex;
                      
                      return (
                        <div key={`${workout.id}-${exerciseIndex}`} className={`py-2 px-3 bg-white rounded-lg border border-gray-100 group ${isEditing ? 'space-y-2' : 'flex items-center justify-between'}`}>
                          {isEditing ? (
                            /* Режим редактирования */
                            <div className="flex-1 space-y-3">
                              <input
                                type="text"
                                value={editingExercise.name}
                                onChange={(e) => setEditingExercise({...editingExercise, name: e.target.value})}
                                className="w-full p-2 text-xs sm:text-sm font-medium text-gray-800 bg-primary-50 border border-primary-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                                placeholder={t('workouts.exerciseName')}
                              />
                              
                              {/* Адаптивная сетка для мобильных и десктопных экранов */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div className="flex flex-col space-y-1">
                                  <label className="font-medium text-gray-600">{t('workouts.weight')}</label>
                                  <input
                                    type="number"
                                    value={editingExercise.weight}
                                    onChange={(e) => setEditingExercise({...editingExercise, weight: parseInt(e.target.value) || 0})}
                                    className="w-full p-2 bg-primary-50 border border-primary-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    min="0"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <label className="font-medium text-gray-600">{t('workouts.sets')}</label>
                                  <input
                                    type="number"
                                    value={editingExercise.sets}
                                    onChange={(e) => setEditingExercise({...editingExercise, sets: parseInt(e.target.value) || 0})}
                                    className="w-full p-2 bg-primary-50 border border-primary-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    min="1"
                                    placeholder="1"
                                  />
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <label className="font-medium text-gray-600">{t('workouts.reps')}</label>
                                  <input
                                    type="number"
                                    value={editingExercise.reps}
                                    onChange={(e) => setEditingExercise({...editingExercise, reps: parseInt(e.target.value) || 0})}
                                    className="w-full p-2 bg-primary-50 border border-primary-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    min="1"
                                    placeholder="1"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Режим просмотра */
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-800 text-xs sm:text-sm capitalize">{exercise.name}</h5>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                                {exercise.weight > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <span className="font-medium">{t('workouts.weightLabel')}</span>
                                    <span>{exercise.weight} {t('common.kg')}</span>
                                  </span>
                                )}
                                <span className="flex items-center space-x-1">
                                  <span className="font-medium">{t('workouts.setsLabel')}</span>
                                  <span>{exercise.sets}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <span className="font-medium">{t('workouts.repsLabel')}</span>
                                  <span>{exercise.reps}</span>
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Кнопки управления */}
                          {isEditing ? (
                            /* Кнопки в режиме редактирования - всегда видимы и увеличены для мобильных */
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-1 sm:space-y-0 sm:space-x-1 mt-2 sm:mt-0">
                              <button
                                onClick={handleSaveExercise}
                                className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-green-700 hover:text-green-800 text-xs font-medium transition-colors"
                                title={t('common.save')}
                              >
                                <Save className="w-4 h-4" />
                                <span className="sm:hidden">{t('common.save')}</span>
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 hover:text-gray-800 text-xs font-medium transition-colors"
                                title={t('common.cancel')}
                              >
                                <X className="w-4 h-4" />
                                <span className="sm:hidden">{t('common.cancel')}</span>
                              </button>
                            </div>
                          ) : (
                            /* Кнопка редактирования - показывается при наведении на десктопе, всегда видна на мобильных */
                            <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditExercise(workout.id, exerciseIndex, exercise)}
                                className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 hover:text-blue-700"
                                title={t('workouts.editExercise')}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ).flat()}
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
            
            {groupedWorkouts.length === 0 && workouts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-sm sm:text-base mb-2">{t('workouts.noWorkouts')}</p>
                <p className="text-xs sm:text-sm">{t('workouts.noWorkoutsDesc')}</p>
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
                <h3 className="text-lg font-semibold text-gray-900">{t('workouts.confirmDelete')}</h3>
                <p className="text-sm text-gray-500">{t('workouts.deleteConfirmDesc')}</p>
              </div>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelDeleteWorkout}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDeleteWorkout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                {t('workouts.delete')}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
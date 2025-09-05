import React, { useState, useEffect } from 'react';
import { workoutApi, Workout, WorkoutSummary } from '../../api/api';
import './WorkoutHistory.css';

interface WorkoutHistoryProps {
  userId?: number;
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ userId = 1 }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadWorkouts();
    loadStats();
  }, [userId]);

  const loadWorkouts = async () => {
    setIsLoading(true);
    try {
      const workoutsData = await workoutApi.getWorkouts(userId, 20);
      setWorkouts(workoutsData);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await workoutApi.getWorkoutStats(userId, 30);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadWorkoutDetails = async (workoutId: number) => {
    try {
      const workoutData = await workoutApi.getWorkout(workoutId);
      setSelectedWorkout(workoutData);
    } catch (error) {
      console.error('Error loading workout details:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="workout-history">
        <div className="loading">Загружаем историю тренировок...</div>
      </div>
    );
  }

  return (
    <div className="workout-history">
      <h2>История тренировок</h2>

      {/* Статистика */}
      {stats && (
        <div className="stats-panel">
          <div className="stat-card">
            <h3>{stats.total_workouts}</h3>
            <p>Тренировок за месяц</p>
          </div>
          <div className="stat-card">
            <h3>{stats.total_volume_kg}кг</h3>
            <p>Общий тоннаж</p>
          </div>
          <div className="stat-card">
            <h3>{stats.avg_workouts_per_week}</h3>
            <p>Тренировок в неделю</p>
          </div>
        </div>
      )}

      {/* Список тренировок */}
      <div className="workouts-container">
        <div className="workouts-list">
          {workouts.length === 0 ? (
            <div className="no-workouts">
              <p>У вас пока нет записанных тренировок.</p>
              <p>Начните логировать упражнения в чате!</p>
            </div>
          ) : (
            workouts.map((workout) => (
              <div
                key={workout.id}
                className={`workout-item ${selectedWorkout?.workout.id === workout.id ? 'selected' : ''}`}
                onClick={() => loadWorkoutDetails(workout.id)}
              >
                <div className="workout-date">
                  <strong>{formatDate(workout.date)}</strong>
                  <span>{formatTime(workout.date)}</span>
                </div>
                <div className="workout-name">
                  {workout.name || 'Тренировка'}
                </div>
                {workout.duration_minutes && (
                  <div className="workout-duration">
                    {workout.duration_minutes} мин
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Детали выбранной тренировки */}
        {selectedWorkout && (
          <div className="workout-details">
            <h3>Детали тренировки</h3>
            <div className="workout-info">
              <p><strong>Дата:</strong> {formatDate(selectedWorkout.workout.date)} в {formatTime(selectedWorkout.workout.date)}</p>
              <p><strong>Общий тоннаж:</strong> {selectedWorkout.total_volume.toFixed(1)} кг</p>
              {selectedWorkout.workout.notes && (
                <p><strong>Заметки:</strong> {selectedWorkout.workout.notes}</p>
              )}
            </div>

            <h4>Упражнения</h4>
            <div className="exercises-list">
              {selectedWorkout.exercises.map((exercise, index) => (
                <div key={index} className="exercise-item">
                  <div className="exercise-name">{exercise.exercise_name}</div>
                  <div className="exercise-details">
                    {exercise.sets && <span>{exercise.sets} подходов</span>}
                    {exercise.reps && <span>{exercise.reps} повторений</span>}
                    {exercise.weight && <span>{exercise.weight} кг</span>}
                  </div>
                  {exercise.volume > 0 && (
                    <div className="exercise-volume">
                      Объем: {exercise.volume.toFixed(1)} кг
                    </div>
                  )}
                  {exercise.notes && (
                    <div className="exercise-notes">
                      {exercise.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Топ упражнений */}
      {stats && stats.top_exercises && stats.top_exercises.length > 0 && (
        <div className="top-exercises">
          <h3>Популярные упражнения</h3>
          <div className="top-exercises-list">
            {stats.top_exercises.map((exercise: any, index: number) => (
              <div key={index} className="top-exercise-item">
                <span className="exercise-rank">#{index + 1}</span>
                <span className="exercise-name">{exercise.name}</span>
                <span className="exercise-count">{exercise.count} раз</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutHistory;
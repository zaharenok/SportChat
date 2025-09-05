import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Flame, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { workoutApi, WorkoutDayUpdate } from '../../api/api';
import EditWorkoutDayDialog from './EditWorkoutDayDialog';

interface WorkoutDay {
  date: Date;
  emoji: string;
  workoutSummary: string;
  completionPercentage: number;
  streak: number;
  exercises: string[];
  volume: number;
  intensity: number;
  duration: number;
  notes: string;
}

interface WorkoutCalendarProps {
  userId?: number;
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ userId = 1 }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState({
    workoutsCompleted: 0,
    totalVolume: 0,
    averageIntensity: 0,
    bestStreak: 0
  });
  const [loading, setLoading] = useState(false);

  // Загружаем реальные данные из API
  useEffect(() => {
    loadCalendarData();
  }, [currentDate, userId]);

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await workoutApi.getCalendarData(
        userId,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );

      // Преобразуем данные API в формат WorkoutDay
      const workoutDays: WorkoutDay[] = data.workouts.map(workout => ({
        date: new Date(workout.date),
        emoji: workout.emoji,
        workoutSummary: `${workout.exercises.length} упражнений`,
        completionPercentage: workout.intensity * 10, // intensity 1-10 -> 10-100%
        streak: 1, // Пока простая логика
        exercises: workout.exercises,
        volume: Math.round(workout.total_volume),
        intensity: workout.intensity,
        duration: workout.duration,
        notes: workout.notes
      }));

      // Сортируем по дате
      workoutDays.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Вычисляем streak
      let streak = 0;
      const today = new Date();
      for (let i = workoutDays.length - 1; i >= 0; i--) {
        const workout = workoutDays[i];
        if (workout.date <= today) {
          streak++;
          workout.streak = streak;
        }
      }

      setWorkoutDays(workoutDays);
      setCurrentStreak(streak);

      // Вычисляем статистику месяца
      const stats = {
        workoutsCompleted: workoutDays.length,
        totalVolume: workoutDays.reduce((sum, day) => sum + day.volume, 0),
        averageIntensity: workoutDays.length > 0 
          ? Math.floor(workoutDays.reduce((sum, day) => sum + day.intensity * 10, 0) / workoutDays.length)
          : 0,
        bestStreak: Math.max(...workoutDays.map(day => day.streak), 0)
      };
      setMonthlyStats(stats);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, currentDate]);

  const getWorkoutForDay = (date: Date): WorkoutDay | undefined => {
    return workoutDays.find(workout => 
      workout.date.getDate() === date.getDate() &&
      workout.date.getMonth() === date.getMonth() &&
      workout.date.getFullYear() === date.getFullYear()
    );
  };

  const getDaysInMonth = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay()); // Начинаем с воскресенья

    const days = [];
    for (let i = 0; i < 42; i++) { // 6 недель × 7 дней
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatMonth = () => {
    return currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    setSelectedDay(null); // Сбрасываем выбранный день при переходе между месяцами
  };

  const handleDayClick = (date: Date) => {
    const workout = getWorkoutForDay(date);
    if (workout) {
      setSelectedDay(workout);
    } else {
      // Если тренировки нет, открываем диалог редактирования
      setEditingDate(date);
      setIsEditDialogOpen(true);
    }
  };

  const handleEditDay = (date: Date) => {
    setEditingDate(date);
    setIsEditDialogOpen(true);
  };

  const handleSaveWorkoutDay = async (date: Date, workoutData: Omit<WorkoutDay, 'date'> | null) => {
    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (workoutData === null) {
        // Удаляем тренировку
        await workoutApi.deleteCalendarDay(userId, dateStr);
      } else {
        // Обновляем/создаем тренировку
        const updateData: WorkoutDayUpdate = {
          exercises: workoutData.exercises,
          emoji: workoutData.emoji,
          intensity: workoutData.intensity,
          duration: workoutData.duration,
          notes: workoutData.notes
        };
        await workoutApi.updateCalendarDay(userId, dateStr, updateData);
      }
      
      // Перезагружаем данные календаря
      await loadCalendarData();
      setSelectedDay(null);
    } catch (error) {
      console.error('Error saving workout day:', error);
    }
  };

  const getIntensityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-orange-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '💎';
    if (streak >= 1) return '⭐';
    return '';
  };

  return (
    <div className="space-y-6 p-4">
      {/* Статистика месяца */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{monthlyStats.workoutsCompleted}</div>
            <div className="text-sm text-muted-foreground">Тренировок</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">{Math.round(monthlyStats.totalVolume / 1000)}к</div>
            <div className="text-sm text-muted-foreground">Тоннаж (кг)</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{monthlyStats.averageIntensity}%</div>
            <div className="text-sm text-muted-foreground">Интенсивность</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500 flex items-center justify-center gap-1">
              {currentStreak} {getStreakEmoji(currentStreak)}
            </div>
            <div className="text-sm text-muted-foreground">Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Календарь */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {formatMonth()}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                ←
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                →
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((date, index) => {
              const workout = getWorkoutForDay(date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              const isFuture = date > new Date();

              return (
                <Button
                  key={index}
                  variant={isToday ? 'default' : 'ghost'}
                  className={`
                    h-12 w-full p-1 relative
                    ${isCurrentMonth ? '' : 'opacity-30'}
                    ${isFuture ? 'opacity-50' : ''}
                    ${workout ? 'bg-accent' : ''}
                  `}
                  onClick={() => handleDayClick(date)}
                  disabled={isFuture}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-xs">{date.getDate()}</div>
                    {workout && (
                      <div className="text-lg leading-none">{workout.emoji}</div>
                    )}
                    {workout && workout.streak > 1 && (
                      <div className="absolute top-0 right-0 text-xs">
                        {getStreakEmoji(workout.streak)}
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Детали выбранного дня */}
      {selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedDay.emoji}</span>
                {selectedDay.workoutSummary}
                <Badge variant="outline">
                  {selectedDay.date.toLocaleDateString('ru-RU')}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditDay(selectedDay.date)}
                className="flex items-center gap-1"
              >
                <Edit2 className="h-4 w-4" />
                Редактировать
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Интенсивность</div>
                <div className={`text-lg font-semibold ${getIntensityColor(selectedDay.completionPercentage)}`}>
                  {selectedDay.intensity}/10
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Длительность</div>
                <div className="text-lg font-semibold">
                  {selectedDay.duration} мин
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Объем</div>
                <div className="text-lg font-semibold">
                  {selectedDay.volume > 0 ? (selectedDay.volume / 1000).toFixed(1) + 'к кг' : '—'}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-2">Упражнения</div>
              <div className="flex flex-wrap gap-2">
                {selectedDay.exercises.map((exercise, index) => (
                  <Badge key={index} variant="secondary">
                    {exercise}
                  </Badge>
                ))}
              </div>
            </div>

            {selectedDay.notes && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Заметки</div>
                <div className="bg-muted p-3 rounded-md text-sm">
                  {selectedDay.notes}
                </div>
              </div>
            )}

            {selectedDay.streak > 1 && (
              <div className="bg-orange-50 p-3 rounded-md">
                <div className="flex items-center gap-2 text-orange-700">
                  <Flame className="h-4 w-4" />
                  <span className="font-medium">
                    Streak: {selectedDay.streak} дней! {getStreakEmoji(selectedDay.streak)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Диалог редактирования */}
      {isEditDialogOpen && editingDate && (
        <EditWorkoutDayDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingDate(null);
          }}
          date={editingDate}
          workoutDay={getWorkoutForDay(editingDate)}
          onSave={handleSaveWorkoutDay}
        />
      )}

      {/* Легенда */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Легенда</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">💪</span>
              <span>Силовая тренировка</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏃</span>
              <span>Кардио тренировка</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🧘</span>
              <span>Гибкость/Йога</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <span>Streak 7+ дней</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">💎</span>
              <span>Streak 3-6 дней</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <span>Streak 1-2 дня</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutCalendar;
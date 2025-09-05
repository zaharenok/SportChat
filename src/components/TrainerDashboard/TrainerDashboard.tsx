import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { TrendingUp, TrendingDown, Dumbbell, AlertTriangle, Activity, Target, Flame, Trophy } from 'lucide-react';

interface TrainerDashboardData {
  overview: {
    total_clients: number;
    active_clients: number;
    inactive_clients: number;
    total_workouts: number;
    total_exercises: number;
    total_reps: number;
  };
  client_progress: Array<{
    user_id: number;
    username: string;
    workouts_count: number;
    last_workout: string | null;
    days_since_last: number | null;
    is_active: boolean;
    total_exercises: number;
    total_reps: number;
    total_volume: number;
    progress_trend: string;
  }>;
  activity_heatmap: { [key: string]: number };
  alerts: Array<{
    type: string;
    user_id: number;
    username: string;
    message: string;
    severity: string;
    days_inactive?: number;
  }>;
}

interface TrainerDashboardProps {
  onNavigate: (tabValue: string) => void;
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState<TrainerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [userGoals, setUserGoals] = useState<any[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: 'workouts',
    target_value: 20,
    period: 'month',
    description: ''
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/workouts/trainer-dashboard/1?days=${selectedPeriod}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dashboard data loaded:', data);
      setDashboardData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  }, [selectedPeriod]);

  const loadUserGoals = useCallback(async () => {
    try {
      setGoalsLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/goals/user/1`);
      
      if (!response.ok) {
        console.error('Goals API error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Goals data loaded:', data);
      setUserGoals(data);
    } catch (error) {
      console.error('Failed to load goals data:', error);
      setUserGoals([]);
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    loadUserGoals();
  }, [loadDashboardData, loadUserGoals]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? <TrendingUp className="h-4 w-4 text-green-600" /> : 
           <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const formatLastWorkout = (lastWorkout: string | null, daysAgo: number | null) => {
    if (!lastWorkout || daysAgo === null) return 'Никогда';
    if (daysAgo === 0) return 'Сегодня';
    if (daysAgo === 1) return 'Вчера';
    return `${daysAgo} дней назад`;
  };

  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const calculateStreak = (activityHeatmap: { [key: string]: number }) => {
    const dates = Object.keys(activityHeatmap).sort().reverse();
    let streak = 0;
    
    for (const date of dates) {
      if (activityHeatmap[date] > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const handleStartWorkout = () => {
    // Navigate to chat tab to start workout
    onNavigate('chat');
  };

  const handleViewHistory = () => {
    // Navigate to history tab
    onNavigate('history');
  };

  const handleViewProgress = () => {
    // Scroll to progress section in current tab
    const progressElement = document.getElementById('progress-section');
    if (progressElement) {
      progressElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewGoals = () => {
    // Scroll to goals section in current tab
    const goalsElement = document.getElementById('goals-section');
    if (goalsElement) {
      goalsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCreateGoal = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/goals/user/1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGoal),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh goals after creating
      await loadUserGoals();
      setIsAddGoalOpen(false);
      
      // Reset form
      setNewGoal({
        type: 'workouts',
        target_value: 20,
        period: 'month',
        description: ''
      });
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="text-center text-gray-500">Ошибка загрузки данных</div>;
  }

  const currentStreak = calculateStreak(dashboardData.activity_heatmap);

  // Вычисляем общий прогресс на основе целей
  const workoutProgress = userGoals.length > 0 
    ? userGoals.reduce((acc, goalData) => acc + goalData.progress_percentage, 0) / userGoals.length 
    : 0;

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Заголовок и фильтры */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
              <AvatarFallback className="text-base sm:text-lg font-bold">
                {dashboardData?.client_progress[0]?.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Мой дашборд</h1>
              {currentStreak > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>Streak: {currentStreak} дней</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
            {[7, 30, 90].map(days => (
              <Button
                key={days}
                variant={selectedPeriod === days ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(days)}
                className="flex-1 sm:flex-initial text-xs sm:text-sm"
              >
                {days} дней
              </Button>
            ))}
          </div>
        </div>

        {/* Цели и прогресс */}
        <Card id="goals-section">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Мои цели
              </div>
              <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Добавить цель
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Добавить новую цель</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Тип цели</label>
                      <select 
                        value={newGoal.type} 
                        onChange={(e) => setNewGoal({...newGoal, type: e.target.value})}
                        className="w-full p-2 border rounded-md mt-1"
                      >
                        <option value="workouts">Тренировки</option>
                        <option value="exercises">Упражнения</option>
                        <option value="reps">Повторения</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Целевое значение</label>
                      <input 
                        type="number" 
                        value={newGoal.target_value} 
                        onChange={(e) => setNewGoal({...newGoal, target_value: Number(e.target.value)})}
                        className="w-full p-2 border rounded-md mt-1"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Период</label>
                      <select 
                        value={newGoal.period} 
                        onChange={(e) => setNewGoal({...newGoal, period: e.target.value})}
                        className="w-full p-2 border rounded-md mt-1"
                      >
                        <option value="week">Неделя</option>
                        <option value="month">Месяц</option>
                        <option value="year">Год</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Описание (необязательно)</label>
                      <input 
                        type="text" 
                        value={newGoal.description} 
                        onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                        className="w-full p-2 border rounded-md mt-1"
                        placeholder="Например: Тренироваться 3 раза в неделю"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleCreateGoal} className="flex-1">
                        Создать цель
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddGoalOpen(false)}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : userGoals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {userGoals.map((goalData: any) => {
                  const goal = goalData.goal;
                  const progressPercentage = goalData.progress_percentage;
                  const status = goalData.status;
                  
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">
                          {goal.type === 'workouts' ? 'Тренировки' : 
                           goal.type === 'exercises' ? 'Упражнения' : 
                           goal.type === 'reps' ? 'Повторения' : goal.type}
                        </span>
                        <Badge variant={status === 'completed' ? 'default' : 'outline'}>
                          {Math.round(progressPercentage)}%
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">
                        {Math.round(goal.current_value)}/{Math.round(goal.target_value)}
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {goal.description || `Осталось: ${Math.max(0, goal.target_value - goal.current_value)}`}
                      </p>
                      {status === 'completed' && (
                        <Badge variant="default" className="w-fit">
                          Выполнено! 🎉
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Нет активных целей</h3>
                <p className="text-muted-foreground mb-4">
                  Поставьте себе цели для мотивации и отслеживания прогресса
                </p>
                <Button onClick={() => setIsAddGoalOpen(true)}>
                  Добавить первую цель
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Достижения и быстрые действия */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card id="progress-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Достижения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 sm:p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Текущий streak</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Дней подряд</p>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold">{currentStreak}</div>
              </div>
              
              <div className="flex items-center justify-between p-2 sm:p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Активность</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Процент от цели</p>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold">{Math.round(workoutProgress)}%</div>
              </div>
              
              {workoutProgress >= 100 && (
                <Badge className="w-full justify-center" variant="default">
                  🎉 Месячная цель достигнута!
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Быстрые действия
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button onClick={handleStartWorkout} className="flex flex-col gap-1 sm:gap-2 h-auto p-3 sm:p-4">
                  <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs sm:text-sm">Начать тренировку</span>
                </Button>
                <Button onClick={handleViewHistory} variant="outline" className="flex flex-col gap-1 sm:gap-2 h-auto p-3 sm:p-4">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs sm:text-sm">История</span>
                </Button>
                <Button onClick={handleViewGoals} variant="outline" className="flex flex-col gap-1 sm:gap-2 h-auto p-3 sm:p-4">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs sm:text-sm">Цели</span>
                </Button>
                <Button onClick={handleViewProgress} variant="outline" className="flex flex-col gap-1 sm:gap-2 h-auto p-3 sm:p-4">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs sm:text-sm">Прогресс</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Алерты */}
        {dashboardData.alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Алерты и уведомления
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardData.alerts.slice(0, 5).map((alert, index) => (
                <Alert key={index} className="border-l-4 border-l-red-500">
                  <AlertDescription className="flex justify-between items-center">
                    <span>{alert.message}</span>
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Мой прогресс */}
        <Card>
          <CardHeader>
            <CardTitle>Мой прогресс</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.client_progress.map(client => (
                <div key={client.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-3 h-3 rounded-full ${client.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <h3 className="font-medium text-sm sm:text-base">{client.username}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Последняя тренировка: {formatLastWorkout(client.last_workout, client.days_since_last)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm sm:ml-auto overflow-x-auto">
                    <div className="text-center min-w-fit">
                      <div className="font-medium">{client.workouts_count}</div>
                      <div className="text-gray-500 text-xs">тренировок</div>
                    </div>
                    <div className="text-center min-w-fit">
                      <div className="font-medium">{client.total_exercises}</div>
                      <div className="text-gray-500 text-xs">упражнений</div>
                    </div>
                    <div className="text-center min-w-fit">
                      <div className="font-medium">{client.total_reps}</div>
                      <div className="text-gray-500 text-xs">повторений</div>
                    </div>
                    {client.total_volume > 0 && (
                      <div className="text-center min-w-fit">
                        <div className="font-medium">{client.total_volume}кг</div>
                        <div className="text-gray-500 text-xs">тоннаж</div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 min-w-fit">
                      {getTrendIcon(client.progress_trend)}
                      <span className="capitalize text-xs sm:text-sm">{client.progress_trend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Тепловая карта активности */}
        <Card>
          <CardHeader>
            <CardTitle>Календарь тренировок</CardTitle>
            <p className="text-sm text-muted-foreground">
              Наведите на день для подробностей
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {Object.entries(dashboardData.activity_heatmap).slice(-35).map(([date, count]) => {
                const intensity = Math.min(count / 3, 1);
                const dateObj = new Date(date);
                return (
                  <Tooltip key={date}>
                    <TooltipTrigger>
                      <div
                        className="aspect-square border rounded-sm cursor-pointer hover:border-primary transition-colors flex flex-col justify-between p-1"
                        style={{
                          backgroundColor: count === 0 ? 'rgb(241 245 249)' : `rgba(34, 197, 94, ${intensity})`,
                        }}
                      >
                        <div className="text-[10px] text-center font-medium">
                          {dateObj.getDate()}
                        </div>
                        {count > 0 && (
                          <div className="text-[10px] text-center font-bold">
                            {count}
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-medium">{dateObj.toLocaleDateString('ru-RU', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'short' 
                        })}</p>
                        <p>{count === 0 ? 'Без тренировок' : `${count} тренировок`}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            
            {/* Легенда */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Менее активно</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className="w-3 h-3 rounded-sm border"
                    style={{
                      backgroundColor: level === 0 ? 'rgb(241 245 249)' : `rgba(34, 197, 94, ${level * 0.25})`,
                    }}
                  />
                ))}
              </div>
              <span>Более активно</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default TrainerDashboard;
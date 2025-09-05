import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Calendar, X, Plus, Save, Trash2 } from 'lucide-react';

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

interface EditWorkoutDayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  workoutDay?: WorkoutDay;
  onSave: (date: Date, workoutData: Omit<WorkoutDay, 'date'> | null) => Promise<void>;
}

const WORKOUT_EMOJIS = ['💪', '🏃', '🧘', '🏋️', '🤸', '⚽', '🏊', '🚴', '🥊', '🤾'];

const EditWorkoutDayDialog: React.FC<EditWorkoutDayDialogProps> = ({
  isOpen,
  onClose,
  date,
  workoutDay,
  onSave
}) => {
  const [hasWorkout, setHasWorkout] = useState(!!workoutDay);
  const [exercises, setExercises] = useState<string[]>(workoutDay?.exercises || []);
  const [selectedEmoji, setSelectedEmoji] = useState(workoutDay?.emoji || '💪');
  const [intensity, setIntensity] = useState(workoutDay?.intensity || 7);
  const [duration, setDuration] = useState(workoutDay?.duration || 60);
  const [notes, setNotes] = useState(workoutDay?.notes || '');
  const [newExercise, setNewExercise] = useState('');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAddExercise = () => {
    if (newExercise.trim() && !exercises.includes(newExercise.trim())) {
      setExercises([...exercises, newExercise.trim()]);
      setNewExercise('');
    }
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (hasWorkout) {
      const workoutData = {
        emoji: selectedEmoji,
        workoutSummary: `${exercises.length} упражнений`,
        completionPercentage: intensity * 10,
        streak: 1,
        exercises,
        volume: 0,
        intensity,
        duration,
        notes: notes.trim()
      };
      await onSave(date, workoutData);
    } else {
      // Удаляем тренировку
      await onSave(date, null);
    }
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newExercise.trim()) {
      handleAddExercise();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {formatDate(date)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Переключатель наличия тренировки */}
          <div className="flex items-center justify-between">
            <Label htmlFor="has-workout" className="text-sm font-medium">
              Была тренировка в этот день
            </Label>
            <Switch
              id="has-workout"
              checked={hasWorkout}
              onCheckedChange={setHasWorkout}
            />
          </div>

          {hasWorkout ? (
            <>
              {/* Выбор эмодзи */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Тип тренировки</Label>
                <div className="flex flex-wrap gap-2">
                  {WORKOUT_EMOJIS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant={selectedEmoji === emoji ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedEmoji(emoji)}
                      className="text-lg p-2 w-10 h-10"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Упражнения */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Упражнения</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Добавить упражнение..."
                    value={newExercise}
                    onChange={(e) => setNewExercise(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddExercise}
                    disabled={!newExercise.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {exercises.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exercises.map((exercise, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs px-2 py-1 flex items-center gap-1"
                      >
                        {exercise}
                        <button
                          onClick={() => handleRemoveExercise(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Интенсивность */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Интенсивность: {intensity}/10
                </Label>
                <Input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Длительность */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium">
                  Длительность (минуты)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min="5"
                  max="300"
                />
              </div>

              {/* Заметки */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Заметки
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Дополнительные заметки о тренировке..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Trash2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Тренировка будет удалена из календаря</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {hasWorkout ? 'Сохранить' : 'Удалить тренировку'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditWorkoutDayDialog;
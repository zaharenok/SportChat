import React from 'react';
import { Dumbbell, Scale, Hash, FileText, Zap, Target, Timer } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface QuickInputButtonsProps {
  onQuickInput: (text: string) => void;
  isVisible: boolean;
}

const QuickInputButtons: React.FC<QuickInputButtonsProps> = ({ onQuickInput, isVisible }) => {
  // Популярные упражнения
  const popularExercises = [
    'жим лежа',
    'приседания',
    'становая тяга',
    'жим стоя',
    'подтягивания',
    'отжимания',
    'планка',
    'тяга штанги'
  ];

  // Частые веса
  const commonWeights = [
    '20кг', '40кг', '50кг', '60кг', '70кг', '80кг', '90кг', '100кг'
  ];

  // Частые форматы подходов
  const commonSets = [
    '3х8', '3х10', '3х12', '4х8', '5х5'
  ];

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Популярные упражнения
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {popularExercises.map((exercise) => (
              <Badge
                key={exercise}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 transition-colors px-3 py-1.5 text-xs"
                onClick={() => onQuickInput(exercise)}
              >
                {exercise}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Частые веса
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {commonWeights.map((weight) => (
              <Badge
                key={weight}
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors px-3 py-1.5 text-xs"
                onClick={() => onQuickInput(weight)}
              >
                {weight}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Подходы/повторения
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {commonSets.map((set) => (
              <Badge
                key={set}
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors px-3 py-1.5 text-xs"
                onClick={() => onQuickInput(set)}
              >
                {set}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Шаблоны
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-auto p-3 text-left justify-start"
              onClick={() => onQuickInput('Делал жим лежа 80кг 3х8')}
            >
              <Zap className="h-4 w-4 mr-2 shrink-0" />
              <span className="text-xs">Жим лежа 80кг 3х8</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-auto p-3 text-left justify-start"
              onClick={() => onQuickInput('Приседания 100кг 5х5')}
            >
              <Target className="h-4 w-4 mr-2 shrink-0" />
              <span className="text-xs">Приседания 100кг 5х5</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-auto p-3 text-left justify-start"
              onClick={() => onQuickInput('Планка 60 секунд')}
            >
              <Timer className="h-4 w-4 mr-2 shrink-0" />
              <span className="text-xs">Планка 60 секунд</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-auto p-3 text-left justify-start"
              onClick={() => onQuickInput('Как мой прогресс?')}
            >
              <FileText className="h-4 w-4 mr-2 shrink-0" />
              <span className="text-xs">Как мой прогресс?</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickInputButtons;
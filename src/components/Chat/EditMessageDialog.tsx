import React, { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';

interface EditMessageDialogProps {
  messageId: number;
  originalText: string;
  onSave: (messageId: number, newText: string) => void;
  parsedData?: {
    exercise?: string;
    weight?: number;
    sets?: number;
    reps?: number;
  };
}

const EditMessageDialog: React.FC<EditMessageDialogProps> = ({
  messageId,
  originalText,
  onSave,
  parsedData
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editedText, setEditedText] = useState(originalText);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (editedText.trim() === originalText.trim()) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(messageId, editedText);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving edited message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedText(originalText);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Редактировать сообщение"
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактировать сообщение</DialogTitle>
          <DialogDescription>
            Исправьте данные тренировки. Система автоматически пересчитает статистику.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Текст сообщения:
            </label>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="Например: жим лежа 80кг 3х8"
              rows={3}
              className="resize-none"
            />
          </div>

          {parsedData && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Текущие данные:
              </label>
              <div className="flex flex-wrap gap-2">
                {parsedData.exercise && (
                  <Badge variant="outline">
                    🏋️ {parsedData.exercise}
                  </Badge>
                )}
                {parsedData.weight && (
                  <Badge variant="outline">
                    ⚖️ {parsedData.weight}кг
                  </Badge>
                )}
                {parsedData.sets && parsedData.reps && (
                  <Badge variant="outline">
                    🔢 {parsedData.sets}х{parsedData.reps}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
            💡 <strong>Совет:</strong> Используйте формат "упражнение вескг подходыхповторения" 
            для лучшего распознавания (например: "жим лежа 80кг 3х8")
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            <X className="w-4 h-4 mr-2" />
            Отмена
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !editedText.trim()}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                Сохранение...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Сохранить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditMessageDialog;
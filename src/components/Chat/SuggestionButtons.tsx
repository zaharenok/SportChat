import React from 'react';
import { Lightbulb } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface SuggestionButtonsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const SuggestionButtons: React.FC<SuggestionButtonsProps> = ({ 
  suggestions, 
  onSuggestionClick 
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Предложения
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="secondary"
              size="sm"
              className="h-auto p-3 text-xs"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestionButtons;
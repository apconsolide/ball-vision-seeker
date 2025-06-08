
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface DetectionModesProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
}

const DetectionModes = ({ currentMode, onModeChange }: DetectionModesProps) => {
  const modes = [
    {
      id: 'standard',
      name: 'Standard Detection',
      description: 'Basic Hough Circle Transform',
      badge: 'Fast'
    },
    {
      id: 'multiscale',
      name: 'Multi-Scale',
      description: 'Multiple resolution analysis',
      badge: 'Accurate'
    },
    {
      id: 'color',
      name: 'Color Segmentation',
      description: 'Color-based ball detection',
      badge: 'Precise'
    },
    {
      id: 'template',
      name: 'Template Matching',
      description: 'Pattern-based detection',
      badge: 'Robust'
    },
    {
      id: 'contour',
      name: 'Contour Analysis',
      description: 'Shape-based detection',
      badge: 'Advanced'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Detection Modes</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={currentMode} onValueChange={onModeChange}>
          <div className="space-y-3">
            {modes.map((mode) => (
              <div key={mode.id} className="flex items-start space-x-3">
                <RadioGroupItem value={mode.id} id={mode.id} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={mode.id} className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{mode.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {mode.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {mode.description}
                    </p>
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default DetectionModes;

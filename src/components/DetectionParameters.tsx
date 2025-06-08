
import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { DetectionParams } from './AdvancedSoccerDetector';

interface DetectionParametersProps {
  params: DetectionParams;
  onChange: (params: DetectionParams) => void;
}

const DetectionParameters = ({ params, onChange }: DetectionParametersProps) => {
  const updateParam = (key: keyof DetectionParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Min Distance: {params.minDistance}px
        </Label>
        <Slider
          value={[params.minDistance]}
          onValueChange={([value]) => updateParam('minDistance', value)}
          max={200}
          min={10}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Minimum distance between detected circles
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Canny Threshold: {params.cannyThreshold}
        </Label>
        <Slider
          value={[params.cannyThreshold]}
          onValueChange={([value]) => updateParam('cannyThreshold', value)}
          max={300}
          min={50}
          step={10}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Edge detection sensitivity
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Circle Threshold: {params.circleThreshold}
        </Label>
        <Slider
          value={[params.circleThreshold]}
          onValueChange={([value]) => updateParam('circleThreshold', value)}
          max={100}
          min={10}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Hough Circle Transform threshold
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Min Radius: {params.minRadius}px
        </Label>
        <Slider
          value={[params.minRadius]}
          onValueChange={([value]) => updateParam('minRadius', value)}
          max={50}
          min={5}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Minimum circle radius to detect
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Max Radius: {params.maxRadius}px
        </Label>
        <Slider
          value={[params.maxRadius]}
          onValueChange={([value]) => updateParam('maxRadius', value)}
          max={300}
          min={50}
          step={10}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Maximum circle radius to detect
        </p>
      </div>
    </div>
  );
};

export default DetectionParameters;

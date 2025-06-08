
import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { AdvancedParams } from './AdvancedSoccerDetector';

interface AdvancedSettingsProps {
  params: AdvancedParams;
  onChange: (params: AdvancedParams) => void;
}

const AdvancedSettings = ({ params, onChange }: AdvancedSettingsProps) => {
  const updateParam = (key: keyof AdvancedParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Contrast: {params.contrast.toFixed(1)}
        </Label>
        <Slider
          value={[params.contrast]}
          onValueChange={([value]) => updateParam('contrast', value)}
          max={3.0}
          min={0.1}
          step={0.1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Adjust image contrast (1.0 = normal)
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Brightness: {params.brightness}
        </Label>
        <Slider
          value={[params.brightness]}
          onValueChange={([value]) => updateParam('brightness', value)}
          max={100}
          min={-100}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Adjust image brightness (0 = normal)
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Edge Enhancement: {params.edgeEnhancement.toFixed(1)}
        </Label>
        <Slider
          value={[params.edgeEnhancement]}
          onValueChange={([value]) => updateParam('edgeEnhancement', value)}
          max={3.0}
          min={0.0}
          step={0.1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Enhance edges for better detection
        </p>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Processing Pipeline</h4>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>1. Contrast & Brightness adjustment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>2. Edge enhancement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>3. Circle detection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;

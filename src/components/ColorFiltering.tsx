
import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ColorFilterParams } from './AdvancedSoccerDetector';

interface ColorFilteringProps {
  params: ColorFilterParams;
  onChange: (params: ColorFilterParams) => void;
}

const ColorFiltering = ({ params, onChange }: ColorFilteringProps) => {
  const updateParam = (key: keyof ColorFilterParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          White Threshold: {params.whiteThreshold}
        </Label>
        <Slider
          value={[params.whiteThreshold]}
          onValueChange={([value]) => updateParam('whiteThreshold', value)}
          max={255}
          min={100}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Threshold for isolating white objects
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Blur Kernel: {params.blurKernel}
        </Label>
        <Slider
          value={[params.blurKernel]}
          onValueChange={([value]) => updateParam('blurKernel', value)}
          max={25}
          min={3}
          step={2}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Gaussian blur kernel size for noise reduction
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Morphology Size: {params.morphologySize}
        </Label>
        <Slider
          value={[params.morphologySize]}
          onValueChange={([value]) => updateParam('morphologySize', value)}
          max={15}
          min={1}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Kernel size for morphological operations
        </p>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Color Filter Preview</h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded mx-auto mb-1"></div>
            <span>White</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-300 border-2 border-gray-400 rounded mx-auto mb-1"></div>
            <span>Gray</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-black border-2 border-gray-500 rounded mx-auto mb-1"></div>
            <span>Black</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorFiltering;

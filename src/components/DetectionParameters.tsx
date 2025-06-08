/**
 * @file DetectionParameters.tsx
 * React component for configuring OpenCV Hough Circle Transform parameters.
 * It provides sliders for users to adjust values and communicates changes
 * via an `onChange` callback.
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { DetectionParams } from './AdvancedSoccerDetector'; // Type for detection parameters

/**
 * @interface DetectionParametersProps
 * Props for the DetectionParameters component.
 * @property {DetectionParams} params - The current detection parameters.
 * @property {(params: DetectionParams) => void} onChange - Callback function invoked when any parameter changes.
 */
interface DetectionParametersProps {
  params: DetectionParams;
  onChange: (params: DetectionParams) => void;
}

/**
 * DetectionParameters component.
 * Renders a set of sliders for adjusting Hough Circle detection parameters.
 * @param {DetectionParametersProps} props - The component's props.
 * @returns {JSX.Element} The rendered component.
 */
const DetectionParameters = ({ params, onChange }: DetectionParametersProps): JSX.Element => {
  /**
   * Updates a specific parameter and calls the onChange callback.
   * @param {keyof DetectionParams} key - The name of the parameter to update.
   * @param {number} value - The new value for the parameter.
   */
  const updateParam = (key: keyof DetectionParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Min Distance Slider */}
      <div className="space-y-2">
        <Label htmlFor={`minDistance-slider`} className="text-sm font-medium">
          Min Distance: {params.minDistance}px
        </Label>
        <Slider
          id={`minDistance-slider`}
          value={[params.minDistance]}
          onValueChange={([value]) => updateParam('minDistance', value)}
          max={200}
          min={10}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Minimum distance between centers of detected circles. Higher values reduce overlapping circles.
        </p>
      </div>

      {/* Canny Threshold Slider */}
      <div className="space-y-2">
        <Label htmlFor={`cannyThreshold-slider`} className="text-sm font-medium">
          Canny Threshold (Param1): {params.cannyThreshold}
        </Label>
        <Slider
          id={`cannyThreshold-slider`}
          value={[params.cannyThreshold]}
          onValueChange={([value]) => updateParam('cannyThreshold', value)}
          max={300}
          min={50}
          step={10}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Upper threshold for the Canny edge detector. Lower values detect more (potentially weaker) edges.
        </p>
      </div>

      {/* Circle Threshold Slider */}
      <div className="space-y-2">
        <Label htmlFor={`circleThreshold-slider`} className="text-sm font-medium">
          Circle Accumulator Threshold (Param2): {params.circleThreshold}
        </Label>
        <Slider
          id={`circleThreshold-slider`}
          value={[params.circleThreshold]}
          onValueChange={([value]) => updateParam('circleThreshold', value)}
          max={100}
          min={10}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Accumulator threshold for circle centers. Smaller values detect more circles, including weaker ones.
        </p>
      </div>

      {/* Min Radius Slider */}
      <div className="space-y-2">
        <Label htmlFor={`minRadius-slider`} className="text-sm font-medium">
          Min Radius: {params.minRadius}px
        </Label>
        <Slider
          id={`minRadius-slider`}
          value={[params.minRadius]}
          onValueChange={([value]) => updateParam('minRadius', value)}
          max={50}
          min={5}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Minimum radius of circles to detect.
        </p>
      </div>

      {/* Max Radius Slider */}
      <div className="space-y-2">
        <Label htmlFor={`maxRadius-slider`} className="text-sm font-medium">
          Max Radius: {params.maxRadius}px
        </Label>
        <Slider
          id={`maxRadius-slider`}
          value={[params.maxRadius]}
          onValueChange={([value]) => updateParam('maxRadius', value)}
          max={300}
          min={50} // Assuming maxRadius should be larger than minRadius typical values
          step={10}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Maximum radius of circles to detect.
        </p>
      </div>

      {/* Blur Kernel Size Slider */}
      <div className="space-y-2">
        <Label htmlFor={`blurKernelSize-slider`} className="text-sm font-medium">
          Blur Kernel Size: {params.blurKernelSize}px (odd values)
        </Label>
        <Slider
          id={`blurKernelSize-slider`}
          value={[params.blurKernelSize]}
          onValueChange={([value]) => updateParam('blurKernelSize', value)}
          max={15}
          min={1}
          step={2} // Ensures odd values: 1, 3, 5...
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Kernel size for Gaussian blur (must be odd). Affects noise reduction and edge smoothing.
        </p>
      </div>

      {/* DP (Accumulator Ratio) Slider */}
      <div className="space-y-2">
        <Label htmlFor={`dp-slider`} className="text-sm font-medium">
          DP (Accumulator Ratio): {params.dp.toFixed(1)}
        </Label>
        <Slider
          id={`dp-slider`}
          value={[params.dp]}
          onValueChange={([value]) => updateParam('dp', value)}
          max={4}
          min={1}
          step={0.1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Inverse ratio of accumulator resolution to image resolution for HoughCircles. 1 is same as input, 2 is half.
        </p>
      </div>
    </div>
  );
};

export default DetectionParameters;

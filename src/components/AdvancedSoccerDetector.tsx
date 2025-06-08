/**
 * @file AdvancedSoccerDetector.tsx
 * A more advanced React component for soccer ball detection, offering
 * real-time webcam input, OpenCV status display, and detailed parameter tuning
 * across different categories (Detection, Color Filtering, Advanced Image Settings).
 * It utilizes the BallDetectionEngine for processing and various UI components for interaction.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Settings, Play, Square, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import DetectionParameters from './DetectionParameters';
import ColorFiltering from './ColorFiltering';
import AdvancedSettings from './AdvancedSettings';
import DetectionModes from './DetectionModes';
import MediaDisplay from './MediaDisplay';
import StatisticsPanel from './StatisticsPanel';
import RoboflowApiKeyInput from './RoboflowApiKeyInput';
import { BallDetectionEngine } from './BallDetectionEngine';
import { DetectionResult } from './SoccerBallDetector'; // Re-use DetectionResult type

/**
 * @interface DetectionParams
 * Parameters specifically for the Hough Circle Transform in OpenCV.
 * @property {number} minDistance - Minimum distance between centers of detected circles.
 * @property {number} cannyThreshold - Upper threshold for the Canny edge detector.
 * @property {number} circleThreshold - Accumulator threshold for circle centers.
 * @property {number} minRadius - Minimum radius of circles to detect.
 * @property {number} maxRadius - Maximum radius of circles to detect.
 * @property {number} blurKernelSize - Kernel size for Gaussian blur (must be odd).
 * @property {number} dp - Inverse ratio of accumulator resolution to image resolution for HoughCircles.
 */
export interface DetectionParams {
  minDistance: number;
  cannyThreshold: number;
  circleThreshold: number;
  minRadius: number;
  maxRadius: number;
  blurKernelSize: number;
  dp: number;
}

/**
 * @interface ColorFilterParams
 * Parameters for color filtering pre-processing steps.
 * @property {number} whiteThreshold - Threshold for white color detection/masking.
 * @property {number} blurKernel - Kernel size for blurring in color filtering.
 * @property {number} morphologySize - Size for morphological operations (e.g., dilation/erosion).
 */
export interface ColorFilterParams {
  whiteThreshold: number;
  blurKernel: number;
  morphologySize: number;
}

/**
 * @interface AdvancedParams
 * Parameters for general image adjustments like contrast and brightness.
 * @property {number} contrast - Contrast adjustment factor (1.0 is normal).
 * @property {number} brightness - Brightness adjustment value (0 is normal).
 * @property {number} edgeEnhancement - Factor for edge enhancement.
 */
export interface AdvancedParams {
  contrast: number;
  brightness: number;
  edgeEnhancement: number;
}

/**
 * @interface DetectionStats
 * Structure for holding statistics about a detection run.
 * @property {number} ballsFound - Number of balls detected.
 * @property {number} processingTime - Time taken for detection in milliseconds.
 * @property {number} confidence - Average confidence of detections (if applicable).
 * @property {number} fps - Frames per second (relevant for video/webcam).
 */
export interface DetectionStats {
  ballsFound: number;
  processingTime: number;
  confidence: number;
  fps: number;
}

/**
 * AdvancedSoccerDetector component.
 * Integrates webcam, file uploads, detailed parameter controls, and real-time detection.
 * @returns {JSX.Element} The rendered component.
 */
const AdvancedSoccerDetector = (): JSX.Element => {
  const [isRoboflowReady, setIsRoboflowReady] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [currentMedia, setCurrentMedia] = useState<string | null>(null); // URL for image/video blob
  const [detectionMode, setDetectionMode] = useState<string>('roboflow'); // E.g., 'standard', 'color_filter'
  const [processedResults, setProcessedResults] = useState<string | null>(null); // URL for the highlighted image
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // Potentially for displaying webcam stream or results
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detectionEngine = useRef(new BallDetectionEngine());

  // State for various parameter sets
  const [detectionParams, setDetectionParams] = useState<DetectionParams>({
    minDistance: 50,
    cannyThreshold: 100,
    circleThreshold: 30,
    minRadius: 10,
    maxRadius: 100,
    blurKernelSize: 5,
    dp: 1,
  });

  const [colorParams, setColorParams] = useState<ColorFilterParams>({
    whiteThreshold: 200,
    blurKernel: 5,
    morphologySize: 3,
  });

  const [advancedParams, setAdvancedParams] = useState<AdvancedParams>({
    contrast: 1.0,
    brightness: 0,
    edgeEnhancement: 1.0,
  });

  const [stats, setStats] = useState<DetectionStats>({
    ballsFound: 0,
    processingTime: 0,
    confidence: 0,
    fps: 0,
  });

  /**
   * Effect hook to load the Roboflow API key from local storage.
   * Manages script loading state and provides feedback via toasts.
   */
  useEffect(() => {
    const savedKey = localStorage.getItem('roboflow_api_key');
    if (savedKey) {
      setIsRoboflowReady(true);
      detectionEngine.current.setApiKey(savedKey);
    }
  }, []);

  /**
   * Effect hook to terminate the detection worker when the component unmounts.
   */
  useEffect(() => {
    const currentEngineInstance = detectionEngine.current;
    return () => {
      currentEngineInstance.terminateWorker();
    };
  }, []);

  /**
   * Handles file upload via the input element.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (currentMedia && currentMedia.startsWith('blob:')) {
        URL.revokeObjectURL(currentMedia); // Revoke old blob URL if one exists
      }
      const url = URL.createObjectURL(file);
      setCurrentMedia(url);
      setProcessedResults(null); // Clear previous results
    }
  };

  /**
   * Starts the webcam stream.
   * @async
   */
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsWebcamActive(true);
        setCurrentMedia(null); // Clear currentMedia when using webcam
        setProcessedResults(null);
        toast.success('Webcam activated');
      }
    } catch (error) {
      console.error("Failed to access webcam:", error);
      toast.error('Failed to access webcam. Please ensure permissions are granted.');
    }
  };

  /**
   * Stops the webcam stream.
   */
  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsWebcamActive(false);
      // Optionally clear currentMedia if it was from webcam
      // setCurrentMedia(null);
      toast.info('Webcam stopped');
    }
  };

  /**
   * Initiates ball detection on the current media (uploaded image/video or webcam frame).
   * @async
   */
  const detectBalls = async () => {
    let mediaToProcess = currentMedia;
    if (isWebcamActive && videoRef.current && videoRef.current.readyState >= videoRef.current.HAVE_METADATA) {
        // For webcam, capture current frame to a data URL
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoRef.current.videoWidth;
        tempCanvas.height = videoRef.current.videoHeight;
        const ctx = tempCanvas.getContext('2d');
        if(ctx){
            ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
            mediaToProcess = tempCanvas.toDataURL('image/jpeg');
        } else {
            toast.error("Could not capture webcam frame.");
            return;
        }
    }

    if (!mediaToProcess) {
      toast.error('Please upload an image/video or start webcam first.');
      return;
    }

    if (!isRoboflowReady) {
      toast.error("Please configure your Roboflow API key first.");
      return;
    }

    setIsProcessing(true);
    const startTime = performance.now();

    try {
      // Combine all parameter sets to pass to the detection engine
      const combinedParams = {
        ...detectionParams,
        ...colorParams, // Assuming BallDetectionEngine can pick what it needs
        ...advancedParams // Or that the worker handles these if applicable
      };

      const result: DetectionResult = await detectionEngine.current.detectBalls(
        mediaToProcess,
        isWebcamActive ? 'webcam-frame.jpg' : (currentMedia?.substring(currentMedia.lastIndexOf('/') + 1) || 'uploaded-media'),
        combinedParams
      );

      setProcessedResults(result.imageUrl); // Display the image with detections
      
      const processingTime = performance.now() - startTime;
      const avgConfidence = result.detections.length > 0 ?
        result.detections.reduce((sum, d) => sum + d.confidence, 0) / result.detections.length * 100 : 0;

      setStats({
        ballsFound: result.detections.length,
        processingTime: Math.round(processingTime),
        confidence: parseFloat(avgConfidence.toFixed(2)), // Format confidence
        fps: isWebcamActive ? Math.round(1000 / (processingTime || 1)) : 0, // Simplified FPS for single frame
      });

      toast.success(`Detected ${result.detections.length} soccer ball(s) using Roboflow.`);
    } catch (error: any) {
      console.error('Detection error in AdvancedSoccerDetector:', error);
      let toastMessage = 'Detection failed. Please try again.';
       if (error && typeof error.message === 'string') {
        if (error.message.includes('API key is required')) {
          toastMessage = 'Please configure your Roboflow API key first.';
        } else if (error.message.includes('timed out')) {
            toastMessage = `Detection process timed out. The image might be too complex or large.`;
        } else if (error.message.includes('Roboflow API error')) {
            toastMessage = `Roboflow API error: ${error.message}`;
        } else {
            toastMessage = `Detection error: ${error.message}`;
        }
      }
      toast.error(toastMessage);
    } finally {
      setIsProcessing(false);
      // If mediaToProcess was a temporary data URL from webcam, it doesn't need explicit revocation here.
      // Blob URLs from handleFileUpload are revoked when a new file is uploaded or component unmounts.
    }
  };

  /**
   * Resets all detection parameters to their default values.
   */
  const resetParameters = () => {
    setDetectionParams({
      minDistance: 50, cannyThreshold: 100, circleThreshold: 30,
      minRadius: 10, maxRadius: 100, blurKernelSize: 5, dp: 1,
    });
    setColorParams({ whiteThreshold: 200, blurKernel: 5, morphologySize: 3 });
    setAdvancedParams({ contrast: 1.0, brightness: 0, edgeEnhancement: 1.0 });
    toast.info('Parameters reset to default values.');
  };

  /**
   * Saves the current detection parameters and statistics to a JSON file.
   */
  const saveResults = () => {
    const dataToSave = {
      timestamp: new Date().toISOString(),
      detectionMode,
      parameters: { detectionParams, colorParams, advancedParams },
      statistics: stats,
      lastProcessedImageUrl: processedResults, // Save the (potentially large) data URL
    };
    
    try {
      const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soccer-detection-results-${Date.now()}.json`;
      document.body.appendChild(a); // Required for Firefox
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Results and parameters saved successfully.');
    } catch(e) {
      console.error("Error saving results:", e);
      toast.error("Failed to save results to JSON.");
    }
  };

  // UI Rendering
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-800 mb-2">
            ⚽ Advanced Soccer Ball Detector
          </h1>
          <p className="text-lg text-blue-600">
            Roboflow-powered real-time detection with advanced parameter controls
          </p>
          <div className="mt-4">
            <Badge variant={isRoboflowReady ? "default" : "destructive"} className="text-sm">
              Roboflow Status: {isRoboflowReady ? 'Ready' : 'API Key Required'}
            </Badge>
          </div>
        </div>

        {/* API Key Configuration */}
        <RoboflowApiKeyInput onApiKeySet={handleApiKeySet} />

        {/* Main Grid: Controls, Media Display, Parameters */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Column 1: Controls Panel */}
          <div className="xl:col-span-1 space-y-4">
            {/* Input Options Card */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Input Options</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />Upload Media
                </Button>
                <Button onClick={isWebcamActive ? stopWebcam : startWebcam} className="w-full" variant={isWebcamActive ? "destructive" : "default"}>
                  <Camera className="h-4 w-4 mr-2" />{isWebcamActive ? 'Stop Webcam' : 'Start Webcam'}
                </Button>
              </CardContent>
            </Card>

            <DetectionModes currentMode={detectionMode} onModeChange={setDetectionMode} />

            <Card>
              <CardContent className="p-4 space-y-3">
                <Button onClick={detectBalls} disabled={isProcessing || !isRoboflowReady} className="w-full">
                  <Play className="h-4 w-4 mr-2" />{isProcessing ? 'Detecting...' : 'Detect Balls'}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={resetParameters} variant="outline" size="sm"><RotateCcw className="h-4 w-4 mr-1" />Reset</Button>
                  <Button onClick={saveResults} variant="outline" size="sm"><Save className="h-4 w-4 mr-1" />Save</Button>
                </div>
              </CardContent>
            </Card>

            <StatisticsPanel stats={stats} />
          </div>

          {/* Column 2: Media Display */}
          <div className="xl:col-span-1">
            <MediaDisplay
              currentMedia={currentMedia}
              processedResults={processedResults}
              isWebcamActive={isWebcamActive}
              videoRef={videoRef}
              canvasRef={canvasRef} // This canvasRef seems unused for direct drawing by AdvancedDetector
              isProcessing={isProcessing}
            />
          </div>

          {/* Column 3: Parameters Panel */}
          <div className="xl:col-span-1">
            <Card className="h-fit"> {/* Fit height to content */}
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Detection Parameters</CardTitle></CardHeader>
              <CardContent>
                <Tabs defaultValue="detection" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="detection">Detection</TabsTrigger>
                    <TabsTrigger value="color">Color</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  <TabsContent value="detection" className="mt-4">
                    <DetectionParameters params={detectionParams} onChange={setDetectionParams} />
                  </TabsContent>
                  <TabsContent value="color" className="mt-4">
                    <ColorFiltering params={colorParams} onChange={setColorParams} />
                  </TabsContent>
                  <TabsContent value="advanced" className="mt-4">
                    <AdvancedSettings params={advancedParams} onChange={setAdvancedParams} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSoccerDetector;

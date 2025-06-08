/**
 * @file SoccerBallDetector.tsx
 * Main React component for the Soccer Ball Detector application.
 * It provides UI for uploading images (single, bulk, or via URL),
 * adjusting detection parameters, and viewing detection results.
 * Detection logic is primarily handled by the BallDetectionEngine.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button'; // Assuming Button is not used directly here, but useful for context
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, Image as ImageIcon, Video, FileImage, Settings } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';
import UrlInput from './UrlInput';
import BulkUpload from './BulkUpload';
import DetectionResults from './DetectionResults';
import RoboflowApiKeyInput from './RoboflowApiKeyInput';
import { BallDetectionEngine } from './BallDetectionEngine';
import DetectionParameters from './DetectionParameters';
import { DetectionParams } from './AdvancedSoccerDetector'; // Using type from AdvancedSoccerDetector for consistency

/**
 * @interface DetectionResult
 * Defines the structure for a single detection result object.
 * @property {string} id - Unique ID for the result.
 * @property {string} imageUrl - Data URL of the image with detections highlighted.
 * @property {string} [originalImageUrl] - Original URL of the processed image.
 * @property {string} fileName - Name of the processed file.
 * @property {Array<object>} detections - Array of detected ball objects.
 * @property {number} detections[].confidence - Confidence score.
 * @property {object} detections[].bbox - Normalized bounding box.
 * @property {Date} processedAt - Timestamp of processing.
 */
export interface DetectionResult {
  id: string;
  imageUrl: string;
  originalImageUrl?: string;
  fileName: string;
  detections: Array<{
    confidence: number;
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  processedAt: Date;
}

/**
 * SoccerBallDetector component.
 * Provides the main UI and orchestrates the image processing workflow.
 * @returns {JSX.Element} The rendered component.
 */
const SoccerBallDetector = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isRoboflowReady, setIsRoboflowReady] = useState<boolean>(false);
  const detectionEngine = useRef(new BallDetectionEngine());

  // State for detection parameters, initialized with default values.
  const [detectionParams, setDetectionParams] = useState<DetectionParams>({
    minDistance: 50,
    cannyThreshold: 100,
    circleThreshold: 30,
    minRadius: 10,
    maxRadius: 100,
    blurKernelSize: 5,
    dp: 1,
  });

  /**
   * Effect hook to terminate the detection worker when the component unmounts.
   */
  useEffect(() => {
    const savedKey = localStorage.getItem('roboflow_api_key');
    if (savedKey) {
      setIsRoboflowReady(true);
      detectionEngine.current.setApiKey(savedKey);
    }
  }, []);

  /**
   * Callback to update detection parameters from the DetectionParameters component.
   * @param {DetectionParams} newParams - The new set of parameters.
   */
  const handleParametersChange = (newParams: DetectionParams) => {
    setDetectionParams(newParams);
  };

  /**
   * Callback to handle setting the Roboflow API key.
   * @param {string} apiKey - The API key to set.
   */
  const handleApiKeySet = (apiKey: string) => {
    detectionEngine.current.setApiKey(apiKey);
    setIsRoboflowReady(true);
    toast.success('Ready to detect soccer balls with Roboflow!');
  };

  /**
   * Processes a single image (from upload or URL).
   * @async
   * @param {string} imageUrl - The URL of the image to process (can be a data URL or external URL).
   * @param {string} fileName - The name associated with the image.
   */
  const processImage = async (imageUrl: string, fileName: string) => {
    if (!isRoboflowReady) {
      toast.error('Please configure your Roboflow API key first.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await detectionEngine.current.detectBalls(imageUrl, fileName, detectionParams);
      setResults(prev => [result, ...prev]); // Prepend new result
      toast.success(`Detected ${result.detections.length} soccer ball(s) in ${fileName}`);
    } catch (error: any) {
      console.error(`Detection error for ${fileName}:`, error);
      // Attempt to provide more user-friendly messages based on error content
      let toastMessage = `Failed to process ${fileName}: An unknown error occurred.`;
      if (error && typeof error.message === 'string') {
        if (error.message.includes('API key is required')) {
          toastMessage = 'Please configure your Roboflow API key first.';
        } else if (error.message.includes('Roboflow API error')) {
          toastMessage = `Roboflow API error: ${error.message}`;
        } else if (error.message.startsWith('Failed to load image')) {
          toastMessage = `Error loading image ${fileName}: ${error.message}`;
        } else if (error.message.includes('timed out')) {
            toastMessage = `Processing for ${fileName} timed out. Please try again.`;
        } else {
            toastMessage = `Failed to process ${fileName}: ${error.message}`;
        }
      }
      toast.error(toastMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Processes multiple images from a bulk upload.
   * @async
   * @param {File[]} files - An array of File objects to process.
   */
  const processBulkImages = async (files: File[]) => {
    if (!isRoboflowReady) {
      toast.error('Please configure your Roboflow API key first.');
      return;
    }

    if (files.length === 0) {
      toast.info("No files selected for bulk processing.");
      return;
    }
    setIsProcessing(true);
    let aFileFailed = false;
    const newResults: DetectionResult[] = [];
    let successfulUploads = 0;

    for (const file of files) {
      const imageUrl = URL.createObjectURL(file);
      let processError: any = null;
      try {
        const result = await detectionEngine.current.detectBalls(imageUrl, file.name, detectionParams);
        newResults.push(result);
        successfulUploads++;
        toast.success(`Processed ${file.name} successfully.`);
      } catch (error: any) {
        processError = error;
        aFileFailed = true;
        console.error(`Error processing ${file.name} during bulk upload:`, error);
        let toastMessage = `Failed to process ${file.name}: An unknown error occurred.`;
         if (error && typeof error.message === 'string') {
            if (error.message.includes('API key is required')) {
              toastMessage = 'Please configure your Roboflow API key first.';
            } else if (error.message.includes('Roboflow API error')) {
              toastMessage = `Roboflow API error: ${error.message}`;
            } else if (error.message.startsWith('Failed to load image')) {
              toastMessage = `Error loading image ${file.name}: ${error.message}`;
            } else if (error.message.includes('timed out')) {
                toastMessage = `Processing for ${file.name} timed out.`;
            } else {
                toastMessage = `Failed to process ${file.name}: ${error.message}`;
            }
        }
        toast.error(toastMessage);
      } finally {
        URL.revokeObjectURL(imageUrl); // Clean up object URL
        // Optional: Small delay for UI updates if processing many files rapidly.
        // await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (processError && typeof processError.message === 'string' && (processError.message.includes('API key is required') || processError.message.includes('Roboflow API error'))) {
        break; // Ensure loop termination if fundamental error occurred
      }
    }

    setResults(prev => [...newResults, ...prev]); // Prepend all new results

    if (successfulUploads > 0 && !aFileFailed) {
      toast.success(`Processed all ${files.length} images successfully.`);
    } else if (successfulUploads > 0 && aFileFailed) {
      toast.info(`Processed ${successfulUploads} out of ${files.length} images. Some images failed.`);
    } else if (successfulUploads === 0 && files.length > 0 && aFileFailed) {
      // Individual errors already toasted. If loop was broken, specific message shown.
      // If all failed without breaking, this implies individual toasts were sufficient.
    }
    // Note: if files.length was 0 initially, that's handled at the start.

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            ⚽ Soccer Ball Detector
          </h1>
          <p className="text-lg text-green-600">
            Roboflow-powered soccer ball detection with visual highlighting
          </p>
        </div>

        {/* API Key Configuration */}
        <RoboflowApiKeyInput onApiKeySet={handleApiKeySet} />

        <Card className="mb-8 bg-white shadow-xl border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Settings className="h-5 w-5" />
              Detection Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetectionParameters params={detectionParams} onChange={handleParametersChange} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white shadow-xl border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <ImageIcon className="h-5 w-5" />
                Upload & Analyze
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload" className="flex items-center gap-1">
                    <Upload className="h-4 w-4" /> Upload
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-1">
                    <Link className="h-4 w-4" /> URL
                  </TabsTrigger>
                  <TabsTrigger value="bulk" className="flex items-center gap-1">
                    <FileImage className="h-4 w-4" /> Bulk
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-6">
                  <ImageUpload 
                    onImageSelect={processImage}
                    isProcessing={isProcessing}
                  />
                </TabsContent>
                <TabsContent value="url" className="mt-6">
                  <UrlInput 
                    onUrlSubmit={processImage}
                    isProcessing={isProcessing}
                  />
                </TabsContent>
                <TabsContent value="bulk" className="mt-6">
                  <BulkUpload 
                    onBulkUpload={processBulkImages}
                    isProcessing={isProcessing}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-xl border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Video className="h-5 w-5" />
                Detection Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetectionResults 
                results={results}
                isProcessing={isProcessing}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SoccerBallDetector;

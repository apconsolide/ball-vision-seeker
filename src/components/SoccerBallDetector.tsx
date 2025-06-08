
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, Image as ImageIcon, Video, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';
import UrlInput from './UrlInput';
import BulkUpload from './BulkUpload';
import DetectionResults from './DetectionResults';
import { BallDetectionEngine } from './BallDetectionEngine';

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

const SoccerBallDetector = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const detectionEngine = useRef(new BallDetectionEngine());

  const processImage = async (imageUrl: string, fileName: string) => {
    setIsProcessing(true);
    try {
      const result = await detectionEngine.current.detectBalls(imageUrl, fileName);
      setResults(prev => [result, ...prev]);
      
      toast.success(`Detected ${result.detections.length} soccer ball(s) in ${fileName}`);
    } catch (error) {
      toast.error('Failed to process image');
      console.error('Detection error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processBulkImages = async (files: File[]) => {
    setIsProcessing(true);
    try {
      const newResults: DetectionResult[] = [];
      
      for (const file of files) {
        const imageUrl = URL.createObjectURL(file);
        const result = await detectionEngine.current.detectBalls(imageUrl, file.name);
        newResults.push(result);
        
        // Add a small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      setResults(prev => [...newResults, ...prev]);
      toast.success(`Processed ${files.length} images successfully`);
    } catch (error) {
      toast.error('Failed to process bulk images');
      console.error('Bulk processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            ⚽ Soccer Ball Detector
          </h1>
          <p className="text-lg text-green-600">
            AI-powered soccer ball detection with visual highlighting
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Detection Input Panel */}
          <Card className="bg-white shadow-xl border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <ImageIcon className="h-5 w-5" />
                Upload & Analyze
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload" className="flex items-center gap-1">
                    <Upload className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-1">
                    <Link className="h-4 w-4" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="bulk" className="flex items-center gap-1">
                    <FileImage className="h-4 w-4" />
                    Bulk
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

          {/* Results Panel */}
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

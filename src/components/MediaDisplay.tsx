
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface MediaDisplayProps {
  currentMedia: string | null;
  processedResults?: string | null;
  isWebcamActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isProcessing: boolean;
}

const MediaDisplay = ({ 
  currentMedia, 
  processedResults,
  isWebcamActive, 
  videoRef, 
  canvasRef,
  isProcessing 
}: MediaDisplayProps) => {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Media Display
          <Badge variant={isWebcamActive ? "default" : "secondary"}>
            {isWebcamActive ? 'Live' : 'Static'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="original" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="original">Original</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
            <TabsTrigger value="processed">Processed</TabsTrigger>
            <TabsTrigger value="mask">Mask</TabsTrigger>
          </TabsList>
          
          <TabsContent value="original" className="mt-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
              {isWebcamActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              ) : currentMedia ? (
                <img
                  src={currentMedia}
                  alt="Uploaded media"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No media selected
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p>Processing...</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="result" className="mt-4">
            <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
              {processedResults ? (
                <img
                  src={processedResults}
                  alt="Detection results"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <p>Detection results will appear here</p>
                  <p className="text-sm mt-1">With highlighted soccer balls</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="processed" className="mt-4">
            <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain"
                style={{ display: 'none' }}
              />
              <div className="text-gray-500 text-center">
                <p>Preprocessed frame will appear here</p>
                <p className="text-sm mt-1">After applying filters and enhancements</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="mask" className="mt-4">
            <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-gray-500 text-center">
                <p>Color/threshold masks</p>
                <p className="text-sm mt-1">Binary masks used for detection</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MediaDisplay;


import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Target } from 'lucide-react';
import { DetectionResult } from './SoccerBallDetector';

interface DetectionResultsProps {
  results: DetectionResult[];
  isProcessing: boolean;
}

const DetectionResults = ({ results, isProcessing }: DetectionResultsProps) => {
  if (isProcessing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Processing image...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No results yet. Upload an image to start detection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {results.map((result) => (
        <Card key={result.id} className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <img
                src={result.imageUrl}
                alt={`Detection result for ${result.fileName}`}
                className="w-20 h-20 object-cover rounded border"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{result.fileName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {result.detections.length} ball{result.detections.length !== 1 ? 's' : ''}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {result.processedAt.toLocaleTimeString()}
                  </div>
                </div>
                {result.detections.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">
                      Avg confidence: {(result.detections.reduce((sum, d) => sum + d.confidence, 0) / result.detections.length * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DetectionResults;

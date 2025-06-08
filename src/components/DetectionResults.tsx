
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Eye, Zap } from 'lucide-react';
import { DetectionResult } from './SoccerBallDetector';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DetectionResultsProps {
  results: DetectionResult[];
  isProcessing: boolean;
}

const DetectionResults = ({ results, isProcessing }: DetectionResultsProps) => {
  const handleDownloadResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      totalImages: results.length,
      totalDetections: results.reduce((sum, r) => sum + r.detections.length, 0),
      results: results.map(r => ({
        fileName: r.fileName,
        detectionsCount: r.detections.length,
        avgConfidence: r.detections.reduce((sum, d) => sum + d.confidence, 0) / r.detections.length,
        processedAt: r.processedAt,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soccer-detection-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isProcessing) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-green-600">Analyzing images...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-green-500">
        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No results yet. Upload an image to start detecting soccer balls!</p>
      </div>
    );
  }

  const totalDetections = results.reduce((sum, r) => sum + r.detections.length, 0);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{results.length}</p>
            <p className="text-xs text-green-600">Images</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">{totalDetections}</p>
            <p className="text-xs text-emerald-600">Detections</p>
          </CardContent>
        </Card>
        <Card className="bg-lime-50 border-lime-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-lime-700">
              {results.length > 0 ? (totalDetections / results.length).toFixed(1) : '0'}
            </p>
            <p className="text-xs text-lime-600">Avg/Image</p>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      <ScrollArea className="h-64">
        <div className="space-y-3">
          {results.map((result) => (
            <Card key={result.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-green-800 truncate">
                      {result.fileName}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <Zap className="h-3 w-3 mr-1" />
                        {result.detections.length} ball{result.detections.length !== 1 ? 's' : ''}
                      </Badge>
                      {result.detections.length > 0 && (
                        <Badge variant="outline" className="text-green-600">
                          {(result.detections.reduce((sum, d) => sum + d.confidence, 0) / result.detections.length * 100).toFixed(0)}% conf.
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-green-500 mt-1">
                      {result.processedAt.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    <img
                      src={result.imageUrl}
                      alt={result.fileName}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-green-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Download Button */}
      <Button
        onClick={handleDownloadResults}
        variant="outline"
        className="w-full border-green-300 text-green-700 hover:bg-green-50"
      >
        <Download className="h-4 w-4 mr-2" />
        Download Results JSON
      </Button>
    </div>
  );
};

export default DetectionResults;

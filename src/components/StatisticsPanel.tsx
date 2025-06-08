
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DetectionStats } from './AdvancedSoccerDetector';

interface StatisticsPanelProps {
  stats: DetectionStats;
}

const StatisticsPanel = ({ stats }: StatisticsPanelProps) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{stats.ballsFound}</div>
            <div className="text-xs text-blue-600">Balls Found</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{stats.processingTime}ms</div>
            <div className="text-xs text-green-600">Processing Time</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Confidence</span>
            <Badge className={`${getConfidenceColor(stats.confidence)} text-white`}>
              {stats.confidence.toFixed(1)}%
            </Badge>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getConfidenceColor(stats.confidence)}`}
              style={{ width: `${stats.confidence}%` }}
            ></div>
          </div>
        </div>
        
        {stats.fps > 0 && (
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">{stats.fps}</div>
            <div className="text-xs text-purple-600">FPS</div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Last Detection:</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Detection Mode:</span>
            <span>Standard</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatisticsPanel;

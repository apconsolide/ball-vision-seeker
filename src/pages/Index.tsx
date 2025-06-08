
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Zap } from 'lucide-react';
import SoccerBallDetector from '@/components/SoccerBallDetector';
import AdvancedSoccerDetector from '@/components/AdvancedSoccerDetector';

const Index = () => {
  const [useAdvanced, setUseAdvanced] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            ⚽ Soccer Ball Detection Suite
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Choose your detection experience: Simple or Advanced
          </p>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Select Detection Mode</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                onClick={() => setUseAdvanced(false)}
                variant={!useAdvanced ? "default" : "outline"}
                className="flex-1 h-20 flex-col"
              >
                <Zap className="h-6 w-6 mb-2" />
                <div>
                  <div className="font-medium">Simple Mode</div>
                  <div className="text-xs opacity-75">Quick upload & detect</div>
                </div>
              </Button>
              
              <Button
                onClick={() => setUseAdvanced(true)}
                variant={useAdvanced ? "default" : "outline"}
                className="flex-1 h-20 flex-col"
              >
                <Settings className="h-6 w-6 mb-2" />
                <div>
                  <div className="font-medium">Advanced Mode</div>
                  <div className="text-xs opacity-75">OpenCV with parameters</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {useAdvanced ? <AdvancedSoccerDetector /> : <SoccerBallDetector />}
      </div>
    </div>
  );
};

export default Index;

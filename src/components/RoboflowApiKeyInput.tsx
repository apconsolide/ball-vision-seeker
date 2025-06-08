
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RoboflowApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
}

const RoboflowApiKeyInput: React.FC<RoboflowApiKeyInputProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSet, setIsSet] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('roboflow_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsSet(true);
      onApiKeySet(savedKey);
    }
  }, [onApiKeySet]);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    localStorage.setItem('roboflow_api_key', apiKey);
    setIsSet(true);
    onApiKeySet(apiKey);
    toast.success('Roboflow API key saved successfully');
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('roboflow_api_key');
    setApiKey('');
    setIsSet(false);
    toast.info('API key cleared');
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Roboflow API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Roboflow API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1"
            />
            {isSet ? (
              <Button onClick={handleClearApiKey} variant="outline" size="sm">
                Clear
              </Button>
            ) : (
              <Button onClick={handleSaveApiKey} size="sm">
                Save
              </Button>
            )}
          </div>
        </div>
        
        {isSet && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-sm">API key configured</span>
          </div>
        )}
        
        {!isSet && (
          <div className="flex items-start gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <div className="text-sm">
              <p>Get your free API key from <a href="https://roboflow.com" target="_blank" rel="noopener noreferrer" className="underline">Roboflow</a></p>
              <p className="mt-1">Sign up → Create workspace → Copy your API key</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoboflowApiKeyInput;

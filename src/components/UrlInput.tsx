
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, Download } from 'lucide-react';

interface UrlInputProps {
  onUrlSubmit: (imageUrl: string, fileName: string) => void;
  isProcessing: boolean;
}

const UrlInput = ({ onUrlSubmit, isProcessing }: UrlInputProps) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      const fileName = url.split('/').pop() || 'url-image.jpg';
      onUrlSubmit(url.trim(), fileName);
      setUrl('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium">Image URL</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/soccer-ball.jpg"
            className="w-full"
          />
          <Button
            type="submit"
            disabled={!url.trim() || isProcessing}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Analyze Image'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default UrlInput;

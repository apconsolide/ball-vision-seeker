
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, Download } from 'lucide-react';
import { toast } from 'sonner';

interface UrlInputProps {
  onUrlSubmit: (imageUrl: string, fileName: string) => void;
  isProcessing: boolean;
}

const UrlInput = ({ onUrlSubmit, isProcessing }: UrlInputProps) => {
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }

    // Extract filename from URL or use default
    const fileName = imageUrl.split('/').pop()?.split('?')[0] || 'image-from-url';
    
    onUrlSubmit(imageUrl, fileName);
    setImageUrl('');
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="image-url" className="text-green-700">
          Image URL
        </Label>
        <Input
          id="image-url"
          type="url"
          placeholder="https://example.com/soccer-image.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="border-green-300 focus:border-green-500"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isProcessing || !isValidUrl(imageUrl)}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <Download className="h-4 w-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Analyze Image'}
        </Button>
      </div>

      <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
        <p className="font-medium mb-1">Example URLs:</p>
        <ul className="text-xs space-y-1">
          <li>• FIFA match photos</li>
          <li>• Sports photography websites</li>
          <li>• Soccer training images</li>
        </ul>
      </div>
    </form>
  );
};

export default UrlInput;

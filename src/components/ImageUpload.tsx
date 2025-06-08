
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (imageUrl: string, fileName: string) => void;
  isProcessing: boolean;
}

const ImageUpload = ({ onImageSelect, isProcessing }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      onImageSelect(imageUrl, file.name);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Upload an image
        </p>
        <p className="text-gray-500 mb-4">
          Choose a soccer ball image to analyze
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Select Image'}
        </Button>
      </div>
    </div>
  );
};

export default ImageUpload;

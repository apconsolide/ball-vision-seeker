
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (imageUrl: string, fileName: string) => void;
  isProcessing: boolean;
}

const ImageUpload = ({ onImageSelect, isProcessing }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      onImageSelect(imageUrl, file.name);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      onImageSelect(imageUrl, file.name);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <p className="text-green-600 mb-2">
          Drop an image here or click to browse
        </p>
        <p className="text-sm text-green-500">
          Supports JPG, PNG, WebP formats
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <Upload className="h-4 w-4 mr-2" />
        {isProcessing ? 'Processing...' : 'Choose Image'}
      </Button>
    </div>
  );
};

export default ImageUpload;

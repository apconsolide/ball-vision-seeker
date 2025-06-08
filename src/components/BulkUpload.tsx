
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileImage, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface BulkUploadProps {
  onBulkUpload: (files: File[]) => void;
  isProcessing: boolean;
}

const BulkUpload = ({ onBulkUpload, isProcessing }: BulkUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Please select at least one image file');
      return;
    }

    if (imageFiles.length > 10) {
      toast.error('Maximum 10 images allowed per batch');
      return;
    }

    onBulkUpload(imageFiles);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
        <FileImage className="h-10 w-10 text-green-400 mx-auto mb-3" />
        <p className="text-green-600 mb-2">
          Bulk Image Analysis
        </p>
        <p className="text-sm text-green-500 mb-4">
          Upload multiple images for match analysis
        </p>
        
        <div className="bg-green-50 p-3 rounded-lg text-xs text-green-600 mb-4">
          <p className="font-medium mb-1">Perfect for:</p>
          <ul className="text-left space-y-1">
            <li>• Match photography analysis</li>
            <li>• Training session reviews</li>
            <li>• Tournament highlights</li>
            <li>• Sports analytics</li>
          </ul>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <Upload className="h-4 w-4 mr-2" />
        {isProcessing ? 'Processing Images...' : 'Select Multiple Images (Max 10)'}
      </Button>

      <div className="text-sm text-green-600 text-center">
        <p>Supported formats: JPG, PNG, WebP</p>
        <p>Maximum file size: 10MB per image</p>
      </div>
    </div>
  );
};

export default BulkUpload;

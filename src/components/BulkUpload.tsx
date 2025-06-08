
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileImage, Upload } from 'lucide-react';

interface BulkUploadProps {
  onBulkUpload: (files: File[]) => void;
  isProcessing: boolean;
}

const BulkUpload = ({ onBulkUpload, isProcessing }: BulkUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      onBulkUpload(imageFiles);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Bulk Upload Images
        </p>
        <p className="text-gray-500 mb-4">
          Select multiple images for batch processing
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Select Images'}
        </Button>
      </div>
    </div>
  );
};

export default BulkUpload;

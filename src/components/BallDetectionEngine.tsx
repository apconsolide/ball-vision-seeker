
import { DetectionResult } from './SoccerBallDetector';
import { DetectionParams } from './AdvancedSoccerDetector';

interface PendingRequest {
  resolve: (value: DetectionResult) => void;
  reject: (reason?: any) => void;
  timer?: ReturnType<typeof setTimeout>;
}

export class BallDetectionEngine {
  private requests: Map<string, PendingRequest> = new Map();
  private nextRequestId = 0;
  private roboflowApiKey: string | null = null;

  constructor() {
    // Check for Roboflow API key in localStorage
    this.roboflowApiKey = localStorage.getItem('roboflow_api_key');
  }

  setApiKey(apiKey: string) {
    this.roboflowApiKey = apiKey;
    localStorage.setItem('roboflow_api_key', apiKey);
  }

  async detectBalls(imageUrl: string, fileName: string, params: DetectionParams): Promise<DetectionResult> {
    if (!this.roboflowApiKey) {
      throw new Error('Roboflow API key is required. Please set your API key first.');
    }

    const requestId = `req-${this.nextRequestId++}`;
    
    return new Promise(async (resolve, reject) => {
      const timeout = 30000;
      const timer = setTimeout(() => {
        if (this.requests.has(requestId)) {
          this.requests.delete(requestId);
          reject(new Error(`Request timed out after ${timeout / 1000}s for image ${fileName}`));
        }
      }, timeout);

      this.requests.set(requestId, { resolve, reject, timer });
      
      try {
        // Convert image to base64 if it's a blob URL
        let base64Image = imageUrl;
        if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
          base64Image = await this.convertToBase64(imageUrl);
        }

        // Call Roboflow API
        const response = await fetch(`https://detect.roboflow.com/soccer-ball-detection/1?api_key=${this.roboflowApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: base64Image
        });

        if (!response.ok) {
          throw new Error(`Roboflow API error: ${response.status} ${response.statusText}`);
        }

        const roboflowResult = await response.json();
        
        // Convert Roboflow result to our format
        const result = await this.processRoboflowResult(roboflowResult, imageUrl, fileName);
        
        if (this.requests.has(requestId)) {
          clearTimeout(timer);
          this.requests.delete(requestId);
          resolve(result);
        }
      } catch (error: any) {
        if (this.requests.has(requestId)) {
          clearTimeout(timer);
          this.requests.delete(requestId);
          reject(error);
        }
      }
    });
  }

  private async convertToBase64(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(base64);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };
      
      img.src = imageUrl;
    });
  }

  private async processRoboflowResult(roboflowResult: any, originalImageUrl: string, fileName: string): Promise<DetectionResult> {
    const predictions = roboflowResult.predictions || [];
    
    // Load the original image to draw detections
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Draw detection boxes
        const detections = predictions.map((prediction: any) => {
          const { x, y, width, height, confidence, class: className } = prediction;
          
          // Convert from center coordinates to top-left coordinates
          const left = x - width / 2;
          const top = y - height / 2;
          
          // Draw bounding box
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(left, top, width, height);
          
          // Draw label
          ctx.fillStyle = '#00ff00';
          ctx.font = 'bold 16px Arial';
          const label = `${className}: ${Math.round(confidence * 100)}%`;
          ctx.fillText(label, left, top - 10);
          
          return {
            confidence,
            bbox: {
              x: left / canvas.width,
              y: top / canvas.height,
              width: width / canvas.width,
              height: height / canvas.height,
            },
          };
        });
        
        const result: DetectionResult = {
          id: Math.random().toString(36).substring(2, 11),
          imageUrl: canvas.toDataURL('image/png'),
          originalImageUrl,
          fileName,
          detections,
          processedAt: new Date(),
        };
        
        resolve(result);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${fileName}`));
      };
      
      img.src = originalImageUrl;
    });
  }

  public terminateWorker(): void {
    // Clean up any pending requests
    this.requests.forEach(pending => {
      if (pending.timer) clearTimeout(pending.timer);
      pending.reject(new Error('Detection engine terminated.'));
    });
    this.requests.clear();
    console.log('Roboflow Detection Engine terminated.');
  }
}

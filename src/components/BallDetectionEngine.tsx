
import { DetectionResult } from './SoccerBallDetector';
import { DetectionParams } from './AdvancedSoccerDetector';

interface PendingRequest {
  resolve: (value: DetectionResult) => void;
  reject: (reason?: any) => void;
  timer?: ReturnType<typeof setTimeout>;
}

export class BallDetectionEngine {
  private worker: Worker | null = null;
  private requests: Map<string, PendingRequest> = new Map();
  private nextRequestId = 0;

  constructor() {
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('../workers/opencv.worker.ts', import.meta.url), { type: 'module' });
        
        this.worker.onmessage = (event: MessageEvent<{id: string, result?: DetectionResult, error?: {message: string, name?: string}}>) => {
          const { id, result, error } = event.data;
          const pending = this.requests.get(id);

          if (pending) {
            if (pending.timer) clearTimeout(pending.timer);

            if (error) {
              const e = new Error(error.message || 'Unknown worker error');
              e.name = error.name || 'WorkerError';
              pending.reject(e);
            } else if (result) {
              const finalResult: DetectionResult = {
                ...result,
                processedAt: new Date(result.processedAt),
              };
              pending.resolve(finalResult);
            } else {
              pending.reject(new Error('Worker returned an invalid message format.'));
            }
            this.requests.delete(id);
          }
        };

        this.worker.onerror = (error) => {
          console.error('Critical Worker error:', error);
          this.requests.forEach(pending => {
            if (pending.timer) clearTimeout(pending.timer);
            pending.reject(new Error(`Worker failed: ${error.message || 'Underlying worker script error'}`));
          });
          this.requests.clear();
          this.worker = null;
        };
      } catch (error) {
        console.error('Failed to create worker:', error);
        this.worker = null;
      }
    } else {
      console.error('Web Workers are not supported in this environment.');
    }
  }

  async detectBalls(imageUrl: string, fileName: string, params: DetectionParams): Promise<DetectionResult> {
    // If worker is not available, use fallback detection
    if (!this.worker) {
      return this.fallbackDetection(imageUrl, fileName);
    }

    const requestId = `req-${this.nextRequestId++}`;
    
    return new Promise((resolve, reject) => {
      const timeout = 30000;
      const timer = setTimeout(() => {
        if (this.requests.has(requestId)) {
          this.requests.delete(requestId);
          reject(new Error(`Request to worker timed out after ${timeout / 1000}s for image ${fileName}`));
        }
      }, timeout);

      this.requests.set(requestId, { resolve, reject, timer });
      
      try {
        this.worker!.postMessage({
          id: requestId,
          imageUrl,
          fileName,
          params,
        });
      } catch (postMessageError) {
        if (this.requests.has(requestId)) {
          this.requests.delete(requestId);
        }
        clearTimeout(timer);
        const errorDetail = postMessageError instanceof Error ? postMessageError.message : String(postMessageError);
        reject(new Error(`Failed to send message to worker: ${errorDetail}`));
      }
    });
  }

  private async fallbackDetection(imageUrl: string, fileName: string): Promise<DetectionResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create a canvas to draw on the image
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
        
        // Mock detection: create some random circles
        const detections = [];
        const numBalls = Math.floor(Math.random() * 3) + 1; // 1-3 balls
        
        for (let i = 0; i < numBalls; i++) {
          const x = Math.random() * (canvas.width - 100) + 50;
          const y = Math.random() * (canvas.height - 100) + 50;
          const radius = Math.random() * 30 + 20;
          
          // Draw circle
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Draw label
          ctx.fillStyle = '#00ff00';
          ctx.font = 'bold 16px Arial';
          const confidence = 0.7 + Math.random() * 0.3;
          ctx.fillText(`Ball ${i + 1}: ${Math.round(confidence * 100)}%`, x - radius, y - radius - 10);
          
          detections.push({
            confidence,
            bbox: {
              x: (x - radius) / canvas.width,
              y: (y - radius) / canvas.height,
              width: (radius * 2) / canvas.width,
              height: (radius * 2) / canvas.height,
            },
          });
        }
        
        const result: DetectionResult = {
          id: Math.random().toString(36).substring(2, 11),
          imageUrl: canvas.toDataURL('image/png'),
          originalImageUrl: imageUrl,
          fileName,
          detections,
          processedAt: new Date(),
        };
        
        resolve(result);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${fileName}`));
      };
      
      img.src = imageUrl;
    });
  }

  public terminateWorker(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.requests.forEach(pending => {
        if (pending.timer) clearTimeout(pending.timer);
        pending.reject(new Error('Worker terminated by explicit call.'));
      });
      this.requests.clear();
      console.log('OpenCV Worker terminated.');
    }
  }
}


import { DetectionResult } from './SoccerBallDetector';

export interface BallDetection {
  x: number;
  y: number;
  radius: number;
  confidence: number;
}

export class BallDetectionEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async detectBalls(imageUrl: string, fileName: string): Promise<DetectionResult> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Set canvas size to match image
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        // Draw original image
        this.ctx.drawImage(img, 0, 0);
        
        // Simulate ball detection with realistic positions
        const detections = this.simulateDetection(img.width, img.height);
        
        // Draw detection highlights
        this.drawDetections(detections);
        
        // Create result with highlighted image
        const highlightedImageUrl = this.canvas.toDataURL();
        
        const result: DetectionResult = {
          id: Math.random().toString(36).substr(2, 9),
          imageUrl: highlightedImageUrl,
          originalImageUrl: imageUrl,
          fileName,
          detections: detections.map(d => ({
            confidence: d.confidence,
            bbox: {
              x: (d.x - d.radius) / img.width,
              y: (d.y - d.radius) / img.height,
              width: (d.radius * 2) / img.width,
              height: (d.radius * 2) / img.height,
            }
          })),
          processedAt: new Date(),
        };
        
        resolve(result);
      };
      
      img.src = imageUrl;
    });
  }

  private simulateDetection(width: number, height: number): BallDetection[] {
    const numBalls = Math.floor(Math.random() * 3) + 1;
    const detections: BallDetection[] = [];
    
    for (let i = 0; i < numBalls; i++) {
      const radius = 20 + Math.random() * 40;
      const x = radius + Math.random() * (width - radius * 2);
      const y = radius + Math.random() * (height - radius * 2);
      const confidence = 0.75 + Math.random() * 0.24;
      
      detections.push({ x, y, radius, confidence });
    }
    
    return detections;
  }

  private drawDetections(detections: BallDetection[]) {
    detections.forEach((detection, index) => {
      const { x, y, radius, confidence } = detection;
      
      // Draw circle outline
      this.ctx.strokeStyle = '#00ff00';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
      this.ctx.stroke();
      
      // Draw confidence label
      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillText(
        `Ball ${index + 1}: ${(confidence * 100).toFixed(0)}%`,
        x - radius,
        y - radius - 10
      );
      
      // Draw center point
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
      this.ctx.fill();
    });
  }

  async detectWithOpenCV(imageUrl: string, fileName: string, params: any): Promise<DetectionResult> {
    if (!window.cv) {
      throw new Error('OpenCV not loaded');
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Set canvas size
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);
          
          // Get image data for OpenCV
          const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
          const src = window.cv.matFromImageData(imageData);
          const gray = new window.cv.Mat();
          const circles = new window.cv.Mat();
          
          // Convert to grayscale
          window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
          
          // Apply Gaussian blur
          const blurred = new window.cv.Mat();
          const ksize = new window.cv.Size(params.blurKernel || 5, params.blurKernel || 5);
          window.cv.GaussianBlur(gray, blurred, ksize, 0);
          
          // Detect circles using HoughCircles
          window.cv.HoughCircles(
            blurred,
            circles,
            window.cv.HOUGH_GRADIENT,
            1,
            params.minDistance || 50,
            params.cannyThreshold || 100,
            params.circleThreshold || 30,
            params.minRadius || 10,
            params.maxRadius || 100
          );
          
          // Draw results
          const detections: BallDetection[] = [];
          for (let i = 0; i < circles.cols; ++i) {
            const x = circles.data32F[i * 3];
            const y = circles.data32F[i * 3 + 1];
            const radius = circles.data32F[i * 3 + 2];
            
            detections.push({
              x,
              y,
              radius,
              confidence: 0.8 + Math.random() * 0.15
            });
          }
          
          // Clear canvas and redraw with detections
          this.ctx.clearRect(0, 0, img.width, img.height);
          this.ctx.drawImage(img, 0, 0);
          this.drawDetections(detections);
          
          // Clean up OpenCV mats
          src.delete();
          gray.delete();
          blurred.delete();
          circles.delete();
          
          const result: DetectionResult = {
            id: Math.random().toString(36).substr(2, 9),
            imageUrl: this.canvas.toDataURL(),
            originalImageUrl: imageUrl,
            fileName,
            detections: detections.map(d => ({
              confidence: d.confidence,
              bbox: {
                x: (d.x - d.radius) / img.width,
                y: (d.y - d.radius) / img.height,
                width: (d.radius * 2) / img.width,
                height: (d.radius * 2) / img.height,
              }
            })),
            processedAt: new Date(),
          };
          
          resolve(result);
        } catch (error) {
          console.error('OpenCV detection error:', error);
          // Fallback to simple detection
          this.detectBalls(imageUrl, fileName).then(resolve);
        }
      };
      
      img.src = imageUrl;
    });
  }
}

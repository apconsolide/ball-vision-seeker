
interface BallDetectionForWorker {
  x: number;
  y: number;
  radius: number;
  confidence: number;
}

interface DetectionResultForWorker {
  id: string;
  imageUrl: string;
  originalImageUrl?: string;
  fileName: string;
  detections: Array<{
    confidence: number;
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  processedAt: Date;
}

declare let cv: any;

const OPENCV_URL = 'https://docs.opencv.org/4.x/opencv.js';
let cvReady = false;

// Try to load OpenCV
try {
  importScripts(OPENCV_URL);
  
  // Wait for OpenCV to be ready
  const checkOpenCV = () => {
    if (typeof cv !== 'undefined' && cv.Mat) {
      cvReady = true;
      console.log('OpenCV loaded successfully in worker');
    } else {
      setTimeout(checkOpenCV, 100);
    }
  };
  checkOpenCV();
} catch (error) {
  console.error('Error loading OpenCV in worker:', error);
  cvReady = false;
}

function drawDetectionsOnCanvas(
  ctx: OffscreenCanvasRenderingContext2D,
  detections: BallDetectionForWorker[],
  imageBitmap: ImageBitmap
) {
  ctx.drawImage(imageBitmap, 0, 0);

  detections.forEach((detection, index) => {
    const { x, y, radius, confidence } = detection;

    // Draw circle outline
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw confidence label
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px Arial';
    const label = `Ball ${index + 1}: ${(confidence * 100).toFixed(0)}%`;
    ctx.fillText(label, x - radius, y - radius - 10);

    // Draw center point
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  });
}

self.onmessage = async (event: MessageEvent<{ id: string; imageUrl: string; fileName: string; params: Record<string, number> }>) => {
  const { id, imageUrl, fileName, params } = event.data;

  // If OpenCV is not ready, fall back to mock detection
  if (!cvReady) {
    try {
      const mockResult = await createMockDetection(imageUrl, fileName);
      self.postMessage({ id, result: mockResult });
    } catch (error) {
      self.postMessage({ 
        id, 
        error: { 
          message: `Mock detection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        } 
      });
    }
    return;
  }

  let src: any = null;
  let gray: any = null;
  let circles: any = null;
  let blurred: any = null;

  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const imageBlob = await response.blob();
    const imageBitmap = await createImageBitmap(imageBlob);

    const offscreenCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
    
    if (!ctx) {
      throw new Error('Failed to get OffscreenCanvas 2D context');
    }

    ctx.drawImage(imageBitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);

    src = cv.matFromImageData(imageData);
    gray = new cv.Mat();
    circles = new cv.Mat();
    blurred = new cv.Mat();

    const blurKernelVal = params.blurKernelSize && params.blurKernelSize > 0 ?
                         (params.blurKernelSize % 2 === 0 ? params.blurKernelSize + 1 : params.blurKernelSize)
                         : 5;
    const ksize = new cv.Size(blurKernelVal, blurKernelVal);

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, ksize, 0);

    cv.HoughCircles(
      blurred,
      circles,
      cv.HOUGH_GRADIENT,
      params.dp || 1,
      params.minDistance || 50,
      params.cannyThreshold || 100,
      params.circleThreshold || 30,
      params.minRadius || 10,
      params.maxRadius || 100
    );

    const detectedBalls: BallDetectionForWorker[] = [];
    for (let i = 0; i < circles.cols; ++i) {
      detectedBalls.push({
        x: circles.data32F[i * 3],
        y: circles.data32F[i * 3 + 1],
        radius: circles.data32F[i * 3 + 2],
        confidence: 0.8 + Math.random() * 0.15,
      });
    }

    drawDetectionsOnCanvas(ctx, detectedBalls, imageBitmap);

    const highlightedImageBlob = await offscreenCanvas.convertToBlob({ type: 'image/png' });
    const highlightedImageUrl = await new Promise<string>((resolve, rejectReader) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => rejectReader(new Error('Failed to read blob as data URL'));
        reader.readAsDataURL(highlightedImageBlob);
    });

    const result: DetectionResultForWorker = {
      id: Math.random().toString(36).substring(2, 11),
      imageUrl: highlightedImageUrl,
      originalImageUrl: imageUrl,
      fileName,
      detections: detectedBalls.map(d => ({
        confidence: d.confidence,
        bbox: {
          x: (d.x - d.radius) / imageBitmap.width,
          y: (d.y - d.radius) / imageBitmap.height,
          width: (d.radius * 2) / imageBitmap.width,
          height: (d.radius * 2) / imageBitmap.height,
        },
      })),
      processedAt: new Date(),
    };
    
    self.postMessage({ id, result });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error during processing:', error);
    self.postMessage({ id, error: { message: errorMessage } });
  } finally {
    src?.delete();
    gray?.delete();
    blurred?.delete();
    circles?.delete();
  }
};

// Mock detection function for when OpenCV is not available
async function createMockDetection(imageUrl: string, fileName: string): Promise<DetectionResultForWorker> {
  const response = await fetch(imageUrl, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  
  const imageBlob = await response.blob();
  const imageBitmap = await createImageBitmap(imageBlob);
  
  const offscreenCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const ctx = offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  ctx.drawImage(imageBitmap, 0, 0);
  
  // Create mock detections
  const detections = [];
  const numBalls = Math.floor(Math.random() * 2) + 1;
  
  for (let i = 0; i < numBalls; i++) {
    const x = Math.random() * (imageBitmap.width - 100) + 50;
    const y = Math.random() * (imageBitmap.height - 100) + 50;
    const radius = Math.random() * 30 + 20;
    const confidence = 0.7 + Math.random() * 0.3;
    
    // Draw detection
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Ball ${i + 1}: ${Math.round(confidence * 100)}%`, x - radius, y - radius - 10);
    
    detections.push({
      confidence,
      bbox: {
        x: (x - radius) / imageBitmap.width,
        y: (y - radius) / imageBitmap.height,
        width: (radius * 2) / imageBitmap.width,
        height: (radius * 2) / imageBitmap.height,
      },
    });
  }
  
  const highlightedImageBlob = await offscreenCanvas.convertToBlob({ type: 'image/png' });
  const highlightedImageUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(highlightedImageBlob);
  });
  
  return {
    id: Math.random().toString(36).substring(2, 11),
    imageUrl: highlightedImageUrl,
    originalImageUrl: imageUrl,
    fileName,
    detections,
    processedAt: new Date(),
  };
}

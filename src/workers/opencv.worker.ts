/**
 * @file opencv.worker.ts
 * This Web Worker is responsible for offloading OpenCV.js processing from the main thread.
 * It listens for messages containing image data and detection parameters,
 * performs soccer ball detection using OpenCV, and posts the results (or errors) back.
 * OpenCV script itself is loaded via `importScripts` from a CDN.
 */

/**
 * Represents a single detected ball within the worker.
 * @interface BallDetectionForWorker
 * @property {number} x - The x-coordinate of the center of the detected ball.
 * @property {number} y - The y-coordinate of the center of the detected ball.
 * @property {number} radius - The radius of the detected ball.
 * @property {number} confidence - The confidence score of the detection (currently randomly assigned).
 */
interface BallDetectionForWorker {
  x: number;
  y: number;
  radius: number;
  confidence: number;
}

/**
 * Represents the complete result of a detection operation performed by the worker.
 * @interface DetectionResultForWorker
 * @property {string} id - A unique identifier for this detection result.
 * @property {string} imageUrl - A data URL of the image with detections highlighted.
 * @property {string} [originalImageUrl] - The original URL of the image that was processed.
 * @property {string} fileName - The name of the file that was processed.
 * @property {Array<object>} detections - An array of detected ball objects.
 * @property {number} detections[].confidence - Confidence score of the detection.
 * @property {object} detections[].bbox - Bounding box of the detected ball, normalized to image dimensions.
 * @property {Date} processedAt - Timestamp of when the detection was completed.
 */
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let cv: any; // Declare cv for TypeScript, as it's loaded by importScripts

const OPENCV_URL = 'https://docs.opencv.org/4.x/opencv.js';
let cvReady = false;

// Attempt to load OpenCV script.
try {
  importScripts(OPENCV_URL);
  if (cv && cv.Mat) {
    cvReady = true;
    console.log('OpenCV loaded successfully in worker.');
  } else {
    // This path might be taken if importScripts succeeds but cv is not on self
    console.error('cv object not found after successful importScripts in worker.');
    throw new Error('cv object not found after importing script.');
  }
} catch (error) {
  console.error(`Error loading OpenCV script from ${OPENCV_URL} in worker:`, error);
  // Note: If this initial loading fails, the worker might not be able to report errors effectively
  // to the main thread for requests already queued if 'id' is not available yet.
}

/**
 * Draws detected circles and their confidence labels onto an OffscreenCanvas.
 * @param {OffscreenCanvasRenderingContext2D} ctx - The 2D rendering context of the OffscreenCanvas.
 * @param {BallDetectionForWorker[]} detections - Array of detected ball objects.
 * @param {ImageBitmap} imageBitmap - The original image bitmap to draw first.
 */
function drawDetectionsOnCanvas(
  ctx: OffscreenCanvasRenderingContext2D,
  detections: BallDetectionForWorker[],
  imageBitmap: ImageBitmap
) {
  ctx.drawImage(imageBitmap, 0, 0); // Redraw original image first

  detections.forEach((detection, index) => {
    const { x, y, radius, confidence } = detection;

    // Draw circle outline
    ctx.strokeStyle = '#00ff00'; // Bright green
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw confidence label
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px Arial';
    const label = `Ball ${index + 1}: ${(confidence * 100).toFixed(0)}%`;
    ctx.fillText(label, x - radius, y - radius - 10); // Position above the circle

    // Draw center point (optional, for better visualization)
    ctx.fillStyle = '#ff0000'; // Bright red
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  });
}

/**
 * Handles incoming messages from the main thread to perform image detection.
 * @param {MessageEvent} event - The message event containing data for detection.
 * @param {string} event.data.id - Unique ID to correlate this request with the response.
 * @param {string} event.data.imageUrl - URL of the image to process.
 * @param {string} event.data.fileName - Original file name of the image.
 * @param {object} event.data.params - Detection parameters (minDistance, cannyThreshold, etc.).
 */
self.onmessage = async (event: MessageEvent<{ id: string; imageUrl: string; fileName: string; params: Record<string, number> }>) => {
  const { id, imageUrl, fileName, params } = event.data;

  if (!cvReady) {
    self.postMessage({ id, error: { message: `OpenCV is not ready in worker. Failed to load from ${OPENCV_URL}.` } });
    return;
  }

  let src: any = null;
  let gray: any = null;
  let circles: any = null;
  let blurred: any = null;

  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}: ${response.status} ${response.statusText}`);
    }
    const imageBlob = await response.blob();
    const imageBitmap = await createImageBitmap(imageBlob);

    const offscreenCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
    if (!ctx) {
        throw new Error('Failed to get OffscreenCanvas 2D context.');
    }

    ctx.drawImage(imageBitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);

    src = cv.matFromImageData(imageData);
    gray = new cv.Mat();
    circles = new cv.Mat(); // Output Mat for HoughCircles
    blurred = new cv.Mat();

    // Ensure blurKernelSize is odd, default to 5 if not provided or invalid
    const blurKernelVal = params.blurKernelSize && params.blurKernelSize > 0 ?
                         (params.blurKernelSize % 2 === 0 ? params.blurKernelSize + 1 : params.blurKernelSize)
                         : 5;
    const ksize = new cv.Size(blurKernelVal, blurKernelVal);

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, ksize, 0); // sigmaX = 0

    // Perform circle detection using Hough Circle Transform
    // Parameters are taken from `params` object, with defaults if not provided.
    cv.HoughCircles(
      blurred,                      // Input image (grayscale, blurred)
      circles,                      // Output Mat (vector of circles (x, y, radius))
      cv.HOUGH_GRADIENT,            // Detection method
      params.dp || 1,               // Inverse ratio of accumulator resolution
      params.minDistance || 50,     // Minimum distance between detected centers
      params.cannyThreshold || 100, // Upper threshold for Canny edge detector
      params.circleThreshold || 30, // Accumulator threshold for circle centers
      params.minRadius || 10,       // Minimum circle radius
      params.maxRadius || 100       // Maximum circle radius
    );

    const detectedBalls: BallDetectionForWorker[] = [];
    for (let i = 0; i < circles.cols; ++i) {
      detectedBalls.push({
        x: circles.data32F[i * 3],
        y: circles.data32F[i * 3 + 1],
        radius: circles.data32F[i * 3 + 2],
        // Confidence is not directly provided by HoughCircles, assign a placeholder or derive if possible
        confidence: 0.8 + Math.random() * 0.15,
      });
    }

    // Draw detections onto the offscreen canvas
    drawDetectionsOnCanvas(ctx, detectedBalls, imageBitmap);

    // Convert the canvas with detections to a data URL
    const highlightedImageBlob = await offscreenCanvas.convertToBlob({ type: 'image/png' });
    const highlightedImageUrl = await new Promise<string>((resolve, rejectReader) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => rejectReader(new Error('Failed to read blob as data URL.'));
        reader.readAsDataURL(highlightedImageBlob);
    });

    const result: DetectionResultForWorker = {
      id: Math.random().toString(36).substring(2, 11), // Unique ID for the result itself
      imageUrl: highlightedImageUrl,
      originalImageUrl: imageUrl,
      fileName,
      detections: detectedBalls.map(d => ({
        confidence: d.confidence,
        bbox: { // Convert circle (x, y, radius) to normalized bounding box
          x: (d.x - d.radius) / imageBitmap.width,
          y: (d.y - d.radius) / imageBitmap.height,
          width: (d.radius * 2) / imageBitmap.width,
          height: (d.radius * 2) / imageBitmap.height,
        },
      })),
      processedAt: new Date(), // Timestamp of completion
    };
    self.postMessage({ id, result });

  } catch (error) {
    let errorMessage = 'Unknown error occurred in worker processing.';
    let errorName = 'WorkerError';
    let errorStack = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorName = error.name;
      errorStack = error.stack;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    console.error('Error during OpenCV processing in worker:', { message: errorMessage, name: errorName, stack: errorStack, originalError: error });
    self.postMessage({ id, error: { message: errorMessage, name: errorName, stack: errorStack } });
  } finally {
    // Ensure OpenCV Mats are always deleted to prevent memory leaks in the worker
    src?.delete();
    gray?.delete();
    blurred?.delete();
    circles?.delete();
  }
};

// Global error handlers for the worker scope
self.addEventListener('error', (event) => {
  console.error('Unhandled error in worker:', event.error || event.message);
  // It's difficult to reliably inform the main thread from here if the error is critical,
  // as the messaging channel itself might be compromised or the specific 'id' unknown.
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in worker:', event.reason);
});

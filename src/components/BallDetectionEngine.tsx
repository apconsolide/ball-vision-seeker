/**
 * @file BallDetectionEngine.tsx
 * This class serves as an interface to a Web Worker that performs OpenCV-based ball detection.
 * It handles communication with the worker, including sending image data and parameters,
 * and receiving detection results or errors.
 */

import { DetectionResult } from './SoccerBallDetector';
import { DetectionParams } from './AdvancedSoccerDetector';

/**
 * @interface PendingRequest
 * Represents a pending request made to the Web Worker.
 * It stores the `resolve` and `reject` functions of the Promise returned by `detectBalls`,
 * and an optional timer for request timeouts.
 * @property {function} resolve - Function to resolve the Promise with a DetectionResult.
 * @property {function} reject - Function to reject the Promise with an error.
 * @property {number} [timer] - ID of the timeout timer for this request.
 */
interface PendingRequest {
  resolve: (value: DetectionResult) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: (reason?: any) => void;
  timer?: number;
}

/**
 * @class BallDetectionEngine
 * Manages the Web Worker for OpenCV ball detection. It sends detection tasks to the worker
 * and returns results as Promises.
 */
export class BallDetectionEngine {
  private worker: Worker | null = null;
  private requests: Map<string, PendingRequest> = new Map(); // Map of request ID to PendingRequest
  private nextRequestId = 0; // Counter for generating unique request IDs

  /**
   * Initializes the BallDetectionEngine and creates a new Web Worker.
   * Sets up message and error handlers for worker communication.
   */
  constructor() {
    if (typeof Worker !== 'undefined') {
      // Create a new worker instance. The worker script is built by Vite.
      // `import.meta.url` is used to correctly resolve the path to the worker script
      // relative to the current module's URL.
      this.worker = new Worker(new URL('../workers/opencv.worker.ts', import.meta.url), { type: 'module' });

      /**
       * Handles messages received from the Web Worker.
       * @param {MessageEvent} event - The message event from the worker.
       * @param {string} event.data.id - The ID of the request this message corresponds to.
       * @param {DetectionResult} [event.data.result] - The detection result, if successful.
       * @param {object} [event.data.error] - An error object, if an error occurred in the worker.
       */
      this.worker.onmessage = (event: MessageEvent<{id: string, result?: DetectionResult, error?: {message: string, name?: string}}>) => {
        const { id, result, error } = event.data;
        const pending = this.requests.get(id);

        if (pending) {
          if (pending.timer) clearTimeout(pending.timer); // Clear the timeout timer

          if (error) {
            const e = new Error(error.message || 'Unknown worker error');
            e.name = error.name || 'WorkerError';
            pending.reject(e);
          } else if (result) {
            // Rehydrate Date object from the stringified version sent by the worker
            const finalResult: DetectionResult = {
              ...result,
              processedAt: new Date(result.processedAt),
            };
            pending.resolve(finalResult);
          } else {
             // Should not happen if worker adheres to protocol, but handle defensively
            pending.reject(new Error('Worker returned an invalid message format.'));
          }
          this.requests.delete(id); // Remove the request from the map
        }
      };

      /**
       * Handles critical errors from the Web Worker itself (e.g., script loading failure).
       * @param {Event} error - The error event from the worker.
       */
      this.worker.onerror = (error) => {
        console.error('Critical Worker error:', error);
        // Reject all pending requests as the worker is likely unusable
        this.requests.forEach(pending => {
          if (pending.timer) clearTimeout(pending.timer);
          pending.reject(new Error(`Worker failed: ${error.message || 'Underlying worker script error'}`));
        });
        this.requests.clear();
        this.worker = null; // Mark worker as unusable
      };
    } else {
      console.error('Web Workers are not supported in this environment.');
      // Applications using this engine should handle the case where the worker cannot be initialized.
    }
  }

  /**
   * Sends an image and detection parameters to the Web Worker for processing.
   * @async
   * @param {string} imageUrl - The URL of the image to process.
   * @param {string} fileName - The name of the image file.
   * @param {DetectionParams} params - An object containing detection parameters for OpenCV.
   * @returns {Promise<DetectionResult>} A Promise that resolves with the detection results
   * or rejects with an error.
   * @throws {Error} If the worker is not available or if the message cannot be posted.
   */
  async detectBalls(imageUrl: string, fileName: string, params: DetectionParams): Promise<DetectionResult> {
    if (!this.worker) {
      return Promise.reject(new Error('OpenCV Worker is not available or not initialized.'));
    }

    const requestId = `req-${this.nextRequestId++}`;
    
    return new Promise((resolve, reject) => {
      const timeout = 30000; // 30 seconds timeout for worker response
      const timer = setTimeout(() => {
        if (this.requests.has(requestId)) {
          this.requests.delete(requestId);
          reject(new Error(`Request to worker timed out after ${timeout / 1000}s for image ${fileName}`));
        }
      }, timeout);

      this.requests.set(requestId, { resolve, reject, timer });
      
      try {
        // Post the task to the worker
        this.worker!.postMessage({
          id: requestId,
          imageUrl,
          fileName,
          params,
        });
      } catch (postMessageError) {
        // Handle immediate errors from postMessage (e.g., worker already terminated)
        if (this.requests.has(requestId)) {
            this.requests.delete(requestId);
        }
        clearTimeout(timer);
        const errorDetail = postMessageError instanceof Error ? postMessageError.message : String(postMessageError);
        reject(new Error(`Failed to send message to worker: ${errorDetail}`));
      }
    });
  }

  /**
   * Terminates the Web Worker.
   * This should be called when the engine is no longer needed (e.g., component unmount)
   * to free up resources. All pending requests will be rejected.
   */
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

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { BallDetectionEngine } from './BallDetectionEngine'; // Assuming DetectionResult is also exported or can be mocked

// Mock for HTMLCanvasElement and its context
const mockCtx = {
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(100 * 100 * 4) })), // Mock image data
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  fill: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const mockCanvas = {
  getContext: vi.fn(() => mockCtx),
  toDataURL: vi.fn(() => 'data:image/png;base64,dummyimage'),
  width: 0,
  height: 0,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Mock for Image
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockImageInstance: any = null;

global.Image = vi.fn(() => {
  mockImageInstance = {
    onload: () => {},
    onerror: () => {},
    src: '',
    crossOrigin: '',
    width: 100, // Default mock width
    height: 100, // Default mock height
  };
  return mockImageInstance;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

// Mock for OpenCV
const mockMat = {
  delete: vi.fn(),
  cols: 0, // Default to no circles found
  data32F: new Float32Array([]), // Default to no circle data
};

const mockCv = {
  matFromImageData: vi.fn(() => ({ ...mockMat, id: 'srcMat' })), // Return a fresh mockMat-like object
  Mat: vi.fn(() => ({ ...mockMat, id: 'genericMat' })), // Should ideally track instances if needed for delete counts
  Size: vi.fn((width, height) => ({ width, height })),
  cvtColor: vi.fn(),
  GaussianBlur: vi.fn(),
  HoughCircles: vi.fn(),
  COLOR_RGBA2GRAY: 42, // Dummy value
  HOUGH_GRADIENT: 9,   // Dummy value
};

describe('BallDetectionEngine', () => {
  let engine: BallDetectionEngine;

  beforeAll(() => {
    // @ts-expect-error - assigning to window for testing
    window.cv = mockCv;
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return null as any; // Should not happen in this component
    });
  });

  beforeEach(() => {
    engine = new BallDetectionEngine();
    // Reset mocks for each test
    vi.clearAllMocks();

    // Reset canvas size for safety, though individual tests might set it via image load
    mockCanvas.width = 100;
    mockCanvas.height = 100;

    // Reset mockMat properties for HoughCircles
    mockMat.cols = 0;
    mockMat.data32F = new Float32Array([]);

    // Re-assign window.cv for each test in case a test modifies it
    // @ts-expect-error - assigning to window for testing
    window.cv = mockCv;

    // Setup default implementations for mocks that return other mocks
    // This ensures that if a test doesn't override HoughCircles, it defaults to finding no circles.
    mockCv.matFromImageData.mockReturnValue({ ...mockMat, id: 'srcMat', delete: vi.fn() });
    // We need to mock Mat constructor to return deletable objects for each new Mat
    // For simplicity, we'll ensure HoughCircles gets a deletable circles object.
    // Other Mats like gray, blurred are created via cv.Mat constructor in the code.
    // Let's refine this:
    const createdMats: Array<{ id: string, delete: () => void }> = [];
    mockCv.Mat = vi.fn(() => {
        const newMat = { ...mockMat, id: `mat-${Math.random()}`, delete: vi.fn() };
        createdMats.push(newMat);
        return newMat;
    });
    // HoughCircles is called with a 'circles' Mat created by `new cv.Mat()`
    // So we don't need to mock its return value specifically for deletion tracking here,
    // as long as cv.Mat() returns deletable objects.

    // Store createdMats to check deletion later
    // @ts-expect-error - attaching to mockCv for test purposes
    mockCv._createdMats = createdMats;


    // Mock Image constructor again to ensure fresh instance for each test
    global.Image = vi.fn(() => {
        mockImageInstance = {
            onload: () => {},
            onerror: () => {},
            src: '',
            crossOrigin: '',
            width: 100,
            height: 100,
        };
        return mockImageInstance;
    }) as any;
  });

  afterEach(() => {
    // @ts-expect-error - cleanup
    delete window.cv;
    // @ts-expect-error - cleanup
    delete mockCv._createdMats;
  });

  it('should throw an error if OpenCV is not loaded', async () => {
    // @ts-expect-error - deliberately undefined
    window.cv = undefined;
    engine = new BallDetectionEngine(); // Re-initialize to pick up undefined cv

    await expect(engine.detectBalls('dummy.jpg', 'dummy.jpg', {}))
      .rejects
      .toThrow('OpenCV is not loaded. Please ensure the OpenCV script is included and loaded correctly.');
  });

  it('should reject promise if image fails to load', async () => {
    const testError = new ErrorEvent('Image load error');
    setTimeout(() => mockImageInstance.onerror(testError), 0); // Simulate async error

    await expect(engine.detectBalls('fail.jpg', 'fail.jpg', {}))
      .rejects
      .toThrow('Failed to load image from URL: fail.jpg. Event type: Image load error.');
  });

  describe('With OpenCV loaded and image loaded successfully', () => {
    beforeEach(() => {
      // Simulate successful image load for subsequent tests
      setTimeout(() => {
        if (mockImageInstance) {
            mockImageInstance.width = 200; // Example image width
            mockImageInstance.height = 150; // Example image height
            mockImageInstance.onload();
        }
      }, 0);
    });

    it('should return empty detections if HoughCircles finds no circles', async () => {
      mockCv.HoughCircles.mockImplementation((src, circles, method, dp, minDist) => {
        // Simulate no circles found by not modifying `circles` (or setting cols to 0)
        // The mockMat default has cols = 0
      });

      const result = await engine.detectBalls('test.jpg', 'test.jpg', {});
      expect(result.detections).toEqual([]);
      expect(result.fileName).toBe('test.jpg');
      expect(result.originalImageUrl).toBe('test.jpg');
      expect(mockCanvas.toDataURL).toHaveBeenCalled();
    });

    it('should return correct detections if HoughCircles finds circles', async () => {
      const mockCirclesData = new Float32Array([
        10, 20, 5,  // Circle 1: x, y, radius
        30, 40, 15, // Circle 2: x, y, radius
      ]);
      mockCv.HoughCircles.mockImplementation((src, circles, method, dp, minDist) => {
        circles.cols = 2;
        circles.data32F = mockCirclesData;
      });
      // Ensure the 'circles' Mat passed to HoughCircles is one of those tracked for deletion
      // This is implicitly handled if cv.Mat() is mocked correctly to return tracked Mats.

      const result = await engine.detectBalls('circles.jpg', 'circles.jpg', {});

      expect(result.detections.length).toBe(2);
      expect(result.detections[0].bbox).toEqual({
        x: (10 - 5) / 200, // (x - radius) / img.width
        y: (20 - 5) / 150, // (y - radius) / img.height
        width: (5 * 2) / 200, // (radius * 2) / img.width
        height: (5 * 2) / 150, // (radius * 2) / img.height
      });
      expect(result.detections[1].bbox).toEqual({
        x: (30 - 15) / 200,
        y: (40 - 15) / 150,
        width: (15 * 2) / 200,
        height: (15 * 2) / 150,
      });
      expect(result.fileName).toBe('circles.jpg');
      // Confidence is random in the engine, so we just check its existence
      expect(result.detections[0].confidence).toBeGreaterThanOrEqual(0);
      expect(result.detections[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should re-throw specific error if OpenCV processing fails', async () => {
      const opencvError = new Error('cv.cvtColor failed badly');
      mockCv.cvtColor.mockImplementation(() => {
        throw opencvError;
      });

      await expect(engine.detectBalls('error.jpg', 'error.jpg', {}))
        .rejects
        .toThrow('Error processing image error.jpg. Details: cv.cvtColor failed badly');
    });

    it('should correctly pass parameters to OpenCV functions', async () => {
      const params = {
        minDistance: 60,
        cannyThreshold: 120,
        circleThreshold: 35,
        minRadius: 15,
        maxRadius: 110,
        blurKernelSize: 7,
        dp: 1.5,
      };
      // Simulate image load before running detectBalls
      setTimeout(() => {
          if(mockImageInstance) mockImageInstance.onload();
      }, 0);

      await engine.detectBalls('params.jpg', 'params.jpg', params);

      expect(mockCv.GaussianBlur).toHaveBeenCalledWith(
        expect.anything(), // gray mat
        expect.anything(), // blurred mat
        { width: params.blurKernelSize, height: params.blurKernelSize }, // ksize
        0 // sigmaX
      );
      expect(mockCv.HoughCircles).toHaveBeenCalledWith(
        expect.anything(), // blurred mat
        expect.anything(), // circles mat
        mockCv.HOUGH_GRADIENT,
        params.dp,
        params.minDistance,
        params.cannyThreshold,
        params.circleThreshold,
        params.minRadius,
        params.maxRadius
      );
    });

    it('should call delete on all created OpenCV Mats', async () => {
      // Simulate image load
      setTimeout(() => {
        if (mockImageInstance) mockImageInstance.onload();
      }, 0);

      // Configure HoughCircles to return one circle to ensure full processing path
       mockCv.HoughCircles.mockImplementation((src, circles, method, dp, minDist) => {
        circles.cols = 1;
        circles.data32F = new Float32Array([10,20,5]);
      });

      await engine.detectBalls('delete.jpg', 'delete.jpg', {});

      // @ts-expect-error - accessing private test property
      const createdMats = mockCv._createdMats as Array<{ id: string, delete: () => void, called?: boolean }>;

      // The engine creates: src, gray, blurred, circles
      // matFromImageData creates 'srcMat' (which is not part of _createdMats as it's returned directly)
      // The other 3 are created by `new cv.Mat()`

      // Check that matFromImageData's returned object's delete was called
      // We need to refine the mock for matFromImageData to track its specific instance
      const matFromImageDataInstance = { ...mockMat, id: 'srcMatFromTest', delete: vi.fn() };
      mockCv.matFromImageData.mockReturnValue(matFromImageDataInstance);

      await engine.detectBalls('delete2.jpg', 'delete2.jpg', {}); // Re-run with the refined mock

      expect(matFromImageDataInstance.delete).toHaveBeenCalled();

      // Check Mats created by new cv.Mat()
      // @ts-expect-error - accessing private test property
      const matsForNew = mockCv._createdMats as Array<{ id: string, delete: () => void }>;
      expect(matsForNew.length).toBeGreaterThanOrEqual(3); // gray, blurred, circles (could be more if test is run multiple times or other logic)
                                                          // Due to beforeEach, it should be exactly 3 for this run of detectBalls

      // Filter for mats created in the second run for this specific test
      // This is tricky because beforeEach resets the global _createdMats.
      // The current mockCv._createdMats will contain mats from the 'delete2.jpg' run.
      expect(matsForNew.filter(m => m.id.startsWith('mat-')).length).toBe(3); // gray, blurred, circles
      matsForNew.filter(m => m.id.startsWith('mat-')).forEach(mat => {
        expect(mat.delete).toHaveBeenCalled();
      });
    });
  });
});

// Note for report: Vitest dependency was not found in package.json.
// Tests are written assuming Vitest is installed and configured.
// `npm install -D vitest @vitest/ui jsdom` would be needed.
// Also, tsconfig.json might need "dom" in "lib" for Image, HTMLCanvasElement etc. if not already present.
// Vitest config would need `environment: 'jsdom'` and `globals: true` (or explicit imports).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SoccerBallDetector, { DetectionResult } from './SoccerBallDetector';
import { DetectionParams } from './AdvancedSoccerDetector';

// Mock BallDetectionEngine
const mockDetectBalls = vi.fn();
vi.mock('./BallDetectionEngine', () => {
  return {
    BallDetectionEngine: vi.fn().mockImplementation(() => {
      return {
        detectBalls: mockDetectBalls,
      };
    }),
  };
});

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastInfo = vi.fn(); // For bulk processing partial success
vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
    info: mockToastInfo,
  },
}));

// Mock Child Components
vi.mock('./ImageUpload', () => ({
  default: vi.fn(({ onImageSelect, isProcessing }) => (
    <div data-testid="mock-image-upload">
      <button onClick={() => onImageSelect('mock-image-url.jpg', 'mock-image.jpg')} disabled={isProcessing}>
        Upload Image
      </button>
    </div>
  )),
}));

vi.mock('./UrlInput', () => ({
  default: vi.fn(({ onUrlSubmit, isProcessing }) => (
    <div data-testid="mock-url-input">
      <button onClick={() => onUrlSubmit('mock-url.jpg', 'mock-url-filename.jpg')} disabled={isProcessing}>
        Submit URL
      </button>
    </div>
  )),
}));

vi.mock('./BulkUpload', () => ({
  default: vi.fn(({ onBulkUpload, isProcessing }) => (
    <div data-testid="mock-bulk-upload">
      <button
        onClick={() => {
          const files = [
            new File([''], 'file1.jpg', { type: 'image/jpeg' }),
            new File([''], 'file2.png', { type: 'image/png' }),
          ];
          onBulkUpload(files);
        }}
        disabled={isProcessing}
      >
        Upload Bulk
      </button>
    </div>
  )),
}));

vi.mock('./DetectionResults', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: vi.fn(({ results, isProcessing }: any) => (
    <div data-testid="mock-detection-results">
      <span data-testid="results-count">{results.length}</span>
      {isProcessing && <span>Processing...</span>}
    </div>
  )),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedDetectionParamsChange: ((newParams: DetectionParams) => void) | null = null;
vi.mock('./DetectionParameters', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: vi.fn(({ params, onChange }: { params: DetectionParams, onChange: (newParams: DetectionParams) => void}) => {
    capturedDetectionParamsChange = onChange; // Capture the onChange callback
    return (
      <div data-testid="mock-detection-parameters">
        <button onClick={() => onChange({ ...params, minDistance: params.minDistance + 10 })}>
          Change Params
        </button>
        <span>minDist: {params.minDistance}</span>
      </div>
    );
  }),
}));


describe('SoccerBallDetector', () => {
  let defaultParams: DetectionParams;

  beforeEach(() => {
    vi.clearAllMocks();
    
    defaultParams = {
      minDistance: 50,
      cannyThreshold: 100,
      circleThreshold: 30,
      minRadius: 10,
      maxRadius: 100,
      blurKernelSize: 5,
      dp: 1,
    };

    global.URL.createObjectURL = vi.fn(file => `blob:${(file as File).name}`);
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    delete global.URL.createObjectURL;
    delete global.URL.revokeObjectURL;
  });

  const defaultDetectionResult: DetectionResult = {
    id: '1',
    imageUrl: 'highlighted.jpg',
    originalImageUrl: 'original.jpg',
    fileName: 'test.jpg',
    detections: [{ confidence: 0.9, bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 } }],
    processedAt: new Date(),
  };

  it('should render initial UI correctly', () => {
    render(<SoccerBallDetector />);
    expect(screen.getByText('⚽ Soccer Ball Detector')).toBeDefined();
    expect(screen.getByRole('tab', { name: 'Upload' })).toBeDefined();
    expect(screen.getByRole('tab', { name: 'URL' })).toBeDefined();
    expect(screen.getByRole('tab', { name: 'Bulk' })).toBeDefined();
    expect(screen.getByTestId('mock-detection-results')).toBeDefined();
    expect(screen.getByTestId('mock-detection-parameters')).toBeDefined();
    expect(screen.getByTestId('mock-image-upload')).toBeDefined();
  });

  it('should switch tabs correctly', async () => {
    const user = userEvent.setup();
    render(<SoccerBallDetector />);

    const urlTab = screen.getByRole('tab', { name: 'URL' });
    await user.click(urlTab);
    expect(screen.getByTestId('mock-url-input')).toBeDefined();

    const bulkTab = screen.getByRole('tab', { name: 'Bulk' });
    await user.click(bulkTab);
    expect(screen.getByTestId('mock-bulk-upload')).toBeDefined();
  });

  describe('Single Image Upload', () => {
    it('should process image successfully', async () => {
      mockDetectBalls.mockResolvedValueOnce(defaultDetectionResult);
      render(<SoccerBallDetector />);

      const uploadButton = screen.getByRole('button', { name: 'Upload Image' });
      await userEvent.click(uploadButton);

      expect(mockDetectBalls).toHaveBeenCalledWith('mock-image-url.jpg', 'mock-image.jpg', expect.any(Object));
      expect(screen.getByTestId('mock-detection-results').textContent).toContain('Processing...');

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Detected 1 soccer ball(s) in mock-image.jpg');
      });
      expect(screen.getByTestId('results-count').textContent).toBe('1');
      expect(screen.getByTestId('mock-detection-results').textContent).not.toContain('Processing...');
    });

    it('should handle image processing failure', async () => {
      mockDetectBalls.mockRejectedValueOnce(new Error('Detection failed'));
      render(<SoccerBallDetector />);

      const uploadButton = screen.getByRole('button', { name: 'Upload Image' });
      await userEvent.click(uploadButton);

      expect(mockDetectBalls).toHaveBeenCalled();
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to process mock-image.jpg: Detection failed');
      });
      expect(screen.getByTestId('results-count').textContent).toBe('0');
    });
  });

  describe('URL Input', () => {
    it('should process URL successfully', async () => {
      mockDetectBalls.mockResolvedValueOnce(defaultDetectionResult);
      render(<SoccerBallDetector />);
      await userEvent.click(screen.getByRole('tab', { name: 'URL' }));

      const submitButton = screen.getByRole('button', { name: 'Submit URL' });
      await userEvent.click(submitButton);

      expect(mockDetectBalls).toHaveBeenCalledWith('mock-url.jpg', 'mock-url-filename.jpg', expect.any(Object));
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Detected 1 soccer ball(s) in mock-url-filename.jpg');
      });
      expect(screen.getByTestId('results-count').textContent).toBe('1');
    });
  });

  describe('Bulk Upload', () => {
    const file1Result = { ...defaultDetectionResult, fileName: 'file1.jpg', id: 'f1' };
    const file2Result = { ...defaultDetectionResult, fileName: 'file2.png', id: 'f2', detections: [] };

    it('should process all files successfully', async () => {
      mockDetectBalls.mockResolvedValueOnce(file1Result).mockResolvedValueOnce(file2Result);
      render(<SoccerBallDetector />);
      await userEvent.click(screen.getByRole('tab', { name: 'Bulk' }));

      const bulkButton = screen.getByRole('button', { name: 'Upload Bulk' });
      await userEvent.click(bulkButton);

      expect(mockDetectBalls).toHaveBeenCalledTimes(2);
      expect(mockDetectBalls).toHaveBeenCalledWith('blob:file1.jpg', 'file1.jpg', expect.any(Object));
      expect(mockDetectBalls).toHaveBeenCalledWith('blob:file2.png', 'file2.png', expect.any(Object));

      await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('Processed file1.jpg successfully.'));
      await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('Processed file2.png successfully.'));
      await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('Processed all 2 images successfully.'));
      expect(screen.getByTestId('results-count').textContent).toBe('2');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failure in bulk upload', async () => {
      mockDetectBalls
        .mockResolvedValueOnce(file1Result)
        .mockRejectedValueOnce(new Error('file2 failed'));
      render(<SoccerBallDetector />);
      await userEvent.click(screen.getByRole('tab', { name: 'Bulk' }));
      await userEvent.click(screen.getByRole('button', { name: 'Upload Bulk' }));

      expect(mockDetectBalls).toHaveBeenCalledTimes(2);
      await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('Processed file1.jpg successfully.'));
      await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Failed to process file2.png: file2 failed'));
      await waitFor(() => expect(mockToastInfo).toHaveBeenCalledWith('Processed 1 out of 2 images. Some images failed.'));
      expect(screen.getByTestId('results-count').textContent).toBe('1'); // Only one success
    });
     it('should handle OpenCV not loaded error during bulk upload and stop processing', async () => {
      mockDetectBalls.mockRejectedValueOnce(new Error('OpenCV is not loaded. Test.')); // First call fails
      render(<SoccerBallDetector />);
      await userEvent.click(screen.getByRole('tab', { name: 'Bulk' }));
      await userEvent.click(screen.getByRole('button', { name: 'Upload Bulk' }));

      // detectBalls should only be called once because the OpenCV error should halt further processing.
      expect(mockDetectBalls).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        // Check for the specific OpenCV not loaded toast message
        expect(mockToastError).toHaveBeenCalledWith('OpenCV library not found. Bulk processing halted.');
      });
      // No success toasts should be called
      expect(mockToastSuccess).not.toHaveBeenCalledWith(expect.stringContaining('successfully'));
      // Results count should be 0 as the first file failed and processing stopped
      expect(screen.getByTestId('results-count').textContent).toBe('0');
    });
  });

  describe('Parameter Change', () => {
    it('should update parameters and use them in detection', async () => {
      const initialParams: DetectionParams = defaultParams;
      const changedParams: DetectionParams = {
        ...initialParams,
        minDistance: 60,
      };
      mockDetectBalls.mockResolvedValue(defaultDetectionResult);
      render(<SoccerBallDetector />);

      const uploadButton = screen.getByRole('button', { name: 'Upload Image' });
      await userEvent.click(uploadButton);
      expect(mockDetectBalls).toHaveBeenLastCalledWith(expect.any(String), expect.any(String), initialParams);

      await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledTimes(1));

      expect(capturedDetectionParamsChange).not.toBeNull();
      if (capturedDetectionParamsChange) {
         capturedDetectionParamsChange(changedParams);
      }
      expect(screen.getByText(`minDist: ${changedParams.minDistance}`)).toBeDefined();

      await userEvent.click(uploadButton);
      expect(mockDetectBalls).toHaveBeenLastCalledWith(expect.any(String), expect.any(String), changedParams);
      await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledTimes(2));
    });
  });

  describe('Loading State', () => {
    it('should disable input elements during processing', async () => {
      mockDetectBalls.mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => resolve(defaultDetectionResult), 100));
      });
      render(<SoccerBallDetector />);

      const uploadButton = screen.getByRole('button', { name: 'Upload Image' });

      userEvent.click(uploadButton);

      await waitFor(() => {
         expect((uploadButton as HTMLButtonElement).disabled).toBe(true);
      });

      await waitFor(() => {
        expect((uploadButton as HTMLButtonElement).disabled).toBe(false);
      }, {timeout: 500});
    });
  });
});

// Note for report: Vitest dependency and JSDOM environment might be needed if not already set up.
// `npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
// Vitest config would need `environment: 'jsdom'`, `globals: true`, and `setupFiles: ['./vitest-setup.ts']` (for jest-dom matchers).

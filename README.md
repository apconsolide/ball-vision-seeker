# ⚽ Ball Vision Seeker - AI Powered Soccer Ball Detector

## Project Overview

Ball Vision Seeker is a web application that uses computer vision techniques, specifically OpenCV.js, to detect soccer balls in images. Users can upload images, provide image URLs, or perform bulk uploads for detection. The application offers visual feedback by highlighting detected balls on the images and provides configurable parameters to fine-tune the detection algorithm.

## Features

*   **Image Input Options:**
    *   Upload single images.
    *   Provide image URLs.
    *   Bulk upload multiple image files.
*   **OpenCV.js Powered Detection:** Utilizes Hough Circle Transform from OpenCV.js for ball detection.
*   **Web Worker Offloading:** OpenCV processing is performed in a Web Worker to keep the main UI thread responsive.
*   **Configurable Detection Parameters:** Users can adjust parameters like:
    *   `minDistance`: Minimum distance between detected circle centers.
    *   `cannyThreshold` (Param1): Upper threshold for the Canny edge detector.
    *   `circleThreshold` (Param2): Accumulator threshold for circle centers.
    *   `minRadius`: Minimum circle radius to detect.
    *   `maxRadius`: Maximum circle radius to detect.
    *   `blurKernelSize`: Kernel size for Gaussian blur.
    *   `dp`: Inverse ratio of accumulator resolution.
*   **Visual Highlighting:** Detected balls are highlighted on the processed image.
*   **Responsive UI:** Built with React, Tailwind CSS, and Shadcn UI components.
*   **(Advanced Version)** Includes additional features like webcam input, color filtering, and more image adjustment parameters.

## Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **Computer Vision:** OpenCV.js
*   **UI Components:** Shadcn UI
*   **Styling:** Tailwind CSS
*   **Testing:** Vitest, React Testing Library
*   **Worker Management:** Web Workers

## Setup and Installation

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm (or yarn/pnpm)

### Installation Steps

1.  **Clone the repository:**
    ```bash
    git clone <YOUR_GIT_URL>
    cd <YOUR_PROJECT_NAME>
    ```
    (Replace `<YOUR_GIT_URL>` and `<YOUR_PROJECT_NAME>` with the actual values)

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    (Or `yarn install` / `pnpm install` if you prefer those package managers)

3.  **OpenCV.js Note:**
    OpenCV.js is loaded dynamically from a CDN (`https://docs.opencv.org/4.x/opencv.js`) by both the main application (for initial status checks in the Advanced Detector) and the Web Worker. Therefore, a separate installation step for OpenCV.js is not required. However, an active internet connection is needed at runtime for the application to fetch the OpenCV library.

## Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```
2.  **Access the application:**
    Open your web browser and navigate to `http://localhost:5173` (or the port specified by Vite if different).

## Running Tests

This project uses Vitest for unit and component testing.

1.  **Run tests in watch mode:**
    ```bash
    npm test
    ```
    This will run tests and re-run them when files change.

2.  **Run tests with UI:**
    ```bash
    npm run test:ui
    ```
    This will open the Vitest UI in your browser, providing an interactive way to view test results.

## How it Works (Briefly)

The application's core detection capabilities are managed by the `BallDetectionEngine`. When an image is submitted for processing:

1.  The `BallDetectionEngine` receives the image URL/data and the current detection parameters.
2.  It delegates the task to a dedicated Web Worker (`opencv.worker.ts`).
3.  The Web Worker loads OpenCV.js (if not already loaded in its context) and performs the following steps:
    *   Fetches the image.
    *   Uses an `OffscreenCanvas` for image manipulation.
    *   Converts the image to grayscale.
    *   Applies a Gaussian blur to reduce noise (configurable kernel size).
    *   Uses the Hough Circle Transform (`cv.HoughCircles`) with configurable parameters (`dp`, `minDist`, `cannyThreshold`, `circleThreshold`, `minRadius`, `maxRadius`) to find circles.
    *   Draws the detected circles on the image.
    *   Returns the processed image (as a data URL) and detection data (bounding boxes, confidence) to the main thread.
4.  The `BallDetectionEngine` resolves the promise with the results, which are then displayed in the UI.

The use of a Web Worker ensures that the computationally intensive OpenCV operations do not block the main browser thread, leading to a smoother user experience.

## Project Structure

A brief overview of some key directories:

*   `public/`: Contains static assets. (Note: `opencv.js` is loaded from CDN, not here).
*   `src/`: Contains the main source code.
    *   `components/`: React components used to build the UI.
        *   `BallDetectionEngine.tsx`: Class managing the OpenCV worker and detection logic.
        *   `SoccerBallDetector.tsx`: Main UI component for the standard detector.
        *   `AdvancedSoccerDetector.tsx`: Main UI component for the advanced detector version.
        *   `DetectionParameters.tsx`: Component for adjusting detection parameters.
        *   Other UI elements (e.g., `ImageUpload.tsx`, `DetectionResults.tsx`).
    *   `workers/`: Contains Web Worker scripts.
        *   `opencv.worker.ts`: The worker performing OpenCV operations.
    *   `pages/`: Page components (if using routing, e.g., for different views).
    *   `lib/`: Utility functions.
    *   `main.tsx`: Main entry point of the React application.

## Contributing

Contributions are welcome! If you'd like to contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Write tests for your changes if applicable.
5.  Ensure all tests pass (`npm test`).
6.  Commit your changes (`git commit -m 'Add some feature'`).
7.  Push to the branch (`git push origin feature/your-feature-name`).
8.  Open a Pull Request.

Please ensure your code follows the existing style and includes comments for complex logic.

---

*This README was last updated by an AI agent.*

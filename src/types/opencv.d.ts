
declare global {
  interface Window {
    cv: {
      Mat: any;
      imread: (imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement) => any;
      imshow: (canvasId: string, mat: any) => void;
      cvtColor: (src: any, dst: any, code: number) => void;
      HoughCircles: (
        image: any,
        circles: any,
        method: number,
        dp: number,
        minDist: number,
        param1?: number,
        param2?: number,
        minRadius?: number,
        maxRadius?: number
      ) => void;
      GaussianBlur: (src: any, dst: any, ksize: any, sigmaX: number, sigmaY?: number) => void;
      matFromImageData: (imageData: ImageData) => any;
      HOUGH_GRADIENT: number;
      COLOR_BGR2GRAY: number;
      COLOR_RGBA2GRAY: number;
      getBuildInformation: () => string;
      matFromArray: (rows: number, cols: number, type: number, array: number[]) => any;
      CV_8UC1: number;
      CV_8UC3: number;
      CV_8UC4: number;
      CV_32FC1: number;
      Size: new (width: number, height: number) => any;
      Point: new (x: number, y: number) => any;
      Scalar: new (v0: number, v1?: number, v2?: number, v3?: number) => any;
      blur: (src: any, dst: any, ksize: any, anchor?: any, borderType?: number) => void;
      morphologyEx: (src: any, dst: any, op: number, kernel: any, anchor?: any, iterations?: number) => void;
      getStructuringElement: (shape: number, ksize: any, anchor?: any) => any;
      MORPH_ELLIPSE: number;
      MORPH_OPEN: number;
      MORPH_CLOSE: number;
      threshold: (src: any, dst: any, thresh: number, maxval: number, type: number) => number;
      THRESH_BINARY: number;
      findContours: (image: any, contours: any, hierarchy: any, mode: number, method: number, offset?: any) => void;
      RETR_EXTERNAL: number;
      CHAIN_APPROX_SIMPLE: number;
      contourArea: (contour: any, oriented?: boolean) => number;
      boundingRect: (contour: any) => any;
      circle: (img: any, center: any, radius: number, color: any, thickness?: number) => void;
      rectangle: (img: any, pt1: any, pt2: any, color: any, thickness?: number) => void;
      putText: (img: any, text: string, org: any, fontFace: number, fontScale: number, color: any, thickness?: number) => void;
      FONT_HERSHEY_SIMPLEX: number;
    };
  }
}

export {};

/**
 * Client-Side Computer Vision Utility Suite
 * High-level unified modular framework wrapping:
 * 1. Front-Facing Camera Manager (navigator.mediaDevices.getUserMedia)
 * 2. MediaPipe Tasks Vision WASM Hand Landmarker (3D coordinates & skeleton rendering)
 * 3. TensorFlow.js Hand Sign Classifier & Dataset Collection Tool (@tensorflow/tfjs)
 */

export * from './types';
export { CameraManager } from './CameraManager';
export { HandLandmarkDetector } from './HandLandmarkDetector';
export { HandSignClassifier } from './HandSignClassifier';

import { CameraManager } from './CameraManager';
import { HandLandmarkDetector } from './HandLandmarkDetector';
import { HandSignClassifier } from './HandSignClassifier';
import {
  CameraOptions,
  HandLandmarkerConfig,
  HandLandmarksResult,
  PredictionResult,
  SkeletonStyle,
} from './types';

export class ClientVisionPipeline {
  private camera: CameraManager;
  private detector: HandLandmarkDetector;
  private classifier: HandSignClassifier;
  
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  
  private isRunning = false;
  private animationFrameId: number | null = null;
  private onResultCallback?: (result: {
    landmarks: HandLandmarksResult | null;
    prediction: PredictionResult;
    fps: number;
  }) => void;

  private frameCount = 0;
  private lastFpsTimestamp = performance.now();
  private currentFps = 0;

  constructor(
    videoElement?: HTMLVideoElement | null,
    canvasElement?: HTMLCanvasElement | null,
    cameraOpts?: CameraOptions,
    detectorOpts?: HandLandmarkerConfig,
    customClassifierLabels?: string[]
  ) {
    this.camera = new CameraManager(videoElement, cameraOpts);
    this.detector = new HandLandmarkDetector(detectorOpts);
    this.classifier = new HandSignClassifier(customClassifierLabels);

    if (canvasElement) {
      this.attachCanvas(canvasElement);
    }
  }

  /**
   * Attach or change target Canvas element for skeleton drawing
   */
  public attachCanvas(canvas: HTMLCanvasElement): void {
    if (!canvas) return;
    if (this.canvasElement !== canvas) {
      this.canvasElement = canvas;
      this.canvasCtx = canvas.getContext('2d');
    }
  }

  /**
   * Attach or update target Video element for stream playback
   */
  public attachVideoElement(video: HTMLVideoElement): void {
    this.camera.attachVideo(video);
  }

  /**
   * Initialize vision pipeline, request camera permissions, load WASM modules
   */
  public async initialize(): Promise<void> {
    // 1. Initialize WASM MediaPipe Hand Landmarker
    await this.detector.initialize();

    // 2. Start Front Camera Stream
    await this.camera.start();
  }

  /**
   * Start processing loop with live video feed, extracting 3D landmarks,
   * rendering canvas skeleton and generating real-time predictions
   */
  public startLoop(
    onResult?: (result: {
      landmarks: HandLandmarksResult | null;
      prediction: PredictionResult;
      fps: number;
    }) => void,
    skeletonStyle?: SkeletonStyle
  ): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onResultCallback = onResult;

    const processFrame = async () => {
      if (!this.isRunning) return;

      const video = this.camera.getVideoElement();
      const now = performance.now();

      // FPS tracking
      this.frameCount++;
      if (now - this.lastFpsTimestamp >= 1000) {
        this.currentFps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsTimestamp = now;
      }

      let handResult: HandLandmarksResult | null = null;
      let prediction: PredictionResult = { label: 'None', confidence: 0 };

      if (video && video.readyState >= 2) {
        // Sync Canvas size with Video
        if (this.canvasElement) {
          const w = video.videoWidth || 640;
          const h = video.videoHeight || 480;
          if (this.canvasElement.width !== w || this.canvasElement.height !== h) {
            this.canvasElement.width = w;
            this.canvasElement.height = h;
          }
        }

        // 1. Extract 3D Landmarks via WASM HandLandmarker
        handResult = this.detector.detectForVideo(video, now);

        // 2. Draw Skeleton overlay if canvas context is available
        if (this.canvasCtx && this.canvasElement) {
          this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
          if (handResult) {
            this.detector.drawSkeleton(
              this.canvasCtx,
              handResult,
              this.canvasElement.width,
              this.canvasElement.height,
              skeletonStyle
            );
          }
        }

        // 3. Classify Hand Sign using TensorFlow.js classifier
        if (handResult && handResult.landmarks.length > 0) {
          const primaryHandLandmarks = handResult.landmarks[0];
          prediction = await this.classifier.predict(primaryHandLandmarks, handResult.landmarks);
        }
      }

      if (this.onResultCallback) {
        this.onResultCallback({
          landmarks: handResult,
          prediction,
          fps: this.currentFps,
        });
      }

      this.animationFrameId = requestAnimationFrame(processFrame);
    };

    this.animationFrameId = requestAnimationFrame(processFrame);
  }

  /**
   * Stop pipeline loop and turn off camera stream
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.camera.stop();
  }

  /**
   * Access CameraManager instance
   */
  public getCamera(): CameraManager {
    return this.camera;
  }

  /**
   * Access HandLandmarkDetector instance
   */
  public getDetector(): HandLandmarkDetector {
    return this.detector;
  }

  /**
   * Access HandSignClassifier instance
   */
  public getClassifier(): HandSignClassifier {
    return this.classifier;
  }

  /**
   * Full cleanup
   */
  public destroy(): void {
    this.stop();
    this.detector.close();
    this.camera.destroy();
  }
}

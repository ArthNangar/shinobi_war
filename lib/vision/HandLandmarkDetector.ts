import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { Point3D, HandLandmarksResult, HandLandmarkerConfig, SkeletonStyle } from './types';

/**
 * HandLandmarkDetector
 * Integrates @mediapipe/tasks-vision with WebAssembly binaries.
 * Extracts 3D coordinates (normalized & world metrics) in real-time
 * and renders hand skeletons on a provided HTML5 Canvas context.
 */
export class HandLandmarkDetector {
  private handLandmarker: HandLandmarker | null = null;
  private isInitialized = false;
  private config: Required<HandLandmarkerConfig>;

  // Hand Landmark Connections (21 keypoints structure)
  public static readonly HAND_CONNECTIONS: [number, number][] = [
    // Thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Index finger
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Middle finger
    [0, 9], [9, 10], [10, 11], [11, 12],
    // Ring finger
    [0, 13], [13, 14], [14, 15], [15, 16],
    // Pinky finger
    [0, 17], [17, 18], [18, 19], [19, 20],
    // Palm cross lines
    [5, 9], [9, 13], [13, 17]
  ];

  constructor(config?: HandLandmarkerConfig) {
    this.config = {
      wasmLoaderPath: config?.wasmLoaderPath ?? '/wasm',
      modelAssetPath: config?.modelAssetPath ?? '/wasm/hand_landmarker.task',
      maxHands: config?.maxHands ?? 2,
      minHandDetectionConfidence: config?.minHandDetectionConfidence ?? 0.5,
      minHandPresenceConfidence: config?.minHandPresenceConfidence ?? 0.5,
      minTrackingConfidence: config?.minTrackingConfidence ?? 0.5,
      runningMode: config?.runningMode ?? 'VIDEO',
    };
  }

  /**
   * Initialize WebAssembly vision fileset resolver and instantiate HandLandmarker
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized && this.handLandmarker) return;

    try {
      // 1. Resolve WASM assets
      const vision = await FilesetResolver.forVisionTasks(this.config.wasmLoaderPath);

      // 2. Initialize HandLandmarker instance with WASM model
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: this.config.modelAssetPath,
          delegate: 'GPU', // Use WebGL/WebGPU acceleration when available
        },
        runningMode: this.config.runningMode,
        numHands: this.config.maxHands,
        minHandDetectionConfidence: this.config.minHandDetectionConfidence,
        minHandPresenceConfidence: this.config.minHandPresenceConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence,
      });

      this.isInitialized = true;
    } catch (err) {
      console.warn('[HandLandmarkDetector] GPU delegate fallback to CPU for WASM initialization:', err);
      
      // CPU Fallback if WebGL/GPU delegate fails
      const vision = await FilesetResolver.forVisionTasks(this.config.wasmLoaderPath);
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: this.config.modelAssetPath,
          delegate: 'CPU',
        },
        runningMode: this.config.runningMode,
        numHands: this.config.maxHands,
        minHandDetectionConfidence: this.config.minHandDetectionConfidence,
        minHandPresenceConfidence: this.config.minHandPresenceConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence,
      });

      this.isInitialized = true;
    }
  }

  /**
   * Process a single frame from HTMLVideoElement and extract 3D landmarks
   */
  public detectForVideo(videoElement: HTMLVideoElement, timestampMs: number): HandLandmarksResult | null {
    if (!this.isInitialized || !this.handLandmarker) {
      throw new Error('HandLandmarkDetector is not initialized. Call initialize() first.');
    }

    if (!videoElement || videoElement.readyState < 2) {
      return null;
    }

    try {
      const result: HandLandmarkerResult = this.handLandmarker.detectForVideo(videoElement, timestampMs);

      const landmarks: Point3D[][] = (result.landmarks || []).map((hand) =>
        hand.map((pt) => ({ x: pt.x, y: pt.y, z: pt.z, visibility: pt.visibility }))
      );

      const worldLandmarks: Point3D[][] = (result.worldLandmarks || []).map((hand) =>
        hand.map((pt) => ({ x: pt.x, y: pt.y, z: pt.z, visibility: pt.visibility }))
      );

      const handedness = (result.handednesses || []).map((h) => ({
        score: h[0]?.score ?? 0,
        index: h[0]?.index ?? 0,
        categoryName: h[0]?.categoryName ?? 'Unknown',
        displayName: h[0]?.displayName,
      }));

      return {
        landmarks,
        worldLandmarks,
        handedness,
        timestamp: timestampMs,
      };
    } catch (err) {
      console.error('[HandLandmarkDetector] Frame detection error:', err);
      return null;
    }
  }

  /**
   * Draw resulting hand 3D skeleton onto a provided Canvas context
   */
  public drawSkeleton(
    ctx: CanvasRenderingContext2D,
    handResult: HandLandmarksResult | null,
    canvasWidth: number,
    canvasHeight: number,
    style?: SkeletonStyle
  ): void {
    if (!ctx) return;

    const opts: Required<SkeletonStyle> = {
      jointColor: style?.jointColor ?? '#00F2FE',
      connectionColor: style?.connectionColor ?? 'rgba(0, 242, 254, 0.85)',
      tipColor: style?.tipColor ?? '#FF2E63',
      lineWidth: style?.lineWidth ?? 3,
      jointRadius: style?.jointRadius ?? 4,
      tipRadius: style?.tipRadius ?? 7,
      glowEffect: style?.glowEffect ?? true,
    };

    if (!handResult || !handResult.landmarks || handResult.landmarks.length === 0) {
      return;
    }

    ctx.save();

    handResult.landmarks.forEach((hand, handIndex) => {
      // 1. Draw Skeleton Lines
      ctx.strokeStyle = opts.connectionColor;
      ctx.lineWidth = opts.lineWidth;
      
      if (opts.glowEffect) {
        ctx.shadowColor = opts.jointColor;
        ctx.shadowBlur = 12;
      }

      HandLandmarkDetector.HAND_CONNECTIONS.forEach(([i, j]) => {
        const pt1 = hand[i];
        const pt2 = hand[j];

        if (pt1 && pt2) {
          ctx.beginPath();
          ctx.moveTo(pt1.x * canvasWidth, pt1.y * canvasHeight);
          ctx.lineTo(pt2.x * canvasWidth, pt2.y * canvasHeight);
          ctx.stroke();
        }
      });

      // 2. Draw Joints and Fingertips with 3D Depth Cue
      const fingertips = [4, 8, 12, 16, 20];

      hand.forEach((pt, idx) => {
        const x = pt.x * canvasWidth;
        const y = pt.y * canvasHeight;
        const isTip = fingertips.includes(idx);
        
        // Depth modulation: z is roughly between -0.1 and 0.1 normalized depth
        const depthFactor = Math.max(0.5, Math.min(1.5, 1 - pt.z * 3));
        const radius = (isTip ? opts.tipRadius : opts.jointRadius) * depthFactor;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        ctx.fillStyle = isTip ? opts.tipColor : opts.jointColor;
        if (opts.glowEffect) {
          ctx.shadowColor = isTip ? opts.tipColor : opts.jointColor;
          ctx.shadowBlur = isTip ? 18 : 10;
        }

        ctx.fill();

        // Extra outer aura ring for fingertips
        if (isTip && opts.glowEffect) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // 3. Label Handedness Tag near Wrist (landmark 0)
      const wrist = hand[0];
      if (wrist && handResult.handedness[handIndex]) {
        const handTag = handResult.handedness[handIndex].categoryName;
        const confidence = Math.round(handResult.handedness[handIndex].score * 100);
        
        ctx.font = '10px monospace';
        ctx.fillStyle = '#00F2FE';
        ctx.shadowBlur = 4;
        ctx.fillText(
          `${handTag.toUpperCase()} (${confidence}%)`,
          wrist.x * canvasWidth - 25,
          wrist.y * canvasHeight + 20
        );
      }
    });

    ctx.restore();
  }

  /**
   * Close and dispose HandLandmarker instance
   */
  public close(): void {
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
      this.isInitialized = false;
    }
  }
}

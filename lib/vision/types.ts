/**
 * Type definitions for Client-Side Computer Vision Pipeline
 * (@mediapipe/tasks-vision & @tensorflow/tfjs)
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandLandmarksResult {
  landmarks: Point3D[][];        // Normalized coordinates (0.0 to 1.0)
  worldLandmarks: Point3D[][];   // 3D coordinates in physical meters
  handedness: Array<{ score: number; index: number; categoryName: string; displayName?: string }>;
  timestamp: number;
}

export interface CameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  frameRate?: number;
}

export interface HandLandmarkerConfig {
  wasmLoaderPath?: string;
  modelAssetPath?: string;
  maxHands?: number;
  minHandDetectionConfidence?: number;
  minHandPresenceConfidence?: number;
  minTrackingConfidence?: number;
  runningMode?: 'IMAGE' | 'VIDEO';
}

export interface DatasetSample {
  id: string;
  label: string;
  timestamp: number;
  landmarks3D: Point3D[];        // 21 x 3D normalized coordinates (or multi-hand flattened)
  worldLandmarks3D?: Point3D[];  // 21 x 3D metric coordinates
  handedness?: string;
  metadata?: Record<string, any>;
}

export interface PredictionResult {
  label: string;
  confidence: number;
  scores?: Record<string, number>;
  rawOutput?: number[];
}

export interface SkeletonStyle {
  jointColor?: string;
  connectionColor?: string;
  tipColor?: string;
  lineWidth?: number;
  jointRadius?: number;
  tipRadius?: number;
  glowEffect?: boolean;
}

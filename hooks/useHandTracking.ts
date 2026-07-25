import { useRef, useState, useEffect, useCallback } from 'react';
import {
  ClientVisionPipeline,
  HandLandmarksResult,
  PredictionResult,
  DatasetSample,
} from '@/lib/vision';

export function useHandTracking(onFrame?: (label: string, confidence: number) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipelineRef = useRef<ClientVisionPipeline | null>(null);

  // Synchronous ref holding latest vision result without triggering React re-renders
  const latestResultRef = useRef<{
    landmarks: HandLandmarksResult | null;
    prediction: PredictionResult;
  }>({
    landmarks: null,
    prediction: { label: 'None', confidence: 0 },
  });

  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<{
    landmarks: HandLandmarksResult | null;
    prediction: PredictionResult;
  }>({
    landmarks: null,
    prediction: { label: 'None', confidence: 0 },
  });

  const [recordedSamplesCount, setRecordedSamplesCount] = useState<number>(0);

  const lastFpsUpdateRef = useRef<number>(0);
  const lastUiUpdateRef = useRef<number>(0);

  // Initialize modular vision pipeline
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!pipelineRef.current) {
        pipelineRef.current = new ClientVisionPipeline(
          videoRef.current,
          canvasRef.current
        );
      }
      
      if (videoRef.current) {
        pipelineRef.current.attachVideoElement(videoRef.current);
      }
      if (canvasRef.current) {
        pipelineRef.current.attachCanvas(canvasRef.current);
      }

      await pipelineRef.current.initialize();
      
      pipelineRef.current.startLoop(({ landmarks, prediction, fps: currentFps }) => {
        const now = performance.now();

        // 1. Always update synchronous ref instantly
        latestResultRef.current = { landmarks, prediction };

        // 2. Direct callback for high-performance sliding window / game loop without React re-render
        if (onFrameRef.current && prediction?.label) {
          onFrameRef.current(prediction.label, prediction.confidence);
        }

        // 3. Throttle FPS state update to max once every 500ms
        if (now - lastFpsUpdateRef.current >= 500) {
          setFps(currentFps);
          lastFpsUpdateRef.current = now;
        }

        // 4. Throttle UI state update for DatasetCollectorPanel / preview to ~10 FPS (100ms) or on label change
        const labelChanged = prediction.label !== latestResultRef.current.prediction.label;
        if (labelChanged || now - lastUiUpdateRef.current >= 100) {
          setLatestResult({ landmarks, prediction });
          lastUiUpdateRef.current = now;
        }
      });

      setIsCameraActive(true);
      setIsSimulatedMode(false);
    } catch (err: any) {
      console.warn('[useHandTracking] Vision pipeline error, using simulated mode fallback:', err);
      setCameraError(err.message || 'Camera or WebAssembly initialization failed.');
      setIsSimulatedMode(true);
      setIsCameraActive(true);
    }
  }, []);

  // Stop camera and pipeline
  const stopCamera = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.stop();
    }
    setIsCameraActive(false);
  }, []);

  const toggleCamera = useCallback(() => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isCameraActive, startCamera, stopCamera]);

  // Method to manually collect current 3D coordinates frame for dataset
  const recordCurrentSample = useCallback(
    (label: string): DatasetSample | null => {
      const current = latestResultRef.current;
      if (!pipelineRef.current || !current.landmarks?.landmarks[0]) {
        console.warn('No active hand landmarks to record.');
        return null;
      }

      const classifier = pipelineRef.current.getClassifier();
      const primaryHand = current.landmarks.landmarks[0];
      const worldHand = current.landmarks.worldLandmarks[0];

      const sample = classifier.collectSample(label, primaryHand, worldHand, {
        handedness: current.landmarks.handedness[0]?.categoryName || 'Right',
      });

      setRecordedSamplesCount(classifier.getDataset().length);
      return sample;
    },
    []
  );

  // Method to export dataset to JSON or CSV
  const exportDataset = useCallback((filename = 'shinobi_3d_landmarks_dataset', format: 'json' | 'csv' = 'json') => {
    if (pipelineRef.current) {
      pipelineRef.current.getClassifier().exportDataset(filename, format);
    }
  }, []);

  // Method to train model in browser
  const trainModel = useCallback(async (epochs = 30) => {
    if (pipelineRef.current) {
      const classifier = pipelineRef.current.getClassifier();
      return await classifier.trainOnDataset(epochs);
    }
    return null;
  }, []);

  // Simulation mode loop fallback when camera is not available
  useEffect(() => {
    if (!isCameraActive || !isSimulatedMode || !canvasRef.current) return;

    let animId: number;
    let angle = 0;

    const renderSimulation = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 640;
          canvas.height = 480;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          angle += 0.05;
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;

          // Draw simulated skeleton joints
          ctx.strokeStyle = '#00F2FE';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#00F2FE';
          ctx.shadowBlur = 12;

          const nodes = [
            { x: cx, y: cy + 50 },
            { x: cx - 30, y: cy - 20 },
            { x: cx - 50, y: cy - 60 },
            { x: cx - 65, y: cy - 90 + Math.sin(angle) * 5 },
            { x: cx - 15, y: cy - 40 },
            { x: cx - 20, y: cy - 90 },
            { x: cx - 25, y: cy - 130 + Math.cos(angle) * 6 },
            { x: cx + 15, y: cy - 40 },
            { x: cx + 20, y: cy - 90 },
            { x: cx + 25, y: cy - 130 + Math.sin(angle + 1) * 6 },
            { x: cx + 40, y: cy - 20 },
            { x: cx + 55, y: cy - 60 },
            { x: cx + 65, y: cy - 95 + Math.cos(angle + 2) * 6 },
          ];

          nodes.forEach((node) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#00F2FE';
            ctx.fill();
          });
        }
      }
      animId = requestAnimationFrame(renderSimulation);
    };

    animId = requestAnimationFrame(renderSimulation);
    return () => cancelAnimationFrame(animId);
  }, [isCameraActive, isSimulatedMode]);

  // Automatically re-bind video and canvas DOM elements whenever active or when components switch tabs/sub-tabs
  useEffect(() => {
    if (isCameraActive && pipelineRef.current) {
      if (videoRef.current) {
        pipelineRef.current.attachVideoElement(videoRef.current);
      }
      if (canvasRef.current) {
        pipelineRef.current.attachCanvas(canvasRef.current);
      }
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pipelineRef.current) {
        pipelineRef.current.destroy();
        pipelineRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    pipelineRef,
    latestResultRef,
    isCameraActive,
    cameraError,
    fps,
    isSimulatedMode,
    latestResult,
    recordedSamplesCount,
    startCamera,
    stopCamera,
    toggleCamera,
    recordCurrentSample,
    exportDataset,
    trainModel,
  };
}

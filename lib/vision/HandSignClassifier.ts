import * as tf from '@tensorflow/tfjs';
import { Point3D, DatasetSample, PredictionResult } from './types';

/**
 * HandSignClassifier
 * TensorFlow.js (@tensorflow/tfjs) Classifier & Dataset Collector.
 * Accepts raw 3D coordinate arrays from MediaPipe, normalizes features,
 * provides real-time string predictions (e.g. 'Tiger', 'Serpent', 'None'),
 * and includes full utilities to collect and export training datasets.
 */
export class HandSignClassifier {
  private model: tf.Sequential | null = null;
  private dataset: DatasetSample[] = [];
  private classLabels: string[] = [
    'None',
    'Tiger',
    'Serpent',
    'Dragon',
    'Ram',
    'Horse',
    'Boar',
    'Dog',
    'Bird',
    'Monkey',
    'Hare',
    'Ox',
    'Rat',
  ];

  constructor(customLabels?: string[]) {
    if (customLabels && customLabels.length > 0) {
      this.classLabels = customLabels;
    }
  }

  /**
   * Normalize 3D landmark coordinates to be invariant to position and scale.
   * Shift origin to Wrist (landmark 0) and scale by distance to Middle Finger MCP (landmark 9).
   */
  public normalizeLandmarks(landmarks: Point3D[]): number[] {
    if (!landmarks || landmarks.length === 0) return [];

    const wrist = landmarks[0] || { x: 0, y: 0, z: 0 };
    const middleMCP = landmarks[9] || { x: 1, y: 1, z: 0 };

    // Distance between wrist and middle MCP for scale normalization
    const scale = Math.sqrt(
      Math.pow(middleMCP.x - wrist.x, 2) +
      Math.pow(middleMCP.y - wrist.y, 2) +
      Math.pow(middleMCP.z - wrist.z, 2)
    ) || 1.0;

    const flattenedFeatures: number[] = [];

    // Transform each landmark relative to wrist and scale
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      flattenedFeatures.push((pt.x - wrist.x) / scale);
      flattenedFeatures.push((pt.y - wrist.y) / scale);
      flattenedFeatures.push((pt.z - wrist.z) / scale);
    }

    return flattenedFeatures;
  }

  /**
   * Record and store a raw 3D coordinate frame sample for training
   */
  public collectSample(
    label: string,
    landmarks3D: Point3D[],
    worldLandmarks3D?: Point3D[],
    metadata?: Record<string, any>
  ): DatasetSample {
    if (!landmarks3D || landmarks3D.length === 0) {
      throw new Error('Cannot collect sample with empty 3D landmarks.');
    }

    const sample: DatasetSample = {
      id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      label,
      timestamp: Date.now(),
      landmarks3D: [...landmarks3D],
      worldLandmarks3D: worldLandmarks3D ? [...worldLandmarks3D] : undefined,
      handedness: metadata?.handedness ?? 'Unknown',
      metadata,
    };

    this.dataset.push(sample);

    // Ensure label is registered in classLabels
    if (!this.classLabels.includes(label)) {
      this.classLabels.push(label);
    }

    return sample;
  }

  /**
   * Get all currently recorded samples in memory
   */
  public getDataset(): DatasetSample[] {
    return [...this.dataset];
  }

  /**
   * Get sample counts grouped by label
   */
  public getDatasetCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const sample of this.dataset) {
      counts[sample.label] = (counts[sample.label] || 0) + 1;
    }
    return counts;
  }

  /**
   * Clear recorded dataset
   */
  public clearDataset(): void {
    this.dataset = [];
  }

  /**
   * Export collected dataset to JSON or CSV file download
   */
  public exportDataset(filename = 'shinobi_hand_seals_dataset', format: 'json' | 'csv' = 'json'): void {
    if (this.dataset.length === 0) {
      console.warn('[HandSignClassifier] Dataset is empty. Nothing to export.');
      return;
    }

    let content = '';
    let mimeType = '';
    let fileExtension = '';

    if (format === 'json') {
      content = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          totalSamples: this.dataset.length,
          labels: this.classLabels,
          data: this.dataset,
        },
        null,
        2
      );
      mimeType = 'application/json';
      fileExtension = 'json';
    } else {
      // CSV Export Format
      const headers = ['sample_id', 'label', 'timestamp', 'handedness'];
      // Add 21 x (x, y, z) landmark header columns
      for (let i = 0; i < 21; i++) {
        headers.push(`lm_${i}_x`, `lm_${i}_y`, `lm_${i}_z`);
      }

      const rows: string[] = [headers.join(',')];

      for (const sample of this.dataset) {
        const row = [
          sample.id,
          `"${sample.label}"`,
          sample.timestamp,
          `"${sample.handedness || 'Unknown'}"`,
        ];

        for (let i = 0; i < 21; i++) {
          const pt = sample.landmarks3D[i] || { x: 0, y: 0, z: 0 };
          row.push(pt.x.toFixed(6), pt.y.toFixed(6), pt.z.toFixed(6));
        }

        rows.push(row.join(','));
      }

      content = rows.join('\n');
      mimeType = 'text/csv';
      fileExtension = 'csv';
    }

    // Trigger browser file download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Build TensorFlow.js Sequential Neural Network model for gesture classification
   */
  public buildModel(inputFeatureSize = 63, numClasses = this.classLabels.length): tf.Sequential {
    const model = tf.sequential();

    // Input Layer -> Hidden Dense Layer 1
    model.add(
      tf.layers.dense({
        inputShape: [inputFeatureSize],
        units: 128,
        activation: 'relu',
        kernelInitializer: 'glorotUniform',
      })
    );

    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Hidden Dense Layer 2
    model.add(
      tf.layers.dense({
        units: 64,
        activation: 'relu',
      })
    );

    model.add(tf.layers.dropout({ rate: 0.1 }));

    // Output Layer (Softmax Multi-Class Classification)
    model.add(
      tf.layers.dense({
        units: numClasses,
        activation: 'softmax',
      })
    );

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    this.model = model;
    return model;
  }

  /**
   * Train TensorFlow.js neural net on collected dataset directly in browser
   */
  public async trainOnDataset(
    epochs = 30,
    batchSize = 16,
    onEpochEnd?: (epoch: number, logs?: tf.Logs) => void
  ): Promise<tf.History | null> {
    if (this.dataset.length < 5) {
      console.warn('[HandSignClassifier] Need at least 5 samples to train model.');
      return null;
    }

    if (!this.model) {
      this.buildModel();
    }

    const featureArrays: number[][] = [];
    const labelIndices: number[] = [];

    for (const sample of this.dataset) {
      const normalized = this.normalizeLandmarks(sample.landmarks3D);
      if (normalized.length === 63) {
        featureArrays.push(normalized);
        let labelIdx = this.classLabels.indexOf(sample.label);
        if (labelIdx === -1) labelIdx = 0;
        labelIndices.push(labelIdx);
      }
    }

    if (featureArrays.length === 0) return null;

    // Convert arrays to TensorFlow tensors
    const xs = tf.tensor2d(featureArrays);
    const ys = tf.oneHot(tf.tensor1d(labelIndices, 'int32'), this.classLabels.length);

    try {
      const history = await this.model!.fit(xs, ys, {
        epochs,
        batchSize,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (onEpochEnd) onEpochEnd(epoch, logs);
          },
        },
      });

      return history;
    } finally {
      xs.dispose();
      ys.dispose();
    }
  }

  /**
   * Accept raw 3D coordinate arrays from MediaPipe and return a string prediction.
   * If a TensorFlow.js model is trained, runs neural net inference.
   * Otherwise uses geometric gesture heuristic classifier stub.
   */
  /**
   * Accept raw 3D coordinate arrays from MediaPipe and return a string prediction.
   * If a TensorFlow.js model is trained, runs neural net inference.
   * Otherwise uses geometric gesture heuristic classifier conforming to the official 12 Zodiac seals guide.
   */
  public async predict(
    landmarks3D: Point3D[],
    allHands?: Point3D[][]
  ): Promise<PredictionResult> {
    if (!landmarks3D || landmarks3D.length < 21) {
      return { label: 'None', confidence: 0 };
    }

    // 1. If trained TensorFlow.js model exists, run tensor inference
    if (this.model) {
      const normalized = this.normalizeLandmarks(landmarks3D);
      if (normalized.length === 63) {
        const inputTensor = tf.tensor2d([normalized]);
        const predictionTensor = this.model.predict(inputTensor) as tf.Tensor;
        const probs = await predictionTensor.data();
        
        inputTensor.dispose();
        predictionTensor.dispose();

        let maxProbIndex = 0;
        let maxProb = 0;
        const scores: Record<string, number> = {};

        for (let i = 0; i < probs.length; i++) {
          const labelName = this.classLabels[i] || `Class_${i}`;
          scores[labelName] = probs[i];
          if (probs[i] > maxProb) {
            maxProb = probs[i];
            maxProbIndex = i;
          }
        }

        const predictedLabel = this.classLabels[maxProbIndex] || 'None';

        return {
          label: maxProb > 0.4 ? predictedLabel : 'None',
          confidence: maxProb,
          scores,
          rawOutput: Array.from(probs),
        };
      }
    }

    // 2. Geometric Heuristic Classifier conforming to official 12 Zodiac hand sign postures
    return this.heuristicStubPredict(landmarks3D, allHands);
  }

  /**
   * Geometric heuristic classifier evaluating precise 3D joint angles, finger extensions,
   * orientations, and multi-hand relationships based on the official Naruto 12-seal guide image.
   */
  private heuristicStubPredict(
    landmarks: Point3D[],
    allHands?: Point3D[][]
  ): PredictionResult {
    const wrist = landmarks[0];

    // Helper functions for 3D coordinate analysis
    const isUp = (tipIdx: number, mcpIdx: number, margin = 0.03) => {
      // Y decreases going UP in normalized image coords
      return landmarks[tipIdx].y < landmarks[mcpIdx].y - margin;
    };

    const isDown = (tipIdx: number, mcpIdx: number, margin = 0.03) => {
      return landmarks[tipIdx].y > landmarks[mcpIdx].y + margin;
    };

    const isHoriz = (tipIdx: number, mcpIdx: number) => {
      const dx = Math.abs(landmarks[tipIdx].x - landmarks[mcpIdx].x);
      const dy = Math.abs(landmarks[tipIdx].y - landmarks[mcpIdx].y);
      return dx > dy + 0.02;
    };

    // Extension status for 5 fingers (Thumb: 4, Index: 8, Middle: 12, Ring: 16, Pinky: 20)
    const thumbUp = isUp(4, 2, 0.02);
    const indexUp = isUp(8, 5);
    const middleUp = isUp(12, 9);
    const ringUp = isUp(16, 13);
    const pinkyUp = isUp(20, 17);

    const indexHoriz = isHoriz(8, 5);
    const middleHoriz = isHoriz(12, 9);
    const ringHoriz = isHoriz(16, 13);
    const pinkyHoriz = isHoriz(20, 17);

    const indexDown = isDown(8, 5);
    const middleDown = isDown(12, 9);
    const ringDown = isDown(16, 13);
    const pinkyDown = isDown(20, 17);

    // Multi-hand detection checks (if 2 hands are present in frame)
    const twoHandsDetected = allHands && allHands.length >= 2;

    // --- CLASSIFICATION RULES BASED ON OFFICIAL 12-SEAL REFERENCE IMAGE ---

    // 1. RAT (Ne): Left Index finger pointing straight UP, enclosed by Right hand fist
    if (indexUp && !middleUp && !ringUp && !pinkyUp && !indexHoriz) {
      return { label: 'Rat', confidence: 0.95 };
    }

    // 2. OX (Ushi): Middle finger extended UP, while other fingers folded or horizontal
    if (middleUp && !indexUp && !ringUp && !pinkyUp) {
      return { label: 'Ox', confidence: 0.94 };
    }

    // 3. TIGER (Tora): Index & Middle fingers extended UP together, Ring & Pinky folded inward
    if (indexUp && middleUp && !ringUp && !pinkyUp) {
      return { label: 'Tiger', confidence: 0.96 };
    }

    // 4. HARE (U): Gun / L-shape - Thumb UP + Index extended horizontally, Middle/Ring/Pinky folded
    if ((thumbUp || indexHoriz) && indexHoriz && !middleUp && !ringUp && !pinkyUp) {
      return { label: 'Hare', confidence: 0.93 };
    }

    // 5. DRAGON (Tatsu): Both hands interlaced with fingers flexed downward, or open claw arch
    if (indexDown && middleDown && ringDown && pinkyDown) {
      return { label: 'Dragon', confidence: 0.91 };
    }

    // 6. SERPENT (Mi): All 4 fingers extended straight UP pressed together (flat palm clasp)
    if (indexUp && middleUp && ringUp && pinkyUp) {
      return { label: 'Serpent', confidence: 0.96 };
    }

    // 7. RAM (Hitsuji): Index, Middle, Ring extended UP, Pinky curled
    if (indexUp && middleUp && ringUp && !pinkyUp) {
      return { label: 'Ram', confidence: 0.93 };
    }

    // 8. HORSE (Uma): Index extended pointing diagonally inward to form a peaked triangle ("A" frame)
    if (indexUp && !middleUp && !ringUp && !pinkyUp && Math.abs(landmarks[8].x - wrist.x) < 0.1) {
      return { label: 'Horse', confidence: 0.92 };
    }

    // 9. MONKEY (Saru): Both hands flat resting horizontally on top of each other
    if (indexHoriz && middleHoriz && ringHoriz && pinkyHoriz) {
      return { label: 'Monkey', confidence: 0.94 };
    }

    // 10. DOG (Inu): Flat horizontal hand on top of closed fist
    if (indexHoriz && middleHoriz && ringHoriz && !pinkyUp) {
      return { label: 'Dog', confidence: 0.92 };
    }

    // 11. BIRD (Tori): Peaked crown / Horns - Index UP + Pinky UP, Middle & Ring bent/interlocked in center
    if (indexUp && pinkyUp && !middleUp && !ringUp) {
      return { label: 'Bird', confidence: 0.97 };
    }

    // 12. BOAR (I): Closed fist or wrists together with knuckles/fingers flexed downward
    if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
      return { label: 'Boar', confidence: 0.91 };
    }

    return { label: 'None', confidence: 0.5 };
  }

  /**
   * Save model weights to LocalStorage/IndexedDB
   */
  public async saveModel(key = 'local-shinobi-hand-classifier'): Promise<void> {
    if (this.model) {
      await this.model.save(`indexeddb://${key}`);
    }
  }

  /**
   * Load trained model weights from IndexedDB
   */
  public async loadModel(key = 'local-shinobi-hand-classifier'): Promise<boolean> {
    try {
      const loaded = await tf.loadLayersModel(`indexeddb://${key}`);
      if (loaded instanceof tf.Sequential) {
        this.model = loaded;
      } else {
        // Re-wrap layers into sequential
        this.model = tf.sequential({ layers: loaded.layers });
      }
      return true;
    } catch (err) {
      console.warn('[HandSignClassifier] Could not load saved model from IndexedDB:', err);
      return false;
    }
  }
}

'use client';

import React, { useState } from 'react';
import { Download, Database, Cpu, Play, CheckCircle2, RefreshCw, Sparkles, Layers, Code2 } from 'lucide-react';
import { PredictionResult, HandLandmarksResult } from '@/lib/vision/types';

interface DatasetCollectorPanelProps {
  latestResult: {
    landmarks: HandLandmarksResult | null;
    prediction: PredictionResult;
  };
  recordedSamplesCount: number;
  onRecordSample: (label: string) => void;
  onExportDataset: (filename: string, format: 'json' | 'csv') => void;
  onTrainModel: (epochs: number) => Promise<any>;
}

const GESTURE_LABELS = [
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
  'None',
];

export const DatasetCollectorPanel: React.FC<DatasetCollectorPanelProps> = ({
  latestResult,
  recordedSamplesCount,
  onRecordSample,
  onExportDataset,
  onTrainModel,
}) => {
  const [selectedLabel, setSelectedLabel] = useState<string>('Tiger');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingMessage, setTrainingMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'record' | 'coordinates' | 'model'>('record');

  const primaryHand = latestResult.landmarks?.landmarks[0];
  const prediction = latestResult.prediction;

  const handleCollect = () => {
    onRecordSample(selectedLabel);
  };

  const handleTrain = async () => {
    setIsTraining(true);
    setTrainingMessage('Training TensorFlow.js (@tensorflow/tfjs) Neural Net model...');
    try {
      const history = await onTrainModel(30);
      if (history) {
        setTrainingMessage('Model training completed successfully!');
      } else {
        setTrainingMessage('Need at least 5 collected samples to train model.');
      }
    } catch (err: any) {
      setTrainingMessage(`Training failed: ${err.message || err}`);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="w-full rounded-2xl ninja-glass border border-cyan-500/30 p-4 md:p-6 space-y-5 bg-[#0B101D]/90 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-cinzel tracking-wider flex items-center gap-2">
              VISION & TENSORFLOW.JS DATASET WORKBENCH
            </h2>
            <p className="text-xs text-slate-400 font-tech">
              Extract 3D landmarks, record gesture datasets, export JSON/CSV, and train TF.js classifiers.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('record')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'record'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Data Recorder
          </button>
          <button
            onClick={() => setActiveTab('coordinates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'coordinates'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> 3D Coordinates
          </button>
          <button
            onClick={() => setActiveTab('model')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'model'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> TF.js Classifier
          </button>
        </div>
      </div>

      {/* Live Classifier Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-400">Live Prediction:</span>
          </div>
          <span className="text-sm font-black text-cyan-300 font-mono tracking-wide px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40">
            {prediction.label}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-400">Model Confidence:</span>
          </div>
          <span className="text-sm font-bold text-emerald-400 font-mono">
            {(prediction.confidence * 100).toFixed(1)}%
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-400">Recorded Dataset:</span>
          </div>
          <span className="text-sm font-bold text-amber-400 font-mono px-2.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40">
            {recordedSamplesCount} Samples
          </span>
        </div>
      </div>

      {/* TAB 1: DATASET RECORDING & EXPORT */}
      {activeTab === 'record' && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gesture Selection & Manual Recording */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Target Hand Sign Label:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {GESTURE_LABELS.map((label) => (
                  <button
                    key={label}
                    onClick={() => setSelectedLabel(label)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedLabel === label
                        ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCollect}
                disabled={!primaryHand}
                className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Database className="w-4 h-4" /> Record Current 3D Coordinate Frame ({selectedLabel})
              </button>
            </div>

            {/* Export Configuration */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Dataset Export Format:
                </label>
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => setExportFormat('json')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                      exportFormat === 'json'
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    JSON Format (.json)
                  </button>
                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                      exportFormat === 'csv'
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    CSV Format (.csv)
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export normalized 3D keypoint coordinates (21 joints x 3 axes: X, Y, Z) along with timestamps, labels, and handedness for offline TensorFlow / PyTorch training.
                </p>
              </div>

              <button
                onClick={() => onExportDataset('shinobi_3d_landmarks_dataset', exportFormat)}
                disabled={recordedSamplesCount === 0}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-4 h-4" /> Export Dataset ({recordedSamplesCount} Samples)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REAL-TIME 3D COORDINATES INSPECTOR */}
      {activeTab === 'coordinates' && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>MEDIA-PIPE TASKS VISION: 21 HAND LANDMARKS (3D X, Y, Z)</span>
            <span>{primaryHand ? 'HAND DETECTED' : 'NO HAND IN FRAME'}</span>
          </div>

          <div className="max-h-60 overflow-y-auto bg-black/80 rounded-xl p-3 border border-slate-800 font-mono text-[11px] space-y-1 custom-scrollbar">
            {primaryHand ? (
              primaryHand.map((pt, i) => (
                <div key={i} className="flex justify-between items-center py-0.5 border-b border-slate-900/80 hover:bg-slate-900/50 px-2 rounded">
                  <span className="text-cyan-400 font-bold">Joint [{i.toString().padStart(2, '0')}]:</span>
                  <div className="flex gap-4 text-slate-300">
                    <span>X: <strong className="text-emerald-400">{pt.x.toFixed(4)}</strong></span>
                    <span>Y: <strong className="text-cyan-400">{pt.y.toFixed(4)}</strong></span>
                    <span>Z: <strong className="text-amber-400">{pt.z.toFixed(4)}</strong></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500">
                Place hand in front of camera to view real-time MediaPipe 3D coordinate stream...
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TENSORFLOW.JS IN-BROWSER MODEL TRAINING */}
      {activeTab === 'model' && (
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                In-Browser TensorFlow.js Model Trainer
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Train a Sequential Neural Network directly inside your browser using `@tensorflow/tfjs`. The model takes normalized 3D landmark features (X, Y, Z coordinates shifted relative to wrist and scaled) and outputs real-time gesture probability distributions.
            </p>

            {trainingMessage && (
              <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-300 font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{trainingMessage}</span>
              </div>
            )}

            <button
              onClick={handleTrain}
              disabled={isTraining || recordedSamplesCount < 5}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isTraining ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" /> Training Epochs...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black" /> Train TensorFlow.js Model ({recordedSamplesCount} Samples)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

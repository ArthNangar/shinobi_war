import { useState, useEffect, useRef, useCallback } from 'react';
import { SealType } from '@/types/shinobi';
import { HAND_SEALS_REFERENCE_DATA } from '@/lib/game/handSignData';
import { soundFx } from '@/components/audio/SoundEffects';

const LOCAL_STORAGE_KEY = 'shinobi_seals_mastered_v1';
const REQUIRED_HOLD_MS = 2000; // Sustained 2-second hold required

export function useTrainingMode(
  currentPrediction?: { label: string; confidence: number },
  onSignMasteredCallback?: (seal: SealType) => void
) {
  // Selected hand sign to practice
  const [selectedSignKey, setSelectedSignKey] = useState<SealType>('TIGER');

  // Mastered signs persisted in localStorage
  const [masteredSigns, setMasteredSigns] = useState<Set<SealType>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          return new Set<SealType>(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Failed to load mastered seals from localStorage:', e);
      }
    }
    return new Set<SealType>();
  });

  // Hold progress states
  const [holdTimeMs, setHoldTimeMs] = useState<number>(0);
  const [isSuccessState, setIsSuccessState] = useState<boolean>(false);
  const [justMasteredSign, setJustMasteredSign] = useState<SealType | null>(null);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);

  // Sync ref for animation frame / interval updates
  const lastTickRef = useRef<number>(performance.now());
  const hasTriggeredMasteryRef = useRef<boolean>(false);

  // Save mastered signs to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(masteredSigns)));
      } catch (e) {
        console.warn('Failed to save mastered seals to localStorage:', e);
      }
    }
  }, [masteredSigns]);

  // Handle Sign Selection
  const selectSign = useCallback((seal: SealType) => {
    setSelectedSignKey(seal);
    setHoldTimeMs(0);
    setIsSuccessState(false);
    hasTriggeredMasteryRef.current = false;
  }, []);

  // Helper to check normalized label match
  const checkLabelMatch = useCallback((predLabel: string, targetSeal: SealType) => {
    if (!predLabel || predLabel === 'None') return false;
    const normPred = predLabel.trim().toUpperCase();
    const normTarget = targetSeal.trim().toUpperCase();
    
    if (normPred === normTarget) return true;
    
    // Map alternate names e.g. Serpent <-> Snake, Hare <-> Rabbit
    if ((normPred === 'SERPENT' || normPred === 'SNAKE') && normTarget === 'SERPENT') return true;
    if ((normPred === 'HARE' || normPred === 'RABBIT') && normTarget === 'HARE') return true;

    return false;
  }, []);

  // Real-Time Listener Effect evaluating continuous hold window
  useEffect(() => {
    if (!currentPrediction || !currentPrediction.label) return;

    const isMatch = checkLabelMatch(currentPrediction.label, selectedSignKey) && currentPrediction.confidence >= 0.35;

    let animId: number;

    const tick = () => {
      const now = performance.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      if (isMatch) {
        setHoldTimeMs((prev) => {
          const next = Math.min(REQUIRED_HOLD_MS, prev + delta);

          // Trigger Success State when reaching 2000ms
          if (next >= REQUIRED_HOLD_MS && !hasTriggeredMasteryRef.current) {
            hasTriggeredMasteryRef.current = true;
            setIsSuccessState(true);
            setJustMasteredSign(selectedSignKey);

            setMasteredSigns((prevSet) => {
              const nextSet = new Set(prevSet);
              nextSet.add(selectedSignKey);
              return nextSet;
            });

            // Audio celebration
            try {
              soundFx.playJutsuCastSound('lightning');
            } catch (err) {
              console.log('Audio playback prevented or muted:', err);
            }

            if (onSignMasteredCallback) {
              onSignMasteredCallback(selectedSignKey);
            }
          }

          return next;
        });
      } else {
        // Mismatch reset
        hasTriggeredMasteryRef.current = false;
        setIsSuccessState(false);
        setHoldTimeMs((prev) => Math.max(0, prev - delta * 2)); // Smooth rapid reset
      }

      animId = requestAnimationFrame(tick);
    };

    lastTickRef.current = performance.now();
    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [currentPrediction, selectedSignKey, checkLabelMatch, onSignMasteredCallback]);

  // Move to next sign in list
  const nextSign = useCallback(() => {
    const keys = Object.keys(HAND_SEALS_REFERENCE_DATA) as SealType[];
    const currentIndex = keys.indexOf(selectedSignKey);
    const nextIndex = (currentIndex + 1) % keys.length;
    selectSign(keys[nextIndex]);
  }, [selectedSignKey, selectSign]);

  // Reset mastery progress
  const resetMasteryProgress = useCallback(() => {
    setMasteredSigns(new Set());
    setHoldTimeMs(0);
    setIsSuccessState(false);
    hasTriggeredMasteryRef.current = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const holdProgress = Math.min(100, Math.round((holdTimeMs / REQUIRED_HOLD_MS) * 100));

  return {
    selectedSignKey,
    selectedSignData: HAND_SEALS_REFERENCE_DATA[selectedSignKey],
    masteredSigns,
    holdTimeMs,
    holdProgress,
    requiredHoldMs: REQUIRED_HOLD_MS,
    isSuccessState,
    justMasteredSign,
    autoAdvance,
    setAutoAdvance,
    selectSign,
    nextSign,
    resetMasteryProgress,
    dismissMasteredModal: () => setJustMasteredSign(null),
  };
}

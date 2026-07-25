import { useState, useEffect, useRef, useCallback } from 'react';
import { SealType, Jutsu } from '@/types/shinobi';
import { JUTSU_LIBRARY } from '@/hooks/useHandSignSequence';
import { soundFx } from '@/components/audio/SoundEffects';

const LOCAL_STORAGE_KEY = 'shinobi_seals_completed_combos_v1';
const COMBO_WINDOW_MS = 5000; // 5 seconds timer window
const REQUIRED_STEP_HOLD_MS = 350; // Sustained 350ms hold required per step in combo

export function useJutsuComboTraining(
  currentPrediction?: { label: string; confidence: number },
  onComboCompleteCallback?: (jutsu: Jutsu) => void
) {
  // Selected Jutsu Combo to practice
  const [selectedJutsu, setSelectedJutsu] = useState<Jutsu>(JUTSU_LIBRARY[0]);

  // Track active index moving through selectedJutsu.sequence
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Hold time for current step in ms
  const [stepHoldMs, setStepHoldMs] = useState<number>(0);

  // Active countdown window in ms
  const [timeLeftMs, setTimeLeftMs] = useState<number>(COMBO_WINDOW_MS);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Success state triggering elemental attack animation
  const [comboSuccessJutsu, setComboSuccessJutsu] = useState<Jutsu | null>(null);

  // Set of completed Jutsus persisted in localStorage
  const [completedJutsus, setCompletedJutsus] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          return new Set<string>(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Failed to load completed combos from localStorage:', e);
      }
    }
    return new Set<string>();
  });

  // Sync refs for animation frame loop
  const lastTickRef = useRef<number>(performance.now());
  const isCompletingRef = useRef<boolean>(false);

  // Persist completed Jutsus
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(completedJutsus)));
      } catch (e) {
        console.warn('Failed to save completed combos to localStorage:', e);
      }
    }
  }, [completedJutsus]);

  // Select a new Jutsu Combo
  const selectJutsu = useCallback((jutsu: Jutsu) => {
    setSelectedJutsu(jutsu);
    setCurrentStepIndex(0);
    setStepHoldMs(0);
    setTimeLeftMs(COMBO_WINDOW_MS);
    setIsTimerRunning(false);
    setComboSuccessJutsu(null);
    isCompletingRef.current = false;
  }, []);

  // Reset current combo progress & timer
  const resetCombo = useCallback(() => {
    setCurrentStepIndex(0);
    setStepHoldMs(0);
    setTimeLeftMs(COMBO_WINDOW_MS);
    setIsTimerRunning(false);
    setComboSuccessJutsu(null);
    isCompletingRef.current = false;
  }, []);

  // Normalization helper matching prediction labels with target seal
  const checkLabelMatch = useCallback((predLabel: string, targetSeal: SealType) => {
    if (!predLabel || predLabel === 'None') return false;
    const normPred = predLabel.trim().toUpperCase();
    const normTarget = targetSeal.trim().toUpperCase();

    if (normPred === normTarget) return true;

    // Synonyms e.g. Serpent <-> Snake, Hare <-> Rabbit
    if ((normPred === 'SERPENT' || normPred === 'SNAKE') && normTarget === 'SERPENT') return true;
    if ((normPred === 'HARE' || normPred === 'RABBIT') && normTarget === 'HARE') return true;

    return false;
  }, []);

  // Manual step advance for testing / keyboard / simulation
  const manualAdvanceStep = useCallback(() => {
    if (isCompletingRef.current) return;

    soundFx.playSealSound(currentStepIndex % 7);

    if (currentStepIndex === 0 && !isTimerRunning) {
      setIsTimerRunning(true);
    }

    if (currentStepIndex + 1 < selectedJutsu.sequence.length) {
      setCurrentStepIndex((prev) => prev + 1);
      setStepHoldMs(0);
    } else {
      // Completed last sign!
      isCompletingRef.current = true;
      setComboSuccessJutsu(selectedJutsu);
      setCompletedJutsus((prev) => new Set(prev).add(selectedJutsu.id));

      try {
        soundFx.playJutsuCastSound(selectedJutsu.soundType);
      } catch (err) {
        console.log('Audio playback prevented:', err);
      }

      if (onComboCompleteCallback) {
        onComboCompleteCallback(selectedJutsu);
      }

      setTimeout(() => {
        resetCombo();
      }, 2500);
    }
  }, [currentStepIndex, isTimerRunning, selectedJutsu, onComboCompleteCallback, resetCombo]);

  // Main real-time prediction and timer loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const now = performance.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      if (!isCompletingRef.current) {
        // 1. Timer countdown if active
        if (isTimerRunning) {
          setTimeLeftMs((prevTime) => {
            const nextTime = prevTime - delta;
            if (nextTime <= 0) {
              // Time's up! Reset sequence
              setCurrentStepIndex(0);
              setStepHoldMs(0);
              setIsTimerRunning(false);
              return COMBO_WINDOW_MS;
            }
            return nextTime;
          });
        }

        // 2. Gesture match verification for current step
        const targetSeal = selectedJutsu.sequence[currentStepIndex];
        const isMatch =
          currentPrediction &&
          currentPrediction.label &&
          checkLabelMatch(currentPrediction.label, targetSeal) &&
          currentPrediction.confidence >= 0.35;

        if (isMatch) {
          // Player is making the correct sign
          if (!isTimerRunning && currentStepIndex === 0) {
            setIsTimerRunning(true);
          }

          setStepHoldMs((prevHold) => {
            const nextHold = prevHold + delta;

            if (nextHold >= REQUIRED_STEP_HOLD_MS) {
              // Completed step!
              soundFx.playSealSound(currentStepIndex % 7);

              if (currentStepIndex + 1 < selectedJutsu.sequence.length) {
                // Advance to next sign index
                setCurrentStepIndex((prevIndex) => prevIndex + 1);
                return 0;
              } else {
                // All signs completed within time window!
                isCompletingRef.current = true;
                setComboSuccessJutsu(selectedJutsu);
                setCompletedJutsus((prev) => new Set(prev).add(selectedJutsu.id));

                try {
                  soundFx.playJutsuCastSound(selectedJutsu.soundType);
                } catch (err) {
                  console.log('Audio error:', err);
                }

                if (onComboCompleteCallback) {
                  onComboCompleteCallback(selectedJutsu);
                }

                setTimeout(() => {
                  resetCombo();
                }, 2500);

                return REQUIRED_STEP_HOLD_MS;
              }
            }

            return nextHold;
          });
        } else {
          // Mismatch or no hand detected: gradually decay step hold
          setStepHoldMs((prevHold) => Math.max(0, prevHold - delta * 2));
        }
      }

      animId = requestAnimationFrame(tick);
    };

    lastTickRef.current = performance.now();
    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [
    currentPrediction,
    selectedJutsu,
    currentStepIndex,
    isTimerRunning,
    checkLabelMatch,
    onComboCompleteCallback,
    resetCombo,
  ]);

  const stepHoldProgress = Math.min(
    100,
    Math.round((stepHoldMs / REQUIRED_STEP_HOLD_MS) * 100)
  );

  const timerProgress = Math.min(
    100,
    Math.round((timeLeftMs / COMBO_WINDOW_MS) * 100)
  );

  return {
    selectedJutsu,
    jutsusList: JUTSU_LIBRARY,
    currentStepIndex,
    stepHoldMs,
    stepHoldProgress,
    requiredStepHoldMs: REQUIRED_STEP_HOLD_MS,
    timeLeftMs,
    timerProgress,
    maxTimeMs: COMBO_WINDOW_MS,
    isTimerRunning,
    comboSuccessJutsu,
    completedJutsus,
    selectJutsu,
    resetCombo,
    manualAdvanceStep,
    dismissSuccessModal: () => setComboSuccessJutsu(null),
  };
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { GameStateManager, AttackEventPayload } from '@/lib/game/GameStateManager';
import { WebRTCNetworkManager } from '@/lib/webrtc/WebRTCNetworkManager';
import { SealType } from '@/types/shinobi';

export interface UseGameStateManagerOptions {
  networkManager?: WebRTCNetworkManager | null;
  onAttackTriggered?: (attackPayload: AttackEventPayload) => void;
  onSealRegistered?: (seal: SealType) => void;
}

export function useGameStateManager(options?: UseGameStateManagerOptions) {
  const [registeredSequence, setRegisteredSequence] = useState<SealType[]>([]);
  const [lastMatchedAttack, setLastMatchedAttack] = useState<AttackEventPayload | null>(null);
  const [windowQueue, setWindowQueue] = useState<string[]>([]);

  const gameStateManagerRef = useRef<GameStateManager | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize GameStateManager ONCE on mount
  useEffect(() => {
    const manager = new GameStateManager({
      windowSize: 5,
      onSealRegistered: (seal) => {
        setRegisteredSequence(manager.getRegisteredSequence());
        if (optionsRef.current?.onSealRegistered) {
          optionsRef.current.onSealRegistered(seal);
        }
      },
      onAttackMatched: (attackPayload) => {
        setLastMatchedAttack(attackPayload);
        setRegisteredSequence([]);
        if (optionsRef.current?.onAttackTriggered) {
          optionsRef.current.onAttackTriggered(attackPayload);
        }
      },
    });

    gameStateManagerRef.current = manager;

    return () => {
      gameStateManagerRef.current = null;
    };
  }, []);

  // Update NetworkManager reference if changed
  useEffect(() => {
    if (gameStateManagerRef.current && options?.networkManager) {
      gameStateManagerRef.current.setNetworkManager(options.networkManager);
    }
  }, [options?.networkManager]);

  const prevQueueStrRef = useRef<string>('');

  /**
   * Continuous stream handler for vision predictions
   */
  const processVisionFrame = useCallback((prediction: string, confidence: number = 0.95) => {
    if (gameStateManagerRef.current) {
      gameStateManagerRef.current.processVisionPrediction(prediction, confidence);
      
      // Only trigger React state update if windowQueue contents changed to avoid 60 FPS re-renders
      const currentQueue = gameStateManagerRef.current.getPredictionQueue();
      const currentQueueStr = currentQueue.join(',');
      if (currentQueueStr !== prevQueueStrRef.current) {
        prevQueueStrRef.current = currentQueueStr;
        setWindowQueue(currentQueue);
      }
    }
  }, []);

  /**
   * Manual seal add helper (for shortcut keys or UI clicks)
   */
  const registerManualSeal = useCallback((seal: SealType, confidence: number = 0.95) => {
    if (gameStateManagerRef.current) {
      gameStateManagerRef.current.registerSeal(seal, confidence);
      setRegisteredSequence(gameStateManagerRef.current.getRegisteredSequence());
    }
  }, []);

  const clearSequence = useCallback(() => {
    if (gameStateManagerRef.current) {
      gameStateManagerRef.current.clearSequence();
      setRegisteredSequence([]);
      setLastMatchedAttack(null);
      prevQueueStrRef.current = '';
      setWindowQueue([]);
    }
  }, []);

  return {
    registeredSequence,
    lastMatchedAttack,
    windowQueue,
    processVisionFrame,
    registerManualSeal,
    clearSequence,
    gameStateManager: gameStateManagerRef.current,
  };
}

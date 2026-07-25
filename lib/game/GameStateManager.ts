import { SealType } from '@/types/shinobi';
import { ELEMENTAL_ATTACK_DICTIONARY, matchElementalAttack, ElementalAttackDefinition } from './elementalAttacks';
import { WebRTCNetworkManager } from '../webrtc/WebRTCNetworkManager';

export interface AttackEventPayload {
  attackType: string;
  name: string;
  element: string;
  damage: number;
  sequence: SealType[];
  timestamp: number;
  senderId?: string;
}

export interface GameStateManagerOptions {
  windowSize?: number;
  networkManager?: WebRTCNetworkManager;
  onSealRegistered?: (seal: SealType, confidence: number) => void;
  onAttackMatched?: (attackPayload: AttackEventPayload) => void;
}

/**
 * Core Game State Manager
 * Processes vision model prediction streams, filters noise via a 5-frame sliding window mode queue,
 * evaluates valid seal sequences against the elemental attack dictionary,
 * and dispatches attack events over WebRTC DataChannel.
 */
export class GameStateManager {
  private windowSize: number = 5;
  private predictionQueue: string[] = [];
  private lastRegisteredSign: SealType | null = null;
  private registeredSequence: SealType[] = [];
  
  private networkManager?: WebRTCNetworkManager;
  private onSealRegisteredCallback?: (seal: SealType, confidence: number) => void;
  private onAttackMatchedCallback?: (attackPayload: AttackEventPayload) => void;

  constructor(options?: GameStateManagerOptions) {
    if (options?.windowSize) {
      this.windowSize = options.windowSize;
    }
    this.networkManager = options?.networkManager;
    this.onSealRegisteredCallback = options?.onSealRegistered;
    this.onAttackMatchedCallback = options?.onAttackMatched;
  }

  public setNetworkManager(networkManager: WebRTCNetworkManager): void {
    this.networkManager = networkManager;
  }

  public getRegisteredSequence(): SealType[] {
    return [...this.registeredSequence];
  }

  public getPredictionQueue(): string[] {
    return [...this.predictionQueue];
  }

  /**
   * Process continuous stream of string predictions from vision model
   * Uses sliding window queue algorithm to extract 5-frame majority mode.
   */
  public processVisionPrediction(rawPrediction: string, confidence: number = 0.95): void {
    if (!rawPrediction) return;

    const normalizedPrediction = rawPrediction.toUpperCase().trim();

    // Push into sliding window queue
    this.predictionQueue.push(normalizedPrediction);
    if (this.predictionQueue.length > this.windowSize) {
      this.predictionQueue.shift();
    }

    // Only calculate mode if sliding window is full (5 frames)
    if (this.predictionQueue.length === this.windowSize) {
      const modeResult = this.calculateMode(this.predictionQueue);

      // Require majority (mode >= 3 out of 5 frames) and valid seal type
      if (modeResult && modeResult.count >= Math.ceil(this.windowSize / 2)) {
        const modeSign = modeResult.sign as SealType;

        // Verify valid seal sign (not 'NONE', 'UNKNOWN', 'BACKGROUND')
        if (this.isValidSealType(modeSign)) {
          // De-noising: Only register if sign changed from last registered sign
          if (modeSign !== this.lastRegisteredSign) {
            this.registerSeal(modeSign, confidence);
          }
        } else {
          // Reset last registered sign if user goes back to neutral/none position
          this.lastRegisteredSign = null;
        }
      }
    }
  }

  /**
   * Calculates the mode (majority element) within the sliding window queue.
   */
  private calculateMode(queue: string[]): { sign: string; count: number } | null {
    if (queue.length === 0) return null;

    const counts: Record<string, number> = {};
    let maxCount = 0;
    let modeSign = '';

    for (const item of queue) {
      counts[item] = (counts[item] || 0) + 1;
      if (counts[item] > maxCount) {
        maxCount = counts[item];
        modeSign = item;
      }
    }

    return { sign: modeSign, count: maxCount };
  }

  private isValidSealType(sign: string): boolean {
    const validTypes: SealType[] = [
      'TIGER', 'BIRD', 'BOAR', 'DRAGON', 'RAM', 'SERPENT',
      'MONKEY', 'OX', 'DOG', 'HORSE', 'HARE', 'RAT'
    ];
    return validTypes.includes(sign as SealType);
  }

  /**
   * Registers a confirmed, noise-filtered hand sign into the sequence.
   */
  public registerSeal(seal: SealType, confidence: number = 0.95): void {
    this.lastRegisteredSign = seal;
    this.registeredSequence.push(seal);

    // Keep sequence length capped at 10
    if (this.registeredSequence.length > 10) {
      this.registeredSequence.shift();
    }

    console.log(`[GameStateManager] Registered Sign: ${seal} (Sequence: [${this.registeredSequence.join(', ')}])`);

    if (this.onSealRegisteredCallback) {
      this.onSealRegisteredCallback(seal, confidence);
    }

    // Evaluate sequence against elemental attacks
    this.evaluateAttackSequence();
  }

  /**
   * Evaluates registered sign sequence against predefined elemental attack dictionary.
   */
  private evaluateAttackSequence(): void {
    const matchedAttack = matchElementalAttack(this.registeredSequence);

    if (matchedAttack) {
      const timestamp = Date.now();
      const attackPayload: AttackEventPayload = {
        attackType: matchedAttack.attackType,
        name: matchedAttack.name,
        element: matchedAttack.element,
        damage: matchedAttack.damage,
        sequence: [...matchedAttack.sequence],
        timestamp,
      };

      console.log(`[GameStateManager] ⚡ ELEMENTAL ATTACK MATCHED: ${matchedAttack.name} (${matchedAttack.attackType})`);

      // Dispatch event through WebRTC Data Channel to opponent
      if (this.networkManager) {
        const dispatched = this.networkManager.sendEvent('ATTACK_DISPATCH', attackPayload);
        if (dispatched) {
          console.log('[GameStateManager] Attack event dispatched over WebRTC Data Channel to opponent.');
        } else {
          console.warn('[GameStateManager] WebRTC Data Channel offline. Attack retained locally.');
        }
      }

      if (this.onAttackMatchedCallback) {
        this.onAttackMatchedCallback(attackPayload);
      }

      // Clear sequence upon successful attack match
      this.clearSequence();
    }
  }

  public clearSequence(): void {
    this.registeredSequence = [];
    this.lastRegisteredSign = null;
    this.predictionQueue = [];
  }
}

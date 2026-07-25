import { useState, useCallback, useRef, useEffect } from 'react';
import { PlayerState, Jutsu } from '@/types/shinobi';
import { soundFx } from '@/components/audio/SoundEffects';

export interface BattleLog {
  id: string;
  sender: string;
  message: string;
  type: 'JUTSU' | 'DAMAGE' | 'CHAKRA' | 'SYSTEM';
  timestamp: string;
}

const INITIAL_P1: PlayerState = {
  id: 'p1',
  name: 'Uzushio Shinobi',
  title: 'Hokage Candidate',
  village: 'Konohagakure',
  avatarUrl: '/images/p1-avatar.png',
  hp: 100,
  maxHp: 100,
  chakra: 100,
  maxChakra: 100,
  isChargingChakra: false,
  score: 0,
  wins: 0,
  activeStatus: 'IDLE',
  lastCastJutsu: null,
};

const INITIAL_P2: PlayerState = {
  id: 'p2',
  name: 'Rival Shinobi',
  title: 'Shadow Assassin',
  village: 'Akatsuki',
  avatarUrl: '/images/p2-avatar.png',
  hp: 100,
  maxHp: 100,
  chakra: 100,
  maxChakra: 100,
  isChargingChakra: false,
  score: 0,
  wins: 0,
  activeStatus: 'IDLE',
  lastCastJutsu: null,
};

export function useBattleState() {
  const [player1, setPlayer1] = useState<PlayerState>(INITIAL_P1);
  const [player2, setPlayer2] = useState<PlayerState>(INITIAL_P2);
  const [battleStatus, setBattleStatus] = useState<'PREPARE' | 'FIGHTING' | 'ENDED'>('FIGHTING');
  const [winner, setWinner] = useState<string | null>(null);
  const [logs, setLogs] = useState<BattleLog[]>([
    {
      id: 'init-1',
      sender: 'System',
      message: 'Battle initialized. Weave hand signs to cast Ninjutsu!',
      type: 'SYSTEM',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
  ]);

  const player1Ref = useRef(player1);
  const player2Ref = useRef(player2);
  const battleStatusRef = useRef(battleStatus);

  useEffect(() => { player1Ref.current = player1; }, [player1]);
  useEffect(() => { player2Ref.current = player2; }, [player2]);
  useEffect(() => { battleStatusRef.current = battleStatus; }, [battleStatus]);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const registerTimeout = (timer: NodeJS.Timeout) => {
    timeoutsRef.current.push(timer);
    return timer;
  };

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  const addLog = useCallback((sender: string, message: string, type: BattleLog['type']) => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        sender,
        message,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  /**
   * Casts a Jutsu asynchronously, resolving a Promise once the full animation and hit cycle completes (1400ms).
   * Perfect for sequential execution of rapid-fire attack payloads over DataChannel.
   */
  const castJutsuAsync = useCallback(
    (casterId: 'p1' | 'p2', jutsu: Jutsu): Promise<boolean> => {
      return new Promise((resolve) => {
        if (battleStatusRef.current === 'ENDED') {
          resolve(false);
          return;
        }

        const caster = casterId === 'p1' ? player1Ref.current : player2Ref.current;
        const setCaster = casterId === 'p1' ? setPlayer1 : setPlayer2;
        const setTarget = casterId === 'p1' ? setPlayer2 : setPlayer1;

        // Check Chakra cost
        if (caster.chakra < jutsu.chakraCost) {
          addLog(caster.name, `Insufficient Chakra to cast ${jutsu.name}! Needs ${jutsu.chakraCost} Chakra.`, 'CHAKRA');
          resolve(false);
          return;
        }

        soundFx.playJutsuCast(jutsu.element);

        // Deduct Chakra from Caster & set status to CASTING
        setCaster((prev) => ({
          ...prev,
          chakra: Math.max(0, prev.chakra - jutsu.chakraCost),
          activeStatus: 'CASTING',
          lastCastJutsu: jutsu,
        }));

        addLog(caster.name, `Weaved seals for [${jutsu.name}] (${jutsu.japaneseName}) dealing ${jutsu.damage} DMG!`, 'JUTSU');

        // Target takes damage after slight delay for visual impact
        const hitTimer = setTimeout(() => {
          soundFx.playHit();
          setTarget((prev) => {
            const newHp = Math.max(0, prev.hp - jutsu.damage);
            const isDefeated = newHp === 0;

            if (isDefeated) {
              setBattleStatus('ENDED');
              setWinner(caster.name);
              setCaster((c) => ({ ...c, score: c.score + 100, wins: c.wins + 1, activeStatus: 'IDLE' }));
              addLog('ANNOUNCER', `K.O.! ${caster.name} wins the match with ${jutsu.name}!`, 'SYSTEM');
              return { ...prev, hp: 0, activeStatus: 'DEFEATED' };
            }

            return { ...prev, hp: newHp, activeStatus: 'HIT' };
          });

          // Reset hit animation status after 1000ms
          const resetTimer = setTimeout(() => {
            setCaster((prev) => ({ ...prev, activeStatus: 'IDLE' }));
            setTarget((prev) => (prev.activeStatus === 'DEFEATED' ? prev : { ...prev, activeStatus: 'IDLE' }));
            resolve(true);
          }, 1000);

          registerTimeout(resetTimer);
        }, 400);

        registerTimeout(hitTimer);
      });
    },
    [addLog]
  );

  // Synchronous wrapper around castJutsuAsync for backward compatibility
  const castJutsu = useCallback(
    (casterId: 'p1' | 'p2', jutsu: Jutsu) => {
      castJutsuAsync(casterId, jutsu);
      return true;
    },
    [castJutsuAsync]
  );

  // Charge Chakra for a player
  const chargeChakra = useCallback((playerId: 'p1' | 'p2') => {
    soundFx.playChakraSurge();
    const setPlayer = playerId === 'p1' ? setPlayer1 : setPlayer2;

    setPlayer((prev) => {
      const newChakra = Math.min(prev.maxChakra, prev.chakra + 25);
      return {
        ...prev,
        chakra: newChakra,
        isChargingChakra: true,
      };
    });

    const timer = setTimeout(() => {
      setPlayer((prev) => ({ ...prev, isChargingChakra: false }));
    }, 600);

    registerTimeout(timer);
  }, []);

  // Heal player
  const healPlayer = useCallback((playerId: 'p1' | 'p2', amount: number = 20) => {
    const setPlayer = playerId === 'p1' ? setPlayer1 : setPlayer2;
    setPlayer((prev) => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + amount),
    }));
  }, []);

  // Reset Battle
  const resetBattle = useCallback(() => {
    clearAllTimeouts();
    setPlayer1((prev) => ({ ...INITIAL_P1, wins: prev.wins, score: prev.score }));
    setPlayer2((prev) => ({ ...INITIAL_P2, wins: prev.wins, score: prev.score }));
    setBattleStatus('FIGHTING');
    setWinner(null);
    addLog('System', 'New battle started! Concentrate your Chakra!', 'SYSTEM');
  }, [addLog, clearAllTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return {
    player1,
    player2,
    battleStatus,
    winner,
    logs,
    castJutsu,
    castJutsuAsync,
    chargeChakra,
    healPlayer,
    resetBattle,
    setPlayer1,
    setPlayer2,
  };
}

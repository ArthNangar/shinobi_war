export type SealType = 
  | 'TIGER' 
  | 'BIRD' 
  | 'BOAR' 
  | 'DRAGON' 
  | 'RAM' 
  | 'SERPENT' 
  | 'MONKEY' 
  | 'OX' 
  | 'DOG' 
  | 'HORSE' 
  | 'HARE' 
  | 'RAT';

export type ElementalAffinity = 'Fire' | 'Water' | 'Lightning' | 'Wind' | 'Earth' | 'Secret';

export interface HandSealInfo {
  type: SealType;
  name: string;
  kanji: string;
  symbol: string;
  color: string;
  glowClass: string;
  keyShortcut: string;
}

export interface Jutsu {
  id: string;
  name: string;
  japaneseName: string;
  element: ElementalAffinity;
  sequence: SealType[];
  damage: number;
  chakraCost: number;
  description: string;
  icon: string;
  color: string;
  soundType: 'fire' | 'lightning' | 'water' | 'wind' | 'earth' | 'clone';
}

export interface PlayerState {
  id: string;
  name: string;
  title: string;
  village: string;
  avatarUrl: string;
  hp: number;
  maxHp: number;
  chakra: number;
  maxChakra: number;
  isChargingChakra: boolean;
  score: number;
  wins: number;
  activeStatus: 'IDLE' | 'CASTING' | 'ATTACKING' | 'HIT' | 'DEFENDING' | 'DEFEATED';
  lastCastJutsu?: Jutsu | null;
}

export interface SequenceItem {
  id: string;
  type: SealType;
  timestamp: number;
  accuracy: number; // 0 to 1 confidence
}

export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface HandLandmarkFrame {
  landmarks: HandLandmark[];
  gestureDetected?: SealType | null;
  confidence: number;
  handType: 'Left' | 'Right' | 'Both';
}

export interface WebRTCMessage {
  type: 'SYNC_STATE' | 'SEAL_DETECTED' | 'CAST_JUTSU' | 'DAMAGE_TAKED' | 'EMOTE';
  payload: any;
  senderId: string;
  timestamp: number;
}

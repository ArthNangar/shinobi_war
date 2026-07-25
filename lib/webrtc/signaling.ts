import { FirebaseSignalingClient } from '../firebase/firebaseConfig';

export interface SignalingOffer {
  type: 'offer';
  sdp: string;
  senderId: string;
  timestamp: number;
}

export interface SignalingAnswer {
  type: 'answer';
  sdp: string;
  senderId: string;
  timestamp: number;
}

export interface SignalingCandidate {
  candidate: RTCIceCandidateInit;
  senderId: string;
  timestamp: number;
}

/**
 * Firebase Realtime Database WebRTC Signaling Service
 * Manages exchange of SDP offers/answers and ICE candidates.
 * Allows closing signaling listeners once WebRTC Data Channel is connected,
 * and reopening them if connection recovery is needed.
 */
export class FirebaseSignalingService {
  private client: FirebaseSignalingClient;
  private currentRoomId: string | null = null;
  private unsubscribeFns: Array<() => void> = [];
  private isListenersClosed: boolean = false;

  constructor(databaseUrl?: string) {
    this.client = new FirebaseSignalingClient(databaseUrl);
  }

  /**
   * Reopens signaling listeners if closed (used during connection recovery / reconnection loop)
   */
  public reopenListeners(): void {
    if (this.isListenersClosed) {
      console.log('[Signaling] Reopening Firebase signaling listeners for connection recovery...');
      this.isListenersClosed = false;
      this.client.reopen();
    }
  }

  // Publish SDP Offer to rooms/{roomId}/offer
  async sendOffer(roomId: string, offer: RTCSessionDescriptionInit, senderId: string): Promise<void> {
    this.currentRoomId = roomId;
    const offerPayload: SignalingOffer = {
      type: 'offer',
      sdp: offer.sdp || '',
      senderId,
      timestamp: Date.now(),
    };
    await this.client.set(`rooms/${roomId}/offer`, offerPayload);
    console.log(`[Signaling] SDP Offer sent to room ${roomId}`);
  }

  // Publish SDP Answer to rooms/{roomId}/answer
  async sendAnswer(roomId: string, answer: RTCSessionDescriptionInit, senderId: string): Promise<void> {
    this.currentRoomId = roomId;
    const answerPayload: SignalingAnswer = {
      type: 'answer',
      sdp: answer.sdp || '',
      senderId,
      timestamp: Date.now(),
    };
    await this.client.set(`rooms/${roomId}/answer`, answerPayload);
    console.log(`[Signaling] SDP Answer sent to room ${roomId}`);
  }

  // Publish ICE Candidate to rooms/{roomId}/callerCandidates or calleeCandidates
  async sendIceCandidate(
    roomId: string,
    candidate: RTCIceCandidate,
    isCaller: boolean,
    senderId: string
  ): Promise<void> {
    const candidatePath = isCaller
      ? `rooms/${roomId}/callerCandidates`
      : `rooms/${roomId}/calleeCandidates`;

    const candidatePayload: SignalingCandidate = {
      candidate: candidate.toJSON(),
      senderId,
      timestamp: Date.now(),
    };

    await this.client.push(candidatePath, candidatePayload);
  }

  // Listen for SDP Offer at rooms/{roomId}/offer
  onOffer(roomId: string, onOfferReceived: (offer: SignalingOffer) => void): void {
    this.reopenListeners();
    this.currentRoomId = roomId;
    const path = `rooms/${roomId}/offer`;

    const unsubscribe = this.client.onValue(path, (data) => {
      if (data && data.type === 'offer' && data.sdp) {
        onOfferReceived(data as SignalingOffer);
      }
    });

    this.unsubscribeFns.push(unsubscribe);
  }

  // Listen for SDP Answer at rooms/{roomId}/answer
  onAnswer(roomId: string, onAnswerReceived: (answer: SignalingAnswer) => void): void {
    this.reopenListeners();
    this.currentRoomId = roomId;
    const path = `rooms/${roomId}/answer`;

    const unsubscribe = this.client.onValue(path, (data) => {
      if (data && data.type === 'answer' && data.sdp) {
        onAnswerReceived(data as SignalingAnswer);
      }
    });

    this.unsubscribeFns.push(unsubscribe);
  }

  // Listen for remote ICE candidates
  onIceCandidates(
    roomId: string,
    listenForCallerCandidates: boolean,
    onCandidateReceived: (candidate: RTCIceCandidateInit) => void
  ): void {
    this.reopenListeners();
    this.currentRoomId = roomId;
    const path = listenForCallerCandidates
      ? `rooms/${roomId}/callerCandidates`
      : `rooms/${roomId}/calleeCandidates`;

    const processedKeys = new Set<string>();

    const unsubscribe = this.client.onValue(path, (data) => {
      if (!data) return;

      const entries = typeof data === 'object' ? Object.entries(data) : [];
      for (const [key, value] of entries) {
        if (!processedKeys.has(key) && value && (value as any).candidate) {
          processedKeys.add(key);
          onCandidateReceived((value as any).candidate);
        }
      }
    });

    this.unsubscribeFns.push(unsubscribe);
  }

  /**
   * Transition all communication to WebRTC Data Channel and close Firebase listener
   */
  closeListeners(): void {
    if (this.isListenersClosed) return;

    console.log('[Signaling] WebRTC Data Channel connected. Closing Firebase Realtime Database signaling listeners...');
    
    this.unsubscribeFns.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        console.warn('[Signaling] Error during unsubscribe:', e);
      }
    });
    this.unsubscribeFns = [];

    this.client.closeAll();
    this.isListenersClosed = true;

    if (this.currentRoomId) {
      console.log(`[Signaling] Firebase signaling listeners for room '${this.currentRoomId}' closed successfully.`);
    }
  }

  clearRoom(roomId: string): void {
    this.client.clearRoom(roomId);
  }

  reset(): void {
    this.closeListeners();
    this.isListenersClosed = false;
    this.client.reopen();
    this.currentRoomId = null;
  }
}


import { FirebaseSignalingService, SignalingOffer, SignalingAnswer } from './signaling';

export type NetworkConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'FAILED';

export interface NetworkMessage<T = any> {
  type: 'ATTACK_DISPATCH' | 'SEAL_REGISTERED' | 'STATE_SYNC' | 'PING' | 'PONG' | 'EMOTE';
  payload: T;
  senderId: string;
  timestamp: number;
}

export interface NetworkManagerOptions {
  iceServers?: RTCIceServer[];
  databaseUrl?: string;
  onMessage?: (msg: NetworkMessage) => void;
  onStatusChange?: (status: NetworkConnectionStatus) => void;
  onLatencyUpdate?: (latencyMs: number) => void;
}

/**
 * WebRTC Peer Connection & DataChannel Manager
 * Uses Firebase RTDB for SDP/ICE exchange during handshake.
 * Closes Firebase listeners upon DataChannel connection and reopens them on demand for reconnection loops.
 */
export class WebRTCNetworkManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private signaling: FirebaseSignalingService;

  private localPeerId: string;
  private currentRoomId: string | null = null;
  private isHost: boolean = false;
  private status: NetworkConnectionStatus = 'DISCONNECTED';
  private latencyMs: number = 0;
  private pingIntervalId: NodeJS.Timeout | null = null;

  // Reconnection Loop properties
  private isReconnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private outgoingBuffer: NetworkMessage[] = [];

  private onMessageCallback?: (msg: NetworkMessage) => void;
  private onStatusChangeCallback?: (status: NetworkConnectionStatus) => void;
  private onLatencyUpdateCallback?: (latencyMs: number) => void;

  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  constructor(options?: NetworkManagerOptions) {
    this.localPeerId = `shinobi-${Math.random().toString(36).substring(2, 8)}`;
    this.signaling = new FirebaseSignalingService(options?.databaseUrl);

    if (options?.iceServers) {
      this.rtcConfig.iceServers = options.iceServers;
    }

    this.onMessageCallback = options?.onMessage;
    this.onStatusChangeCallback = options?.onStatusChange;
    this.onLatencyUpdateCallback = options?.onLatencyUpdate;
  }

  public getPeerId(): string {
    return this.localPeerId;
  }

  public getRoomId(): string | null {
    return this.currentRoomId;
  }

  public getStatus(): NetworkConnectionStatus {
    return this.status;
  }

  public getLatency(): number {
    return this.latencyMs;
  }

  private setStatus(newStatus: NetworkConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      console.log(`[WebRTC Network] Connection Status: ${newStatus}`);
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(newStatus);
      }
    }
  }

  /**
   * Host / Create Room: Initiates WebRTC Offer & DataChannel creation
   */
  public async createRoom(roomId: string): Promise<void> {
    this.currentRoomId = roomId;
    this.isHost = true;
    this.setStatus('CONNECTING');
    this.signaling.reset();

    this.initPeerConnection();

    if (!this.peerConnection) return;

    // Create DataChannel as host
    this.dataChannel = this.peerConnection.createDataChannel('shinobi-game-channel', {
      ordered: true,
    });
    this.bindDataChannelEvents(this.dataChannel);

    // Create & Send SDP Offer via Firebase RTDB
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      await this.signaling.sendOffer(roomId, offer, this.localPeerId);

      // Listen for SDP Answer from joiner
      this.signaling.onAnswer(roomId, async (answerPayload: SignalingAnswer) => {
        if (answerPayload.senderId === this.localPeerId) return;
        if (this.peerConnection?.signalingState !== 'stable') {
          const remoteDesc = new RTCSessionDescription({
            type: 'answer',
            sdp: answerPayload.sdp,
          });
          await this.peerConnection?.setRemoteDescription(remoteDesc);
          console.log('[WebRTC Network] Remote answer set successfully.');
        }
      });

      // Listen for remote ICE candidates from joiner
      this.signaling.onIceCandidates(roomId, false, async (candidateInit) => {
        try {
          if (this.peerConnection && candidateInit) {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidateInit));
          }
        } catch (e) {
          console.warn('[WebRTC Network] Error adding caller ICE candidate:', e);
        }
      });
    } catch (err) {
      console.error('[WebRTC Network] Error creating offer:', err);
      this.handleConnectionLoss();
    }
  }

  /**
   * Join Room: Receives WebRTC Offer & sends Answer
   */
  public async joinRoom(roomId: string): Promise<void> {
    this.currentRoomId = roomId;
    this.isHost = false;
    this.setStatus('CONNECTING');
    this.signaling.reset();

    this.initPeerConnection();

    if (!this.peerConnection) return;

    // Listen for incoming DataChannel
    this.peerConnection.ondatachannel = (event) => {
      console.log('[WebRTC Network] DataChannel received by joiner.');
      this.dataChannel = event.channel;
      this.bindDataChannelEvents(this.dataChannel);
    };

    // Listen for SDP Offer from host
    this.signaling.onOffer(roomId, async (offerPayload: SignalingOffer) => {
      if (offerPayload.senderId === this.localPeerId) return;
      if (!this.peerConnection) return;

      try {
        const remoteDesc = new RTCSessionDescription({
          type: 'offer',
          sdp: offerPayload.sdp,
        });
        await this.peerConnection.setRemoteDescription(remoteDesc);

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        await this.signaling.sendAnswer(roomId, answer, this.localPeerId);

        // Listen for remote ICE candidates from host
        this.signaling.onIceCandidates(roomId, true, async (candidateInit) => {
          try {
            if (this.peerConnection && candidateInit) {
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidateInit));
            }
          } catch (e) {
            console.warn('[WebRTC Network] Error adding callee ICE candidate:', e);
          }
        });
      } catch (err) {
        console.error('[WebRTC Network] Error joining room:', err);
        this.handleConnectionLoss();
      }
    });
  }

  private initPeerConnection(): void {
    this.closePeerConnection();

    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    // ICE candidate gathering
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentRoomId) {
        this.signaling.sendIceCandidate(
          this.currentRoomId,
          event.candidate,
          this.isHost,
          this.localPeerId
        );
      }
    };

    // Connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const connState = this.peerConnection?.connectionState;
      console.log(`[WebRTC Network] RTCPeerConnection State: ${connState}`);

      if (connState === 'connected') {
        this.onEstablishedConnection();
      } else if (connState === 'disconnected') {
        console.warn('[WebRTC Network] Peer Connection temporarily DISCONNECTED. Attempting ICE recovery...');
        this.setStatus('RECONNECTING');
      } else if (connState === 'failed' || connState === 'closed') {
        console.error('[WebRTC Network] Peer Connection FAILED or CLOSED.');
        this.handleConnectionLoss();
      }
    };
  }

  private bindDataChannelEvents(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('[WebRTC Network] RTCDataChannel is OPEN!');
      this.onEstablishedConnection();
    };

    channel.onclose = () => {
      console.log('[WebRTC Network] RTCDataChannel CLOSED.');
      this.stopPingInterval();
      if (this.status === 'CONNECTED') {
        this.handleConnectionLoss();
      }
    };

    channel.onerror = (err) => {
      console.error('[WebRTC Network] RTCDataChannel Error:', err);
    };

    channel.onmessage = (event) => {
      try {
        const msg: NetworkMessage = JSON.parse(event.data);

        // Handle internal ping/pong for latency measurement
        if (msg.type === 'PING') {
          this.sendEvent('PONG', { pingTimestamp: msg.timestamp });
          return;
        }

        if (msg.type === 'PONG') {
          const roundTrip = Date.now() - (msg.payload?.pingTimestamp || Date.now());
          this.latencyMs = Math.round(roundTrip / 2);
          if (this.onLatencyUpdateCallback) {
            this.onLatencyUpdateCallback(this.latencyMs);
          }
          return;
        }

        // Delegate application message
        if (this.onMessageCallback) {
          this.onMessageCallback(msg);
        }
      } catch (err) {
        console.warn('[WebRTC Network] Failed to parse DataChannel message:', event.data);
      }
    };
  }

  /**
   * Called when connection is established over DataChannel.
   * Closes Firebase RTDB signaling listeners to transition 100% to WebRTC Data Channel.
   * Flushes any buffered outgoing messages.
   */
  private onEstablishedConnection(): void {
    if (this.status !== 'CONNECTED') {
      this.setStatus('CONNECTED');
      this.isReconnecting = false;
      this.reconnectAttempts = 0;

      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }

      // CLOSE Firebase Realtime Database signaling listeners
      this.signaling.closeListeners();

      // Start ping loop for low-latency feedback
      this.startPingInterval();

      // Flush buffered messages
      this.flushOutgoingBuffer();
    }
  }

  /**
   * Triggers Exponential Backoff Reconnection Loop for Firebase signaling & WebRTC re-handshake
   */
  private handleConnectionLoss(): void {
    if (this.status === 'DISCONNECTED') return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[WebRTC Network] Reconnection failed after ${this.maxReconnectAttempts} attempts.`);
      this.setStatus('FAILED');
      this.isReconnecting = false;
      return;
    }

    this.isReconnecting = true;
    this.setStatus('RECONNECTING');
    this.reconnectAttempts++;

    // Calculate exponential backoff delay (1s, 2s, 4s, 8s, 16s)
    const delayMs = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 16000);
    console.log(`[WebRTC Network] Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delayMs}ms...`);

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    this.reconnectTimeoutId = setTimeout(async () => {
      if (!this.currentRoomId) return;

      console.log(`[WebRTC Network] Executing reconnection loop (Attempt ${this.reconnectAttempts})...`);
      this.signaling.reopenListeners();

      if (this.isHost) {
        await this.createRoom(this.currentRoomId);
      } else {
        await this.joinRoom(this.currentRoomId);
      }
    }, delayMs);
  }

  /**
   * Dispatch an event through WebRTC DataChannel to opponent
   */
  public sendEvent<T = any>(type: NetworkMessage['type'], payload: T): boolean {
    const msg: NetworkMessage<T> = {
      type,
      payload,
      senderId: this.localPeerId,
      timestamp: Date.now(),
    };

    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify(msg));
        return true;
      } catch (e) {
        console.error('[WebRTC Network] Error sending event over DataChannel:', e);
        this.outgoingBuffer.push(msg);
        return false;
      }
    } else {
      console.warn('[WebRTC Network] DataChannel is not open. Buffering event for recovery.');
      this.outgoingBuffer.push(msg);
      return false;
    }
  }

  private flushOutgoingBuffer(): void {
    if (this.outgoingBuffer.length > 0 && this.dataChannel?.readyState === 'open') {
      console.log(`[WebRTC Network] Flushing ${this.outgoingBuffer.length} buffered messages...`);
      while (this.outgoingBuffer.length > 0) {
        const msg = this.outgoingBuffer.shift();
        if (msg) {
          try {
            this.dataChannel.send(JSON.stringify(msg));
          } catch (_) {}
        }
      }
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingIntervalId = setInterval(() => {
      this.sendEvent('PING', {});
    }, 3000);
  }

  private stopPingInterval(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private closePeerConnection(): void {
    this.stopPingInterval();

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  public disconnect(): void {
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.outgoingBuffer = [];
    this.signaling.closeListeners();
    this.closePeerConnection();
    this.setStatus('DISCONNECTED');
    this.currentRoomId = null;
    console.log('[WebRTC Network] Network Manager disconnected and reset.');
  }
}

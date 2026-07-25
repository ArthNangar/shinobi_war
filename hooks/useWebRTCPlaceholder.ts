import { useState, useCallback } from 'react';
import { WebRTCMessage } from '@/types/shinobi';

export function useWebRTCPlaceholder() {
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(24);

  const connectRoom = useCallback((targetRoom: string) => {
    setConnectionStatus('CONNECTING');
    setRoomId(targetRoom);

    // Simulate WebRTC Peer handshake
    setTimeout(() => {
      setPeerId(`shinobi-peer-${Math.random().toString(36).substring(2, 7)}`);
      setConnectionStatus('CONNECTED');
    }, 1200);
  }, []);

  const disconnectRoom = useCallback(() => {
    setConnectionStatus('DISCONNECTED');
    setRoomId(null);
    setPeerId(null);
  }, []);

  const sendPeerMessage = useCallback((msg: WebRTCMessage) => {
    // WebRTC DataChannel send placeholder
    console.log('[WebRTC Send]:', msg);
  }, []);

  return {
    connectionStatus,
    roomId,
    peerId,
    latencyMs,
    connectRoom,
    disconnectRoom,
    sendPeerMessage,
  };
}

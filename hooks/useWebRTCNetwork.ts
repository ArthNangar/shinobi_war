import { useState, useEffect, useRef, useCallback } from 'react';
import {
  WebRTCNetworkManager,
  NetworkConnectionStatus,
  NetworkMessage,
} from '@/lib/webrtc/WebRTCNetworkManager';

export function useWebRTCNetwork(onIncomingMessage?: (msg: NetworkMessage) => void) {
  const [connectionStatus, setConnectionStatus] = useState<NetworkConnectionStatus>('DISCONNECTED');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number>(0);

  const networkManagerRef = useRef<WebRTCNetworkManager | null>(null);
  const onIncomingMessageRef = useRef(onIncomingMessage);

  useEffect(() => {
    onIncomingMessageRef.current = onIncomingMessage;
  }, [onIncomingMessage]);

  useEffect(() => {
    const manager = new WebRTCNetworkManager({
      onMessage: (msg) => {
        if (onIncomingMessageRef.current) onIncomingMessageRef.current(msg);
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
      onLatencyUpdate: (latency) => {
        setLatencyMs(latency);
      },
    });

    networkManagerRef.current = manager;
    setPeerId(manager.getPeerId());

    return () => {
      manager.disconnect();
    };
  }, []);

  const createRoom = useCallback(async (targetRoom: string) => {
    if (networkManagerRef.current) {
      setRoomId(targetRoom);
      await networkManagerRef.current.createRoom(targetRoom);
    }
  }, []);

  const joinRoom = useCallback(async (targetRoom: string) => {
    if (networkManagerRef.current) {
      setRoomId(targetRoom);
      await networkManagerRef.current.joinRoom(targetRoom);
    }
  }, []);

  const disconnectRoom = useCallback(async () => {
    if (networkManagerRef.current) {
      await networkManagerRef.current.disconnect();
      setRoomId(null);
      setConnectionStatus('DISCONNECTED');
    }
  }, []);

  const sendPeerEvent = useCallback((type: NetworkMessage['type'], payload: any) => {
    if (networkManagerRef.current) {
      return networkManagerRef.current.sendEvent(type, payload);
    }
    return false;
  }, []);

  return {
    connectionStatus,
    roomId,
    peerId,
    latencyMs,
    createRoom,
    joinRoom,
    disconnectRoom,
    sendPeerEvent,
    networkManager: networkManagerRef.current,
  };
}

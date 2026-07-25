// Firebase Realtime Database Configuration & Helper

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

// Environment config getter
export function getFirebaseConfig(): FirebaseConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'shinobi-seals.firebaseapp.com',
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://shinobi-seals-default-rtdb.firebaseio.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'shinobi-seals',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'shinobi-seals.appspot.com',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abc123def456',
  };
}

export interface ExponentialBackoffOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

/**
 * Lightweight Firebase Realtime Database REST/WebSocket client
 * Provides node writing, reading, and listening capabilities for WebRTC signaling.
 * Includes exponential backoff and connection retry loops.
 */
export class FirebaseSignalingClient {
  private databaseUrl: string;
  private activeEventSources: Map<string, EventSource> = new Map();
  private pollIntervals: Map<string, NodeJS.Timeout> = new Map();
  private localListeners: Map<string, Set<(data: any) => void>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private isClosed: boolean = false;

  constructor(databaseUrl?: string) {
    const config = getFirebaseConfig();
    this.databaseUrl = (databaseUrl || config.databaseURL || '').replace(/\/$/, '');

    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('shinobi_seals_local_signaling');
        this.broadcastChannel.onmessage = (event) => {
          if (this.isClosed) return;
          const { path, data } = event.data || {};
          if (path) {
            this.notifyLocalListeners(path, data);
          }
        };

        window.addEventListener('storage', (e) => {
          if (this.isClosed || !e.key || !e.key.startsWith('shinobi_sig_')) return;
          const path = e.key.replace('shinobi_sig_', '');
          try {
            const data = e.newValue ? JSON.parse(e.newValue) : null;
            this.notifyLocalListeners(path, data);
          } catch (_) {}
        });
      } catch (err) {
        console.warn('[Signaling] BroadcastChannel initialization skipped:', err);
      }
    }
  }

  private notifyLocalListeners(path: string, data: any) {
    const normalized = path.replace(/^\//, '');
    const listeners = this.localListeners.get(normalized);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(data);
        } catch (_) {}
      });
    }
  }

  /**
   * Helper function for executing network requests with Exponential Backoff
   */
  private async fetchWithBackoff(
    url: string,
    options: RequestInit,
    backoffOpts?: ExponentialBackoffOptions
  ): Promise<Response> {
    const maxRetries = backoffOpts?.maxRetries ?? 3;
    const initialDelay = backoffOpts?.initialDelayMs ?? 800;
    const maxDelay = backoffOpts?.maxDelayMs ?? 8000;
    const factor = backoffOpts?.backoffFactor ?? 2;

    let attempt = 0;
    let delay = initialDelay;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(url, options);
        if (response.ok || attempt === maxRetries - 1) {
          return response;
        }
      } catch (err) {
        if (attempt === maxRetries - 1) {
          throw err;
        }
      }

      attempt++;
      await new Promise((res) => setTimeout(res, delay));
      delay = Math.min(delay * factor, maxDelay);
    }

    throw new Error(`[Firebase RTDB] Request failed after ${maxRetries} backoff attempts.`);
  }

  // Clear room signaling data from localStorage & local listeners to prevent stale handshake pollution
  clearRoom(roomId: string): void {
    const normalizedRoom = roomId.replace(/^\//, '');
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove = [
          `shinobi_sig_rooms/${normalizedRoom}/offer`,
          `shinobi_sig_rooms/${normalizedRoom}/answer`,
          `shinobi_sig_rooms/${normalizedRoom}/callerCandidates`,
          `shinobi_sig_rooms/${normalizedRoom}/calleeCandidates`,
        ];
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (_) {}
    }
  }

  // Set data at specific RTDB path with exponential backoff & local broadcast fallback
  async set(path: string, data: any): Promise<void> {
    const normalized = path.replace(/^\//, '');

    // 1. Broadcast locally for instant same-browser / localhost tab connection
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`shinobi_sig_${normalized}`, JSON.stringify(data));
        this.broadcastChannel?.postMessage({ path: normalized, data });
        this.notifyLocalListeners(normalized, data);
      } catch (_) {}
    }

    // 2. Sync remotely to Firebase RTDB for cross-network device connection
    const url = `${this.databaseUrl}/${normalized}.json`;
    try {
      await this.fetchWithBackoff(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn(`[Firebase RTDB Set Warning] Remote sync for '${normalized}' restricted or offline. Local signaling active.`);
    }
  }

  // Push item into RTDB array/list with exponential backoff & local fallback
  async push(path: string, data: any): Promise<string | null> {
    const normalized = path.replace(/^\//, '');
    const pushKey = `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Local push & broadcast
    if (typeof window !== 'undefined') {
      try {
        const existingRaw = localStorage.getItem(`shinobi_sig_${normalized}`);
        const existing = existingRaw ? JSON.parse(existingRaw) : {};
        existing[pushKey] = data;
        localStorage.setItem(`shinobi_sig_${normalized}`, JSON.stringify(existing));
        this.broadcastChannel?.postMessage({ path: normalized, data: existing });
        this.notifyLocalListeners(normalized, existing);
      } catch (_) {}
    }

    // 2. Remote RTDB push
    const url = `${this.databaseUrl}/${normalized}.json`;
    try {
      const res = await this.fetchWithBackoff(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      return resData?.name || pushKey;
    } catch (err) {
      return pushKey;
    }
  }

  // Get data from RTDB path or local storage fallback
  async get(path: string): Promise<any> {
    const normalized = path.replace(/^\//, '');

    // Try local storage first if available
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`shinobi_sig_${normalized}`);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch (_) {}
    }

    const url = `${this.databaseUrl}/${normalized}.json`;
    try {
      const res = await this.fetchWithBackoff(url, { method: 'GET' });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  }

  // Subscribe to real-time changes at path using local channel, SSE, or polling
  onValue(path: string, callback: (data: any) => void): () => void {
    if (this.isClosed) return () => {};

    const normalizedPath = path.replace(/^\//, '');

    // Register local listener
    if (!this.localListeners.has(normalizedPath)) {
      this.localListeners.set(normalizedPath, new Set());
    }
    this.localListeners.get(normalizedPath)!.add(callback);

    // Initial local value check
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`shinobi_sig_${normalizedPath}`);
        if (raw) {
          callback(JSON.parse(raw));
        }
      } catch (_) {}
    }

    const url = `${this.databaseUrl}/${normalizedPath}.json`;

    // Try EventSource (SSE) if supported in browser environment
    if (typeof window !== 'undefined' && typeof window.EventSource !== 'undefined') {
      try {
        const eventSource = new EventSource(url);
        
        eventSource.addEventListener('put', (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            if (parsed && parsed.data !== undefined) {
              callback(parsed.data);
            }
          } catch (_) {}
        });

        eventSource.addEventListener('patch', (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            if (parsed && parsed.data !== undefined) {
              callback(parsed.data);
            }
          } catch (_) {}
        });

        eventSource.onerror = () => {};

        this.activeEventSources.set(normalizedPath, eventSource);
      } catch (_) {}
    }

    // Adaptive Polling backup
    let lastHash = '';
    
    const pollId = setInterval(async () => {
      if (this.isClosed) return;

      const currentData = await this.get(normalizedPath);
      if (currentData !== null) {
        const currentHash = JSON.stringify(currentData);
        if (currentHash !== lastHash) {
          lastHash = currentHash;
          callback(currentData);
        }
      }
    }, 1000);

    this.pollIntervals.set(normalizedPath, pollId);

    return () => this.off(normalizedPath);
  }

  // Close & unsubscribe listener for path
  off(path: string): void {
    const normalizedPath = path.replace(/^\//, '');

    this.localListeners.delete(normalizedPath);

    const es = this.activeEventSources.get(normalizedPath);
    if (es) {
      es.close();
      this.activeEventSources.delete(normalizedPath);
    }

    const poll = this.pollIntervals.get(normalizedPath);
    if (poll) {
      clearInterval(poll);
      this.pollIntervals.delete(normalizedPath);
    }
  }

  // Close all active listeners
  closeAll(): void {
    this.isClosed = true;
    this.localListeners.clear();
    this.activeEventSources.forEach((es) => es.close());
    this.activeEventSources.clear();

    this.pollIntervals.forEach((interval) => clearInterval(interval));
    this.pollIntervals.clear();

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    console.log('[Firebase RTDB] Closed all active signaling database listeners.');
  }

  // Re-open client if needed for reconnection
  reopen(): void {
    this.isClosed = false;
  }
}

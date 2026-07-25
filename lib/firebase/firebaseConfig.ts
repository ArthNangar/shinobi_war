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

  // Clear room signaling data from localStorage, local listeners & signaling API
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

    try {
      fetch('/api/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', path: `rooms/${normalizedRoom}` }),
      }).catch(() => {});
    } catch (_) {}
  }

  // Set data at specific path (Next.js Signaling API + LocalStorage + RTDB)
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

    // 2. Sync to Next.js local signaling API (works across Incognito, different browsers & devices)
    try {
      await fetch('/api/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set', path: normalized, data }),
      });
    } catch (_) {}

    // 3. Remote RTDB fallback if valid URL configured
    if (this.databaseUrl && !this.databaseUrl.includes('shinobi-seals-default-rtdb')) {
      const url = `${this.databaseUrl}/${normalized}.json`;
      try {
        await this.fetchWithBackoff(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch (err) {
        console.warn(`[Firebase RTDB Set Warning] Remote sync for '${normalized}' restricted or offline.`);
      }
    }
  }

  // Push item into array/list (Next.js Signaling API + LocalStorage + RTDB)
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

    // 2. Sync to Next.js local signaling API
    try {
      const res = await fetch('/api/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push', path: normalized, data }),
      });
      const resData = await res.json();
      if (resData?.key) return resData.key;
    } catch (_) {}

    // 3. Sync remotely to Firebase RTDB if configured
    if (this.databaseUrl && !this.databaseUrl.includes('shinobi-seals-default-rtdb')) {
      const url = `${this.databaseUrl}/${normalized}.json`;
      try {
        const res = await this.fetchWithBackoff(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (resData?.name) return resData.name;
      } catch (_) {}
    }

    return pushKey;
  }

  // Get data from Next.js signaling API, Remote Firebase RTDB, or local storage fallback
  async get(path: string): Promise<any> {
    const normalized = path.replace(/^\//, '');

    // 1. Try Next.js local signaling API first
    try {
      const res = await fetch(`/api/signaling?path=${encodeURIComponent(normalized)}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.data !== null && json.data !== undefined) {
          return json.data;
        }
      }
    } catch (_) {}

    // 2. Try Remote Firebase RTDB if configured
    if (this.databaseUrl && !this.databaseUrl.includes('shinobi-seals-default-rtdb')) {
      const url = `${this.databaseUrl}/${normalized}.json`;
      try {
        const res = await this.fetchWithBackoff(url, { method: 'GET' });
        if (res.ok) {
          const remoteData = await res.json();
          if (remoteData !== null && remoteData !== undefined) {
            return remoteData;
          }
        }
      } catch (_) {}
    }

    // 3. Local storage fallback
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`shinobi_sig_${normalized}`);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch (_) {}
    }

    return null;
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

    // Initial value check from server API / local storage
    this.get(normalizedPath).then((initialData) => {
      if (initialData !== null && initialData !== undefined && !this.isClosed) {
        callback(initialData);
      }
    });

    // Adaptive Polling backup (500ms interval for ultra-fast handshake)
    let lastHash = '';
    
    const pollId = setInterval(async () => {
      if (this.isClosed) return;

      const currentData = await this.get(normalizedPath);
      if (currentData !== null && currentData !== undefined) {
        const currentHash = JSON.stringify(currentData);
        if (currentHash !== lastHash) {
          lastHash = currentHash;
          callback(currentData);
        }
      }
    }, 500);

    this.pollIntervals.set(normalizedPath, pollId);

    return () => this.off(normalizedPath);
  }

  // Reopen signaling client after reset or close
  reopen(): void {
    this.isClosed = false;
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined' && !this.broadcastChannel) {
      try {
        this.broadcastChannel = new BroadcastChannel('shinobi_seals_local_signaling');
        this.broadcastChannel.onmessage = (event) => {
          if (this.isClosed) return;
          const { path, data } = event.data || {};
          if (path) {
            this.notifyLocalListeners(path, data);
          }
        };
      } catch (_) {}
    }
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
}

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
  private isClosed: boolean = false;

  constructor(databaseUrl?: string) {
    const config = getFirebaseConfig();
    this.databaseUrl = (databaseUrl || config.databaseURL || '').replace(/\/$/, '');
  }

  /**
   * Helper function for executing network requests with Exponential Backoff
   */
  private async fetchWithBackoff(
    url: string,
    options: RequestInit,
    backoffOpts?: ExponentialBackoffOptions
  ): Promise<Response> {
    const maxRetries = backoffOpts?.maxRetries ?? 5;
    const initialDelay = backoffOpts?.initialDelayMs ?? 1000;
    const maxDelay = backoffOpts?.maxDelayMs ?? 16000;
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
      console.warn(`[Firebase RTDB] Request failed. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
      await new Promise((res) => setTimeout(resolve => setTimeout(resolve, delay), delay));
      delay = Math.min(delay * factor, maxDelay);
    }

    throw new Error(`[Firebase RTDB] Network request failed after ${maxRetries} backoff attempts.`);
  }

  // Set data at specific RTDB path with exponential backoff
  async set(path: string, data: any): Promise<void> {
    const url = `${this.databaseUrl}/${path.replace(/^\//, '')}.json`;
    try {
      await this.fetchWithBackoff(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn(`[Firebase RTDB Set Warning] ${path}:`, err);
    }
  }

  // Push item into RTDB array/list with exponential backoff
  async push(path: string, data: any): Promise<string | null> {
    const url = `${this.databaseUrl}/${path.replace(/^\//, '')}.json`;
    try {
      const res = await this.fetchWithBackoff(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      return resData?.name || null;
    } catch (err) {
      console.warn(`[Firebase RTDB Push Warning] ${path}:`, err);
      return null;
    }
  }

  // Get data from RTDB path with exponential backoff
  async get(path: string): Promise<any> {
    const url = `${this.databaseUrl}/${path.replace(/^\//, '')}.json`;
    try {
      const res = await this.fetchWithBackoff(url, { method: 'GET' });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  }

  // Subscribe to real-time changes at path using Server-Sent Events (SSE) or polling
  onValue(path: string, callback: (data: any) => void): () => void {
    if (this.isClosed) return () => {};

    const normalizedPath = path.replace(/^\//, '');
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

        eventSource.onerror = () => {
          // SSE fallback to polling if connection drops or CORS issues occur
        };

        this.activeEventSources.set(normalizedPath, eventSource);
      } catch (_) {}
    }

    // Adaptive Polling backup with Exponential Backoff monitoring
    let lastHash = '';
    let consecutiveFailures = 0;
    
    const pollId = setInterval(async () => {
      if (this.isClosed) return;

      const currentData = await this.get(normalizedPath);
      if (currentData !== null) {
        consecutiveFailures = 0;
        const currentHash = JSON.stringify(currentData);
        if (currentHash !== lastHash) {
          lastHash = currentHash;
          callback(currentData);
        }
      } else {
        consecutiveFailures++;
        if (consecutiveFailures > 3) {
          console.warn(`[Firebase RTDB] Polling listener '${normalizedPath}' experienced repeated network failures.`);
        }
      }
    }, 1000);

    this.pollIntervals.set(normalizedPath, pollId);

    // Return un-subscribe function
    return () => this.off(normalizedPath);
  }

  // Close & unsubscribe listener for path
  off(path: string): void {
    const normalizedPath = path.replace(/^\//, '');

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
    this.activeEventSources.forEach((es) => es.close());
    this.activeEventSources.clear();

    this.pollIntervals.forEach((interval) => clearInterval(interval));
    this.pollIntervals.clear();
    console.log('[Firebase RTDB] Closed all active signaling database listeners.');
  }

  // Re-open client if needed for reconnection
  reopen(): void {
    this.isClosed = false;
  }
}

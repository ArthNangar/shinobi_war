import { NetworkMessage } from './WebRTCNetworkManager';

export type EventProcessorHandler<T = any> = (msg: NetworkMessage<T>) => Promise<void> | void;

export interface EventQueueOptions {
  /** Delay in ms between processing items if handler doesn't return a promise */
  defaultItemDurationMs?: number;
  /** Callback fired when queue size changes */
  onQueueLengthChange?: (size: number) => void;
}

/**
 * Sequential Event Queue Processor for WebRTC DataChannel
 * Guarantees that rapid-fire incoming network payloads (e.g. 5 consecutive attack events)
 * are processed strictly sequentially without state race conditions or animation overriding.
 */
export class EventQueueProcessor {
  private queue: NetworkMessage[] = [];
  private isProcessing: boolean = false;
  private handler: EventProcessorHandler | null = null;
  private defaultItemDurationMs: number = 1200;
  private onQueueLengthChange?: (size: number) => void;

  constructor(handler?: EventProcessorHandler, options?: EventQueueOptions) {
    if (handler) {
      this.handler = handler;
    }
    if (options?.defaultItemDurationMs) {
      this.defaultItemDurationMs = options.defaultItemDurationMs;
    }
    this.onQueueLengthChange = options?.onQueueLengthChange;
  }

  public setHandler(handler: EventProcessorHandler): void {
    this.handler = handler;
  }

  /**
   * Enqueues an incoming network message and triggers processing loop
   */
  public enqueue(message: NetworkMessage): void {
    console.log(`[EventQueueProcessor] Enqueued message '${message.type}' (Queue length: ${this.queue.length + 1})`);
    this.queue.push(message);

    if (this.onQueueLengthChange) {
      this.onQueueLengthChange(this.queue.length);
    }

    this.processNext();
  }

  /**
   * Enqueues multiple messages sequentially (useful for rapid-fire payload simulations)
   */
  public enqueueBatch(messages: NetworkMessage[]): void {
    for (const msg of messages) {
      this.enqueue(msg);
    }
  }

  /**
   * Processes the queue sequentially
   */
  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !this.handler) {
      return;
    }

    this.isProcessing = true;
    const currentMessage = this.queue.shift()!;

    if (this.onQueueLengthChange) {
      this.onQueueLengthChange(this.queue.length);
    }

    try {
      console.log(`[EventQueueProcessor] ⚡ Processing message '${currentMessage.type}' (Sender: ${currentMessage.senderId})`);
      
      const result = this.handler(currentMessage);
      
      if (result instanceof Promise) {
        await result;
      } else {
        // Fallback delay if handler is synchronous
        await new Promise((resolve) => setTimeout(resolve, this.defaultItemDurationMs));
      }
    } catch (err) {
      console.error('[EventQueueProcessor] Error processing queued message:', err);
    } finally {
      this.isProcessing = false;
      // Continue to next item in queue
      if (this.queue.length > 0) {
        this.processNext();
      }
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public clear(): void {
    this.queue = [];
    this.isProcessing = false;
    if (this.onQueueLengthChange) {
      this.onQueueLengthChange(0);
    }
  }
}

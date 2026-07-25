import { CameraOptions } from './types';

/**
 * CameraManager
 * Handles requesting navigator.mediaDevices.getUserMedia for front-facing camera
 * and piping the live feed into a hidden HTML5 video element.
 */
export class CameraManager {
  private videoElement: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private isCreatedInternally = false;
  private options: Required<CameraOptions>;

  constructor(providedVideoElement?: HTMLVideoElement | null, options?: CameraOptions) {
    this.options = {
      width: options?.width ?? 640,
      height: options?.height ?? 480,
      facingMode: options?.facingMode ?? 'user', // Front-facing camera
      frameRate: options?.frameRate ?? 30,
    };

    if (providedVideoElement) {
      this.videoElement = providedVideoElement;
    } else {
      // Create hidden video element in DOM if not provided
      this.videoElement = document.createElement('video');
      this.videoElement.id = `hidden-camera-video-${Date.now()}`;
      this.videoElement.style.display = 'none';
      this.videoElement.style.position = 'absolute';
      this.videoElement.style.pointerEvents = 'none';
      this.videoElement.style.opacity = '0';
      this.videoElement.setAttribute('autoplay', '');
      this.videoElement.setAttribute('playsinline', '');
      this.videoElement.setAttribute('muted', '');
      document.body.appendChild(this.videoElement);
      this.isCreatedInternally = true;
    }
  }

  /**
   * Request front-facing camera access and bind stream to hidden video element
   */
  public async start(): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('navigator.mediaDevices.getUserMedia is not supported in this browser environment.');
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: this.options.facingMode },
          width: { ideal: this.options.width },
          height: { ideal: this.options.height },
          frameRate: { ideal: this.options.frameRate },
        },
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      
      // Ensure video attributes are set for smooth playback
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true;

      // Wait for video metadata to load and start playing
      await new Promise<void>((resolve) => {
        if (this.videoElement.readyState >= 2) {
          resolve();
        } else {
          this.videoElement.onloadedmetadata = () => resolve();
        }
      });

      await this.videoElement.play();
      return this.stream;
    } catch (err: any) {
      console.error('[CameraManager] Error accessing webcam:', err);
      throw new Error(`Failed to access front-facing camera: ${err.message || err}`);
    }
  }

  /**
   * Stop camera stream tracks and cleanup media stream
   */
  public stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * Get underlying HTMLVideoElement
   */
  public getVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }

  /**
   * Get active MediaStream
   */
  public getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Check if camera is currently playing
   */
  public isStreaming(): boolean {
    return (
      !!this.stream &&
      this.stream.active &&
      !this.videoElement.paused &&
      this.videoElement.readyState >= 2
    );
  }

  /**
   * Get current video dimensions
   */
  public getDimensions(): { width: number; height: number } {
    return {
      width: this.videoElement.videoWidth || this.options.width,
      height: this.videoElement.videoHeight || this.options.height,
    };
  }

  /**
   * Cleanup created DOM nodes on destroy
   */
  public destroy(): void {
    this.stop();
    if (this.isCreatedInternally && this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
    }
  }
}

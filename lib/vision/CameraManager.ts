import { CameraOptions } from './types';

/**
 * CameraManager
 * Handles requesting navigator.mediaDevices.getUserMedia for front-facing / default camera
 * and piping the live feed into an HTML5 video element.
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
      // Create hidden video element in DOM if not provided initially
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
   * Attach a new or newly mounted HTMLVideoElement
   */
  public attachVideo(videoElement: HTMLVideoElement): void {
    if (!videoElement) return;
    const isNewElement = this.videoElement !== videoElement;
    this.videoElement = videoElement;

    if (this.stream && this.stream.active) {
      if (isNewElement || this.videoElement.srcObject !== this.stream) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        this.videoElement.play().catch((err) => {
          console.warn('[CameraManager] Play failed on newly attached video element:', err);
        });
      }
    }
  }

  /**
   * Request camera access with fallback constraints and bind stream to video element
   */
  public async start(): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('navigator.mediaDevices.getUserMedia is not supported in this browser environment.');
    }

    try {
      let stream: MediaStream;

      // Try preferred constraints first
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
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (primaryErr) {
        console.warn('[CameraManager] Ideal constraints failed, falling back to basic video constraint:', primaryErr);
        // Fallback constraint for desktop / webcams without facingMode or strict frameRate support
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }

      this.stream = stream;
      this.videoElement.srcObject = this.stream;
      
      // Ensure video attributes are set for smooth autoplay
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true;

      // Wait max 1.5s for metadata to load, or proceed directly
      await Promise.race([
        new Promise<void>((resolve) => {
          if (this.videoElement.readyState >= 2) {
            resolve();
          } else {
            const onMeta = () => {
              this.videoElement.removeEventListener('loadedmetadata', onMeta);
              resolve();
            };
            this.videoElement.addEventListener('loadedmetadata', onMeta);
          }
        }),
        new Promise<void>((resolve) => setTimeout(resolve, 1500)),
      ]);

      try {
        await this.videoElement.play();
      } catch (playErr) {
        console.warn('[CameraManager] Autoplay error, video element will play on user interaction:', playErr);
      }

      return this.stream;
    } catch (err: any) {
      console.error('[CameraManager] Error accessing webcam:', err);
      throw new Error(`Failed to access camera: ${err.message || err}`);
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

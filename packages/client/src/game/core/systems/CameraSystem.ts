import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';
import { MAP_SIZE_METERS, MAP_CENTER_METERS, worldToRender } from '@fluxpolis/types';

import type { ISystem } from './ISystem';

// Derived render dimensions (from shared constants)
const MAP_SIZE_PIXELS = worldToRender(MAP_SIZE_METERS);
const MAP_CENTER_PIXELS = worldToRender(MAP_CENTER_METERS);

// Camera-specific constants
const CAMERA_PADDING = 500;
const CAMERA_BG_COLOR = '#1a1a2e';
const ZOOM_STEP_IN = 1.1;
const ZOOM_STEP_OUT = 0.9;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 5;
const ZOOM_DEFAULT = 1;
const PAN_DURATION_MS = 1000;
const ZOOM_DURATION_MS = 500;

interface CameraState {
  x: number;
  y: number;
  zoom: number;
  scrollX: number;
  scrollY: number;
}

export class CameraSystem implements ISystem {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private lastEmittedState: CameraState | null = null;

  constructor(camera: Phaser.Cameras.Scene2D.Camera) {
    this.camera = camera;
  }

  init(): void {
    this.camera.setBackgroundColor(CAMERA_BG_COLOR);

    // Set camera bounds with padding outside world borders
    this.camera.setBounds(
      -CAMERA_PADDING,
      -CAMERA_PADDING,
      MAP_SIZE_PIXELS + CAMERA_PADDING * 2,
      MAP_SIZE_PIXELS + CAMERA_PADDING * 2
    );

    this.setupInputListeners();
    this.reset();
  }

  private setupInputListeners(): void {
    EventBus.on(EVENTS.GAME_INPUT_DRAG, (data) => {
      this.camera.scrollX -= data.deltaX / this.camera.zoom;
      this.camera.scrollY -= data.deltaY / this.camera.zoom;
    });

    EventBus.on(EVENTS.GAME_INPUT_WHEEL, (data) => {
      const zoomFactor = data.deltaY > 0 ? ZOOM_STEP_OUT : ZOOM_STEP_IN;
      const newZoom = Phaser.Math.Clamp(this.camera.zoom * zoomFactor, ZOOM_MIN, ZOOM_MAX);

      this.camera.setZoom(newZoom);
    });

    EventBus.on(EVENTS.GAME_INPUT_SPACE, () => {
      this.reset();
    });
  }

  update(_delta: number): void {
    const currentState: CameraState = {
      x: Math.floor(this.camera.scrollX + this.camera.width / 2),
      y: Math.floor(this.camera.scrollY + this.camera.height / 2),
      zoom: this.camera.zoom,
      scrollX: this.camera.scrollX,
      scrollY: this.camera.scrollY,
    };

    if (
      this.lastEmittedState &&
      this.lastEmittedState.x === currentState.x &&
      this.lastEmittedState.y === currentState.y &&
      this.lastEmittedState.zoom === currentState.zoom &&
      this.lastEmittedState.scrollX === currentState.scrollX &&
      this.lastEmittedState.scrollY === currentState.scrollY
    ) {
      return;
    }

    EventBus.emit(EVENTS.GAME_CAMERA_POSITION_CHANGED, currentState);
    this.lastEmittedState = currentState;
  }

  // Utility methods
  reset(): void {
    this.camera.setZoom(ZOOM_DEFAULT);
    this.camera.centerOn(MAP_CENTER_PIXELS, MAP_CENTER_PIXELS);
  }

  panTo(x: number, y: number, duration: number = PAN_DURATION_MS): void {
    this.camera.pan(x, y, duration, 'Power2');
  }

  zoomTo(level: number, duration: number = ZOOM_DURATION_MS): void {
    this.camera.zoomTo(level, duration, 'Power2');
  }

  centerOn(x: number, y: number): void {
    this.camera.centerOn(x, y);
  }
}

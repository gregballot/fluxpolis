import { EventBus } from '../../../EventBus';
import type { ISystem } from './ISystem';

interface CameraState {
  x: number;
  y: number;
  zoom: number;
  scrollX: number;
  scrollY: number;
};

export class CameraSystem implements ISystem {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private lastEmittedState: CameraState | null = null;

  constructor(camera: Phaser.Cameras.Scene2D.Camera) {
    this.camera = camera;
  }

  init(): void {
    this.camera.setBackgroundColor('#1a1a2e');
    
    // TODO: find a way to get the map size
    // this.camera.setBounds(0, 0, this.mapWidth, this.mapHeight);
    // this.camera.centerOn(this.mapWidth / 2, this.mapHeight / 2);
    
    this.setupInputListeners();
    this.reset();
  }

  private setupInputListeners(): void {
    EventBus.on('game:input:drag', (data: { deltaX: number; deltaY: number }) => {
      this.camera.scrollX -= data.deltaX / this.camera.zoom;
      this.camera.scrollY -= data.deltaY / this.camera.zoom;
    });

    EventBus.on('game:input:wheel', (data: { deltaY: number }) => {
      const zoomFactor = data.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Phaser.Math.Clamp(this.camera.zoom * zoomFactor, 0.3, 3);
      
      this.camera.setZoom(newZoom);
    });

    EventBus.on('game:input:space', () => {
      this.reset();
    });
  }

  update(_delta: number): void {
    const currentState: CameraState = {
      x: Math.floor(this.camera.scrollX + this.camera.width / 2),
      y: Math.floor(this.camera.scrollY + this.camera.height / 2),
      zoom: this.camera.zoom,
      scrollX: this.camera.scrollX,
      scrollY: this.camera.scrollY
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

    EventBus.emit('game:camera:positionChanged', currentState);
    this.lastEmittedState = currentState;
  }

  // Utility methods
  reset(): void {
    this.camera.setZoom(1);
    // TODO: find a way to get the map size
    this.camera.centerOn(1500, 1500);
  }

  panTo(x: number, y: number, duration: number = 1000): void {
    this.camera.pan(x, y, duration, 'Power2');
  }

  zoomTo(level: number, duration: number = 500): void {
    this.camera.zoomTo(level, duration, 'Power2');
  }

  centerOn(x: number, y: number): void {
    this.camera.centerOn(x, y);
  }
}

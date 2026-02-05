import { Scene } from 'phaser';
import { EventBus } from '../../../EventBus';
import type { ISystem } from '../../core/systems/ISystem';

const DISTRICT_RADIUS = 25;

export class BuildModeSystem implements ISystem {
  private scene: Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private isActive: boolean = false;

  constructor(scene: Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
  }

  init(): void {
    EventBus.on('ui:menu:build-district', () => {
      this.isActive = true;
    });

    EventBus.on('game:input:click-on-free-zone', (data: { x: number; y: number }) => {
      if (!this.isActive) return;
      EventBus.emit('game:build-mode:district-placed', { x: data.x, y: data.y });
      this.graphics.clear();
      this.isActive = false;
    });
  }

  update(_delta: number): void {
    if (!this.isActive) return;

    const pointer = this.scene.input.activePointer;
    if (!pointer) return;

    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    this.graphics.clear();
    this.graphics.fillStyle(0x00ffff, 0.4);
    this.graphics.fillCircle(worldPoint.x, worldPoint.y, DISTRICT_RADIUS);
  }
}

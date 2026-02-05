import { Scene } from 'phaser';
import { EntitiesManager } from '../../core/entities/EntitiesManager';
import type { ISystem } from '../../core/systems/ISystem';
import type { DistrictState } from './components/DistrictState';

export class DistrictRenderSystem implements ISystem {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(private entitiesManager: EntitiesManager, scene: Scene) {
    this.graphics = scene.add.graphics();
  }

  init(): void {}

  update(): void {
    this.graphics.clear();

    const entities = this.entitiesManager.query('DistrictState');
    for (const entity of entities) {
      const district = entity.getComponent<DistrictState>('DistrictState')!;
      this.graphics.fillStyle(district.color, district.alpha);
      this.graphics.fillCircle(district.x, district.y, district.radius);
    }
  }
}

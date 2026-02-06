import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import type { DistrictState } from '@fluxpolis/client/game/features/districts/components/DistrictState';
import type { Scene } from 'phaser';

export class DistrictRenderSystem implements ISystem {
  private graphics: Phaser.GameObjects.Graphics;
  private labels = new Map<string, Phaser.GameObjects.Text>();

  constructor(
    private entitiesManager: EntitiesManager,
    private scene: Scene,
  ) {
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

      let label = this.labels.get(district.id);
      if (!label) {
        label = this.scene.add.text(0, 0, '').setOrigin(0.5, 0.5);
        this.labels.set(district.id, label);
      }
      label.setText(String(district.age));
      label.setPosition(district.x, district.y);
    }
  }
}

import type { Scene } from 'phaser';

import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import { worldToRender } from '@fluxpolis/types';

import type { DistrictComponent } from './components/DistrictComponent';
import { DISTRICT_COMPONENT } from './components/DistrictComponent';

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

    const entities = this.entitiesManager.query(DISTRICT_COMPONENT);
    for (const entity of entities) {
      const district = entity.getComponent<DistrictComponent>(DISTRICT_COMPONENT);
      if (!district) continue;

      // Defensive guard - skip if essential fields missing
      if (district.x === undefined || district.y === undefined || district.radius === undefined) {
        console.warn(`District ${district.id} missing essential fields, skipping render`);
        continue;
      }

      const renderX = worldToRender(district.x);
      const renderY = worldToRender(district.y);
      const renderRadius = worldToRender(district.radius);

      this.graphics.fillStyle(district.color, district.alpha);
      this.graphics.fillCircle(renderX, renderY, renderRadius);

      let label = this.labels.get(district.id);
      if (!label) {
        label = this.scene.add.text(0, 0, '').setOrigin(0.5, 0.5);
        this.labels.set(district.id, label);
      }
      label.setText(district.id);
      label.setPosition(renderX, renderY);
    }
  }
}

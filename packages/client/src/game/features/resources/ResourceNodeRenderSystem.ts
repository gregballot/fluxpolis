import type { Scene } from 'phaser';
import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import { worldToRender } from '@fluxpolis/types';
import type { ResourceNodeComponent } from './components/ResourceNodeComponent';
import { RESOURCE_NODE_COMPONENT } from './components/ResourceNodeComponent';

export class ResourceNodeRenderSystem implements ISystem {
  private entitiesManager: EntitiesManager;
  private graphics: Phaser.GameObjects.Graphics;

  constructor(
    entitiesManager: EntitiesManager,
    scene: Scene,
  ) {
    this.entitiesManager = entitiesManager;
    this.graphics = scene.add.graphics();
  }

  init(): void { }

  update(): void {
    this.graphics.clear();

    const entities = this.entitiesManager.query(RESOURCE_NODE_COMPONENT);
    for (const entity of entities) {
      const node = entity.getComponent<ResourceNodeComponent>(RESOURCE_NODE_COMPONENT);
      if (!node) continue;

      // Defensive guard - skip if essential fields missing
      if (node.x === undefined || node.y === undefined || node.radius === undefined) {
        console.warn(`ResourceNode ${node.id} missing essential fields, skipping render`);
        continue;
      }

      const renderX = worldToRender(node.x);
      const renderY = worldToRender(node.y);
      const renderRadius = worldToRender(node.radius);

      this.graphics.fillStyle(node.color, node.alpha);
      this.graphics.fillCircle(renderX, renderY, renderRadius);
    }
  }
}

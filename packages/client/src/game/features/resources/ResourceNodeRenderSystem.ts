import type { Scene } from 'phaser';
import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import type { ResourceNodeState } from './components/ResourceNodeState';

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

    const entities = this.entitiesManager.query('ResourceNodeState');
    for (const entity of entities) {
      const node = entity.getComponent<ResourceNodeState>('ResourceNodeState');
      if (!node) continue;

      this.graphics.fillStyle(node.color, node.alpha);
      this.graphics.fillCircle(node.x, node.y, node.radius);
    }
  }
}

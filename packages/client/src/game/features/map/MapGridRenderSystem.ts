import type { Scene } from 'phaser';

import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import { worldToRender } from '@fluxpolis/types';

import type { MapGridComponent } from './components/MapGridComponent';
import { MAP_GRID_COMPONENT } from './components/MapGridComponent';

export class MapRenderSystem implements ISystem {
  private entitiesManager: EntitiesManager;
  private graphics: Phaser.GameObjects.Graphics;

  constructor(entitiesManager: EntitiesManager, scene: Scene) {
    this.entitiesManager = entitiesManager;
    this.graphics = scene.add.graphics();
  }

  init(): void {
    // Draw map once on initialization
    this.render();
  }

  render(): void {
    const [map] = this.entitiesManager.query(MAP_GRID_COMPONENT);
    if (!map) {
      console.error('No map found');
      return;
    }

    const mapGrid = map.getComponent<MapGridComponent>(MAP_GRID_COMPONENT);
    if (!mapGrid) {
      console.error('No grid found');
      return;
    }

    this.graphics.clear();
    this.graphics.lineStyle(1, mapGrid.gridColor, mapGrid.gridAlpha);

    const renderWidth = worldToRender(mapGrid.width);
    const renderHeight = worldToRender(mapGrid.height);
    const renderGridSize = worldToRender(mapGrid.gridSize);

    // Draw vertical lines
    for (let x = 0; x <= renderWidth; x += renderGridSize) {
      this.graphics.lineBetween(x, 0, x, renderHeight);
    }

    // Draw horizontal lines
    for (let y = 0; y <= renderHeight; y += renderGridSize) {
      this.graphics.lineBetween(0, y, renderWidth, y);
    }
  }
}

import { Scene } from 'phaser';
import { EntitiesManager } from '../../core/entities/EntitiesManager';
import type { ISystem } from '../../core/systems/ISystem';
import type { MapGrid } from './components/MapGrid';

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
    const [map] = this.entitiesManager.query('MapGrid');
    if (!map) {
      console.error('No map found');
      return;
    }

    const mapGrid = map.getComponent<MapGrid>('MapGrid');
    if (!mapGrid) {
      console.error('No grid found');
      return;
    }

    this.graphics.clear();
    this.graphics.lineStyle(1, mapGrid.gridColor, mapGrid.gridAlpha);

    // Draw vertical lines
    for (let x = 0; x <= mapGrid.width; x += mapGrid.gridSize) {
      this.graphics.lineBetween(x, 0, x, mapGrid.height);
    }

    // Draw horizontal lines
    for (let y = 0; y <= mapGrid.height; y += mapGrid.gridSize) {
      this.graphics.lineBetween(0, y, mapGrid.width, y);
    }
  }
}
import { MAP_SIZE_METERS } from '@fluxpolis/types';
import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { GameEntity } from '@fluxpolis/client/game/core/entities/GameEntity';

import type { MapGrid } from './MapGrid';

// Grid-specific constants
const GRID_SIZE_METERS = 5000;  // 5 km grid cells
const GRID_COLOR = 0x696969;
const GRID_ALPHA = 0.5;

const MapDefaultConfig: MapGrid = {
  width: MAP_SIZE_METERS,
  height: MAP_SIZE_METERS,
  gridSize: GRID_SIZE_METERS,
  gridColor: GRID_COLOR,
  gridAlpha: GRID_ALPHA,
};

export class MapFactory {
  static createMapGrid(
    entitiesManager: EntitiesManager,
    config: MapGrid = MapDefaultConfig,
  ): GameEntity {
    const mapEntity = entitiesManager.createEntity();
    mapEntity.addComponent('MapGrid', {
      width: config.width,
      height: config.height,
      gridSize: config.gridSize,
      gridColor: config.gridColor,
      gridAlpha: config.gridAlpha,
    });
    return mapEntity;
  }
}

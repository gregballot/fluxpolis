import { Logger } from './Logger';
import type { TypedEventBus } from '@fluxpolis/events';
import { EVENTS } from '@fluxpolis/events';
import type { IManager } from './types';

import { DistrictManager } from './districts/DistrictManager';
import { ResourceNodeManager } from './resources/ResourceNodeManager';
import { MapGenerator } from './map/MapGenerator';
import { DEFAULT_MAP_CONFIG } from './map/MapConfig';
import type { MapConfig } from './map/MapConfig';

export class Simulation {
  private managers: IManager[] = [];
  private mapConfig: MapConfig;
  private resourceNodeManager: ResourceNodeManager;

  constructor(events: TypedEventBus) {
    this.mapConfig = DEFAULT_MAP_CONFIG;

    this.resourceNodeManager = new ResourceNodeManager(events);
    this.addManager(this.resourceNodeManager);
    this.addManager(new DistrictManager(events));

    events.on(EVENTS.GAME_SIMULATION_TICK, () => this.tick());

    // Wait for scene to be ready before initializing world
    // This ensures all client systems are listening before we emit events
    events.on(EVENTS.CURRENT_SCENE_READY, () => {
      this.initializeWorld(events);
    });

    Logger.info('Simulation started');
  }

  private addManager(manager: IManager): void {
    this.managers.push(manager);
  }

  private initializeWorld(events: TypedEventBus): void {
    const mapGenerator = new MapGenerator();
    const resourceNodes = mapGenerator.generateResourceNodes(this.mapConfig);

    this.resourceNodeManager.loadNodes(resourceNodes);

    // Emit map loaded event with all entities
    events.emit(EVENTS.GAME_MAP_LOADED, {
      resourceNodes: resourceNodes.map((node) => ({
        id: node.id,
        x: node.x,
        y: node.y,
        type: node.type,
      })),
    });
  }

  getMapConfig(): MapConfig {
    return { ...this.mapConfig };
  }

  tick(): void {
    for (const manager of this.managers) {
      manager.tick();
    }
  }
}

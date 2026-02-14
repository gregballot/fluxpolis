import { Logger } from './Logger';
import type { TypedEventBus } from '@fluxpolis/events';
import { EVENTS } from '@fluxpolis/events';
import type { IManager } from './types';

import { DistrictManager } from './districts/DistrictManager';
import { DistrictGrowthManager } from './districts/growth/DistrictGrowthManager';
import { ResourceNodeManager } from './resources/ResourceNodeManager';
import { FluxManager } from './flux/FluxManager';
import { MapGenerator } from './map/MapGenerator';
import { DEFAULT_MAP_CONFIG } from './map/MapConfig';
import type { MapConfig } from './map/MapConfig';
import { PlaceRegistry } from './places/PlaceRegistry';
import { TimeManager } from './time/TimeManager';

export class Simulation {
	private managers: IManager[] = [];
	private mapConfig: MapConfig;
	private resourceNodeManager: ResourceNodeManager;
	private districtManager: DistrictManager;
	private placeRegistry: PlaceRegistry;

	constructor(events: TypedEventBus) {
		this.mapConfig = DEFAULT_MAP_CONFIG;
		this.placeRegistry = new PlaceRegistry();

		// Pass PlaceRegistry to managers via constructor
		this.resourceNodeManager = new ResourceNodeManager(
			events,
			this.placeRegistry,
		);

		this.districtManager = new DistrictManager(events, this.placeRegistry);

		// Tick order matters: FluxManager mutates district/node state first
		this.addManager(new TimeManager(events)); // Time tracking first
		this.addManager(new FluxManager(events, this.placeRegistry));
		this.addManager(this.resourceNodeManager);
		this.addManager(this.districtManager);
		this.addManager(new DistrictGrowthManager(events, this.districtManager, this.placeRegistry));

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
    // Get full state from manager (includes radius from ResourceNode constructor)
    events.emit(EVENTS.GAME_MAP_LOADED, {
      resourceNodes: this.resourceNodeManager.getAll().map((node) => node.state),
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

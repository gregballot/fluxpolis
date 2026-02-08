import type { IManager } from '../types';
import type { TypedEventBus } from '@fluxpolis/events';
import { EVENTS } from '@fluxpolis/events';
import { Logger } from '../Logger';

import { District } from './District';
import type { PlaceRegistry } from '../places/PlaceRegistry';
import { DEFAULT_INFLUENCE_RADIUS } from '../places/PlaceConfig';

export class DistrictManager implements IManager {
	private districts = new Map<string, District>();
	private nextId = 1;

	constructor(
		private events: TypedEventBus,
		private placeRegistry: PlaceRegistry,
	) {
    // TypeScript now infers the payload type automatically!
    this.events.on(EVENTS.GAME_BUILD_MODE_DISTRICT_PLACED, (data) => {
      const district = this.create(data.x, data.y);
      this.events.emit(EVENTS.SIMULATION_DISTRICTS_NEW, { district: district.state });
      Logger.info('District placed', district);
    });

    // Handle UI queries for district data
    this.events.on(EVENTS.UI_QUERY_DISTRICT, (data) => {
      const district = this.districts.get(data.districtId);
      if (district) {
        this.events.emit(EVENTS.SIMULATION_DISTRICT_RESPONSE, {
          requestId: data.requestId,
          districtId: data.districtId,
          data: district.state,
        });
      }
    });
  }

	private create(x: number, y: number): District {
		const district = new District(`district-${this.nextId++}`, x, y);
		this.districts.set(district.id, district);

		// Register with PlaceRegistry for spatial queries
		this.placeRegistry.register(district);

		// Find and log nearby places
		const nearby = this.placeRegistry.getNearbyPlaces(
			district,
			DEFAULT_INFLUENCE_RADIUS,
		);
		if (nearby.length > 0) {
			Logger.info(
				`District ${district.id} has ${nearby.length} nearby places:`,
			);
			for (const place of nearby) {
				const distance = district.distanceTo(place);
				Logger.info(`  - ${place.id} (distance: ${distance.toFixed(1)}px)`);
			}
		} else {
			Logger.info(`District ${district.id} has no nearby places`);
		}

		return district;
	}

  tick(): void {
    for (const district of this.districts.values()) {
      district.age++;
      this.events.emit(EVENTS.SIMULATION_DISTRICTS_UPDATE, { district: district.state });
    }
  }

  getAll(): readonly District[] {
    return [...this.districts.values()];
  }
}

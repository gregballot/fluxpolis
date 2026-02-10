import type { IManager } from '../types';
import type { TypedEventBus } from '@fluxpolis/events';
import { EVENTS } from '@fluxpolis/events';
import { PLACE_RADIUS, worldCoord } from '@fluxpolis/types';
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
		// Handle placement requests with authoritative validation
		this.events.on(
			EVENTS.GAME_BUILD_MODE_DISTRICT_PLACEMENT_REQUESTED,
			(data) => {
				// Validate collision using PlaceRegistry
				const position = worldCoord(data.x, data.y);
				const hasCollision = this.placeRegistry.checkCollisionStrict(
					position,
					PLACE_RADIUS['district'],
				);

				if (hasCollision) {
					this.events.emit(EVENTS.SIMULATION_PLACEMENT_REJECTED, {
						x: data.x,
						y: data.y,
						reason: 'collision',
					});
					Logger.warn(
						`District placement rejected at (${data.x}, ${data.y}): collision`,
					);
					return;
				}

				// Valid placement - create district
				const district = this.create(data.x, data.y);
				this.events.emit(EVENTS.SIMULATION_DISTRICTS_NEW, {
					district: district.state,
				});
				Logger.info('District placed', district);
			},
		);

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
				Logger.info(`  - ${place.id} (distance: ${distance}m)`);
			}
		} else {
			Logger.info(`District ${district.id} has no nearby places`);
		}

		return district;
	}

	tick(): void {
		// Empty: DistrictManager has no per-tick logic
		// FluxManager handles all state mutations via flux delivery
	}

	getAll(): readonly District[] {
		return [...this.districts.values()];
	}
}

/**
 * Coordinates district growth each tick.
 *
 * Per district, three-step approach:
 * 1. Attempt spatial growth (push vertices outward into free space)
 * 2. Always attempt border snap toward neighbors (independent of spatial growth)
 * 3. If neither worked, fall back to density growth
 */

import type { IManager } from '../../types';
import type { TypedEventBus } from '@fluxpolis/events';
import { EVENTS } from '@fluxpolis/events';
import type { DistrictManager } from '../DistrictManager';
import type { PlaceRegistry } from '../../places/PlaceRegistry';
import { attemptSpatialGrowth, attemptBorderSnap, attemptDensityGrowth } from './GrowthAlgorithm';
import { GROWTH_CONFIG } from './GrowthConfig';
import { Logger } from '../../Logger';

export class DistrictGrowthManager implements IManager {
	private currentTick = 0;
	private lastGrowthTick = new Map<string, number>();

	constructor(
		private events: TypedEventBus,
		private districtManager: DistrictManager,
		private placeRegistry: PlaceRegistry
	) {}

	tick(): void {
		this.currentTick++;

		for (const district of this.districtManager.getAll()) {
			const lastGrowth = this.lastGrowthTick.get(district.id) ?? 0;
			if (this.currentTick - lastGrowth < GROWTH_CONFIG.GROWTH_INTERVAL_TICKS) continue;

			// Step 1: spatial growth
			let changed = attemptSpatialGrowth(district, this.placeRegistry);

			// Step 2: border snap (always — independent of spatial growth)
			const snapped = attemptBorderSnap(district, this.placeRegistry);
			changed = changed || snapped;

			// Step 3: density fallback (only if nothing else worked)
			if (!changed) {
				changed = attemptDensityGrowth(district);
			}

			if (changed) {
				this.lastGrowthTick.set(district.id, this.currentTick);
				this.events.emit(EVENTS.SIMULATION_DISTRICTS_UPDATE, { district: district.state });

				Logger.info(
					`District ${district.id} grew — Area: ${Math.floor(district.state.area / 1000)}k m², ` +
					`Density: ${district.state.density}, Vertices: ${district.state.geometry.length}`
				);
			}
		}
	}
}

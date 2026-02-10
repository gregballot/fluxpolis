import type { DistrictState, ResourceType, Commodity } from '@fluxpolis/types';
import { PLACE_RADIUS, worldCoord } from '@fluxpolis/types';
import { Place } from '../places/Place';
import { DEFAULT_DISTRICT_NEEDS, DEFAULT_DISTRICT_POPULATION, DEFAULT_DISTRICT_JOBS } from '../flux/FluxConfig';

export class District extends Place<DistrictState> {
	constructor(id: string, x: number, y: number) {
		const position = worldCoord(x, y);

		super({
			...position,
			id,
			placeType: 'district',
			radius: PLACE_RADIUS['district'],
			needs: {
				food: { ...DEFAULT_DISTRICT_NEEDS.food },
			},
			population: {
				total: { ...DEFAULT_DISTRICT_POPULATION.total },
				workers: { ...DEFAULT_DISTRICT_POPULATION.workers },
				inactive: { ...DEFAULT_DISTRICT_POPULATION.inactive },
			},
			jobs: {
				workers: { ...DEFAULT_DISTRICT_JOBS.workers },
			},
		});
	}

	get population() {
		return this.state.population;
	}

	get jobs() {
		return this.state.jobs;
	}

	/**
	 * Get needs for a specific resource type
	 */
	getNeed(resourceType: ResourceType): Commodity {
		return this.state.needs[resourceType];
	}

	/**
	 * Add resources (increase supply)
	 */
	addResource(resourceType: ResourceType, amount: number): number {
		const need = this.state.needs[resourceType];
		const available = need.demand - need.supply;
		const added = Math.min(amount, available);
		need.supply += added;
		return added;
	}

	/**
	 * Get available workers that can be assigned to fluxes
	 * Available workers = current population - workers already busy in fluxes
	 */
	getAvailableWorkers(): number {
		return this.state.population.workers.current - this.state.population.workers.busy;
	}

	/**
	 * Mark workers as busy (assigned to outgoing flux)
	 */
	markWorkersBusy(amount: number): number {
		const available = this.getAvailableWorkers();
		const marked = Math.min(amount, available);
		this.state.population.workers.busy += marked;
		return marked;
	}
}

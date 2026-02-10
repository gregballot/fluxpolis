import type { PlaceState } from './PlaceState';
import type { Commodity } from './Commodity';
import type { ResourceType } from './ResourceNodeState';

export interface PopulationSegment {
	capacity: number;
	current: number;
	busy: number; // Citizens currently assigned to fluxes
}

export interface Population {
	total: PopulationSegment;
	workers: PopulationSegment;
	inactive: PopulationSegment;
}

export interface DistrictState extends PlaceState {
	placeType: 'district';
	needs: Record<ResourceType, Commodity>;
	population: Population;
	jobs: {
		workers: Commodity;
	};
}

import type { PlaceState } from './PlaceState';
import type { Commodity } from './Commodity';
import type { ResourceType } from './ResourceNodeState';

export interface PopulationSegment {
	capacity: number;
	current: number;
}

export interface Population {
	total: PopulationSegment;
	workers: PopulationSegment;
	inactive: PopulationSegment;
}

export interface DistrictState extends PlaceState {
	placeType: 'district';
	age: number;
	needs: Record<ResourceType, Commodity>;
	population: Population;
	jobs: {
		workers: Commodity;
	};
}

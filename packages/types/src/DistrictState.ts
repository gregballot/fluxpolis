import type { PlaceState } from './PlaceState';
import type { Commodity } from './Commodity';
import type { ResourceType } from './ResourceNodeState';

export interface DistrictState extends PlaceState {
	placeType: 'district';
	age: number;
	needs: Record<ResourceType, Commodity>;
}

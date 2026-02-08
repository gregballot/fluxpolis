import type { PlaceState } from './PlaceState';

export interface DistrictState extends PlaceState {
	placeType: 'district';
	age: number;
}

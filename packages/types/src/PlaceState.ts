import type { PlaceType } from './PlaceType';

/**
 * Base state interface for all spatial entities that can be connected by Fluxes
 */
export interface PlaceState {
  id: string;
  x: number;
  y: number;
  placeType: PlaceType;
}

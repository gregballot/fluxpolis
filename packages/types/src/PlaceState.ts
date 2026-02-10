import type { PlaceType } from './PlaceType';
import type { WorldCoordinate } from './Coordinates';

/**
 * Base state interface for all spatial entities that can be connected by Fluxes
 */
export interface PlaceState extends WorldCoordinate {
  id: string;
  placeType: PlaceType;
  radius: number;
}

import { MAP_SIZE_METERS } from '@fluxpolis/types';

export interface MapConfig {
  width: number;   // in meters
  height: number;  // in meters
}

export const DEFAULT_MAP_CONFIG: MapConfig = {
  width: MAP_SIZE_METERS,
  height: MAP_SIZE_METERS,
};

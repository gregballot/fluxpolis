import type { DistrictState } from '@fluxpolis/types';

/**
 * Client-side ECS component for district rendering.
 * Extends simulation DistrictState to ensure TypeScript alignment.
 * Adds rendering-specific properties not in simulation state.
 */
export interface DistrictComponent extends DistrictState {
  // Rendering properties (not in DistrictState)
  color: number;
  alpha: number;
}

export const DISTRICT_COMPONENT = 'DistrictComponent';

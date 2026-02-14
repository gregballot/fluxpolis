import type { DistrictState } from '@fluxpolis/types';

/**
 * Client-side ECS component for district rendering.
 * Extends simulation DistrictState to ensure TypeScript alignment.
 * Adds rendering-specific properties not in simulation state.
 *
 * Note: geometry, area, density, color, originalX, originalY are inherited from DistrictState
 */
export interface DistrictComponent extends DistrictState {
  // Rendering properties (not in DistrictState)
  alpha: number;
}

export const DISTRICT_COMPONENT = 'DistrictComponent';

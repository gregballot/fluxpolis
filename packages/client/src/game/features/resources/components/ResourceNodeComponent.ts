import type { ResourceNodeState } from '@fluxpolis/types';

/**
 * Client-side ECS component for resource node rendering.
 * Extends simulation ResourceNodeState to ensure TypeScript alignment.
 * Adds rendering-specific properties not in simulation state.
 */
export interface ResourceNodeComponent extends ResourceNodeState {
  // Rendering properties (not in ResourceNodeState)
  color: number;
  alpha: number;
}

export const RESOURCE_NODE_COMPONENT = 'ResourceNodeComponent';

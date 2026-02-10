import type { ResourceType } from '@fluxpolis/types';

/**
 * Rendering configuration for resource nodes.
 * Maps resource types to visual properties.
 */
export const RESOURCE_NODE_COLORS: Record<ResourceType, number> = {
  food: 0xffaa00, // Orange/yellow
};

export const RESOURCE_NODE_ALPHA = 0.9;

import type { ResourceType } from '@fluxpolis/types';

export interface ResourceNodeState {
  id: string;
  x: number;
  y: number;
  type: ResourceType;
  // Rendering properties
  radius: number;
  color: number;
  alpha: number;
}

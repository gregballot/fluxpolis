import type { PlaceState } from './PlaceState';

export type ResourceType = 'food';

export interface ResourceNodeState extends PlaceState {
  placeType: 'resource-node';
  type: ResourceType;
}

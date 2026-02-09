import type { PlaceState } from './PlaceState';
import type { Commodity } from './Commodity';

export type ResourceType = 'food';

export interface ResourceNodeState extends PlaceState {
  placeType: 'resource-node';
  type: ResourceType;
  throughput: number; // Units produced per tick
  workerNeeds: Commodity;
}

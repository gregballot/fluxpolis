export type ResourceType = 'food';

export interface ResourceNodeState {
  id: string;
  x: number;
  y: number;
  type: ResourceType;
}

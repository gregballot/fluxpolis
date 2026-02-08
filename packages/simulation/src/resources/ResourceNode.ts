import type { ResourceNodeState, ResourceType } from '@fluxpolis/types';

export class ResourceNode {
  readonly state: ResourceNodeState;

  constructor(id: string, x: number, y: number, type: ResourceType) {
    this.state = {
      id,
      x,
      y,
      type,
    };
  }

  get id() {
    return this.state.id;
  }
  get x() {
    return this.state.x;
  }
  get y() {
    return this.state.y;
  }
  get type() {
    return this.state.type;
  }
}

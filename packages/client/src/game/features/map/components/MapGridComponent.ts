/**
 * Client-side ECS component for map grid rendering.
 */
export interface MapGridComponent {
  width: number;
  height: number;
  gridSize: number;
  gridColor: number;
  gridAlpha: number;
}

export const MAP_GRID_COMPONENT = 'MapGridComponent';

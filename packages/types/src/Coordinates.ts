/**
 * World space coordinates in meters (simulation layer).
 * Range: 0-150,000 meters (150 km map size)
 */
export interface WorldCoordinate {
  readonly x: number;
  readonly y: number;
}

/**
 * Render space coordinates in pixels (client layer).
 * Scale: 50 meters = 1 pixel
 */
export interface RenderCoordinate {
  readonly x: number;
  readonly y: number;
}

export function worldCoord(x: number, y: number): WorldCoordinate {
  return { x: Math.round(x), y: Math.round(y) } as const;
}

export function renderCoord(x: number, y: number): RenderCoordinate {
  return { x: Math.round(x), y: Math.round(y) } as const;
}

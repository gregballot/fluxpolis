import type { WorldCoordinate, RenderCoordinate } from './Coordinates';
import { worldCoord, renderCoord } from './Coordinates';
import { METERS_TO_PIXELS, PIXELS_TO_METERS } from './SpatialConfig';

/**
 * Calculate Euclidean distance between two world coordinates.
 * Returns integer distance in meters.
 */
export function worldDistance(
  a: WorldCoordinate,
  b: WorldCoordinate
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.round(Math.hypot(dx, dy));
}

/**
 * Check circle-circle collision between two world positions.
 */
export function checkCircleCollision(
  a: WorldCoordinate,
  radiusA: number,
  b: WorldCoordinate,
  radiusB: number
): boolean {
  const distance = worldDistance(a, b);
  return distance < radiusA + radiusB;
}

/**
 * Convert world coordinate to render coordinate.
 */
export function worldToRenderCoord(world: WorldCoordinate): RenderCoordinate {
  return renderCoord(
    world.x * METERS_TO_PIXELS,
    world.y * METERS_TO_PIXELS
  );
}

/**
 * Convert render coordinate to world coordinate.
 */
export function renderToWorldCoord(render: RenderCoordinate): WorldCoordinate {
  return worldCoord(
    render.x * PIXELS_TO_METERS,
    render.y * PIXELS_TO_METERS
  );
}

/**
 * Convert inline coordinate object to WorldCoordinate.
 */
export function toWorldCoord(obj: { x: number; y: number }): WorldCoordinate {
  return worldCoord(obj.x, obj.y);
}

/**
 * Convert inline coordinate object to RenderCoordinate.
 */
export function toRenderCoord(obj: { x: number; y: number }): RenderCoordinate {
  return renderCoord(obj.x, obj.y);
}

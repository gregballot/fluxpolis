/**
 * World space to render space conversion factor.
 *
 * World space (simulation): meters
 * Render space (client): pixels
 *
 * Scale: 50 meters = 1 pixel (districts at 1500m render at 30px).
 */
export const METERS_TO_PIXELS = 1 / 50; // 0.02
export const PIXELS_TO_METERS = 50;

/**
 * Convert world space (meters) to render space (pixels).
 */
export function worldToRender(worldUnits: number): number {
  return worldUnits * METERS_TO_PIXELS;
}

/**
 * Convert render space (pixels) to world space (meters).
 */
export function renderToWorld(renderUnits: number): number {
  return renderUnits * PIXELS_TO_METERS;
}

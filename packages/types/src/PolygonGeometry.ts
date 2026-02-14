/**
 * Polygon geometry types for organic district shapes
 */

/**
 * A vertex in a polygon, using world coordinates (meters)
 */
export interface PolygonVertex {
  x: number; // World X coordinate in meters
  y: number; // World Y coordinate in meters
}

/**
 * A polygon defined by an ordered array of vertices
 * Vertices should be in counter-clockwise order
 */
export type Polygon = PolygonVertex[];

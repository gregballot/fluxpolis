/**
 * Polygon collision detection utilities
 */

import type { PolygonVertex, Polygon } from './PolygonGeometry';
import { vertexDistance } from './PolygonUtils';

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param point - Point to test
 * @param polygon - Polygon vertices
 * @returns True if point is inside polygon
 */
export function isPointInPolygon(point: PolygonVertex, polygon: Polygon): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const x = point.x;
  const y = point.y;
  const numVertices = polygon.length;

  for (let i = 0, j = numVertices - 1; i < numVertices; j = i++) {
    const vertexI = polygon[i];
    const vertexJ = polygon[j];

    // Safe access guaranteed by length check above
    if (vertexI && vertexJ) {
      const intersect = vertexI.y > y !== vertexJ.y > y &&
        x < ((vertexJ.x - vertexI.x) * (y - vertexI.y)) / (vertexJ.y - vertexI.y) + vertexI.x;

      if (intersect) inside = !inside;
    }
  }

  return inside;
}

/**
 * Project a polygon onto an axis
 * @param polygon - Polygon vertices
 * @param axisX - Axis X component (normalized)
 * @param axisY - Axis Y component (normalized)
 * @returns [min, max] projection values
 */
function projectPolygon(polygon: Polygon, axisX: number, axisY: number): [number, number] {
  const firstVertex = polygon[0];
  if (!firstVertex) return [0, 0]; // Handle empty polygon

  let min = firstVertex.x * axisX + firstVertex.y * axisY;
  let max = min;

  for (let i = 1; i < polygon.length; i++) {
    const vertex = polygon[i];
    if (vertex) {
      const projection = vertex.x * axisX + vertex.y * axisY;
      if (projection < min) min = projection;
      if (projection > max) max = projection;
    }
  }

  return [min, max];
}

/**
 * Check if two projection intervals overlap
 * @param proj1 - First projection [min, max]
 * @param proj2 - Second projection [min, max]
 * @returns True if intervals overlap
 */
function projectionsOverlap(proj1: [number, number], proj2: [number, number], margin = 0): boolean {
  return !(proj1[1] < proj2[0] + margin || proj2[1] < proj1[0] + margin);
}

/**
 * Check if two polygons collide using Separating Axis Theorem (SAT)
 * @param poly1 - First polygon
 * @param poly2 - Second polygon
 * @returns True if polygons overlap
 */
export function checkPolygonCollision(poly1: Polygon, poly2: Polygon, margin = 0): boolean {
  if (poly1.length < 3 || poly2.length < 3) return false;

  // Test all edges of both polygons as potential separating axes
  const polygons = [poly1, poly2];

  for (const polygon of polygons) {
    const numVertices = polygon.length;

    for (let i = 0; i < numVertices; i++) {
      const current = polygon[i];
      const next = polygon[(i + 1) % numVertices];

      // Safe access - skip if vertices are missing
      if (!current || !next) continue;

      // Calculate edge vector
      const edgeX = next.x - current.x;
      const edgeY = next.y - current.y;

      // Calculate perpendicular (axis to test)
      const axisX = -edgeY;
      const axisY = edgeX;

      // Normalize axis
      const length = Math.sqrt(axisX * axisX + axisY * axisY);
      if (length === 0) continue;

      const normalizedAxisX = axisX / length;
      const normalizedAxisY = axisY / length;

      // Project both polygons onto this axis
      const proj1 = projectPolygon(poly1, normalizedAxisX, normalizedAxisY);
      const proj2 = projectPolygon(poly2, normalizedAxisX, normalizedAxisY);

      // If projections don't overlap, we found a separating axis
      if (!projectionsOverlap(proj1, proj2, margin)) {
        return false; // No collision
      }
    }
  }

  // No separating axis found, polygons must be colliding
  return true;
}

/**
 * Find the nearest vertex from a given vertex among all vertices in other polygons
 * @param vertex - The vertex to search from
 * @param otherPolygons - Array of polygons to search in
 * @returns Object containing nearest vertex and distance, or null if no vertices found
 */
export function findNearestVertex(
  vertex: PolygonVertex,
  otherPolygons: Polygon[]
): { vertex: PolygonVertex; distance: number; polygonIndex: number; vertexIndex: number } | null {
  let nearestVertex: PolygonVertex | null = null;
  let nearestDistance = Infinity;
  let nearestPolygonIndex = -1;
  let nearestVertexIndex = -1;

  for (let polyIdx = 0; polyIdx < otherPolygons.length; polyIdx++) {
    const polygon = otherPolygons[polyIdx];
    if (!polygon) continue;

    for (let vertIdx = 0; vertIdx < polygon.length; vertIdx++) {
      const otherVertex = polygon[vertIdx];
      if (!otherVertex) continue;

      const distance = vertexDistance(vertex, otherVertex);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestVertex = otherVertex;
        nearestPolygonIndex = polyIdx;
        nearestVertexIndex = vertIdx;
      }
    }
  }

  if (nearestVertex === null) return null;

  return {
    vertex: nearestVertex,
    distance: nearestDistance,
    polygonIndex: nearestPolygonIndex,
    vertexIndex: nearestVertexIndex,
  };
}

/**
 * Check if two line segments intersect
 * @param p1 - First point of first segment
 * @param p2 - Second point of first segment
 * @param p3 - First point of second segment
 * @param p4 - Second point of second segment
 * @returns True if segments intersect
 */
export function lineSegmentsIntersect(
  p1: PolygonVertex,
  p2: PolygonVertex,
  p3: PolygonVertex,
  p4: PolygonVertex
): boolean {
  const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
  if (det === 0) return false; // Parallel or collinear

  const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
  const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;

  return lambda > 0 && lambda < 1 && gamma > 0 && gamma < 1;
}

/**
 * Check if a polygon is simple (no self-intersecting edges).
 * Tests all non-adjacent edge pairs for intersection.
 */
export function isSimplePolygon(polygon: Polygon): boolean {
  const n = polygon.length;
  if (n < 4) return true; // triangles can't self-intersect

  for (let i = 0; i < n; i++) {
    const a1 = polygon[i]!;
    const a2 = polygon[(i + 1) % n]!;
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // first and last edge share a vertex
      const b1 = polygon[j]!;
      const b2 = polygon[(j + 1) % n]!;
      if (lineSegmentsIntersect(a1, a2, b1, b2)) return false;
    }
  }
  return true;
}

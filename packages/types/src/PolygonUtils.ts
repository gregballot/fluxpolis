/**
 * Polygon geometry calculation utilities
 */

import type { PolygonVertex, Polygon } from './PolygonGeometry';

/**
 * Calculate the area of a polygon using the Shoelace formula
 * @param vertices - Ordered array of polygon vertices
 * @returns Area in square meters
 */
export function calculatePolygonArea(vertices: Polygon): number {
  if (vertices.length < 3) return 0;

  let area = 0;
  const numVertices = vertices.length;

  for (let i = 0; i < numVertices; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % numVertices];

    // Safe access guaranteed by length check above
    if (current && next) {
      area += current.x * next.y - next.x * current.y;
    }
  }

  return Math.abs(area / 2);
}

/**
 * Calculate the centroid (geometric center) of a polygon
 * @param vertices - Ordered array of polygon vertices
 * @returns Centroid coordinates
 */
export function calculateCentroid(vertices: Polygon): PolygonVertex {
  if (vertices.length === 0) return { x: 0, y: 0 };

  let sumX = 0;
  let sumY = 0;
  let signedArea = 0;
  const numVertices = vertices.length;

  for (let i = 0; i < numVertices; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % numVertices];

    // Safe access guaranteed by length check above
    if (current && next) {
      const cross = current.x * next.y - next.x * current.y;
      signedArea += cross;
      sumX += (current.x + next.x) * cross;
      sumY += (current.y + next.y) * cross;
    }
  }

  signedArea *= 0.5;
  const factor = 1 / (6 * signedArea);

  return {
    x: sumX * factor,
    y: sumY * factor,
  };
}

/**
 * Calculate the bounding circle radius for a polygon
 * @param vertices - Ordered array of polygon vertices
 * @param centroid - Centroid of the polygon
 * @returns Radius of the smallest circle containing all vertices, centered at centroid
 */
export function calculateBoundingRadius(vertices: Polygon, centroid: PolygonVertex): number {
  let maxDistanceSq = 0;

  for (const vertex of vertices) {
    const dx = vertex.x - centroid.x;
    const dy = vertex.y - centroid.y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq > maxDistanceSq) {
      maxDistanceSq = distanceSq;
    }
  }

  return Math.sqrt(maxDistanceSq);
}

/**
 * Calculate the outward normal direction for a vertex
 * This is the perpendicular direction to push the vertex during growth
 * @param prev - Previous vertex in the polygon
 * @param current - Current vertex being pushed
 * @param next - Next vertex in the polygon
 * @param centroid - Centroid of the polygon (to ensure normal points outward)
 * @returns Normalized outward direction vector
 */
export function calculateOutwardNormal(
  prev: PolygonVertex,
  current: PolygonVertex,
  next: PolygonVertex,
  centroid: PolygonVertex
): PolygonVertex {
  // Calculate edge vectors
  const edge1X = current.x - prev.x;
  const edge1Y = current.y - prev.y;
  const edge2X = next.x - current.x;
  const edge2Y = next.y - current.y;

  // Calculate perpendicular vectors (rotated 90 degrees)
  const perp1X = -edge1Y;
  const perp1Y = edge1X;
  const perp2X = -edge2Y;
  const perp2Y = edge2X;

  // Average the perpendiculars to get candidate normal direction
  let normalX = perp1X + perp2X;
  let normalY = perp1Y + perp2Y;

  // Normalize the vector
  const length = Math.sqrt(normalX * normalX + normalY * normalY);
  if (length > 0) {
    normalX /= length;
    normalY /= length;
  }

  // Vector from centroid to current vertex
  const toCenterX = current.x - centroid.x;
  const toCenterY = current.y - centroid.y;

  // Check if normal points outward (dot product with to-center vector should be positive)
  const dotProduct = normalX * toCenterX + normalY * toCenterY;

  // If pointing inward, flip it
  if (dotProduct < 0) {
    normalX = -normalX;
    normalY = -normalY;
  }

  return { x: normalX, y: normalY };
}

/**
 * Calculate the interior angle at a vertex (in degrees)
 * @param prev - Previous vertex in the polygon
 * @param current - Current vertex
 * @param next - Next vertex in the polygon
 * @returns Angle in degrees (0-180 for interior angles)
 */
export function calculateAngle(
  prev: PolygonVertex,
  current: PolygonVertex,
  next: PolygonVertex
): number {
  // Vectors from current to prev and next
  const v1x = prev.x - current.x;
  const v1y = prev.y - current.y;
  const v2x = next.x - current.x;
  const v2y = next.y - current.y;

  // Calculate angle using dot product
  const dot = v1x * v2x + v1y * v2y;
  const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

  if (len1 === 0 || len2 === 0) return 0;

  const cosAngle = dot / (len1 * len2);
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle))); // Clamp to avoid numerical errors

  return (angleRad * 180) / Math.PI;
}

/**
 * Calculate distance between two vertices
 * @param v1 - First vertex
 * @param v2 - Second vertex
 * @returns Distance in meters
 */
export function vertexDistance(v1: PolygonVertex, v2: PolygonVertex): number {
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate perpendicular distance from point to line segment and projected point
 * @param point - Point to measure from
 * @param edgeStart - Start of line segment
 * @param edgeEnd - End of line segment
 * @returns Object with distance, projected point, and whether projection is on segment
 */
export function distanceToEdge(
  point: PolygonVertex,
  edgeStart: PolygonVertex,
  edgeEnd: PolygonVertex
): { distance: number; projectedPoint: PolygonVertex; onSegment: boolean } {
  // Edge vector
  const edgeX = edgeEnd.x - edgeStart.x;
  const edgeY = edgeEnd.y - edgeStart.y;
  const edgeLengthSq = edgeX * edgeX + edgeY * edgeY;

  // Degenerate edge (start == end)
  if (edgeLengthSq === 0) {
    return {
      distance: vertexDistance(point, edgeStart),
      projectedPoint: { ...edgeStart },
      onSegment: true,
    };
  }

  // Vector from edge start to point
  const toPointX = point.x - edgeStart.x;
  const toPointY = point.y - edgeStart.y;

  // Project point onto edge (parameterized 0 to 1)
  const t = (toPointX * edgeX + toPointY * edgeY) / edgeLengthSq;

  // Clamp to segment bounds
  const onSegment = t >= 0 && t <= 1;
  const clampedT = Math.max(0, Math.min(1, t));

  // Calculate projected point
  const projectedPoint: PolygonVertex = {
    x: edgeStart.x + clampedT * edgeX,
    y: edgeStart.y + clampedT * edgeY,
  };

  // Distance to projected point
  const distance = vertexDistance(point, projectedPoint);

  return { distance, projectedPoint, onSegment };
}

/**
 * Check if two edges are approximately parallel
 * @param edge1 - First edge [start, end]
 * @param edge2 - Second edge [start, end]
 * @param angleTolerance - Maximum angle difference in degrees (default 15)
 * @returns True if edges are parallel within tolerance
 */
export function areEdgesParallel(
  edge1: [PolygonVertex, PolygonVertex],
  edge2: [PolygonVertex, PolygonVertex],
  angleTolerance: number = 15
): boolean {
  // Edge vectors
  const edge1X = edge1[1].x - edge1[0].x;
  const edge1Y = edge1[1].y - edge1[0].y;
  const edge2X = edge2[1].x - edge2[0].x;
  const edge2Y = edge2[1].y - edge2[0].y;

  // Normalize
  const len1 = Math.sqrt(edge1X * edge1X + edge1Y * edge1Y);
  const len2 = Math.sqrt(edge2X * edge2X + edge2Y * edge2Y);

  if (len1 === 0 || len2 === 0) return false;

  const norm1X = edge1X / len1;
  const norm1Y = edge1Y / len1;
  const norm2X = edge2X / len2;
  const norm2Y = edge2Y / len2;

  // Dot product (cosine of angle between vectors)
  const dotProduct = Math.abs(norm1X * norm2X + norm1Y * norm2Y);

  // Convert tolerance to cosine (angles near 0° or 180° are parallel)
  const cosTolerance = Math.cos((angleTolerance * Math.PI) / 180);

  return dotProduct >= cosTolerance;
}

/**
 * Calculate the midline of two parallel edges
 * @param edge1 - First edge [start, end]
 * @param edge2 - Second edge [start, end]
 * @returns Midline edge [start, end]
 */
export function calculateEdgeMidline(
  edge1: [PolygonVertex, PolygonVertex],
  edge2: [PolygonVertex, PolygonVertex]
): [PolygonVertex, PolygonVertex] {
  return [
    {
      x: (edge1[0].x + edge2[0].x) / 2,
      y: (edge1[0].y + edge2[0].y) / 2,
    },
    {
      x: (edge1[1].x + edge2[1].x) / 2,
      y: (edge1[1].y + edge2[1].y) / 2,
    },
  ];
}

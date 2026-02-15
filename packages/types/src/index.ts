/**
 * @fluxpolis/types
 *
 * Shared type definitions used across all Fluxpolis packages.
 * This package has zero dependencies and exports only TypeScript types.
 */

export type { Commodity } from './Commodity';
export type { DistrictState, Population, PopulationSegment } from './DistrictState';
export type { FluxState, FlowType } from './FluxState';
export type { ResourceNodeState, ResourceType } from './ResourceNodeState';
export type { PlaceState } from './PlaceState';
export type { PlaceType } from './PlaceType';
export { PLACE_RADIUS } from './PlaceTypeConfig';
export { METERS_TO_PIXELS, PIXELS_TO_METERS, MAP_SIZE_METERS, MAP_CENTER_METERS, worldToRender, renderToWorld } from './SpatialConfig';
export type { WorldCoordinate, RenderCoordinate } from './Coordinates';
export { worldCoord, renderCoord } from './Coordinates';
export {
  worldDistance,
  checkCircleCollision,
  worldToRenderCoord,
  renderToWorldCoord,
  toWorldCoord,
  toRenderCoord,
} from './CoordinateUtils';
export type { PolygonVertex, Polygon } from './PolygonGeometry';
export {
  calculatePolygonArea,
  calculateCentroid,
  calculateBoundingRadius,
  calculateOutwardNormal,
  calculateAngle,
  vertexDistance,
  distanceToEdge,
  areEdgesParallel,
  calculateEdgeMidline,
} from './PolygonUtils';
export {
  isPointInPolygon,
  checkPolygonCollision,
  findNearestVertex,
  lineSegmentsIntersect,
  isSimplePolygon,
} from './PolygonCollision';

/**
 * District growth algorithm — three-step approach:
 * 1. Spatial growth: push vertices outward into free space
 * 2. Border snap: close gaps with neighboring districts
 * 3. Density growth: increase density when spatial growth is blocked
 */

import type { PolygonVertex, Polygon } from '@fluxpolis/types';
import {
	calculatePolygonArea,
	calculateCentroid,
	calculateBoundingRadius,
	calculateOutwardNormal,
	calculateAngle,
	checkPolygonCollision,
	findNearestVertex,
	vertexDistance,
	distanceToEdge,
	isSimplePolygon,
	isPointInPolygon,
} from '@fluxpolis/types';
import type { District } from '../District';
import type { PlaceRegistry } from '../../places/PlaceRegistry';
import { GROWTH_CONFIG } from './GrowthConfig';

/** Tiny epsilon for "already merged" checks — snapped vertices share exact coordinates */
const SNAP_EPSILON = 0.01;

/**
 * Try to grow a district outward into free space.
 * Picks 2 random vertices and pushes them along their outward normals.
 * Returns true if any vertex moved.
 */
export function attemptSpatialGrowth(district: District, placeRegistry: PlaceRegistry): boolean {
	const geometry = [...district.state.geometry];
	const neighbors = getNeighborGeometries(district, placeRegistry);

	if (district.state.area >= GROWTH_CONFIG.MAX_AREA) return false;

	// Pick one random vertex — grow it and its next neighbor (adjacent pair)
	const startIdx = Math.floor(Math.random() * geometry.length);
	const pairIndices = [startIdx, (startIdx + 1) % geometry.length];
	let anyGrowth = false;

	for (const idx of pairIndices) {
		const current = geometry[idx]!;

		// Skip locked vertices — those shared with a neighbor
		if (isVertexLocked(current, neighbors)) continue;

		const prev = geometry[(idx - 1 + geometry.length) % geometry.length]!;
		const next = geometry[(idx + 1) % geometry.length]!;

		const result = growVertex(current, prev, next, geometry, idx, neighbors);
		if (result.grew) {
			geometry.splice(idx, 1, ...result.vertices);
			anyGrowth = true;
		}
	}

	if (anyGrowth) {
		updateDerivedState(district, geometry);
	}

	return anyGrowth;
}

/**
 * Try to snap a district's border vertices toward neighboring districts.
 * Merges nearby vertices onto neighbor vertices, then walks the neighbor's
 * border to trace shared edges exactly (zero-gap borders).
 */
export function attemptBorderSnap(district: District, placeRegistry: PlaceRegistry): boolean {
	const geometry = [...district.state.geometry];
	const neighbors = getNeighborGeometries(district, placeRegistry);
	if (neighbors.length === 0) return false;

	const snapThreshold = GROWTH_CONFIG.GROWTH_DISTANCE;
	let changed = false;

	for (let i = 0; i < geometry.length; i++) {
		const va = geometry[i]!;
		const nearest = findNearestVertex(va, neighbors);
		if (!nearest) continue;

		// Within snap range but not already merged
		if (nearest.distance < snapThreshold && nearest.distance > SNAP_EPSILON) {
			// Facing check: vertex's outward normal must point toward the snap target
			const centroidA = calculateCentroid(geometry);
			const prev = geometry[(i - 1 + geometry.length) % geometry.length]!;
			const next = geometry[(i + 1) % geometry.length]!;
			const normal = calculateOutwardNormal(prev, va, next, centroidA);
			const dx = nearest.vertex.x - va.x;
			const dy = nearest.vertex.y - va.y;
			if (normal.x * dx + normal.y * dy <= 0) continue;

			// Save geometry before this snap so we can revert just this one
			const snapshot = geometry.map(v => ({ ...v }));

			// Snap A's vertex to B's exact position
			geometry[i] = { x: nearest.vertex.x, y: nearest.vertex.y };

			// Walk along B's border from the merged vertex
			const neighborPoly = neighbors[nearest.polygonIndex]!;

			const forwardVertices = walkBorderDirection(
				nearest.vertexIndex, 1, neighborPoly, centroidA, geometry
			);
			const backwardVertices = walkBorderDirection(
				nearest.vertexIndex, -1, neighborPoly, centroidA, geometry
			);

			if (backwardVertices.length > 0 || forwardVertices.length > 0) {
				for (const bv of backwardVertices.reverse()) {
					const insertIdx = findInsertionIndex(bv, geometry);
					geometry.splice(insertIdx, 0, bv);
				}
				const anchorIdx = geometry.findIndex(
					(v) => vertexDistance(v, nearest.vertex) < SNAP_EPSILON
				);
				for (let fi = 0; fi < forwardVertices.length; fi++) {
					geometry.splice(anchorIdx + 1 + fi, 0, forwardVertices[fi]!);
				}
			}

			// Validate: no self-intersection AND no vertices inside neighbors
			if (!isSimplePolygon(geometry) || hasOverlapWithNeighbors(geometry, neighbors)) {
				geometry.length = 0;
				geometry.push(...snapshot);
			} else {
				changed = true;
			}
		}
	}

	if (changed) {
		const cleaned = cleanupCollinearVertices(geometry, neighbors);
		updateDerivedState(district, cleaned);
	}

	return changed;
}

/**
 * Density growth — increase density when spatial growth is blocked.
 */
export function attemptDensityGrowth(district: District): boolean {
	const state = district.state as any;
	if (state.density >= GROWTH_CONFIG.MAX_DENSITY) return false;

	state.density = Math.min(state.density + GROWTH_CONFIG.DENSITY_GROWTH_AMOUNT, GROWTH_CONFIG.MAX_DENSITY);

	const densityMultiplier = state.density / GROWTH_CONFIG.DEFAULT_DENSITY;
	const areaKm2 = state.area / 1_000_000;
	state.population.total.capacity = Math.floor(areaKm2 * 50000 * densityMultiplier);

	return true;
}

// --- Internal helpers ---

/** Check if a vertex coincides with any neighbor vertex (shared border vertex) */
function isVertexLocked(vertex: PolygonVertex, neighbors: Polygon[]): boolean {
	const nearest = findNearestVertex(vertex, neighbors);
	return nearest !== null && nearest.distance < SNAP_EPSILON;
}

/** Walk B's border in one direction from startIdx, collecting facing vertices */
function walkBorderDirection(
	startIdx: number,
	direction: 1 | -1,
	neighborPoly: Polygon,
	centroidA: PolygonVertex,
	geometryA: Polygon
): PolygonVertex[] {
	const collected: PolygonVertex[] = [];
	const len = neighborPoly.length;
	const centroidB = calculateCentroid(neighborPoly);

	for (let step = 1; step < len; step++) {
		const idx = ((startIdx + direction * step) % len + len) % len;
		const ubNext = neighborPoly[idx]!;

		// Facing check: B's outward normal at this vertex should point toward A's centroid
		const prevIdx = ((idx - 1) % len + len) % len;
		const nextIdx = (idx + 1) % len;
		const normal = calculateOutwardNormal(
			neighborPoly[prevIdx]!, ubNext, neighborPoly[nextIdx]!, centroidB
		);

		// Does B's outward normal point toward A's centroid?
		const toA_x = centroidA.x - ubNext.x;
		const toA_y = centroidA.y - ubNext.y;
		const dot = normal.x * toA_x + normal.y * toA_y;
		if (dot <= 0) break; // Left the facing side

		// Skip if A already has a vertex at this position
		const alreadyExists = geometryA.some((v) => vertexDistance(v, ubNext) < SNAP_EPSILON);
		if (alreadyExists) continue;

		collected.push({ x: ubNext.x, y: ubNext.y });
	}

	return collected;
}

/** Find the best edge index in a polygon to insert a new vertex after */
function findInsertionIndex(vertex: PolygonVertex, polygon: Polygon): number {
	const edge = findNearestEdge(vertex, polygon);
	// Insert after the edge start index
	return edge ? edge.edgeIndex + 1 : polygon.length;
}

/** Find the nearest edge of a polygon to a vertex. Returns edge start index + distance. */
function findNearestEdge(
	vertex: PolygonVertex,
	polygon: Polygon
): { distance: number; edgeIndex: number } | null {
	if (polygon.length < 2) return null;

	let bestDistance = Infinity;
	let bestEdgeIndex = 0;

	for (let i = 0; i < polygon.length; i++) {
		const edgeStart = polygon[i]!;
		const edgeEnd = polygon[(i + 1) % polygon.length]!;
		const result = distanceToEdge(vertex, edgeStart, edgeEnd);

		if (result.distance < bestDistance) {
			bestDistance = result.distance;
			bestEdgeIndex = i;
		}
	}

	return { distance: bestDistance, edgeIndex: bestEdgeIndex };
}

/** Get polygon geometries of all other districts */
function getNeighborGeometries(district: District, placeRegistry: PlaceRegistry): Polygon[] {
	const geometries: Polygon[] = [];
	for (const place of placeRegistry.getAll()) {
		if (place.id === district.id) continue;
		if (place.state.placeType === 'district') {
			const s = place.state as any;
			if (s.geometry) geometries.push(s.geometry);
		}
	}
	return geometries;
}

/** Push a vertex outward, trying progressively smaller distances. */
function growVertex(
	current: PolygonVertex,
	prev: PolygonVertex,
	next: PolygonVertex,
	geometry: Polygon,
	idx: number,
	neighbors: Polygon[]
): { grew: boolean; vertices: PolygonVertex[] } {
	const centroid = calculateCentroid(geometry);
	const normal = calculateOutwardNormal(prev, current, next, centroid);
	const margin = GROWTH_CONFIG.COLLISION_MARGIN;
	const steps = [1, 0.5, 0.25];

	for (const scale of steps) {
		const distance = GROWTH_CONFIG.GROWTH_DISTANCE * scale;
		const target: PolygonVertex = {
			x: current.x + normal.x * distance,
			y: current.y + normal.y * distance,
		};

		// Collision check
		const test = [...geometry];
		test[idx] = target;
		if (neighbors.some((n) => checkPolygonCollision(test, n, margin))) continue;

		// Angle check — insert intermediate vertex if too sharp
		const angle = calculateAngle(prev, target, next);
		if (angle < GROWTH_CONFIG.MIN_ANGLE_DEGREES) {
			const mid: PolygonVertex = {
				x: (target.x + next.x) / 2 + normal.x * distance * 0.5,
				y: (target.y + next.y) / 2 + normal.y * distance * 0.5,
			};
			const test2 = [...geometry];
			test2.splice(idx, 1, target, mid);
			if (!neighbors.some((n) => checkPolygonCollision(test2, n, margin))) {
				return { grew: true, vertices: [target, mid] };
			}
		} else {
			return { grew: true, vertices: [target] };
		}
	}

	return { grew: false, vertices: [current] };
}

/** Check if any non-shared vertex of A ended up inside a neighbor polygon */
function hasOverlapWithNeighbors(geometry: Polygon, neighbors: Polygon[]): boolean {
	for (const v of geometry) {
		if (isVertexLocked(v, neighbors)) continue;
		for (const neighbor of neighbors) {
			if (isPointInPolygon(v, neighbor)) return true;
		}
	}
	return false;
}

/** Remove non-locked collinear vertices that add no shape information */
function cleanupCollinearVertices(geometry: Polygon, neighbors: Polygon[]): Polygon {
	if (geometry.length <= 4) return geometry;

	const keep: boolean[] = new Array(geometry.length).fill(true);

	for (let i = 0; i < geometry.length; i++) {
		const curr = geometry[i]!;

		// Never remove locked vertices — neighbors expect them
		if (isVertexLocked(curr, neighbors)) continue;

		const prev = geometry[(i - 1 + geometry.length) % geometry.length]!;
		const next = geometry[(i + 1) % geometry.length]!;

		// Deviation from the line between prev and next
		const cross = (curr.x - prev.x) * (next.y - prev.y) - (curr.y - prev.y) * (next.x - prev.x);
		const edgeLen = vertexDistance(prev, next);
		if (edgeLen === 0) continue;
		const deviation = Math.abs(cross) / edgeLen;

		if (deviation < 1.0) {
			// Only remove if both neighbors are being kept (don't remove adjacent)
			const prevIdx = (i - 1 + geometry.length) % geometry.length;
			const nextIdx = (i + 1) % geometry.length;
			if (keep[prevIdx] && keep[nextIdx]) {
				keep[i] = false;
			}
		}
	}

	const result = geometry.filter((_, i) => keep[i]);
	return result.length >= 3 ? result : geometry;
}

/** Recalculate and write derived state after geometry change */
function updateDerivedState(district: District, geometry: Polygon): void {
	const centroid = calculateCentroid(geometry);
	const state = district.state as any;
	state.geometry = geometry;
	state.area = calculatePolygonArea(geometry);
	state.x = centroid.x;
	state.y = centroid.y;
	state.radius = calculateBoundingRadius(geometry, centroid);
}

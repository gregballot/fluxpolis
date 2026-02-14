/**
 * District growth algorithm — two-step approach:
 * 1. Spatial growth: push vertices outward into free space
 * 2. Border snap: close gaps with neighboring districts (TODO)
 */

import type { PolygonVertex, Polygon } from '@fluxpolis/types';
import {
	calculatePolygonArea,
	calculateCentroid,
	calculateBoundingRadius,
	calculateOutwardNormal,
	calculateAngle,
	checkPolygonCollision,
} from '@fluxpolis/types';
import type { District } from '../District';
import type { PlaceRegistry } from '../../places/PlaceRegistry';
import { GROWTH_CONFIG } from './GrowthConfig';

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
		const prev = geometry[(idx - 1 + geometry.length) % geometry.length]!;
		const current = geometry[idx]!;
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
 * Stub — returns false for now.
 */
export function attemptBorderSnap(_district: District, _placeRegistry: PlaceRegistry): boolean {
	// TODO: implement border snapping
	return false;
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

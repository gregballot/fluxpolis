import type { DistrictState, ResourceType, Commodity, Polygon } from '@fluxpolis/types';
import {
	calculatePolygonArea,
	calculateCentroid,
	calculateBoundingRadius,
} from '@fluxpolis/types';
import { Place } from '../places/Place';
import { DEFAULT_DISTRICT_NEEDS, DEFAULT_DISTRICT_POPULATION, DEFAULT_DISTRICT_JOBS } from '../flux/FluxConfig';

const INITIAL_AREA = 2_000_000; // ~2 km² target area
const INITIAL_VERTICES = 5; // Pentagon
const VERTEX_DISTANCE_VARIATION = 0.15; // ±15% randomization
const DEFAULT_DENSITY = 100;

/**
 * Generate a random district color (0xRRGGBB format)
 * Creates vibrant, medium-brightness colors suitable for density adjustment
 */
function generateRandomDistrictColor(): number {
	// Use HSL for better color control
	// Hue: random across spectrum (0-360)
	// Saturation: high (70-100%) for vibrant colors
	// Lightness: medium (45-65%) to allow both darkening and lightening
	const h = Math.random() * 360;
	const s = 70 + Math.random() * 30; // 70-100%
	const l = 45 + Math.random() * 20; // 45-65%

	return hslToRgb(h, s, l);
}

/**
 * Convert HSL color to RGB hex value
 */
function hslToRgb(h: number, s: number, l: number): number {
	s /= 100;
	l /= 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0, g = 0, b = 0;

	if (h >= 0 && h < 60) {
		r = c; g = x; b = 0;
	} else if (h >= 60 && h < 120) {
		r = x; g = c; b = 0;
	} else if (h >= 120 && h < 180) {
		r = 0; g = c; b = x;
	} else if (h >= 180 && h < 240) {
		r = 0; g = x; b = c;
	} else if (h >= 240 && h < 300) {
		r = x; g = 0; b = c;
	} else {
		r = c; g = 0; b = x;
	}

	const red = Math.round((r + m) * 255);
	const green = Math.round((g + m) * 255);
	const blue = Math.round((b + m) * 255);

	return (red << 16) | (green << 8) | blue;
}

/**
 * Create a randomized pentagon shape around a center point
 * Each vertex distance from center is randomized for organic appearance
 */
function createRandomizedPentagon(centerX: number, centerY: number, targetArea: number): Polygon {
	const vertices: Polygon = [];

	// Calculate base radius from target area (area = 5 * r² * sin(72°) / 2)
	const baseRadius = Math.sqrt(targetArea / (5 * Math.sin((72 * Math.PI) / 180) * 0.5));

	// Create pentagon vertices with randomized distances
	for (let i = 0; i < INITIAL_VERTICES; i++) {
		const angle = (i * 2 * Math.PI) / INITIAL_VERTICES;

		// Randomize radius for this vertex (±15%)
		const variation = 1 + (Math.random() * 2 - 1) * VERTEX_DISTANCE_VARIATION;
		const radius = baseRadius * variation;

		vertices.push({
			x: centerX + radius * Math.cos(angle),
			y: centerY + radius * Math.sin(angle),
		});
	}

	return vertices;
}

export class District extends Place<DistrictState> {
	constructor(id: string, x: number, y: number) {
		// Create randomized pentagon geometry
		const geometry = createRandomizedPentagon(x, y, INITIAL_AREA);
		const area = calculatePolygonArea(geometry);
		const centroid = calculateCentroid(geometry);
		const radius = calculateBoundingRadius(geometry, centroid);
		const color = generateRandomDistrictColor();

		super({
			...centroid, // Use calculated centroid as initial x, y
			id,
			placeType: 'district',
			radius,
			geometry,
			area,
			density: DEFAULT_DENSITY,
			color,
			originalX: x, // Voronoi seed (will move on growth)
			originalY: y, // Voronoi seed (will move on growth)
			needs: {
				food: { ...DEFAULT_DISTRICT_NEEDS.food },
			},
			population: {
				total: { ...DEFAULT_DISTRICT_POPULATION.total },
				workers: { ...DEFAULT_DISTRICT_POPULATION.workers },
				inactive: { ...DEFAULT_DISTRICT_POPULATION.inactive },
			},
			jobs: {
				workers: { ...DEFAULT_DISTRICT_JOBS.workers },
			},
		});
	}

	get population() {
		return this.state.population;
	}

	get jobs() {
		return this.state.jobs;
	}

	/**
	 * Get needs for a specific resource type
	 */
	getNeed(resourceType: ResourceType): Commodity {
		return this.state.needs[resourceType];
	}

	/**
	 * Add resources (increase supply)
	 */
	addResource(resourceType: ResourceType, amount: number): number {
		const need = this.state.needs[resourceType];
		const available = need.demand - need.supply;
		const added = Math.min(amount, available);
		need.supply += added;
		return added;
	}

	/**
	 * Get available workers that can be assigned to fluxes
	 * Available workers = current population - workers already busy in fluxes
	 */
	getAvailableWorkers(): number {
		return this.state.population.workers.current - this.state.population.workers.busy;
	}

	/**
	 * Mark workers as busy (assigned to outgoing flux)
	 */
	markWorkersBusy(amount: number): number {
		const available = this.getAvailableWorkers();
		const marked = Math.min(amount, available);
		this.state.population.workers.busy += marked;
		return marked;
	}
}

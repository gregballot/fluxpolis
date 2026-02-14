import type { PlaceState } from './PlaceState';
import type { Commodity } from './Commodity';
import type { ResourceType } from './ResourceNodeState';
import type { Polygon } from './PolygonGeometry';

export interface PopulationSegment {
	capacity: number;
	current: number;
	busy: number; // Citizens currently assigned to fluxes
}

export interface Population {
	total: PopulationSegment;
	workers: PopulationSegment;
	inactive: PopulationSegment;
}

export interface DistrictState extends PlaceState {
	placeType: 'district';

	// Polygon geometry
	geometry: Polygon; // Ordered array of vertices defining district shape
	area: number; // Cached area in m² (recalculated on growth)
	density: number; // Building density (100-1000, affects capacity and visuals)
	color: number; // Random color (0xRRGGBB) for district identity

	// Center points (x, y inherited from PlaceState are the evolving centroid)
	originalX: number; // Original placement X coordinate (Voronoi seed - moves on growth)
	originalY: number; // Original placement Y coordinate (Voronoi seed - moves on growth)
	// radius inherited from PlaceState is the bounding circle radius

	// Game state
	needs: Record<ResourceType, Commodity>;
	population: Population;
	jobs: {
		workers: Commodity;
	};
}

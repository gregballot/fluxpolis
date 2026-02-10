import type { PlaceState, WorldCoordinate } from '@fluxpolis/types';
import { checkCircleCollision } from '@fluxpolis/types';
import { Place } from './Place';

/**
 * Central registry for spatial queries across all place types.
 * Enables finding nearby places without manager cross-dependencies.
 */
export class PlaceRegistry {
	private places = new Map<string, Place>();

	/**
	 * Register a place for spatial queries
	 */
	register(place: Place): void {
		this.places.set(place.id, place);
	}

	/**
	 * Unregister a place (e.g., when destroyed)
	 */
	unregister(placeId: string): void {
		this.places.delete(placeId);
	}

	/**
	 * Get all registered places
	 */
	getAll(): readonly Place[] {
		return Array.from(this.places.values());
	}

	/**
	 * Get place by ID
	 */
	getById(id: string): Place<PlaceState> | undefined {
		return this.places.get(id);
	}

	/**
	 * Find all places within radius of a given place (excluding the place itself).
	 * Uses linear O(n) scan - acceptable for current scale (<200 places).
	 *
	 * @param place - The center place to query from
	 * @param radius - Maximum distance in meters
	 * @returns Array of places within radius, sorted by distance (nearest first)
	 */
	getNearbyPlaces(place: Place, radius: number): Place[] {
		const nearby: Array<{ place: Place; distance: number }> = [];

		for (const candidate of this.places.values()) {
			// Skip self
			if (candidate.id === place.id) continue;

			const distance = place.distanceTo(candidate);
			if (distance <= radius) {
				nearby.push({ place: candidate, distance });
			}
		}

		// Sort by distance (nearest first)
		nearby.sort((a, b) => a.distance - b.distance);

		return nearby.map((entry) => entry.place);
	}

	/**
	 * Check if a circle at given position with given radius collides with any registered place.
	 * Uses proper circle-circle collision: distance < radius1 + radius2
	 *
	 * @param position - Position of new placement
	 * @param radius - Radius of entity being placed
	 * @returns true if collision detected, false if placement is valid
	 */
	checkCollisionStrict(position: WorldCoordinate, radius: number): boolean {
		for (const place of this.places.values()) {
			if (checkCircleCollision(position, radius, place.state, place.radius)) {
				return true;
			}
		}

		return false;
	}
}

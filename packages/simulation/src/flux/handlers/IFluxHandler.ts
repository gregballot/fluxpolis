import type { Flux } from '../Flux';
import type { Place } from '../../places/Place';
import type { PlaceState } from '@fluxpolis/types';
import type { PlaceRegistry } from '../../places/PlaceRegistry';

/**
 * Handler interface for flux-specific fill and delivery logic.
 * Implementations define how a specific flow type (food, workers, etc.)
 * should fill from sources and deliver to destinations.
 */
export interface IFluxHandler {
	/**
	 * Fill the flux from its source place.
	 * @param flux - The flux to fill
	 * @param source - The source place
	 * @param placeRegistry - Registry for looking up other places
	 * @returns Amount filled
	 */
	fill(flux: Flux, source: Place<PlaceState>, placeRegistry: PlaceRegistry): number;

	/**
	 * Deliver flux content to its destination place.
	 * @param flux - The flux to deliver from
	 * @param destination - The destination place
	 * @returns Amount delivered
	 */
	deliver(flux: Flux, destination: Place<PlaceState>): number;
}

import type { PlaceType, FlowType } from '@fluxpolis/types';

/**
 * Declarative rule for flux creation between place types.
 * When a new place is created, these rules determine which fluxes to create.
 */
export interface FluxCreationRule {
	sourcePlaceType: PlaceType;
	destinationPlaceType: PlaceType;
	flowType: FlowType;
	selfFlux?: boolean; // True for fluxes from a place to itself
}

/**
 * All flux creation rules.
 * Adding a new flux type only requires adding rules here.
 */
export const FLUX_CREATION_RULES: FluxCreationRule[] = [
	// Food flows from resource nodes to districts
	{
		sourcePlaceType: 'resource-node',
		destinationPlaceType: 'district',
		flowType: 'food',
	},
	// Workers flow from districts to resource nodes
	{
		sourcePlaceType: 'district',
		destinationPlaceType: 'resource-node',
		flowType: 'workers',
	},
	// Workers flow within districts (local jobs)
	{
		sourcePlaceType: 'district',
		destinationPlaceType: 'district',
		flowType: 'workers',
		selfFlux: true,
	},
];

/**
 * Get flux creation rules for a specific source/destination pair.
 * @param sourcePlaceType - Type of source place
 * @param destinationPlaceType - Type of destination place
 * @param isSelf - True if source and destination are the same place
 */
export function getFluxCreationRules(
	sourcePlaceType: PlaceType,
	destinationPlaceType: PlaceType,
	isSelf: boolean,
): FluxCreationRule[] {
	return FLUX_CREATION_RULES.filter(
		(rule) =>
			rule.sourcePlaceType === sourcePlaceType &&
			rule.destinationPlaceType === destinationPlaceType &&
			(isSelf ? rule.selfFlux === true : !rule.selfFlux),
	);
}

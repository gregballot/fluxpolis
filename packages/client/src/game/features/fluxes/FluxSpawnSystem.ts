import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';

import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { GameEntity } from '@fluxpolis/client/game/core/entities/GameEntity';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import type { FluxState as SimulationFluxState } from '@fluxpolis/types';
import type { DistrictState } from '../districts/components/DistrictState';
import type { ResourceNodeState } from '../resources/components/ResourceNodeState';
import type { FluxState } from './components/FluxState';
import { FLUX_STATE } from './components/FluxState';

export class FluxSpawnSystem implements ISystem {
	private entities = new Map<string, GameEntity>();
	private pendingFluxes = new Map<string, SimulationFluxState>();

	constructor(private entitiesManager: EntitiesManager) {}

	init(): void {
		EventBus.on(EVENTS.SIMULATION_FLUX_NEW, (data) => {
			const entity = this.createFlux(data.flux);
			if (entity) {
				this.entities.set(data.flux.id, entity);
			} else {
				// Queue for retry - race condition with district/resource node spawn
				this.pendingFluxes.set(data.flux.id, data.flux);
			}
		});

		EventBus.on(EVENTS.SIMULATION_FLUX_UPDATE, (data) => {
			const entity = this.entities.get(data.flux.id);
			if (!entity) return;

			const state = entity.getComponent<FluxState>(FLUX_STATE);
			if (!state) return;

			// Update content (capacity and positions don't change)
			state.content = data.flux.content;
		});
	}

	update(): void {
		// Retry pending fluxes that couldn't be created due to missing place entities
		if (this.pendingFluxes.size === 0) return;

		const toRetry = Array.from(this.pendingFluxes.entries());
		for (const [fluxId, flux] of toRetry) {
			const entity = this.createFlux(flux);
			if (entity) {
				this.entities.set(fluxId, entity);
				this.pendingFluxes.delete(fluxId);
			}
		}
	}

	private createFlux(flux: SimulationFluxState): GameEntity | null {
		// Look up source and destination positions
		const sourcePos = this.findPlacePosition(flux.sourceId);
		const destPos = this.findPlacePosition(flux.destinationId);

		if (!sourcePos || !destPos) {
			// Places not spawned yet - will retry in update loop
			return null;
		}

		// Create entity with FluxState component
		const entity = this.entitiesManager.createEntity();
		entity.addComponent<FluxState>(FLUX_STATE, {
			id: flux.id,
			sourceId: flux.sourceId,
			destinationId: flux.destinationId,
			sourceX: sourcePos.x,
			sourceY: sourcePos.y,
			destX: destPos.x,
			destY: destPos.y,
			flowType: flux.flowType,
			capacity: flux.capacity,
			content: flux.content,
		});

		return entity;
	}

	private findPlacePosition(
		placeId: string,
	): { x: number; y: number } | null {
		// Check districts
		const districts = this.entitiesManager.query('DistrictState');
		for (const entity of districts) {
			const state = entity.getComponent<DistrictState>('DistrictState');
			if (state?.id === placeId) {
				return { x: state.x, y: state.y };
			}
		}

		// Check resource nodes
		const nodes = this.entitiesManager.query('ResourceNodeState');
		for (const entity of nodes) {
			const state = entity.getComponent<ResourceNodeState>('ResourceNodeState');
			if (state?.id === placeId) {
				return { x: state.x, y: state.y };
			}
		}

		return null;
	}
}

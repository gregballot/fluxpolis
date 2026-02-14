import type { Scene } from 'phaser';

import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import { worldToRender } from '@fluxpolis/types';

import type { FluxComponent } from './components/FluxComponent';
import { FLUX_COMPONENT } from './components/FluxComponent';
import type { DistrictComponent } from '../districts/components/DistrictComponent';
import { DISTRICT_COMPONENT } from '../districts/components/DistrictComponent';
import type { ResourceNodeComponent } from '../resources/components/ResourceNodeComponent';
import { RESOURCE_NODE_COMPONENT } from '../resources/components/ResourceNodeComponent';
import { getFluxTypeDisplayConfig } from './FluxTypeDisplayConfig';

// Visual constants for flux rendering
const FLUX_LINE_WIDTH = 2;
const FLUX_ALPHA = 0.6;

export class FluxRenderSystem implements ISystem {
	private graphics: Phaser.GameObjects.Graphics;

	constructor(
		private entitiesManager: EntitiesManager,
		scene: Scene,
	) {
		this.graphics = scene.add.graphics();
	}

	init(): void { }

	update(): void {
		this.graphics.clear();

		const entities = this.entitiesManager.query(FLUX_COMPONENT);
		for (const entity of entities) {
			const flux = entity.getComponent<FluxComponent>(FLUX_COMPONENT);
			if (!flux) continue;

			// Query current place positions dynamically (supports moving/growing districts)
			const sourcePos = this.findPlacePosition(flux.sourceId);
			const destPos = this.findPlacePosition(flux.destinationId);

			if (!sourcePos || !destPos) continue; // Skip if places not found

			// Convert world coordinates to render coordinates
			const renderSourceX = worldToRender(sourcePos.x);
			const renderSourceY = worldToRender(sourcePos.y);
			const renderDestX = worldToRender(destPos.x);
			const renderDestY = worldToRender(destPos.y);

			// Set line style based on flow type using display config
			const displayConfig = getFluxTypeDisplayConfig(flux.flowType);
			this.graphics.lineStyle(FLUX_LINE_WIDTH, displayConfig.renderColor, FLUX_ALPHA);

			// Draw line between source and destination
			this.graphics.lineBetween(
				renderSourceX,
				renderSourceY,
				renderDestX,
				renderDestY,
			);
		}
	}

	/**
	 * Find current position of a place by ID (districts or resource nodes)
	 * Queries entities dynamically to support moving/growing places
	 */
	private findPlacePosition(placeId: string): { x: number; y: number } | null {
		// Check districts
		const districts = this.entitiesManager.query(DISTRICT_COMPONENT);
		for (const entity of districts) {
			const component = entity.getComponent<DistrictComponent>(DISTRICT_COMPONENT);
			if (component?.id === placeId) {
				return { x: component.x, y: component.y };
			}
		}

		// Check resource nodes
		const nodes = this.entitiesManager.query(RESOURCE_NODE_COMPONENT);
		for (const entity of nodes) {
			const component = entity.getComponent<ResourceNodeComponent>(RESOURCE_NODE_COMPONENT);
			if (component?.id === placeId) {
				return { x: component.x, y: component.y };
			}
		}

		return null;
	}
}

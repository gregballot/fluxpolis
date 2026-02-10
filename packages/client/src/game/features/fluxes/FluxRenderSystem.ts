import type { Scene } from 'phaser';

import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import { worldToRender } from '@fluxpolis/types';

import type { FluxComponent } from './components/FluxComponent';
import { FLUX_COMPONENT } from './components/FluxComponent';
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

			// Convert world coordinates to render coordinates
			const renderSourceX = worldToRender(flux.sourceX);
			const renderSourceY = worldToRender(flux.sourceY);
			const renderDestX = worldToRender(flux.destX);
			const renderDestY = worldToRender(flux.destY);

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
}

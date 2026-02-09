import type { Scene } from 'phaser';

import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import { worldToRender } from '@fluxpolis/types';

import type { FluxState } from './components/FluxState';
import { FLUX_STATE } from './components/FluxState';

// Visual constants for flux rendering
const FLUX_LINE_WIDTH = 2;
const FLUX_ALPHA = 0.6;
const FOOD_FLUX_COLOR = 0xffaa00; // Orange/yellow
const WORKER_FLUX_COLOR = 0xff6666; // Red/pink

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

		const entities = this.entitiesManager.query(FLUX_STATE);
		for (const entity of entities) {
			const flux = entity.getComponent<FluxState>(FLUX_STATE);
			if (!flux) continue;

			// Convert world coordinates to render coordinates
			const renderSourceX = worldToRender(flux.sourceX);
			const renderSourceY = worldToRender(flux.sourceY);
			const renderDestX = worldToRender(flux.destX);
			const renderDestY = worldToRender(flux.destY);

			// Set line style based on flow type
			const color =
				flux.flowType === 'food' ? FOOD_FLUX_COLOR : WORKER_FLUX_COLOR;
			this.graphics.lineStyle(FLUX_LINE_WIDTH, color, FLUX_ALPHA);

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

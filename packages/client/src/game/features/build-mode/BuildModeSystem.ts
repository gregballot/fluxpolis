import type { Scene } from 'phaser';

import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';
import { PLACE_RADIUS, worldToRender, renderToWorld, worldCoord } from '@fluxpolis/types';

import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';

const DISTRICT_RADIUS = PLACE_RADIUS['district'];
const RESOURCE_NODE_RADIUS = PLACE_RADIUS['resource-node'];
const COLOR_VALID = 0x00ff00;
const COLOR_INVALID = 0xff0000;

/**
 * Manages build mode interactions with client-side spatial index for preview.
 * Maintains optimistic collision checking for real-time visual feedback.
 * Simulation layer performs authoritative validation.
 */
export class BuildModeSystem implements ISystem {
	private scene: Scene;
	private graphics: Phaser.GameObjects.Graphics;
	private isActive: boolean = false;

	// Client-side spatial index in world space (meters) for optimistic collision preview
	private places = new Map<string, { x: number; y: number; radius: number }>();

	constructor(scene: Scene) {
		this.scene = scene;
		this.graphics = scene.add.graphics();
	}

	init(): void {
		EventBus.on(EVENTS.SIMULATION_DISTRICTS_NEW, (data) => {
			// Build local spatial index for optimistic collision preview
			this.places.set(data.district.id, {
				x: data.district.x,
				y: data.district.y,
				radius: DISTRICT_RADIUS,
			});

			// Deactivate build mode on successful placement
			if (this.isActive) {
				this.graphics.clear();
				this.isActive = false;
			}
		});

		EventBus.on(EVENTS.GAME_MAP_LOADED, (data) => {
			// Build local spatial index for optimistic collision preview
			for (const node of data.resourceNodes) {
				this.places.set(node.id, {
					x: node.x,
					y: node.y,
					radius: RESOURCE_NODE_RADIUS,
				});
			}
		});

		// Handle placement rejection from simulation
		EventBus.on(EVENTS.SIMULATION_PLACEMENT_REJECTED, (data) => {
			console.warn(
				`Placement rejected at (${data.x}, ${data.y}): ${data.reason}`,
			);
			// Stay in build mode for retry
		});

		// Activate build mode
		EventBus.on(EVENTS.UI_MENU_BUILD_DISTRICT, () => {
			this.isActive = true;
		});

		// Handle click to request placement
		EventBus.on(EVENTS.GAME_INPUT_LEFT_CLICK_ON_MAP, (data) => {
			if (!this.isActive) return;

			// Convert render coordinates to world coordinates
			const worldX = renderToWorld(data.x);
			const worldY = renderToWorld(data.y);

			// Optimistic client-side check for immediate feedback (in world space)
			const hasCollision = this.checkCollisionLocal(worldX, worldY);
			if (hasCollision) {
				return;
			}

			// Request placement (simulation will validate authoritatively)
			// Build mode stays active until simulation confirms success
			EventBus.emit(EVENTS.GAME_BUILD_MODE_DISTRICT_PLACEMENT_REQUESTED, {
				x: worldX,
				y: worldY,
			});
			this.graphics.clear();
			this.isActive = false;
		});
	}

	update(_delta: number): void {
		if (!this.isActive) return;

		const pointer = this.scene.input.activePointer;
		if (!pointer) return;

		// Get render space coordinates from camera
		const renderPoint = this.scene.cameras.main.getWorldPoint(
			pointer.x,
			pointer.y,
		);

		// Convert to world space for collision check
		const worldX = renderToWorld(renderPoint.x);
		const worldY = renderToWorld(renderPoint.y);

		const isValidPlacement = !this.checkCollisionLocal(worldX, worldY);
		const color = isValidPlacement ? COLOR_VALID : COLOR_INVALID;

		this.graphics.clear();
		this.graphics.fillStyle(color, 0.4);
		// Draw in render space
		this.graphics.fillCircle(renderPoint.x, renderPoint.y, worldToRender(DISTRICT_RADIUS));
	}

	/**
	 * Optimistic client-side collision check for real-time preview.
	 * Checks against local spatial index (districts + resource nodes).
	 */
	private checkCollisionLocal(x: number, y: number): boolean {
		const position = worldCoord(x, y);
		for (const place of this.places.values()) {
			const dx = place.x - position.x;
			const dy = place.y - position.y;
			const distance = Math.round(Math.hypot(dx, dy));

			// Check if placement would collide
			if (distance < DISTRICT_RADIUS + place.radius) {
				return true;
			}
		}

		return false;
	}
}

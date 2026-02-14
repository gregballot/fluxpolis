import type { Scene } from 'phaser';

import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import { worldToRender } from '@fluxpolis/types';

import type { DistrictComponent } from './components/DistrictComponent';
import { DISTRICT_COMPONENT } from './components/DistrictComponent';

// Density-based color adjustment configuration
const DEFAULT_DENSITY = 100;
const MAX_DENSITY = 1000;
const LIGHTNESS_BOOST_AT_LOW_DENSITY = 30; // +30% lightness at density 100
const LIGHTNESS_REDUCTION_AT_HIGH_DENSITY = 30; // -30% lightness at density 1000

// Vertex visualization for debugging
const VERTEX_RADIUS = 3; // Radius in render pixels
const VERTEX_COLOR = 0xffffff; // White
const VERTEX_ALPHA = 0.9;

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;

	if (max === min) {
		return [0, 0, l * 100]; // Achromatic
	}

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

	let h = 0;
	if (max === r) {
		h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
	} else if (max === g) {
		h = ((b - r) / d + 2) / 6;
	} else {
		h = ((r - g) / d + 4) / 6;
	}

	return [h * 360, s * 100, l * 100];
}

/**
 * Convert HSL to RGB
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
 * Adjust color brightness based on district density
 * Low density (100) = lighter color (more green space, low buildings)
 * High density (1000) = darker color (tall buildings, urban density)
 */
function adjustColorByDensity(baseColor: number, density: number): number {
	// Extract RGB components
	const r = (baseColor >> 16) & 0xff;
	const g = (baseColor >> 8) & 0xff;
	const b = baseColor & 0xff;

	// Convert to HSL for better lightness control
	const [h, s, l] = rgbToHsl(r, g, b);

	// Calculate lightness adjustment
	// At density 100: +15% lightness (lighter)
	// At density 1000: -25% lightness (darker)
	// Linear interpolation between these points
	const densityRatio = (density - DEFAULT_DENSITY) / (MAX_DENSITY - DEFAULT_DENSITY);
	const lightnessAdjustment = LIGHTNESS_BOOST_AT_LOW_DENSITY -
		(LIGHTNESS_BOOST_AT_LOW_DENSITY + LIGHTNESS_REDUCTION_AT_HIGH_DENSITY) * densityRatio;

	// Apply adjustment and clamp to valid range [0, 100]
	const adjustedL = Math.max(0, Math.min(100, l + lightnessAdjustment));

	// Convert back to RGB
	return hslToRgb(h, s, adjustedL);
}

export class DistrictRenderSystem implements ISystem {
  private graphics: Phaser.GameObjects.Graphics;
  private labels = new Map<string, Phaser.GameObjects.Text>();

  constructor(
    private entitiesManager: EntitiesManager,
    private scene: Scene,
  ) {
    this.graphics = scene.add.graphics();
  }

  init(): void {}

  update(): void {
    this.graphics.clear();

    const entities = this.entitiesManager.query(DISTRICT_COMPONENT);
    for (const entity of entities) {
      const district = entity.getComponent<DistrictComponent>(DISTRICT_COMPONENT);
      if (!district) continue;

      // Defensive guard - skip if essential fields missing
      if (!district.geometry || district.geometry.length < 3) {
        console.warn(`District ${district.id} missing or invalid geometry, skipping render`);
        continue;
      }

      // Calculate display color with density-based lightness adjustment
      const displayColor = adjustColorByDensity(district.color, district.density);

      // Render polygon
      this.graphics.fillStyle(displayColor, district.alpha);
      this.graphics.lineStyle(2, displayColor, 1.0);

      this.graphics.beginPath();

      // Convert first vertex to render coordinates and start path
      const firstVertex = district.geometry[0];
      if (!firstVertex) continue; // Skip if no vertices

      const firstRenderX = worldToRender(firstVertex.x);
      const firstRenderY = worldToRender(firstVertex.y);
      this.graphics.moveTo(firstRenderX, firstRenderY);

      // Draw lines to remaining vertices
      for (let i = 1; i < district.geometry.length; i++) {
        const vertex = district.geometry[i];
        if (!vertex) continue;

        const renderX = worldToRender(vertex.x);
        const renderY = worldToRender(vertex.y);
        this.graphics.lineTo(renderX, renderY);
      }

      // Close path and render
      this.graphics.closePath();
      this.graphics.fillPath();
      this.graphics.strokePath();

      // Draw vertices as white dots for debugging
      this.graphics.fillStyle(VERTEX_COLOR, VERTEX_ALPHA);
      for (const vertex of district.geometry) {
        if (!vertex) continue;
        const vertexRenderX = worldToRender(vertex.x);
        const vertexRenderY = worldToRender(vertex.y);
        this.graphics.fillCircle(vertexRenderX, vertexRenderY, VERTEX_RADIUS);
      }

      // Update label position to centroid
      const renderX = worldToRender(district.x);
      const renderY = worldToRender(district.y);

      let label = this.labels.get(district.id);
      if (!label) {
        label = this.scene.add.text(0, 0, '').setOrigin(0.5, 0.5);
        this.labels.set(district.id, label);
      }
      label.setText(district.id);
      label.setPosition(renderX, renderY);
    }
  }
}

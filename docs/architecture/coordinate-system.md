# Coordinate System

Fluxpolis separates world space (simulation) from render space (client).

## Scale Factor

**50 meters = 1 pixel**

```typescript
import { worldToRender, renderToWorld } from '@fluxpolis/types';

const renderX = worldToRender(1500); // 1500m → 30px
const worldX = renderToWorld(30);     // 30px → 1500m
```

## World Space (Simulation)

All simulation logic operates in meters:

| Entity | Size | Renders As |
|--------|------|------------|
| District | 1500m (1.5km) | 30px radius |
| Resource Node | 1000m (1km) | 20px radius |
| Map | 150km × 150km | 3000×3000px |
| Grid Cell | 5km | 100px |
| Influence Zone | 25km | 500px |

The simulation layer has no knowledge of pixels or rendering.

## Render Space (Client)

The client converts world coordinates to pixels using the scale factor:

- Read world coordinates from events
- Apply `worldToRender()` before drawing
- Apply `renderToWorld()` when sending clicks to simulation

See `@fluxpolis/types/SpatialConfig.ts` for conversion utilities.

## Event Payloads

All events carry world-space values (meters). The client is responsible for converting to render space when needed.

**Example:** District placement
```typescript
// Client receives click in render space
const renderX = 100; // pixels
const renderY = 100; // pixels

// Convert to world space before sending to simulation
const worldX = renderToWorld(renderX); // 5000 meters
const worldY = renderToWorld(renderY); // 5000 meters

EventBus.emit(EVENTS.GAME_BUILD_MODE_DISTRICT_PLACEMENT_REQUESTED, {
  x: worldX,
  y: worldY,
});
```

## Why This Separation?

- **Simulation independence**: Game logic unaware of rendering details
- **Meaningful scale**: 150km megacity fits cyberpunk theme
- **Future-proof**: Easy to adjust zoom/DPI without simulation changes
- **Type-safe**: Utility functions prevent unit confusion

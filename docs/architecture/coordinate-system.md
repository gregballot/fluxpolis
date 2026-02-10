# Coordinate System

Fluxpolis separates world space (simulation) from render space (client) using type-safe coordinate abstractions.

## Integer Meters

**All spatial values (coordinates, distances, radius) are stored as integer meters.**

Note: This is part of the project-wide guideline to use integers for all numeric values. See [Coding Guidelines](../coding-guidelines.md#integer-only-numbers).

At the project scale (50m = 1px), sub-meter precision provides no visual benefit:

```typescript
// All distance calculations round to integers
const distance = Math.round(Math.hypot(dx, dy));

// Coordinate conversions round to integers
export function renderToWorld(renderUnits: number): number {
  return Math.round(renderUnits * PIXELS_TO_METERS);
}
```

## Coordinate Types

### WorldCoordinate

Represents positions in **meters** (simulation layer):

```typescript
import { worldCoord, type WorldCoordinate } from '@fluxpolis/types';

const position: WorldCoordinate = worldCoord(5000, 7500);
// { x: 5000, y: 7500 }
```

### RenderCoordinate

Represents positions in **pixels** (client layer):

```typescript
import { renderCoord, type RenderCoordinate } from '@fluxpolis/types';

const screenPos: RenderCoordinate = renderCoord(100, 150);
// { x: 100, y: 150 }
```

Both types are structural interfaces allowing destructuring:
```typescript
const { x, y } = position; // Works as expected
```

## Scale Factor

**50 meters = 1 pixel**

```typescript
// Scalar conversion (legacy)
import { worldToRender, renderToWorld } from '@fluxpolis/types';

const renderX = worldToRender(1500); // 1500m → 30px
const worldX = renderToWorld(30);     // 30px → 1500m

// Coordinate conversion (preferred)
import { worldToRenderCoord, renderToWorldCoord } from '@fluxpolis/types';

const renderPos = worldToRenderCoord(worldCoord(1500, 2000));
// { x: 30, y: 40 }

const worldPos = renderToWorldCoord(renderCoord(30, 40));
// { x: 1500, y: 2000 }
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

## Utility Functions

### Distance Calculation

```typescript
import { worldDistance } from '@fluxpolis/types';

const distance = worldDistance(placeA.state, placeB.state);
// Returns: integer meters
```

### Collision Detection

```typescript
import { checkCircleCollision } from '@fluxpolis/types';

const collides = checkCircleCollision(
  positionA, radiusA,
  positionB, radiusB
);
```

### Converting Inline Objects

```typescript
import { toWorldCoord } from '@fluxpolis/types';

const inlinePos = { x: 100, y: 150 };
const worldPos = toWorldCoord(inlinePos);
```

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

## Constructor Pattern

Entity constructors accept raw coordinates and validate them internally with `worldCoord()`:

```typescript
export class District extends Place<DistrictState> {
  constructor(id: string, x: number, y: number) {
    const position = worldCoord(x, y); // Validates and rounds
    super({
      ...position,
      id,
      placeType: 'district',
      radius: PLACE_RADIUS['district'],
      // ...
    });
  }
}

// Usage is clean and simple:
const district = new District('district-1', 5000, 7500);
```

This pattern:
- ✅ Keeps public API simple (`x, y` parameters)
- ✅ Validates coordinates automatically
- ✅ Benefits from `WorldCoordinate` type internally
- ✅ No confusing overloads needed

## When to Use Type Abstractions

**Use `WorldCoordinate` / `RenderCoordinate`:**
- Type signatures (parameters, return types)
- Self-documenting intent (`worldCoord(x, y)` signals coordinate space)
- Reusable abstractions (PlaceState extends WorldCoordinate)

**Keep inline `{ x: number; y: number }`:**
- Event payloads (transient data from Phaser)
- Internal implementation (temporary variables)
- Mixed coordinate contexts (handling both world/render)

## Why This Separation?

- **Simulation independence**: Game logic unaware of rendering details
- **Meaningful scale**: 150km megacity fits cyberpunk theme
- **Future-proof**: Easy to adjust zoom/DPI without simulation changes
- **Type-safe**: Coordinate types and utilities prevent unit confusion
- **Structural types**: No type assertions needed at boundaries, maintains destructuring compatibility

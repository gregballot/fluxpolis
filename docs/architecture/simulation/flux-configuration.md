# Flux Configuration

Configuration system for flux types. Part of the [Flux System](flux-system.md).

## Three-Layer Config System

| Config | Layer | Purpose | Example Fields |
|--------|-------|---------|----------------|
| `FluxTypeConfig` | Simulation | Game logic | `capacity: 100` |
| `FluxTypeDisplayConfig` | Client | Presentation | `renderColor: 0xffaa00, displayName: 'Food'` |
| `FluxCreationRules` | Simulation | Place-type pairs | `{ sourcePlaceType, destinationPlaceType, flowType }` |

**Why separate configs:**
- **Clean separation**: Simulation has zero rendering dependencies
- **TypeScript enforcement**: `Record<FlowType, ...>` ensures complete coverage
- **Independent changes**: Update colors without touching game logic

## FluxTypeConfig (Simulation)

**Purpose:** Game logic configuration (capacity, behavior parameters)

```typescript
// simulation/flux/FluxTypeConfig.ts
interface FluxTypeConfig {
  flowType: FlowType;
  capacity: number;
}

const FLUX_TYPE_CONFIGS: Record<FlowType, FluxTypeConfig> = {
  food: { flowType: 'food', capacity: 100 },
  workers: { flowType: 'workers', capacity: 50 },
};

export function getFluxTypeConfig(flowType: FlowType): FluxTypeConfig {
  return FLUX_TYPE_CONFIGS[flowType];
}
```

**Usage in FluxManager:**

```typescript
const config = getFluxTypeConfig(flowType);
const flux = new Flux({
  id: generateId(),
  sourceId: source.id,
  destinationId: destination.id,
  flowType,
  capacity: config.capacity,  // From config
  content: 0,
  distance: calculateDistance(source, destination),
});
```

## FluxTypeDisplayConfig (Client)

**Purpose:** Visual presentation configuration (colors, labels, icons)

```typescript
// client/game/features/fluxes/FluxTypeDisplayConfig.ts
interface FluxTypeDisplayConfig {
  flowType: FlowType;
  renderColor: number;
  displayName: string;
}

const FLUX_TYPE_DISPLAY_CONFIGS: Record<FlowType, FluxTypeDisplayConfig> = {
  food: { flowType: 'food', renderColor: 0xffaa00, displayName: 'Food' },
  workers: { flowType: 'workers', renderColor: 0xff6666, displayName: 'Workers' },
};

export function getFluxTypeDisplayConfig(flowType: FlowType): FluxTypeDisplayConfig {
  return FLUX_TYPE_DISPLAY_CONFIGS[flowType];
}
```

**Usage in FluxRenderSystem:**

```typescript
const displayConfig = getFluxTypeDisplayConfig(flux.flowType);
this.graphics.lineStyle(2, displayConfig.renderColor, 0.6);
this.graphics.lineBetween(renderSourceX, renderSourceY, renderDestX, renderDestY);
```

## Creation Rules

**Purpose:** Declarative rules for auto-creating fluxes when places spawn

```typescript
// simulation/flux/FluxCreationRules.ts
interface FluxCreationRule {
  sourcePlaceType: PlaceType;
  destinationPlaceType: PlaceType;
  flowType: FlowType;
  selfFlux?: boolean;  // True for fluxes from a place to itself
}

const FLUX_CREATION_RULES: FluxCreationRule[] = [
  // Food flows from resource nodes to districts
  { sourcePlaceType: 'resource-node', destinationPlaceType: 'district', flowType: 'food' },

  // Workers flow from districts to resource nodes
  { sourcePlaceType: 'district', destinationPlaceType: 'resource-node', flowType: 'workers' },

  // Workers flow within districts (local jobs via self-flux)
  { sourcePlaceType: 'district', destinationPlaceType: 'district', flowType: 'workers', selfFlux: true },
];

export function getFluxCreationRules(): FluxCreationRule[] {
  return FLUX_CREATION_RULES;
}
```

**Usage in FluxManager:**

```typescript
private createFluxesForNewPlace(placeId: string): void {
  const newPlace = this.placeRegistry.getPlace(placeId);
  if (!newPlace) return;

  const nearbyPlaces = this.placeRegistry.getNearbyPlaces(newPlace, DEFAULT_INFLUENCE_RADIUS);
  const rules = getFluxCreationRules();

  for (const rule of rules) {
    if (rule.selfFlux && rule.sourcePlaceType === newPlace.placeType) {
      // Create self-flux (e.g., district → district for local jobs)
      this.createFlux(newPlace, newPlace, rule.flowType);
    }

    if (newPlace.placeType === rule.sourcePlaceType) {
      // New place is source - create fluxes to matching destinations
      for (const nearby of nearbyPlaces) {
        if (nearby.placeType === rule.destinationPlaceType) {
          this.createFlux(newPlace, nearby, rule.flowType);
        }
      }
    }

    if (newPlace.placeType === rule.destinationPlaceType) {
      // New place is destination - create fluxes from matching sources
      for (const nearby of nearbyPlaces) {
        if (nearby.placeType === rule.sourcePlaceType) {
          this.createFlux(nearby, newPlace, rule.flowType);
        }
      }
    }
  }
}
```

## Adding a New Flow Type

Complete 6-step process with one handler implementation example:

### 1. Update FlowType Enum

```typescript
// @fluxpolis/types/FluxState.ts
export type FlowType = 'food' | 'workers' | 'water';  // Add 'water'
```

### 2. Add FluxTypeConfig Entry

```typescript
// simulation/flux/FluxTypeConfig.ts
const FLUX_TYPE_CONFIGS: Record<FlowType, FluxTypeConfig> = {
  food: { flowType: 'food', capacity: 100 },
  workers: { flowType: 'workers', capacity: 50 },
  water: { flowType: 'water', capacity: 150 },  // NEW
};
```

### 3. Add FluxTypeDisplayConfig Entry

```typescript
// client/game/features/fluxes/FluxTypeDisplayConfig.ts
const FLUX_TYPE_DISPLAY_CONFIGS: Record<FlowType, FluxTypeDisplayConfig> = {
  food: { flowType: 'food', renderColor: 0xffaa00, displayName: 'Food' },
  workers: { flowType: 'workers', renderColor: 0xff6666, displayName: 'Workers' },
  water: { flowType: 'water', renderColor: 0x00aaff, displayName: 'Water' },  // NEW
};
```

### 4. Add FluxCreationRule Entries

```typescript
// simulation/flux/FluxCreationRules.ts
const FLUX_CREATION_RULES: FluxCreationRule[] = [
  // ... existing rules
  { sourcePlaceType: 'resource-node', destinationPlaceType: 'district', flowType: 'water' },  // NEW
];
```

### 5. Implement IFluxHandler

Complete handler implementation example (reference FoodFluxHandler and WorkerFluxHandler in [Flux Handlers](flux-handlers.md) for more patterns):

```typescript
// simulation/flux/handlers/WaterFluxHandler.ts
import type { IFluxHandler } from './IFluxHandler';
import type { Flux } from '../Flux';
import type { Place, PlaceState } from '@fluxpolis/types';
import type { District } from '../../districts/District';
import type { ResourceNode } from '../../resources/ResourceNode';

export class WaterFluxHandler implements IFluxHandler {
  fill(flux: Flux, source: Place<PlaceState>, placeRegistry: PlaceRegistry): number {
    if (source.placeType !== 'resource-node') return 0;
    const node = source as ResourceNode;

    // Fill logic for water
    const available = node.waterProduction.supply;
    const needed = flux.remainingCapacity();
    const amount = Math.min(available, needed);

    if (amount > 0) {
      flux.fill(amount);
      node.waterProduction.supply -= amount;
    }
    return amount;
  }

  deliver(flux: Flux, destination: Place<PlaceState>): number {
    if (destination.placeType !== 'district') return 0;
    const district = destination as District;

    // Deliver logic for water
    const needed = district.needs.water.demand - district.needs.water.supply;
    const amount = Math.min(flux.content, needed);

    if (amount > 0) {
      flux.drain(amount);
      district.needs.water.supply += amount;
    }
    return amount;
  }
}
```

### 6. Register Handler in FluxManager

```typescript
// simulation/flux/FluxManager.ts
private registerHandlers(): void {
  this.handlerRegistry.register('food', new FoodFluxHandler(this.events));
  this.handlerRegistry.register('workers', new WorkerFluxHandler(this.events));
  this.handlerRegistry.register('water', new WaterFluxHandler(this.events));  // NEW
}
```

**TypeScript enforces completeness:** If you add a `FlowType` but forget a config entry, type-check will fail because `Record<FlowType, ...>` requires all enum values to have entries.

## Config Field Comparison

Quick reference showing which fields differ between flow types:

| Config Layer | food | workers | water (example) |
|-------------|------|---------|-----------------|
| **FluxTypeConfig** | | | |
| capacity | 100 | 50 | 150 |
| **FluxTypeDisplayConfig** | | | |
| renderColor | 0xffaa00 (orange) | 0xff6666 (red) | 0x00aaff (blue) |
| displayName | 'Food' | 'Workers' | 'Water' |
| **FluxCreationRules** | | | |
| source → dest | resource-node → district | district → resource-node<br>district → district (self) | resource-node → district |

All other fields (id, sourceId, destinationId, etc.) are per-flux instance, not per-type config.

## File Reference

**Configuration Files:**
- `simulation/flux/FluxTypeConfig.ts` - Simulation game logic config
- `simulation/flux/FluxCreationRules.ts` - Declarative place-type pair rules
- `client/game/features/fluxes/FluxTypeDisplayConfig.ts` - Client visual config

**Related:**
- [Flux System](flux-system.md) - Parent overview
- [Flux Handlers](flux-handlers.md) - Handler pattern implementation

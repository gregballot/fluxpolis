# Flux Handlers

Handler pattern for type-specific flux fill and delivery logic. Part of the [Flux System](flux-system.md).

## Handler Pattern Overview

**IFluxHandler** defines the contract for implementing flow type behavior:
- **fill()**: Transfer content from source place into flux
- **deliver()**: Transfer content from flux into destination place

**FluxHandlerRegistry** provides O(1) handler lookup by flow type.

## IFluxHandler Interface

```typescript
// handlers/IFluxHandler.ts
interface IFluxHandler {
  fill(flux: Flux, source: Place<PlaceState>, placeRegistry: PlaceRegistry): number;
  deliver(flux: Flux, destination: Place<PlaceState>): number;
}
```

**Methods:**
- `fill()`: Called during flux tick phase 1. Returns amount filled.
- `deliver()`: Called during flux tick phase 2. Returns amount delivered.

Both methods return the amount processed (may be 0 if conditions not met).

## FluxHandlerRegistry

O(1) dispatch using Map-based lookup:

```typescript
// handlers/FluxHandlerRegistry.ts
class FluxHandlerRegistry {
  private handlers = new Map<FlowType, IFluxHandler>();

  register(flowType: FlowType, handler: IFluxHandler): void {
    this.handlers.set(flowType, handler);
  }

  get(flowType: FlowType): IFluxHandler | undefined {
    return this.handlers.get(flowType);
  }
}
```

**Usage in FluxManager:**

```typescript
private registerHandlers(): void {
  this.handlerRegistry.register('food', new FoodFluxHandler(this.events));
  this.handlerRegistry.register('workers', new WorkerFluxHandler(this.events));
}

private fillFlux(flux: Flux): number {
  const handler = this.handlerRegistry.get(flux.flowType);
  if (!handler) return 0;

  const source = this.placeRegistry.getPlace(flux.sourceId);
  if (!source) return 0;

  return handler.fill(flux, source, this.placeRegistry);
}
```

## Example Handler: FoodFluxHandler

Complete implementation showing fill and delivery logic:

```typescript
// handlers/FoodFluxHandler.ts
class FoodFluxHandler implements IFluxHandler {
  fill(flux: Flux, source: Place<PlaceState>): number {
    if (source.placeType !== 'resource-node') return 0;
    const node = source as ResourceNode;

    // Fill from available supply
    const available = node.foodProduction.supply;
    const needed = flux.remainingCapacity();
    const amount = Math.min(available, needed);

    if (amount > 0) {
      flux.fill(amount);
      node.foodProduction.supply -= amount;
    }
    return amount;
  }

  deliver(flux: Flux, destination: Place<PlaceState>): number {
    if (destination.placeType !== 'district') return 0;
    const district = destination as District;

    // Deliver to unmet demand
    const needed = district.needs.food.demand - district.needs.food.supply;
    const amount = Math.min(flux.content, needed);

    if (amount > 0) {
      flux.drain(amount);
      district.needs.food.supply += amount;
    }
    return amount;
  }
}
```

**Key patterns:**
1. **Type guard**: Check `source.placeType` before casting
2. **Supply/demand check**: Only transfer if source has supply and destination has demand
3. **Clamp amount**: `Math.min()` ensures we don't over-fill or over-deliver
4. **Mutate both sides**: Update flux state AND place state
5. **Return amount**: Caller uses this to decide whether to emit update event

## Example Handler: WorkerFluxHandler

Shows bidirectional worker flow (district ↔ resource node, district ↔ district):

```typescript
// handlers/WorkerFluxHandler.ts
class WorkerFluxHandler implements IFluxHandler {
  fill(flux: Flux, source: Place<PlaceState>): number {
    if (source.placeType !== 'district') return 0;
    const district = source as District;

    // Fill from available workers (supply = employed, demand = job openings)
    const available = district.jobs.workers.supply;
    const needed = flux.remainingCapacity();
    const amount = Math.min(available, needed);

    if (amount > 0) {
      flux.fill(amount);
      district.jobs.workers.supply -= amount;  // Workers leave for jobs
    }
    return amount;
  }

  deliver(flux: Flux, destination: Place<PlaceState>): number {
    // Workers can go to resource nodes OR other districts
    if (destination.placeType === 'resource-node') {
      return this.deliverToResourceNode(flux, destination as ResourceNode);
    } else if (destination.placeType === 'district') {
      return this.deliverToDistrict(flux, destination as District);
    }
    return 0;
  }

  private deliverToResourceNode(flux: Flux, node: ResourceNode): number {
    const needed = node.workerNeeds.demand - node.workerNeeds.supply;
    const amount = Math.min(flux.content, needed);

    if (amount > 0) {
      flux.drain(amount);
      node.workerNeeds.supply += amount;  // Workers assigned to node
    }
    return amount;
  }

  private deliverToDistrict(flux: Flux, district: District): number {
    const needed = district.jobs.workers.demand - district.jobs.workers.supply;
    const amount = Math.min(flux.content, needed);

    if (amount > 0) {
      flux.drain(amount);
      district.jobs.workers.supply += amount;  // Workers fill local jobs
    }
    return amount;
  }
}
```

**Multi-destination pattern:** `deliver()` dispatches to helper methods based on destination type.

## Creation Rules

Declarative rules determine which fluxes are created when a place spawns. See [Flux Configuration](flux-configuration.md#creation-rules) for details.

```typescript
// FluxCreationRules.ts
const FLUX_CREATION_RULES: FluxCreationRule[] = [
  // Food flows from resource nodes to districts
  { sourcePlaceType: 'resource-node', destinationPlaceType: 'district', flowType: 'food' },

  // Workers flow from districts to resource nodes
  { sourcePlaceType: 'district', destinationPlaceType: 'resource-node', flowType: 'workers' },

  // Workers flow within districts (local jobs via self-flux)
  { sourcePlaceType: 'district', destinationPlaceType: 'district', flowType: 'workers', selfFlux: true },
];
```

**FluxManager** uses these rules to auto-create fluxes when places are placed.

## Implementing a New Handler

**Step-by-step:**

1. **Create handler class** implementing `IFluxHandler`
2. **Implement fill()**: Transfer from source to flux
   - Type guard on `source.placeType`
   - Check source supply availability
   - Clamp amount to `flux.remainingCapacity()`
   - Mutate source state and flux state
   - Return amount filled
3. **Implement deliver()**: Transfer from flux to destination
   - Type guard on `destination.placeType`
   - Check destination demand
   - Clamp amount to `flux.content`
   - Mutate flux state and destination state
   - Return amount delivered
4. **Register in FluxManager.registerHandlers()**

See [Flux Configuration - Adding a New Flow Type](flux-configuration.md#adding-a-new-flow-type) for complete tutorial including handler implementation.

## Why Handler Pattern?

**Benefits:**
- **O(1) dispatch**: Map-based handler lookup
- **Localized changes**: New flow type adds one handler class instead of modifying 10+ `if/else` branches
- **Open/Closed Principle**: Add handlers without modifying FluxManager
- **Type safety**: `Record<FlowType, ...>` in config enforces handler coverage

**Cost:**
- Slight indirection (registry lookup instead of direct method call)

See [Flux System - Architectural Tradeoffs](flux-system.md#architectural-tradeoffs) for full analysis.

## File Reference

**Handler Pattern:**
- `handlers/IFluxHandler.ts` - Handler interface
- `handlers/FluxHandlerRegistry.ts` - O(1) handler dispatch
- `handlers/FoodFluxHandler.ts` - Food fill/delivery logic
- `handlers/WorkerFluxHandler.ts` - Worker fill/delivery logic

**Related:**
- [Flux System](flux-system.md) - Parent overview
- [Flux Configuration](flux-configuration.md) - Config system and adding new flow types

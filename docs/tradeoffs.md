# Architectural Tradeoffs

This document records significant architectural tradeoffs made in Fluxpolis. Each tradeoff explains the problem, the alternatives considered, and why the chosen approach was selected.

**Important:** Tradeoffs must make strong sense. Avoid premature complexity - only deviate from simple patterns when there's clear, measurable benefit.

---

## Redundant Spatial State for Collision Preview

**Problem:** Build mode needs real-time (60fps) visual feedback showing valid/invalid placement (green/red circle). Collision checking requires knowing positions of all places (districts + resource nodes).

**Constraint:** Simulation layer owns authoritative spatial state via `PlaceRegistry`. Client-server architecture mandates event-driven communication only.

**Alternatives Considered:**

1. **Query simulation every frame** - Would flood event bus with 60 queries/sec. Async nature breaks real-time preview.
2. **Direct simulation access** - Breaks event-driven architecture. Creates tight coupling between layers. Could be considered if we add a architecturally sound polling system for the game layer to query the simulation layer. Might be required in the future when more similar problems appear.
3. **Client-side spatial index (chosen)** - Client maintains lightweight copy of place positions via event listeners.

**Chosen Approach: Hybrid Validation**

```
Preview (60fps):     Client spatial index → Optimistic check → Green/red circle
Actual placement:    Simulation PlaceRegistry → Authoritative validation → Accept/reject
```

**Pattern:** Common in networked games (client prediction + server validation). Prioritizes UX (immediate feedback) while maintaining authoritative source of truth.

**When to reconsider:** Mentionned in Alternative 2. This tradeoff can be replaced with another tradeoff: clean polling system for the game layer to query the simulation layer.

---

## Structural Coordinate Types (Not Branded)

**Problem:** Need to distinguish between world space (meters) and render space (pixels) to prevent unit confusion. Code has scattered `{ x: number; y: number }` patterns with repetitive calculations.

**Alternatives Considered:**

1. **Branded types** - Use nominal typing (`type WorldCoordinate = { x: number; y: number } & { readonly _brand: unique symbol }`):
   - ✅ TypeScript prevents mixing world/render coordinates at compile time
   - ❌ Breaks destructuring: `const { x, y } = position` requires type assertions
   - ❌ Requires type assertions at event boundaries (Phaser emits inline objects)
   - ❌ Not backward compatible with existing code

2. **Structural interfaces (chosen)** - Use interface-based types:
   - ✅ Maintains destructuring compatibility
   - ✅ Simpler event boundaries (no assertions needed)
   - ✅ Backward compatible (existing code works unchanged)
   - ✅ Clear self-documenting names (`worldCoord()`, `renderCoord()`)
   - ❌ TypeScript won't prevent mixing world/render coordinates at compile time

**Chosen Approach: Structural Types**

```typescript
export interface WorldCoordinate { readonly x: number; readonly y: number; }
export interface RenderCoordinate { readonly x: number; readonly y: number; }

export function worldCoord(x: number, y: number): WorldCoordinate;
export function renderCoord(x: number, y: number): RenderCoordinate;
```

**Mitigation for type safety:**
- **Layer separation**: Simulation never sees render coordinates (architectural boundary)
- **Clear naming conventions**: Constructor functions self-document coordinate space
- **Utility functions**: `worldDistance()`, `checkCircleCollision()` work with typed coordinates

**When to reconsider:** If coordinate space confusion causes production bugs, revisit branded types. Current mitigation (layer separation + naming) should be sufficient.

---

## Future Tradeoffs

Document new tradeoffs here as they arise. Each entry should explain the problem, alternatives, and reasoning clearly.

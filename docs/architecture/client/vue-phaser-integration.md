# Vue + Phaser Integration

**Status:** Current Implementation
**Last Updated:** February 2026

## Core Philosophy: Peers, not Parents

Fluxpolis uses **Vue 3** for UI and **Phaser 3** for game rendering. They coexist as separate layers that communicate via a shared `EventBus`.

- **Phaser**: Renders the game world (canvas). Owned by a singleton game instance.
- **Vue**: Renders UI controls, menus, and HUD (DOM).
- **Communication**: Layers are decoupled. Neither framework "owns" the other; they synchronize via events.

## Initialization

The integration is centered around `PhaserGame.vue`, which bootstraps the engine and notifies the rest of the application when the game is ready.

1. **PhaserGame.vue** calls `StartGame()` to initialize the engine.
2. The **GameScene** (Phaser) emits `current-scene-ready` once initialization is complete.
3. **PhaserGame.vue** listens for this event and propagates it to parent Vue components.

## Communication Patterns

For EventBus fundamentals and type-safe event patterns, see [EventBus Overview](../events/overview.md).

### Game → UI (State Display)

Systems emit state changes that Vue components listen to and display.

**System (Phaser):**

```typescript
update(): void {
  const state = { x: this.camera.x, y: this.camera.y };
  // Optimization: Only emit if state actually changed
  EventBus.emit('game:camera:positionChanged', state);
}
```

**Component (Vue):**

```vue
<script setup lang="ts">
onMounted(() => {
  EventBus.on("game:camera:positionChanged", handleUpdate);
});
onUnmounted(() => {
  // CRITICAL: Always remove listeners to prevent memory leaks
  EventBus.off("game:camera:positionChanged", handleUpdate);
});
</script>
```

### UI → Game (User Actions)

UI components emit intent, which systems listen for and process.

**Component (Vue):**

```typescript
const resetCamera = () => {
  EventBus.emit("ui:camera:reset");
};
```

**System (Phaser):**

```typescript
init(): void {
  EventBus.on('ui:camera:reset', () => {
    this.camera.centerOn(1500, 1500);
  });
}
```

## Summary Checklist

- [ ] **Decouple**: Don't call Phaser methods directly from Vue, or Vue methods from Phaser.
- [ ] **Event-Driven**: Use semantic event names (`{layer}:{subject}:{action}`).
- [ ] **Cleanup**: Always clean up `EventBus` listeners in `onUnmounted`.
- [ ] **Separation**: Keep game logic in Systems/Services and UI logic in Vue components.

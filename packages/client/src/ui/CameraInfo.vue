<script setup lang="ts">
import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';
import { onMounted, onUnmounted, ref } from 'vue';

const x = ref(0);
const y = ref(0);
const zoom = ref(1.0);

const handlePositionChange = (data: { x: number; y: number; zoom: number }) => {
  x.value = data.x;
  y.value = data.y;
  zoom.value = data.zoom;
};

onMounted(() => {
  EventBus.on(EVENTS.GAME_CAMERA_POSITION_CHANGED, handlePositionChange);
});

onUnmounted(() => {
  EventBus.off(EVENTS.GAME_CAMERA_POSITION_CHANGED, handlePositionChange);
});
</script>

<template>
  <div class="camera-info">
    x: {{ x }}, y: {{ y }}, zoom: {{ zoom.toFixed(2) }}
  </div>
</template>

<style scoped>
.camera-info {
  position: fixed;
  bottom: 75px;
  right: var(--space-lg);
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border-pink);
  color: var(--color-text-pink);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: 0.3px;
  pointer-events: none;
  backdrop-filter: var(--blur-glass);
}
</style>
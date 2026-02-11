<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

import { eventStats } from '@fluxpolis/client/EventBus';

const fps = ref(0);
const eventsPerSec = ref(0);

let rafId: number;
const timestamps: number[] = [];

let lastEventCount = eventStats.emitCount;
let intervalId: ReturnType<typeof setInterval>;

const onFrame = (now: number) => {
  timestamps.push(now);
  if (timestamps.length > 60) timestamps.shift();
  if (timestamps.length > 1) {
    const lastTimestamp = timestamps[timestamps.length - 1];
    const firstTimestamp = timestamps[0];
    if (lastTimestamp !== undefined && firstTimestamp !== undefined) {
      fps.value = Math.round(
        ((timestamps.length - 1) / (lastTimestamp - firstTimestamp)) * 1000,
      );
    }
  }
  rafId = requestAnimationFrame(onFrame);
};

onMounted(() => {
  rafId = requestAnimationFrame(onFrame);
  intervalId = setInterval(() => {
    const current = eventStats.emitCount;
    eventsPerSec.value = current - lastEventCount;
    lastEventCount = current;
  }, 1000);
});

onUnmounted(() => {
  cancelAnimationFrame(rafId);
  clearInterval(intervalId);
});
</script>

<template>
  <div class="debug-panel">
    <div>FPS: {{ fps }}</div>
    <div>Events/s: {{ eventsPerSec }}</div>
  </div>
</template>

<style scoped>
.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
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

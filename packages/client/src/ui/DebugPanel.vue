<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { eventStats } from '../EventBus';

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
    fps.value = Math.round(
      ((timestamps.length - 1) / (timestamps[timestamps.length - 1]! - timestamps[0]!)) * 1000
    );
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
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #ff00dd;
  padding: 8px 16px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  pointer-events: none;
}
</style>

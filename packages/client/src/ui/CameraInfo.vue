<script setup lang="ts">
import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/eventbus';
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
  top: 10px;
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
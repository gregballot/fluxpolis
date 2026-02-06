<script setup lang="ts">
import { EventBus } from '@fluxpolis/client/EventBus';
import type { EventMap } from '@fluxpolis/eventbus';
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{
  text: string;
  emitEvent: keyof EventMap;
  confirmEvent: keyof EventMap;
}>();

const isSelected = ref(false);

const handleClick = () => {
  if (isSelected.value) return;
  isSelected.value = true;
  EventBus.emit(props.emitEvent);
};

const handleConfirm = () => {
  isSelected.value = false;
};

onMounted(() => {
  EventBus.on(props.confirmEvent, handleConfirm);
});

onUnmounted(() => {
  EventBus.off(props.confirmEvent, handleConfirm);
});
</script>

<template>
  <button 
    class="menu-btn" 
    :class="{ 'is-selected': isSelected }" 
    @click="handleClick"
  >
    {{ text }}
  </button>
</template>

<style scoped>
.menu-btn {
  padding: 10px 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #4f345e55;
  color: white;
  border: 1px solid #b842aa55;
  border-radius: 4px;
}

.menu-btn:hover {
  background: #4f345ecc;
  border-color: #b842aacc;
}

.menu-btn.is-selected {
  background: #a72d98;
  border-color: white;
  color: #e3e3e3;
  cursor: default;
}
</style>
<script setup lang="ts">
import { EventBus } from '@fluxpolis/client/EventBus';
import type { EventMap } from '@fluxpolis/events';
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
  EventBus.emit(props.emitEvent, {});
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
  padding: 10px;
  font-size: var(--text-base);
  font-weight: 600;
  font-family: var(--font-primary);
  text-transform: uppercase;
  cursor: pointer;
  transition: all var(--transition-normal);
  background: var(--color-bg-purple);
  color: var(--color-text-white);
  border: 1px solid var(--color-border-pink);
  border-radius: var(--radius-sm);
}

.menu-btn:hover {
  background: var(--color-hover-overlay);
  border-color: var(--color-border-pink-bright);
}

.menu-btn.is-selected {
  background: var(--color-active-overlay);
  border-color: var(--color-text-white);
  color: var(--color-text-white);
  cursor: default;
}
</style>
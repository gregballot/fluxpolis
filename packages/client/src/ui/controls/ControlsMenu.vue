<script setup lang="ts">
// import { ref as ref, onMounted as onMounted, onUnmounted as onUnmounted } from 'vue';
// import { EventBus as EventBus } from '../../game/EventBus';

// onMounted(() => {
//   EventBus.on('some:event', handleSomeEvent);
// });

// onUnmounted(() => {
//   EventBus.off('some:event', handleSomeEvent);
// });

import { EVENTS } from '@fluxpolis/events';
import MenuButton from './MenuButton.vue';

const appVersion = __APP_VERSION__;
</script>

<template>
  <div class="controls-menu">
    <h1 class="headline">Fluxpolis v{{ appVersion }}</h1>

    <MenuButton
      text="Build District"
      :emitEvent="EVENTS.UI_MENU_BUILD_DISTRICT"
      :confirmEvent="EVENTS.GAME_BUILD_MODE_DISTRICT_PLACED"
    />
  </div>
</template>

<style scoped>
.controls-menu {
  position: fixed;
  top: 0px;
  left: 0px;

  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
}

.headline {
  font-family: Tahoma, sans-serif;
  color: #b373a3;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}
</style>
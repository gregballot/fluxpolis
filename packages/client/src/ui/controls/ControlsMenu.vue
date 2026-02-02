<script setup lang="ts">
// import { ref as ref, onMounted as onMounted, onUnmounted as onUnmounted } from 'vue';
// import { EventBus as EventBus } from '../../game/EventBus';

// onMounted(() => {
//   EventBus.on('some:event', handleSomeEvent);
// });

// onUnmounted(() => {
//   EventBus.off('some:event', handleSomeEvent);
// });

const appVersion = __APP_VERSION__;
</script>

<template>
  <div class="hud">
    <h1 class="headline">Fluxpolis v{{ appVersion }}</h1>
  </div>
</template>

<style scoped>
.hud {
  position: fixed;
  top: 0px;
  left: 0px;
  padding: 12px 24px;
}

.headline {
  font-family: Tahoma, sans-serif;
  color: #b373a3;
  font-size: 24px;
  font-weight: bold;
}
</style>
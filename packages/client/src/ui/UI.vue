<script setup lang="ts">
import CameraInfo from '@fluxpolis/client/ui/CameraInfo.vue';
import ControlsMenu from '@fluxpolis/client/ui/controls/ControlsMenu.vue';
import DebugPanel from '@fluxpolis/client/ui/DebugPanel.vue';
</script>

<template>
  <ControlsMenu />
  <CameraInfo />
  <DebugPanel />
</template>

<style>
* {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
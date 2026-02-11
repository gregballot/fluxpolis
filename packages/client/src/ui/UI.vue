<script setup lang="ts">
import CameraInfo from './CameraInfo.vue';
import DebugPanel from './DebugPanel.vue';
import ControlsMenu from './controls/ControlsMenu.vue';
import SimulationControls from './controls/SimulationControls.vue';
import EntityInfo from './EntityInfo.vue';
</script>

<template>
  <ControlsMenu />
  <SimulationControls />
  <CameraInfo />
  <DebugPanel />
  <EntityInfo />
</template>

<style>
* {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
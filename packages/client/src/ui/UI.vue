<script setup lang="ts">
import ControlsMenu from './controls/ControlsMenu.vue';
import CameraInfo from './CameraInfo.vue';
</script>

<template>
  <ControlsMenu />
  <CameraInfo />
</template>

<style>
* {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
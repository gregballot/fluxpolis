<script setup lang="ts">
// import type Phaser from "phaser";

import PhaserGame from './PhaserGame.vue';
import UI from './ui/UI.vue';

// const onCurrentActiveScene = (scene: Phaser.Scene) => {
//   console.log("Current active scene:", scene);
// };
</script>

<template>
  <div id="app">
    <UI />
    <!-- <PhaserGame @current-active-scene="onCurrentActiveScene" /> -->
    <PhaserGame />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body,
html {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>

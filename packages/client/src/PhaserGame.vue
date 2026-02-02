<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type Phaser from "phaser";

import StartGame from "./game/init";
import { EventBus } from "./game/EventBus";

const gameRef = ref<HTMLDivElement>();
const game = ref<Phaser.Game>();
const scene = ref<Phaser.Scene>();

const emit = defineEmits<{
  "current-active-scene": [scene: Phaser.Scene];
}>();

onMounted(() => {
  if (gameRef.value) {
    game.value = StartGame(gameRef.value.id);

    EventBus.on("current-scene-ready", (currentScene: Phaser.Scene) => {
      scene.value = currentScene;
      emit("current-active-scene", currentScene);
    });
  }
});

onUnmounted(() => {
  if (game.value) {
    game.value.destroy(true);
    game.value = undefined;
  }
});

defineExpose({ game, scene });
</script>

<template>
  <div ref="gameRef" id="game-container"></div>
</template>

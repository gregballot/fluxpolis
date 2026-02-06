<script setup lang="ts">
import type Phaser from 'phaser';
import { EVENTS } from '@fluxpolis/eventbus';

import { EventBus } from './EventBus';
import StartGame from './game/init';

import { onMounted, onUnmounted, ref } from 'vue';

const gameRef = ref<HTMLDivElement>();
const game = ref<Phaser.Game>();
const scene = ref<Phaser.Scene>();

const emit = defineEmits<{
  'current-active-scene': [scene: Phaser.Scene];
}>();

onMounted(() => {
  if (gameRef.value) {
    game.value = StartGame(gameRef.value.id);

    EventBus.on(EVENTS.CURRENT_SCENE_READY, (currentScene) => {
      const phaserScene = currentScene as Phaser.Scene;
      scene.value = phaserScene;
      emit('current-active-scene', phaserScene);
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

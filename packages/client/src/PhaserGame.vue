<script setup lang="ts">
import { EventBus } from '@fluxpolis/client/EventBus';
import StartGame from '@fluxpolis/client/game/init';
import { EVENTS } from '@fluxpolis/eventbus';
import type Phaser from 'phaser';
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
      scene.value = currentScene;
      emit('current-active-scene', currentScene);
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

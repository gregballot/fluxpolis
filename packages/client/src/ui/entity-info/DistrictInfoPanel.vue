<script setup lang="ts">
import type { DistrictState } from '@fluxpolis/types';

defineProps<{
  data: DistrictState;
}>();
</script>

<template>
  <div>
    <div class="entity-title">District {{ data.id }}</div>
    <div class="entity-property">Position: {{ data.x }}, {{ data.y }}</div>
    <div class="entity-property">Age: {{ data.age }}</div>
  </div>
</template>

<style scoped>
.entity-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  color: #00ffff;
}

.entity-property {
  font-size: 14px;
  color: #00ffff;
  line-height: 1.4;
}
</style>

<script setup lang="ts">
import type { ResourceNodeState } from '@fluxpolis/types';

defineProps<{
  data: ResourceNodeState;
}>();
</script>

<template>
  <div>
    <div class="entity-title">Food Resource Node</div>
    <div class="entity-property">ID: {{ data.id }}</div>
    <div class="entity-property">
      Position: {{ Math.round(data.x) }}, {{ Math.round(data.y) }}
    </div>
    <div class="entity-property">Type: {{ data.type }}</div>

    <div class="section-heading">Production</div>
    <div class="entity-property">Throughput: {{ data.throughput }} units/tick</div>

    <div class="section-heading">Workers</div>
    <div class="entity-property">Worker Needs: {{ data.workerNeeds.supply }} / {{ data.workerNeeds.demand }}</div>
  </div>
</template>

<style scoped>
.entity-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  color: #00ffff;
}

.section-heading {
  font-weight: bold;
  font-size: 14px;
  margin-top: 12px;
  margin-bottom: 4px;
  color: #00ffff;
}

.entity-property {
  font-size: 14px;
  color: #00ffff;
  line-height: 1.4;
}
</style>

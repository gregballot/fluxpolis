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

    <div class="section-heading">Population</div>
    <div class="entity-property">Total: {{ data.population.total.current }} / {{ data.population.total.capacity }}</div>
    <div class="entity-property">Workers: {{ data.population.workers.current }} / {{ data.population.workers.capacity }}</div>
    <div class="entity-property">Workers Busy: {{ data.population.workers.busy }}</div>
    <div class="entity-property">Workers Available: {{ data.population.workers.current - data.population.workers.busy }}</div>
    <div class="entity-property">Inactive: {{ data.population.inactive.current }} / {{ data.population.inactive.capacity }}</div>

    <div class="section-heading">Economy</div>
    <div class="entity-property">Jobs: {{ data.jobs.workers.supply }} / {{ data.jobs.workers.demand }}</div>

    <div class="section-heading">Needs</div>
    <div class="entity-property">Food: {{ data.needs.food.supply }} / {{ data.needs.food.demand }}</div>
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

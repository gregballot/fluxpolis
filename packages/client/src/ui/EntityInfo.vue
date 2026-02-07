<script setup lang="ts">
import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';
import type { DistrictState } from '@fluxpolis/types';
import { onMounted, onUnmounted, ref } from 'vue';

const entityData = ref<unknown | null>(null);

// Query a district by ID
const queryDistrict = (districtId: string) => {
	EventBus.emit(EVENTS.UI_QUERY_DISTRICT, { districtId });
};

// Adapter: Extract district ID from click event
const handleDistrictClicked = (data: { districtId: string }) => {
	queryDistrict(data.districtId);
};

// Adapter: Extract district ID from creation event
const handleDistrictCreated = (data: { district: { id: string } }) => {
	queryDistrict(data.district.id);
};

const handleDistrictResponse = (data: {
	districtId: string;
	data: DistrictState;
}) => {
	// Store the district data for display
	entityData.value = data.data;
};

onMounted(() => {
	EventBus.on(EVENTS.GAME_DISTRICTS_CLICKED, handleDistrictClicked);
	EventBus.on(EVENTS.SIMULATION_DISTRICTS_NEW, handleDistrictCreated);
	EventBus.on(EVENTS.SIMULATION_DISTRICT_RESPONSE, handleDistrictResponse);
});

onUnmounted(() => {
	EventBus.off(EVENTS.GAME_DISTRICTS_CLICKED, handleDistrictClicked);
	EventBus.off(EVENTS.SIMULATION_DISTRICTS_NEW, handleDistrictCreated);
	EventBus.off(EVENTS.SIMULATION_DISTRICT_RESPONSE, handleDistrictResponse);
});
</script>

<template>
	<div v-if="entityData" class="entity-info">
		<pre>{{ JSON.stringify(entityData, null, 2) }}</pre>
	</div>
</template>

<style scoped>
.entity-info {
	position: fixed;
	bottom: 10px;
	left: 10px;
	background: rgba(0, 0, 0, 0.7);
	color: #00ffff;
	padding: 8px 16px;
	border-radius: 4px;
	font-family: monospace;
	font-size: 14px;
	pointer-events: none;
	max-width: 400px;
	white-space: pre-wrap;
	word-break: break-word;
}
</style>

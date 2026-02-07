<script setup lang="ts">
import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';
import type { DistrictState } from '@fluxpolis/types';
import { onMounted, onUnmounted, ref } from 'vue';

const entityData = ref<DistrictState | null>(null);
const selectedDistrictId = ref<string | null>(null);

// Query a district by ID
const queryDistrict = (districtId: string) => {
	EventBus.emit(EVENTS.UI_QUERY_DISTRICT, { districtId });
};

// Adapter: Extract district ID from click event
const handleDistrictClicked = (data: { districtId: string }) => {
	selectedDistrictId.value = data.districtId;
	queryDistrict(data.districtId);
};

// Adapter: Extract district ID from creation event
const handleDistrictCreated = (data: { district: { id: string } }) => {
	selectedDistrictId.value = data.district.id;
	queryDistrict(data.district.id);
};

const handleDistrictResponse = (data: {
	districtId: string;
	data: DistrictState;
}) => {
	// Store the district data for display
	entityData.value = data.data;
};

const handleDistrictUpdate = (data: { district: DistrictState }) => {
	// Filter: Only update if this is the currently selected district
	if (!selectedDistrictId.value || data.district.id !== selectedDistrictId.value) {
		return;
	}

	// Create a new object to trigger Vue reactivity (district.state is mutated in place)
	entityData.value = { ...data.district };
};

onMounted(() => {
	EventBus.on(EVENTS.GAME_DISTRICTS_CLICKED, handleDistrictClicked);
	EventBus.on(EVENTS.SIMULATION_DISTRICTS_NEW, handleDistrictCreated);
	EventBus.on(EVENTS.SIMULATION_DISTRICT_RESPONSE, handleDistrictResponse);
	EventBus.on(EVENTS.SIMULATION_DISTRICTS_UPDATE, handleDistrictUpdate);
});

onUnmounted(() => {
	EventBus.off(EVENTS.GAME_DISTRICTS_CLICKED, handleDistrictClicked);
	EventBus.off(EVENTS.SIMULATION_DISTRICTS_NEW, handleDistrictCreated);
	EventBus.off(EVENTS.SIMULATION_DISTRICT_RESPONSE, handleDistrictResponse);
	EventBus.off(EVENTS.SIMULATION_DISTRICTS_UPDATE, handleDistrictUpdate);
});
</script>

<template>
	<div v-if="entityData" class="entity-info">
		<div class="entity-title">District {{ entityData.id }}</div>
		<div class="entity-property">Position: {{ entityData.x }}, {{ entityData.y }}</div>
		<div class="entity-property">Age: {{ entityData.age }}</div>
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
}

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

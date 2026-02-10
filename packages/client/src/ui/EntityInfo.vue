<script setup lang="ts">
import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';
import type { DistrictState, ResourceNodeState } from '@fluxpolis/types';
import { onMounted, onUnmounted, ref } from 'vue';
import DistrictInfoPanel from './entity-info/DistrictInfoPanel.vue';
import ResourceNodeInfoPanel from './entity-info/ResourceNodeInfoPanel.vue';

type EntityType = 'district' | 'resource-node';
type EntityData = DistrictState | ResourceNodeState;

const entityType = ref<EntityType | null>(null);
const entityData = ref<EntityData | null>(null);
const selectedEntityId = ref<string | null>(null);
const pendingRequestId = ref<string | null>(null);

// District handlers
const handleDistrictClicked = (data: { districtId: string }) => {
  entityType.value = 'district';
  selectedEntityId.value = data.districtId;
  pendingRequestId.value = crypto.randomUUID();
  EventBus.emit(EVENTS.UI_QUERY_DISTRICT, {
    requestId: pendingRequestId.value,
    districtId: data.districtId,
  });
};

const handleDistrictCreated = (data: { district: { id: string } }) => {
  entityType.value = 'district';
  selectedEntityId.value = data.district.id;
  pendingRequestId.value = crypto.randomUUID();
  EventBus.emit(EVENTS.UI_QUERY_DISTRICT, {
    requestId: pendingRequestId.value,
    districtId: data.district.id,
  });
};

const handleDistrictResponse = (data: {
  requestId: string;
  districtId: string;
  data: DistrictState;
}) => {
  if (
    entityType.value === 'district' &&
    data.requestId === pendingRequestId.value
  ) {
    entityData.value = data.data;
    pendingRequestId.value = null;
  }
};

const handleDistrictUpdate = (data: { district: DistrictState }) => {
  if (
    entityType.value === 'district' &&
    selectedEntityId.value === data.district.id
  ) {
    // Deep clone to prevent shared references and enable Vue reactivity
    entityData.value = structuredClone(data.district);
  }
};

// Resource node handlers
const handleResourceNodeClicked = (data: { resourceNodeId: string }) => {
  entityType.value = 'resource-node';
  selectedEntityId.value = data.resourceNodeId;
  pendingRequestId.value = crypto.randomUUID();
  EventBus.emit(EVENTS.UI_QUERY_RESOURCE_NODE, {
    requestId: pendingRequestId.value,
    resourceNodeId: data.resourceNodeId,
  });
};

const handleResourceNodeResponse = (data: {
  requestId: string;
  resourceNodeId: string;
  data: ResourceNodeState;
}) => {
  if (
    entityType.value === 'resource-node' &&
    data.requestId === pendingRequestId.value
  ) {
    entityData.value = data.data;
    pendingRequestId.value = null;
  }
};

const handleResourceNodeUpdate = (data: { resourceNode: ResourceNodeState }) => {
  if (
    entityType.value === 'resource-node' &&
    selectedEntityId.value === data.resourceNode.id
  ) {
    // Deep clone for resource nodes too
    entityData.value = structuredClone(data.resourceNode);
  }
};

onMounted(() => {
  EventBus.on(EVENTS.GAME_DISTRICTS_CLICKED, handleDistrictClicked);
  EventBus.on(EVENTS.SIMULATION_DISTRICTS_NEW, handleDistrictCreated);
  EventBus.on(EVENTS.SIMULATION_DISTRICT_RESPONSE, handleDistrictResponse);
  EventBus.on(EVENTS.SIMULATION_DISTRICTS_UPDATE, handleDistrictUpdate);
  EventBus.on(EVENTS.GAME_RESOURCE_NODES_CLICKED, handleResourceNodeClicked);
  EventBus.on(
    EVENTS.SIMULATION_RESOURCE_NODE_RESPONSE,
    handleResourceNodeResponse,
  );
  EventBus.on(EVENTS.SIMULATION_RESOURCE_NODE_UPDATE, handleResourceNodeUpdate);
});

onUnmounted(() => {
  EventBus.off(EVENTS.GAME_DISTRICTS_CLICKED, handleDistrictClicked);
  EventBus.off(EVENTS.SIMULATION_DISTRICTS_NEW, handleDistrictCreated);
  EventBus.off(EVENTS.SIMULATION_DISTRICT_RESPONSE, handleDistrictResponse);
  EventBus.off(EVENTS.SIMULATION_DISTRICTS_UPDATE, handleDistrictUpdate);
  EventBus.off(EVENTS.GAME_RESOURCE_NODES_CLICKED, handleResourceNodeClicked);
  EventBus.off(
    EVENTS.SIMULATION_RESOURCE_NODE_RESPONSE,
    handleResourceNodeResponse,
  );
  EventBus.off(EVENTS.SIMULATION_RESOURCE_NODE_UPDATE, handleResourceNodeUpdate);
});
</script>

<template>
  <div v-if="entityData && entityType" class="entity-info">
    <DistrictInfoPanel
      v-if="entityType === 'district'"
      :data="entityData as DistrictState"
    />
    <ResourceNodeInfoPanel
      v-else-if="entityType === 'resource-node'"
      :data="entityData as ResourceNodeState"
    />
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
</style>

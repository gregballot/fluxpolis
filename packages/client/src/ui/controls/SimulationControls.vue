<script setup lang="ts">
import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';
import { onMounted, onUnmounted, ref, computed } from 'vue';

const isPaused = ref(false);
const currentSpeed = ref(1);
const simulationTime = ref({
  year: 0,
  day: 0,
  hour: 0,
  totalHours: 0,
});

const speedOptions = [
  { value: 0.5, label: '0.5×', arrowCount: 1 },  // Slow - 1 arrow
  { value: 1, label: '1×', arrowCount: 2 },      // Normal - 2 arrows
  { value: 2, label: '2×', arrowCount: 3 },      // Fast - 3 arrows
  { value: 5, label: '5×', arrowCount: 4 },      // Very fast - 4 arrows
];

const currentSpeedIndex = ref(1); // Start at 1x (index 1)

// Convert day of year (0-364) to month-day format
const formattedTime = computed(() => {
  const year = simulationTime.value.year;
  const dayOfYear = simulationTime.value.day;

  // Days per month (non-leap year)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let remainingDays = dayOfYear;
  let month = 1;

  for (let i = 0; i < daysInMonth.length; i++) {
    const daysInCurrentMonth = daysInMonth[i] ?? 30; // Fallback to 30 (should never happen)
    if (remainingDays < daysInCurrentMonth) {
      month = i + 1;
      break;
    }
    remainingDays -= daysInCurrentMonth;
  }

  const day = remainingDays + 1; // Days are 1-indexed
  const hour = simulationTime.value.hour;

  return `${hour.toString().padStart(2, '0')}:00, ${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}, Year ${year}`;
});

const togglePlayPause = () => {
  isPaused.value = !isPaused.value;
  if (isPaused.value) {
    EventBus.emit(EVENTS.UI_CONTROLS_PAUSE);
  } else {
    EventBus.emit(EVENTS.UI_CONTROLS_PLAY);
  }
};

const cycleSpeed = () => {
  currentSpeedIndex.value = (currentSpeedIndex.value + 1) % speedOptions.length;
  const newSpeed = speedOptions[currentSpeedIndex.value];
  if (newSpeed) {
    currentSpeed.value = newSpeed.value;
    EventBus.emit(EVENTS.UI_CONTROLS_SPEED, { speed: newSpeed.value });
  }
};

const currentSpeedOption = computed(() => speedOptions[currentSpeedIndex.value]);

const handleTimeUpdate = (data: {
  year: number;
  day: number;
  hour: number;
  totalHours: number;
}) => {
  simulationTime.value = data;
};

onMounted(() => {
  EventBus.on(EVENTS.SIMULATION_TIME_UPDATE, handleTimeUpdate);
});

onUnmounted(() => {
  EventBus.off(EVENTS.SIMULATION_TIME_UPDATE, handleTimeUpdate);
});
</script>

<template>
  <div class="simulation-controls">
    <button
      class="control-btn play-pause-btn"
      @click="togglePlayPause"
      :title="isPaused ? 'Play' : 'Pause'"
    >
      <span class="icon">{{ isPaused ? '▶' : '⏸' }}</span>
    </button>

    <div class="time-display">{{ formattedTime }}</div>

    <button
      class="control-btn speed-btn"
      @click="cycleSpeed"
      :title="currentSpeedOption?.label"
    >
      <span class="speed-arrows">
        <span
          v-for="i in 4"
          :key="i"
          class="arrow"
          :class="{ active: i <= (currentSpeedOption?.arrowCount ?? 1) }"
        >
          ▶
        </span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.simulation-controls {
  position: fixed;
  bottom: var(--space-lg);
  right: var(--space-lg);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border-pink);
  border-radius: var(--radius-sm);
  overflow: hidden;
  backdrop-filter: var(--blur-glass);
}

.control-btn {
  padding: var(--space-sm) 14px;
  font-size: var(--text-base);
  font-weight: 400;
  font-family: var(--font-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: transparent;
  color: var(--color-text-pink-muted);
  border: none;
  border-right: 1px solid var(--color-separator);
}

.control-btn:hover {
  background: var(--color-hover-overlay);
  color: var(--color-text-pink);
}

.control-btn .icon {
  display: block;
  font-size: 16px;
  line-height: 1;
}

.play-pause-btn {
  padding: var(--space-sm) 14px;
}

.play-pause-btn .icon {
  font-size: 18px;
}

.time-display {
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-pink);
  text-align: center;
  padding: var(--space-sm) var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border-right: 1px solid var(--color-separator);
  letter-spacing: 0.5px;
  min-width: 200px;
}

.speed-btn {
  padding: var(--space-sm) 10px;
}

.speed-arrows {
  display: flex;
  gap: 1px;
  line-height: 1;
}

.arrow {
  font-size: 13px;
  color: var(--color-text-pink-muted);
  opacity: 0.3;
  transition: all var(--transition-fast);
}

.arrow.active {
  color: var(--color-text-pink);
  opacity: 1;
}
</style>

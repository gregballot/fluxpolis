// Internal utility - NOT exported from index.ts
// Pure simulation logging with minimal styling to differentiate from EventBus

// Minimal window interface for dev tools (browser environment only)
interface WindowWithLogger {
  logSimulation?: boolean;
}

let isLoggingEnabled = true;

// Check for browser environment and add dev tools
// Using globalThis which is available in ES2022
const globalWindow = globalThis as unknown as WindowWithLogger;

// Only add dev tools in browser environment (not Node.js)
if (typeof (globalThis as { document?: unknown }).document !== 'undefined') {
  Object.defineProperty(globalWindow, 'logSimulation', {
    get: () => isLoggingEnabled,
    set: (v) => {
      isLoggingEnabled = !!v;
      console.log(
        `%c[Simulation] Logging ${isLoggingEnabled ? 'ENABLED' : 'DISABLED'}`,
        'color: #00d9ff; font-weight: bold',
      );
    },
    configurable: true,
  });

  console.log(
    '%c[Simulation] Type `logSimulation = false` to disable simulation logging',
    'color: #00d9ff; border: 1px solid #00d9ff; padding: 2px 5px; border-radius: 3px;',
  );
}

/**
 * Simple centralized logger for simulation layer.
 * Automatically prefixes messages with [Simulation].
 * Toggle via console: `logSimulation = false`
 */
export const Logger = {
  info(message: string, ...args: unknown[]): void {
    if (isLoggingEnabled && typeof console !== 'undefined') {
      console.log(
        `%c[Simulation]%c ${message}`,
        'color: #00d9ff; font-weight: bold',
        'color: inherit',
        ...args,
      );
    }
  },

  warn(message: string, ...args: unknown[]): void {
    if (isLoggingEnabled && typeof console !== 'undefined') {
      console.warn(
        `%c[Simulation]%c ${message}`,
        'color: #ff9500; font-weight: bold',
        'color: inherit',
        ...args,
      );
    }
  },
};

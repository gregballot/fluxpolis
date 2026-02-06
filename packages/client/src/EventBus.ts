import type { TypedEventBus } from '@fluxpolis/eventbus';
import Phaser from 'phaser';

// Extend Window interface for dev tools
declare global {
  interface Window {
    logEvents: boolean;
    setEventLogging: (enabled: boolean) => void;
  }
}

const EventBusInstance = new Phaser.Events.EventEmitter();
export const eventStats = { emitCount: 0 };

let isLoggingEnabled = true;

// Direct toggle: logEvents = true
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  Object.defineProperty(window, 'logEvents', {
    get: () => isLoggingEnabled,
    set: (v) => {
      isLoggingEnabled = !!v;
      console.log(
        `%c[EventBus] Logging ${isLoggingEnabled ? 'ENABLED' : 'DISABLED'}`,
        'color: #ff00dd; font-weight: bold',
      );
    },
    configurable: true,
  });
  // Keep for compatibility
  window.setEventLogging = (v: boolean) => {
    window.logEvents = v;
  };

  console.log(
    '%c[EventBus] Type `logEvents = false` to disable event logging',
    'color: #ff00dd; border: 1px solid #ff00dd; padding: 2px 5px; border-radius: 3px;',
  );
}

const ignoredEvents: (string | symbol)[] = [
  'game:simulation-tick',
  'game:input:drag',
  'game:input:wheel',
  'game:camera:positionChanged',

  'simulation:districts:update',
];

const originalEmit = EventBusInstance.emit.bind(EventBusInstance);
EventBusInstance.emit = function (event: string | symbol, ...args: unknown[]) {
  eventStats.emitCount++;
  if (isLoggingEnabled && !ignoredEvents.includes(event)) {
    console.groupCollapsed(
      `%c[EventBus]%c ${String(event)}`,
      'color: #ff00dd; font-weight: bold',
      'color: inherit',
    );
    if (args.length > 0) console.log('Args:', args);
    console.trace('Trace');
    console.groupEnd();
  }
  return originalEmit.apply(this, [event, ...args] as [string | symbol, ...unknown[]]);
};

// Export with TypedEventBus interface for compile-time type safety
export const EventBus = EventBusInstance as unknown as TypedEventBus;

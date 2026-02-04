import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

/**
 * Event Debugging Utility
 * To enable in console: setEventLogging(true)
 */
let isLoggingEnabled = false;
const originalEmit = EventBus.emit;

// Expose setEventLogging function to window for easy console access during development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
    (window as any).setEventLogging = (enabled: boolean) => {
        isLoggingEnabled = enabled;
        console.log(`[EventBus] Logging ${enabled ? 'enabled' : 'disabled'}`);
    };
}

const ignoredEvents: (string | symbol)[] = [
    'game:input:drag',
    'game:input:wheel',
    'game:camera:positionChanged',
];

EventBus.emit = function (event: string | symbol, ...args: any[]) {
    if (isLoggingEnabled && !ignoredEvents.includes(event)) {
        console.groupCollapsed(
            `%c[EventBus]%c ${String(event)}`,
            'color: #ff00dd; font-weight: bold',
            'color: inherit'
        );
        if (args.length > 0) {
            console.log('Arguments:', args);
        }
        console.trace('Emission Trace');
        console.groupEnd();
    }
    
    return originalEmit.apply(this, [event, ...args] as [any, ...any[]]);
};


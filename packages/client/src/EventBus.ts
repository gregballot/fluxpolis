import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();
export const eventStats = { emitCount: 0 };

let isLoggingEnabled = true;

// Direct toggle: logEvents = true
if (typeof window !== 'undefined' && import.meta.env.DEV) {
    Object.defineProperty(window, 'logEvents', {
        get: () => isLoggingEnabled,
        set: (v) => {
            isLoggingEnabled = !!v;
            console.log(`%c[EventBus] Logging ${isLoggingEnabled ? 'ENABLED' : 'DISABLED'}`, 'color: #ff00dd; font-weight: bold');
        },
        configurable: true
    });
    // Keep for compatibility
    (window as any).setEventLogging = (v: boolean) => { (window as any).logEvents = v; };

    console.log(
        '%c[EventBus] Type `logEvents = false` to disable event logging',
        'color: #ff00dd; border: 1px solid #ff00dd; padding: 2px 5px; border-radius: 3px;'
    );
}

const ignoredEvents: (string | symbol)[] = [
    'game:simulation-tick',
    'game:input:drag',
    'game:input:wheel',
    'game:camera:positionChanged',

    'simulation:districts:update',
];

const originalEmit = EventBus.emit;
EventBus.emit = function (event: string | symbol, ...args: any[]) {
    eventStats.emitCount++;
    if (isLoggingEnabled && !ignoredEvents.includes(event)) {
        console.groupCollapsed(
            `%c[EventBus]%c ${String(event)}`,
            'color: #ff00dd; font-weight: bold',
            'color: inherit'
        );
        if (args.length > 0) console.log('Args:', args);
        console.trace('Trace');
        console.groupEnd();
    }
    return originalEmit.apply(this, [event, ...args] as [any, ...any[]]);
};

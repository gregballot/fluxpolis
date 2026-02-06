import type { EventMap } from './EventMap';

/**
 * Type-safe EventBus interface.
 * Provides compile-time type checking for event names and payloads.
 */
export interface TypedEventBus {
  /**
   * Emit an event with automatic payload type validation.
   * @example
   * // TypeScript knows this needs { x: number; y: number }
   * EventBus.emit('game:input:dragStart', { x: 10, y: 20 });
   *
   * // TypeScript error - wrong payload shape
   * EventBus.emit('game:input:dragStart', { x: 10 }); // Missing 'y'
   *
   * // No payload needed for events with undefined payload
   * EventBus.emit('game:input:space');
   */
  emit<K extends keyof EventMap>(
    event: K,
    ...args: EventMap[K] extends void ? [] : [EventMap[K]]
  ): boolean;

  /**
   * Listen to an event with automatic payload type inference.
   * @example
   * EventBus.on('game:input:drag', (data) => {
   *   console.log(data.deltaX); // TypeScript knows the shape!
   * });
   */
  on<K extends keyof EventMap>(
    event: K,
    listener: EventMap[K] extends void
      ? () => void
      : (data: EventMap[K]) => void,
    context?: unknown,
  ): this;

  /**
   * Listen to an event once.
   */
  once<K extends keyof EventMap>(
    event: K,
    listener: EventMap[K] extends void
      ? () => void
      : (data: EventMap[K]) => void,
    context?: unknown,
  ): this;

  /**
   * Remove an event listener.
   */
  off<K extends keyof EventMap>(
    event: K,
    listener?: EventMap[K] extends void
      ? () => void
      : (data: EventMap[K]) => void,
    context?: unknown,
  ): this;

  /**
   * Remove all listeners for an event.
   */
  removeAllListeners<K extends keyof EventMap>(event?: K): this;
}

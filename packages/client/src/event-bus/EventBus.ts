export interface GameEvent {
  type: string;
  timestamp?: number;
}

type EventHandler<T extends GameEvent = GameEvent> = (event: T) => void;

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  emit<T extends GameEvent>(event: T): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  on<T extends GameEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);
  }

  off<T extends GameEvent>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler as EventHandler);
    }
  }
}

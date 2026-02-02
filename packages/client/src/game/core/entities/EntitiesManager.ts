import { GameEntity } from './GameEntity';

export class EntitiesManager {
  private entities: Map<string, GameEntity> = new Map();
  private nextEntityId: number = 0;

  createEntity(): GameEntity {
    const id = `entity-${this.nextEntityId++}`;
    const entity = new GameEntity(id);
    this.entities.set(id, entity);
    return entity;
  }

  destroyEntity(id: string): void {
    this.entities.delete(id);
  }

  getEntity(id: string): GameEntity | undefined {
    return this.entities.get(id);
  }

  query(...componentNames: string[]): GameEntity[] {
    const results: GameEntity[] = [];

    this.entities.forEach(entity => {
      const hasAllComponents = componentNames.every(name => 
        entity.hasComponent(name)
      );

      if (hasAllComponents) {
        results.push(entity);
      }
    });

    return results;
  }

  getAllEntities(): GameEntity[] {
    return Array.from(this.entities.values());
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  clear(): void {
    this.entities.clear();
    this.nextEntityId = 0;
  }
}
import { EcsWorld } from "./EcsWorld";

interface IEcsPool {
    type: any;
    entities: number[];
    id: number;

    Add(): void;
    Del(): void;
    Get(): IEcsPool;
};

class EcsPool<T> {
    private _world: EcsWorld;
    private mapping: number[];
    private recycledItems: number[];

    public type: any;
    public items: T[];
    public entities: number[];

    public id: number;

    constructor(world: EcsWorld, type: classType) {
        this._world = world;
        this.type = type;
        this.items = [];
        this.mapping = [];
        this.recycledItems = [];
        this.entities = [];

        this.id = this._world.componetsCount++;
        this._world.poolMapping[type.name] = this.id;
        this._world.pool.push(this);
    }

    public Add(entity: number): void {
        let itemIndex = this.items.length;
        if(this.recycledItems.length > 0) {
            itemIndex = this.recycledItems.pop();
        }

        this.mapping[entity] = itemIndex;
        this.entities[entity] = entity;
        this.items[itemIndex] = new this.type;

        this._world.entitiesMask[(this.id >> 5) + entity * this._world.entityMaskSize] |= (1 << this.id % 32);
    }

    public Del(entity: number): void {
        this.recycledItems.push(this.mapping[entity]);
        this.entities[entity] = null;

        this._world.entitiesMask[(this.id >> 5) + entity * this._world.entityMaskSize] &= ~(1 << this.id % 32);
    }

    public Get(entityID: number) : T {
        return this.items[this.mapping[entityID]];
    }
};

export { IEcsPool, EcsPool };
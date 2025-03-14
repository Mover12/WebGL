import { EcsWorld } from "./EcsWorld";

interface IEcsPool {
    type: any;
    entities: number[];

    Add(): void;
    Del(): void;
    Get(): IEcsPool;
};

class EcsPool<T> {
    public type: any;
    public items: T[];
    public entities: number[];

    private _world: EcsWorld;
    private mapping: number[];
    private recycledItems: number[];

    constructor(world: EcsWorld, type: { prototype: T }) {
        this._world = world;
        this.type = type;
        this.items = [];
        this.mapping = [];
        this.recycledItems = [];
        this.entities = [];
    }

    public Add(entityID: number): void {
        let itemIndex = this.items.length;
        if(this.recycledItems.length > 0) {
            itemIndex = this.recycledItems[this.recycledItems.length - 1];
            this.recycledItems.pop();
        }

        this.mapping[entityID] = itemIndex;
        this.entities[entityID] = entityID;
        this.items[itemIndex] = new this.type;

        this._world.entitiesMask[this._world.components[this.type.name] >> 5 + entityID * this._world.entityMaskSize] |= (1 << this._world.components[this.type.name] % 32);
    }

    public Del(entityID: number): void {
        this.recycledItems.push(this.mapping[entityID]);
        delete this.items[this.mapping[entityID]];
        delete this.entities[entityID];

        this._world.entitiesMask[this._world.components[this.type.name] >> 5 + entityID * this._world.entityMaskSize] &= ~(1 << this._world.components[this.type.name] % 32);
    }

    public Get(entityID: number) : T {
        return this.items[this.mapping[entityID]];
    }
};

export { IEcsPool, EcsPool };
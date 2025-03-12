import { EcsWorld } from "./EcsWorld";

interface IEcsPool {
    entities: number[];
    Add();
    Del();
    Get();
}

class EcsPool<T> {   
    _world: EcsWorld;
    type: any;
    items: T[] = [];
    mapping: number[] = [];
    recycledItems: number[] = [];
    entities: number[] = [];

    constructor(world: EcsWorld, type: {prototype: T}) {
        this._world = world;
        this.type = type;   
    }

    Add(entityID : number) {
        let itemIndex = this.items.length;
        if(this.recycledItems.length > 0) {
            itemIndex = this.recycledItems[this.recycledItems.length-1];
            this.recycledItems.pop();
        }
        this.mapping[entityID] = itemIndex;
        this.entities.push(entityID);
        this.items[itemIndex] = new this.type;

        this._world.entitiesMask[entityID * this._world.entityMaskOffset + Math.floor(this._world.components[this.type.name] / 32)] |= (1 << (this._world.components[this.type.name] % 32));
    }

    Del(entityID : number) {
        this.recycledItems.push(this.mapping[entityID]);
        delete this.items[this.mapping[entityID]];
        delete this.entities[entityID];

        this._world.entitiesMask[entityID * this._world.entityMaskOffset + Math.floor(this._world.components[this.type.name] / 32)] &= ~(1 << (this._world.components[this.type.name] % 32));
    }

    Get(entityID : number) : T {
        return this.items[this.mapping[entityID]];
    }
}

export { IEcsPool, EcsPool };
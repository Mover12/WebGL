import { EcsWorld } from "./EcsWorld";

abstract class EcsSystem {
    public _world: EcsWorld;

    constructor(world: EcsWorld) {
        this._world = world;
        this.Init();
        this._world.systems.push(this);
    }
    abstract Init(): void;
    abstract Update(): void;
};

export { EcsSystem };
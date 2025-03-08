import { EcsPool, IEcsPool } from "./EcsPool";
import { EcsWorld } from "./EcsWorld";

interface IEcsAspect {
    Incluede();
    Excluede();
}

class EcsAspect {    
    _world: EcsWorld;
    constructor(world: EcsWorld) {
        this._world = world;
        this._world.aspects[this.constructor.name] = [];    
    }
    Incluede<T>(type: classType): EcsPool<T> {
        var pool: EcsPool<T> = this.GetPool(type);
        if (!this._world.aspectMasksIncluede[this.constructor.name]) {
            this._world.aspectMasksIncluede[this.constructor.name] = [];
        }
        this._world.aspectMasksIncluede[this.constructor.name][Math.floor(this._world.components[type.name] / 32)] |= (1 << this._world.components[type.name] % 32);
        return pool;
    }
    Excluede<T>(type: classType): EcsPool<T> {
        var pool: EcsPool<T> = this.GetPool(type);
        if (!this._world.aspectMasksExcluede[this.constructor.name]) {
            this._world.aspectMasksExcluede[this.constructor.name] = [];
        }
        this._world.aspectMasksExcluede[this.constructor.name][Math.floor(this._world.components[type.name] / 32)] |= (1 << this._world.components[type.name] % 32);
        return pool;
    }
    GetPool<T>(type: classType): EcsPool<T>{
        var pool: EcsPool<T>;
        if (this._world.pool.has(type.name)) {
            pool = this._world.pool[type.name];       
        } else {
            pool = new EcsPool(this._world, type);
            this._world.components[type.name] = this._world.componentsCount++;
            this._world.pool[type.name] = pool
        }
        this._world.aspects[this.constructor.name].push(type.name)
        return pool;
    }
};

export { IEcsAspect,  EcsAspect };
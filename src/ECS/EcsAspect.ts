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

        this._world.aspectMasksMapping[this.constructor.name] = [this._world.aspectMasksMapping.size, 4]; //[ptr, len]

        this._world.aspectsMaskIncluede.buffer.resize(this._world.aspectsMaskIncluede.buffer.byteLength + 4);
        this._world.aspectsMaskExcluede.buffer.resize(this._world.aspectsMaskExcluede.buffer.byteLength + 4);
    }
    Incluede<T>(type: classType): EcsPool<T> {
        const pool: EcsPool<T> = this.GetPool(type);
        this._world.aspectsMaskIncluede[this._world.aspectMasksMapping[this.constructor.name][0] + Math.floor(this._world.components[type.name] / 32)] |= (1 << (this._world.components[type.name] % 32));
        return pool;
    }
    Excluede<T>(type: classType): EcsPool<T> {
        const pool: EcsPool<T> = this.GetPool(type);
        this._world.aspectsMaskExcluede[this._world.aspectMasksMapping[this.constructor.name][0] + Math.floor(this._world.components[type.name] / 32)] |= (1 << (this._world.components[type.name] % 32));
        return pool;
    }
    GetPool<T>(type: classType): EcsPool<T>{
        let pool: EcsPool<T>;
        if (this._world.pool.has(type.name)) {
            pool = this._world.pool[type.name];
        } else {
            pool = new EcsPool(this._world, type);
            this._world.pool[type.name] = pool
            this._world.components[type.name] = this._world.componentsCount;
            this._world.componentsCount++;
        }
        
        if (Math.floor(this._world.componentsCount / 8) > this._world.aspectsMaskIncluede.buffer.byteLength) {
            this._world.aspectMasksMapping[this.constructor.name][1] += 4;
            this._world.aspectsMaskIncluede.buffer.resize(this._world.aspectsMaskIncluede.buffer.byteLength + 4);
            this._world.aspectsMaskExcluede.buffer.resize(this._world.aspectsMaskExcluede.buffer.byteLength + 4);
        }
        
        this._world.aspects[this.constructor.name].push(type.name)
        return pool;
    }
};

export { IEcsAspect,  EcsAspect };
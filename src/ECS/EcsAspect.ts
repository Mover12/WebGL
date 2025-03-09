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
        this._world.aspectMasksIncluede[this.constructor.name] = new DataView(new ArrayBuffer(4, { maxByteLength: 16 }));
        this._world.aspectMasksExcluede[this.constructor.name] = new DataView(new ArrayBuffer(4, { maxByteLength: 16 }));
    }
    Incluede<T>(type: classType): EcsPool<T> {
        const pool: EcsPool<T> = this.GetPool(type);
        const maskIncluede = this._world.aspectMasksIncluede[this.constructor.name];
        const index = Math.floor(this._world.components[type.name] / 32);
        maskIncluede.setUint32(index, maskIncluede.getUint32(index) | (1 << (this._world.components[type.name] % 32)));
        return pool;
    }
    Excluede<T>(type: classType): EcsPool<T> {
        const pool: EcsPool<T> = this.GetPool(type);
        const maskExcluede = this._world.aspectMasksExcluede[this.constructor.name];
        const index = Math.floor(this._world.components[type.name] / 32);
        maskExcluede.setUint32(index, maskExcluede.getUint32(index) | (1 << (this._world.components[type.name] % 32)));
        return pool;
    }
    GetPool<T>(type: classType): EcsPool<T>{
        let pool: EcsPool<T>;
        if (this._world.pool.has(type.name)) {
            pool = this._world.pool[type.name];       
        } else {
            pool = new EcsPool(this._world, type);
            this._world.components[type.name] = this._world.componentsCount++;
            if (Math.floor(this._world.componentsCount / 32) * 4 >= this._world.aspectMasksIncluede[this.constructor.name].byteLength) {
                this._world.aspectMasksIncluede[this.constructor.name].buffer.resize((Math.floor(this._world.componentsCount / 32) + 1) * 4);
                this._world.aspectMasksExcluede[this.constructor.name].buffer.resize((Math.floor(this._world.componentsCount / 32) + 1) * 4);
            }
            this._world.pool[type.name] = pool
        }
        this._world.aspects[this.constructor.name].push(type.name)
        return pool;
    }
};

export { IEcsAspect,  EcsAspect };
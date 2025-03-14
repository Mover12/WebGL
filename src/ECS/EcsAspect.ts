import { EcsWorld } from "./EcsWorld";
import { EcsPool, IEcsPool } from "./EcsPool";
import { IIterator, Iterator } from "./Iterator";

interface IEcsAspect {
    Incluede(): IEcsPool;
    Excluede(): IEcsPool;
    GetPool(): IEcsPool;
}

class EcsAspect {    
    private _world: EcsWorld;
    public entities: IIterator;
    public entity: number;

    constructor(world: EcsWorld) {
        this._world = world;
        this._world.aspectComponets[this.constructor.name] = [];

        this._world.aspectMasksMapping[this.constructor.name] = [this._world.aspectMasksMapping.size, this._world.aspectMasksMapping.size];
    }
    
    public Incluede<T>(type: classType): EcsPool<T> {
        const pool: EcsPool<T> = this.GetPool(type);

        this._world.aspectsMaskIncluede[this._world.components[type.name] >> 5 + this._world.aspectMasksMapping[this.constructor.name][0]] |= (1 << this._world.components[type.name] % 32);
        
        return pool;
    }

    public Excluede<T>(type: classType): EcsPool<T> {
        const pool: EcsPool<T> = this.GetPool(type);

        this._world.aspectsMaskExcluede[this._world.components[type.name] >> 5 + this._world.aspectMasksMapping[this.constructor.name][0]] |= (1 << this._world.components[type.name] % 32);
        
        return pool;
    }

    private GetPool<T>(type: classType): EcsPool<T>{
        let pool: EcsPool<T>;
        if (this._world.pool.has(type.name)) pool = this._world.pool[type.name];
        else {
            pool = new EcsPool(this._world, type);
            this._world.pool[type.name] = pool;
            this._world.components[type.name] = this._world.componetsCount++;
        }
        
        if ((this._world.components.size >> 5) >= this._world.aspectMasksMapping[this.constructor.name][1]) {
            this._world.aspectMasksMapping[this.constructor.name][1] += 1;
            this._world.aspectsMaskIncluede.buffer.resize(this._world.aspectsMaskIncluede.buffer.byteLength + 4);
            this._world.aspectsMaskExcluede.buffer.resize(this._world.aspectsMaskExcluede.buffer.byteLength + 4);
        }
        
        this._world.aspectComponets[this.constructor.name].push(type.name)

        return pool;
    }

    begin() {
        let minLenghtPool: IEcsPool = this._world.pool[this._world.aspectComponets[this.constructor.name][0]];
        let minComponentLenght: number = this._world.pool[this._world.aspectComponets[this.constructor.name][0]].entities.length;

        for (let componentName of this._world.aspectComponets[this.constructor.name]) {
            if (this._world.pool[componentName].entities.length < minComponentLenght) {
                minComponentLenght = this._world.pool[componentName].entities.length;
                minLenghtPool = this._world.pool[componentName];
            }
        }

        if (minLenghtPool.entities.length == 0) {
            return new Iterator([]);
        }

        this.entities = new Iterator(minLenghtPool.entities);
    }

    next() {
        loop: for(;;) {
            var entity = this.entities.next();
            if(entity != null) {
                for (let i = this._world.aspectMasksMapping[this.constructor.name][0]; i < this._world.aspectMasksMapping[this.constructor.name][1]; i++) {
                    if (~this._world.entitiesMask[entity * this._world.entityMaskSize] & this._world.aspectsMaskIncluede[i]) {
                        continue loop;
                    }
                    if (this._world.entitiesMask[entity * this._world.entityMaskSize] & this._world.aspectsMaskExcluede[i]) {
                        continue loop;
                    }
                }
            }
            this.entity = entity;
            return this.entity != null
        }
    }
};

export { IEcsAspect,  EcsAspect };
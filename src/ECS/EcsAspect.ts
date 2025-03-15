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
    private entities: IIterator;
    private aspectComponets = Array<string>();

    public entity: number;
    private start: number;
    private end: number;

    constructor(world: EcsWorld) {
        this._world = world;
        this.aspectComponets = new Array<string>();

        this.start = this.end = this._world.aspectsMaskIncluede.buffer.byteLength >> 2;
    }
    
    public Incluede<T>(type: classType): EcsPool<T> {
        const pool: EcsPool<T> = this.GetPool(type);

        this._world.aspectsMaskIncluede[(this._world.components[type.name] >> 5) + this.start] |= (1 << this._world.components[type.name] % 32);
        
        return pool;
    }

    public Excluede<T>(type: classType): EcsPool<T> {
        const pool: EcsPool<T> = this.GetPool(type);

        this._world.aspectsMaskExcluede[(this._world.components[type.name] >> 5) + this.start] |= (1 << this._world.components[type.name] % 32);
        
        return pool;
    }

    private GetPool<T>(type: classType): EcsPool<T>{
        let pool: EcsPool<T>;
        if (this._world.pool[type.name]) pool = this._world.pool[type.name];
        else {
            pool = new EcsPool(this._world, type);
            this._world.pool[type.name] = pool;
            this._world.components[type.name] = this._world.componetsCount++;
        }
        
        if (((this._world.componetsCount + 31) >> 5) > this.end - this.start) {
            this.end += 1;
            this._world.aspectsMaskIncluede.buffer.resize(this._world.aspectsMaskIncluede.buffer.byteLength + 4);
            this._world.aspectsMaskExcluede.buffer.resize(this._world.aspectsMaskExcluede.buffer.byteLength + 4);
        }
        
        this.aspectComponets.push(type.name)

        return pool;
    }

    public begin() {
        let minLenghtPool: IEcsPool = this._world.pool[this.aspectComponets[0]];
        let minComponentLenght: number = this._world.pool[this.aspectComponets[0]].entities.length;

        for (let componentName of this.aspectComponets) {
            if (this._world.pool[componentName].entities.length < minComponentLenght) {
                minComponentLenght = this._world.pool[componentName].entities.length;
                minLenghtPool = this._world.pool[componentName];
            }
        }

        if (minLenghtPool.entities) this.entities = new Iterator(minLenghtPool.entities);
        else this.entities = new Iterator([]);
    }

    public next() {
        loop: for(;;) {
            var entity = this.entities.next();
            if(entity != null) {
                for (let i = this.start; i < this.end; i++) {
                    if (~this._world.entitiesMask[entity * this._world.entityMaskSize] & this._world.aspectsMaskIncluede[i]) {
                        continue loop;
                    }
                    if (this._world.entitiesMask[entity * this._world.entityMaskSize] & this._world.aspectsMaskExcluede[i]) {
                        continue loop;
                    }
                }
            }
            this.entity = entity;
            return this.entity != null;
        }
    }
};

export { IEcsAspect,  EcsAspect };
import { EcsAspect } from "./EcsAspect";
import { IEcsPool } from "./EcsPool";
import { Iterator } from "./Iterator";

class EcsWorld {
    pool: Map<string, IEcsPool> = new Map<string, IEcsPool>();
    components: Map<string, number> = new Map<string, number>();
    componentsCount: number = 0;

    aspects: Map<string, Array<string>> = new Map<string, Array<string>>();
    aspectMasksMapping: Map<string, number> = new Map<string, number>();
    aspectsMaskIncluede: Uint32Array = new Uint32Array(new ArrayBuffer(0, { maxByteLength: 16 }));
    aspectsMaskExcluede: Uint32Array = new Uint32Array(new ArrayBuffer(0, { maxByteLength: 16 }));

    entitiesCount: number = 0;
    entitiesMask: Uint32Array = new Uint32Array(new ArrayBuffer(0, { maxByteLength: 2000000 }));
    entityMaskOffset: number = 0;
    
    NewEntity(): number {
        this.entityMaskOffset = Math.ceil(this.componentsCount / 32);
        this.entitiesMask.buffer.resize(this.entitiesMask.buffer.byteLength + this.entityMaskOffset * 4);
        return this.entitiesCount++;
    }

    Where(type: string) {
        let minLenghtPool: IEcsPool = this.pool[this.aspects[type][0]];
        let minComponentLenght: number = this.pool[this.aspects[type][0]].entities.length;

        for (let componentName of this.aspects[type]) {
            if (this.pool[componentName].entities.length < minComponentLenght) {
                minComponentLenght = this.pool[componentName].entities.length;
                minLenghtPool = this.pool[componentName];
            }
        }

        if (minLenghtPool.entities.length == 0) {
            return [];
        }

        var entities = new Iterator(minLenghtPool.entities);
        loop: for (;;) {
            var entity = entities.next();
            for (let i = this.aspectMasksMapping[type][0]; i < this.aspectMasksMapping[type][1] / 4; i++) {
                if (~this.entitiesMask[entity * this.entityMaskOffset] & this.aspectsMaskIncluede[i]) {
                    continue loop;
                }
                if (this.entitiesMask[entity * this.entityMaskOffset] & this.aspectsMaskExcluede[i]) {
                    continue loop;
                }
            }
            return entity;
        }

        // let entities = [];
        // loop: for (var entity of minLenghtPool.entities) {
        //     for (let i = this.aspectMasksMapping[type][0]; i < this.aspectMasksMapping[type][1] / 4; i++) {
        //         if (~this.entitiesMask[entity * this.entityMaskOffset] & this.aspectsMaskIncluede[i]) {
        //             continue loop;
        //         }
        //         if (this.entitiesMask[entity * this.entityMaskOffset] & this.aspectsMaskExcluede[i]) {
        //             continue loop;
        //         }
        //     }
        //     entities.push(entity);
        // }               

        // return entities;
    }
        
};

export { EcsWorld };
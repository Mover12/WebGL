import { IEcsPool } from "./EcsPool";

class EcsWorld {
    pool: Map<string, IEcsPool> = new Map<string, IEcsPool>();
    components: Map<string, number> = new Map<string, number>();
    aspects: Map<string, Array<string>> = new Map<string, Array<string>>();
    componentsCount: number = 0;
    aspectMasksIncluede: Map<string, ArrayBuffer> = new Map<string, ArrayBuffer>();
    aspectMasksExcluede: Map<string, ArrayBuffer> = new Map<string, ArrayBuffer>();
    entitiesMask: ArrayBuffer[] = new Array<ArrayBuffer>();
    entitiesCount: number = 0;

    
    
    NewEntity(): number {
        this.entitiesMask[this.entitiesCount] = new ArrayBuffer(Math.ceil(this.componentsCount / 32) * 4);
        return this.entitiesCount++;
    }

    Where(type: string): Array<number>{
        var entites = [];
     

        var minLenghtPool: IEcsPool = this.pool[this.aspects[type][0]];
        var minComponentLenght: number = this.pool[this.aspects[type][0]].entities.length;

        for (const componentName of this.aspects[type]) {
            if (this.pool[componentName].entities.length < minComponentLenght) {
                minComponentLenght = this.pool[componentName].entities.length;
                minLenghtPool = this.pool[componentName];
            }
        }

        if (minLenghtPool.entities.length == 0) {
            return [];
        }

        for (const entity of minLenghtPool.entities) {
            var entityMask = new Uint32Array(this.entitiesMask[entity]);    
            for (let i = 0; i < Math.ceil(this.componentsCount / 32); i++) { 
                if(this.aspectMasksExcluede[type]) {
                    if (((entityMask[i] & this.aspectMasksExcluede[type][i]) == entityMask[i])) {
                        break;
                    }
                }
                if ((entityMask[i] & this.aspectMasksIncluede[type][i]) != entityMask[i]) {
                    break;
                }
            }
            entites.push(entity)
        }               

        return entites;
    }
        
};

export { EcsWorld };
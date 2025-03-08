import { IEcsPool } from "./EcsPool";

class EcsWorld {
    pool: Map<string, IEcsPool> = new Map<string, IEcsPool>();
    components: Map<string, number> = new Map<string, number>();
    aspects: Map<string, Array<string>> = new Map<string, Array<string>>();
    componentsCount: number = 0;
    aspectMasksIncluede: Map<string, Array<number>> = new Map<string, Array<number>>();
    aspectMasksExcluede: Map<string, Array<number>> = new Map<string, Array<number>>();
    entitiesMask: Array<number>[] = new Array<Array<number>>();
    entitiesCount: number = 0;
    
    
    NewEntity(): number {
        this.entitiesMask[this.entitiesCount] = [];
        return this.entitiesCount++;
    }

    Where(type: string): Array<number>{
        var entites = [];
     

        var minLenghtPool: IEcsPool = this.pool[this.aspects[type][0]];
        var minComponentLenght: number = this.pool[this.aspects[type][0]].entities.length;

        var maxLenghtPool: IEcsPool;
        var maxComponentLenght: number = 0;

        for (const componentName of this.aspects[type]) {
            if (this.pool[componentName].entities.length < minComponentLenght) {
                minComponentLenght = this.pool[componentName].entities.length;
                minLenghtPool = this.pool[componentName];
            }
            if (this.pool[componentName].entities.length > maxComponentLenght) {
                maxComponentLenght = this.pool[componentName].entities.length;
                maxLenghtPool = this.pool[componentName];
            }
        }
        if (minLenghtPool.entities.length == 0) {
            return [];
        }

        if(this.aspectMasksExcluede[type]) {
            for (const entity of maxLenghtPool.entities) { 
                for (let i = 0; i < this.entitiesMask[entity].length; i++) {            
                    if ((this.entitiesMask[entity][i] & this.aspectMasksIncluede[type][i]) != this.aspectMasksIncluede[type][i]) {
                        break;
                    }
                    
                    if (((this.entitiesMask[entity][i] & this.aspectMasksExcluede[type][i]) == this.aspectMasksExcluede[type][i])) {
                        break;
                    }
                }
                entites.push(entity)
            }                    
        } else {
            for (const entity of minLenghtPool.entities) {      
                for (let i = 0; i < this.entitiesMask[entity].length; i++) {            
                    if ((this.entitiesMask[entity][i] & this.aspectMasksIncluede[type][i]) != this.aspectMasksIncluede[type][i]) {               
                        break;
                    }                                   
                }
                entites.push(entity)           
            }

        }

        return entites;
    }
        
};

export { EcsWorld };
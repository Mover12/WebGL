import { IEcsPool } from "./EcsPool";
import { Iterator } from "./Iterator";

class EcsWorld {
    pool: Map<string, IEcsPool> = new Map<string, IEcsPool>();
    components: Map<string, number> = new Map<string, number>();
    aspects: Map<string, Array<string>> = new Map<string, Array<string>>();
    componentsCount: number = 0;
    aspectMasksIncluede: Map<string, ArrayBuffer> = new Map<string, ArrayBuffer>();
    aspectMasksExcluede: Map<string, ArrayBuffer> = new Map<string, ArrayBuffer>();
    entitiesMask: DataView[] = new Array<DataView>();
    entitiesCount: number = 0;

    
    
    NewEntity(): number {
        this.entitiesMask[this.entitiesCount] = new DataView(new ArrayBuffer(Math.ceil(this.componentsCount / 32) * 4));
        return this.entitiesCount++;
    }

    Where(type: string): Array<number>{
        let entites = [];

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

        const aspectMaskIncluede = this.aspectMasksIncluede[type];
        const aspectMaskExcluede = this.aspectMasksExcluede[type];

        loop: for (var entity of minLenghtPool.entities) {
            for (let i = 0; i < Math.max(this.aspectMasksIncluede[type].byteLength, this.aspectMasksExcluede[type].byteLength) / 4; i++) {
                if (~this.entitiesMask[entity].getUint32(i) & aspectMaskIncluede.getUint32(i)) {
                    continue loop;
                }
                if (this.entitiesMask[entity].getUint32(i) & aspectMaskExcluede.getUint32(i)) {
                    continue loop;
                }
            }
            entites.push(entity);
        }               

        return entites;
    }
        
};

export { EcsWorld };
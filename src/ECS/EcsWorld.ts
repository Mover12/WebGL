import { IEcsPool } from "./EcsPool";
import { EcsSystem } from "./EcsSystem";

class EcsWorld {
    public pool: Array<IEcsPool>;
    public poolMapping: Map<string, number>;
    public componetsCount: number;

    public aspectsMaskIncluede: Uint32Array;
    public aspectsMaskExcluede: Uint32Array;

    public entitiesMask: Uint32Array;
    public entityMaskSize: number
    private recycledEntities: Array<number>;
    private entitiesCount: number;

    public systems: Array<EcsSystem>;

    constructor(options: { maxEntityCount: number, aspectsMaskSize: number} = { maxEntityCount: 1024, aspectsMaskSize: 1024}) {
        this.pool = new Array<IEcsPool>();
        this.poolMapping = new Map<string, number>();
        this.componetsCount = 0;
    
        this.aspectsMaskIncluede = new Uint32Array(new ArrayBuffer(0, { maxByteLength: options.aspectsMaskSize }));
        this.aspectsMaskExcluede = new Uint32Array(new ArrayBuffer(0, { maxByteLength: options.aspectsMaskSize }));
    
        this.entitiesMask = new Uint32Array(new ArrayBuffer(0, { maxByteLength: options.maxEntityCount * 4 }));
        this.entitiesCount = 0;
        this.recycledEntities = [];
        this.entityMaskSize = 0;

        this.systems = new Array<EcsSystem>();
        setInterval(() => {
            for (const system of this.systems) system.Update();
        }, 1 / 60);
    }
    
    public NewEntity(): number {
        if (this.recycledEntities.length > 0) return this.recycledEntities.pop();
        this.entityMaskSize = (this.componetsCount >> 5) + 1;
        this.entitiesMask.buffer.resize(this.entitiesMask.buffer.byteLength + this.entityMaskSize * 4);
        return this.entitiesCount++;
    }
};

export { EcsWorld };
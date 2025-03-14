import { IEcsPool } from "./EcsPool";

class EcsWorld {
    public pool: Map<string, IEcsPool>;
    public components: Map<string, number>;
    public componetsCount: number;

    public aspectComponets: Map<string, Array<string>>;
    public aspectMasksMapping: Map<string, Array<number>>;
    public aspectsMaskIncluede: Uint32Array;
    public aspectsMaskExcluede: Uint32Array;

    public entitiesMask: Uint32Array;
    public entityMaskSize: number
    private recycledEntities: Array<number>;
    private entitiesCount: number;

    constructor(options: { maxEntityCount: 1024, aspectsMaskSize: 1024} = { maxEntityCount: 1024, aspectsMaskSize: 1024}) {
        this.pool = new Map<string, IEcsPool>();
        this.components = new Map<string, number>();
        this.componetsCount = 0;
    
        this.aspectComponets = new Map<string, Array<string>>();
        this.aspectMasksMapping = new Map<string, Array<number>>();
        this.aspectsMaskIncluede = new Uint32Array(new ArrayBuffer(0, { maxByteLength: options.aspectsMaskSize }));
        this.aspectsMaskExcluede = new Uint32Array(new ArrayBuffer(0, { maxByteLength: options.aspectsMaskSize }));
    
        this.entitiesMask = new Uint32Array(new ArrayBuffer(0, { maxByteLength: options.maxEntityCount * 4 }));
        this.entitiesCount = 0;
        this.recycledEntities = [];
        this.entityMaskSize = 0;
    }
    
    public NewEntity(): number {
        if (this.recycledEntities.length > 0) return this.recycledEntities.pop();
        this.entityMaskSize = (this.components.size >> 5) + 1;
        this.entitiesMask.buffer.resize(this.entitiesMask.buffer.byteLength + this.entityMaskSize * 4);
        return this.entitiesCount++;
    }
};

export { EcsWorld };
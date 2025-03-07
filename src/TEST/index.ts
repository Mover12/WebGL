<<<<<<< Updated upstream:src/TEST/index.ts
class f<T>
{

}

class EcsPool<T> {
=======
class EcsPool<T> {      
    poolname : string = "";

>>>>>>> Stashed changes:src/game/EcsPool.ts
    items: T[] = [];

    mapping: Int32Array = new Int32Array(128);
    recycledItems: number[] = []; 
    type: any;

    constructor(type: {prototype: T}) {
        this.type = type;       
        this.poolname = this.type.name;
    }
<<<<<<< Updated upstream:src/TEST/index.ts
    
  
     

    
    Add(entityID : number) {
       
        this.items[entityID] = new this.type;
        console.log(this.items)
=======

    Add(entityID : number) {
        var itemIndex = this.items.length;
        if(this.recycledItems.length > 0) {
            itemIndex = this.recycledItems[this.recycledItems.length-1];
            this.recycledItems.pop();
        }
        this.mapping[entityID] = itemIndex;
        this.items[itemIndex]=new this.type;
>>>>>>> Stashed changes:src/game/EcsPool.ts
    }

    Del(entityID : number) {
        this.recycledItems.push(this.mapping[entityID]);
        delete this.items[this.mapping[entityID]];
    }

    Get(entityID : number) : T {
        return this.items[this.mapping[entityID]]   ;
    }
<<<<<<< Updated upstream:src/TEST/index.ts
}
=======

    GetName() : string {
        return this.poolname;
    }

    
}

export default EcsPool;
>>>>>>> Stashed changes:src/game/EcsPool.ts

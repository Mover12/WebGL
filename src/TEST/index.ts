class f<T>
{

}

class EcsPool<T> {
    items: T[] = [];
    type: any;
    constructor(type: any) {
        this.type = type;
    }
    
  
     

    
    Add(entityID : number) {
       
        this.items[entityID] = new this.type;
        console.log(this.items)
    }
    Get(entityID : number) : T {
        return this.items[entityID];
    }
}
//aspect
class TestComponent {
    test : number = 0;
    test2 : number = 0;
}
class TestComponent2 {
    test2 : number = 0;
}

class EcsPool<T> {
    items: T[] = [];
    mapping: Int32Array = new Int32Array(128);
    recycledItems: number[] = []; 
    type: any;
    constructor(type: {prototype: T}) {
        this.type = type;
    }
    Add(entityID : number) {
        var itemIndex = this.items.length;
        if(this.recycledItems.length > 0) {
            itemIndex = this.recycledItems[--this.recycledItems.length];
            this.recycledItems.pop();
        }
        this.mapping[entityID] = itemIndex;
        this.items.push(new this.type);
    }
    Del(entityID : number) {
        this.recycledItems.push(this.mapping[entityID]);
        delete this.items[this.mapping[entityID]];
    }
    Get(entityID : number) : T {
        return this.items[this.mapping[entityID]];
    }
}
//world
var c0 = new EcsPool(TestComponent);
var c1 = new EcsPool(TestComponent2);

c0.Add(1);
c0.Add(2);
c0.Add(3);
c0.Del(2);
c0.Add(2);
console.log(c0.items)
c1.Add(1);
//system
console.log(c0.Get(1), c1.Get(1));
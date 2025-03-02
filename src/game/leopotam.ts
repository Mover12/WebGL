import * as proto from '../leopotam/proto'
class Component1 {
    test: number = 0;
}
class Component2 {
    test: number = 0;
}
class Component3 {
    test: number = 0;
}
class Component4 {
    test: number = 0;
}

class Aspect1 implements proto.IAspect {
    c1!: proto.Pool<Component1>
    c2!: proto.Pool<Component2>
    c3!: proto.Pool<Component3>
    c4!: proto.Pool<Component4>

    init(world: proto.World) {
        world.addAspect(this)

        this.c1 = new proto.Pool(Component1)
        this.c2 = new proto.Pool(Component2)
        this.c3 = new proto.Pool(Component3)
        this.c4 = new proto.Pool(Component4)

        world.addPool(this.c1)
        world.addPool(this.c2)
        world.addPool(this.c3)
        world.addPool(this.c4)
    }
    postInit() {}
}

const world = new proto.World(new Aspect1())

const aspect: Aspect1 = world.aspect(Aspect1.name) as Aspect1
const c1 = aspect.c1;
const c2 = aspect.c2;
const c3 = aspect.c3;
const c4 = aspect.c4;

for (let i = 0; i < 1000000; i++) {
    const entity = world.newEntity();
    c1.add(entity);
    c2.add(entity);
    c3.add(entity);
    c4.add(entity);
}

const it = new proto.It([Component1, Component1, Component1, Component1]);
it.init(world)
setInterval(() => {
    for (it.begin(); it.next();) {
        c1.get(it.entity()).test++;
        c2.get(it.entity()).test++;
        c3.get(it.entity()).test++;
        c4.get(it.entity()).test++;
    }
}, 1 / 60)
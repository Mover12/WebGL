import * as proto from '../proto'

class TestComponent1 {
    test1: number = 0;
}
class TestComponent2 {
    test2: number = 0;
}
class TestComponent3 {
    test3: number = 0;
}
class TestComponent4 {
    test4: number = 0;
}

class Aspect1 implements proto.IAspect {
    ts1!: proto.Pool<TestComponent1>
    ts2!: proto.Pool<TestComponent2>
    ts3!: proto.Pool<TestComponent3>
    ts4!: proto.Pool<TestComponent4>

    init(world: proto.World) {
        world.addAspect(this)
        this.ts1 = new proto.Pool(TestComponent1)
        this.ts2 = new proto.Pool(TestComponent2)
        this.ts3 = new proto.Pool(TestComponent3)
        this.ts4 = new proto.Pool(TestComponent4)
        world.addPool(this.ts1)
        world.addPool(this.ts2)
        world.addPool(this.ts3)
        world.addPool(this.ts4)
    }
    postInit() {}
}

const world = new proto.World(new Aspect1())

const a1: Aspect1 = world.aspect(Aspect1.name) as Aspect1

for (let i = 0; i < 500000; i++) {
    var e = world.newEntity();
    a1.ts1.add(e);
    a1.ts2.add(e);
    a1.ts3.add(e);
    a1.ts4.add(e);
}

const it = new proto.It([TestComponent1, TestComponent2, TestComponent3, TestComponent4]);

it.init(world);

setInterval(() => {
    for (it.begin(); it.next();) {
        a1.ts1.get(it.entity()).test1++;
        a1.ts2.get(it.entity()).test2++;
        a1.ts3.get(it.entity()).test3++;
        a1.ts4.get(it.entity()).test4++;
    }
}, 1 / 60)
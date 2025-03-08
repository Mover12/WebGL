import { EcsAspect } from "./EcsAspect";
import { EcsPool } from "./EcsPool";
import { EcsWorld } from "./EcsWorld";

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

class Aspect1 extends EcsAspect {
    ts1: EcsPool<TestComponent1> = this.Incluede(TestComponent1);
    ts2: EcsPool<TestComponent2> = this.Incluede(TestComponent2);
    ts3: EcsPool<TestComponent3> = this.Incluede(TestComponent3);
    ts4: EcsPool<TestComponent4> = this.Incluede(TestComponent4);   
}

var world = new EcsWorld;

var a1 = new Aspect1(world);


for (let i = 0; i < 500000; i++) {
    var e = world.NewEntity();
    a1.ts1.Add(e);
    a1.ts2.Add(e);
    a1.ts3.Add(e);
    a1.ts4.Add(e);
}

console.log(world)

setInterval(() => {
    for (const e of world.Where(Aspect1.name)) {
        a1.ts1.Get(e).test1++;
        a1.ts2.Get(e).test2++;
        a1.ts3.Get(e).test3++;
        a1.ts4.Get(e).test4++;
    }
}, 1 / 60)
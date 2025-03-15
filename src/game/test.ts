import { EcsAspect } from "@/ECS/EcsAspect";
import { EcsPool } from "@/ECS/EcsPool";
import { EcsWorld } from "@/ECS/EcsWorld";

class TestComponent1 {
    test1: number = 0;
};

class TestComponent2 {
    test2: number = 0;
};

class TestComponent3 {
    test3: number = 0;
};

class TestComponent4 {
    test4: number = 0;
};

class Aspect1 extends EcsAspect {
    t1: EcsPool<TestComponent1> = this.Incluede(TestComponent1);
    t2: EcsPool<TestComponent2> = this.Incluede(TestComponent2);
    t3: EcsPool<TestComponent3> = this.Incluede(TestComponent3);
    t4: EcsPool<TestComponent4> = this.Incluede(TestComponent4);
};
class Aspect2 extends EcsAspect {
    t1: EcsPool<TestComponent1> = this.Incluede(TestComponent1);
};

var world = new EcsWorld({ maxEntityCount: 500000, aspectsMaskSize: 1024});

var a1 = new Aspect1(world);
var a2 = new Aspect2(world);

for (let i = 0; i < 1; i++) {
    var e = world.NewEntity();
    a1.t1.Add(e);
    a1.t2.Add(e);
    a1.t3.Add(e);
    a1.t4.Add(e);
}
console.log(world)
console.log(a1, a2)

setInterval(() => {
    for (a1.begin();a1.next();) {
        a1.t2.Del(a1.entity);
        a1.t3.Del(a1.entity);
        a1.t4.Del(a1.entity);
    }
    for (a2.begin();a2.next();) {
        a1.t2.Add(a2.entity);
        a1.t3.Add(a2.entity);
        a1.t4.Add(a2.entity);
    }
}, 1 / 60)
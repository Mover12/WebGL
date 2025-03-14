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

var world = new EcsWorld({ maxEntityCount: 500000, aspectsMaskSize: 1024});

var a1 = new Aspect1(world);

for (let i = 0; i < 500000; i++) {
    var e = world.NewEntity();
    a1.t1.Add(e);
    a1.t2.Add(e);
    a1.t3.Add(e);
    a1.t4.Add(e);
}


setInterval(() => {
    for (a1.begin();a1.next();) {
        a1.t1.Get(a1.entity).test1++;
        a1.t2.Get(a1.entity).test2++;
        a1.t3.Get(a1.entity).test3++;
        a1.t4.Get(a1.entity).test4++;
    }
}, 1 / 60)
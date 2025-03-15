import { EcsAspect } from "@/ECS/EcsAspect";
import { EcsPool } from "@/ECS/EcsPool";
import { EcsSystem } from "@/ECS/EcsSystem";
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

class System1 extends EcsSystem {
    a1: Aspect1;

    Init() {
        this.a1 = new Aspect1(this._world);

        for (let i = 0; i < 500000; i++) {
            var e = this._world.NewEntity();
            this.a1.t1.Add(e);
            this.a1.t2.Add(e);
            this.a1.t3.Add(e);
            this.a1.t4.Add(e);
        }

        console.log(this._world);
    }

    Update() {
        for (this.a1.begin();this.a1.next();) {
            this.a1.t1.Get(this.a1.entity).test1++;
            this.a1.t2.Get(this.a1.entity).test2++;
            this.a1.t3.Get(this.a1.entity).test3++;
            this.a1.t4.Get(this.a1.entity).test4++;
        }
    }
};

var world = new EcsWorld({ maxEntityCount: 500000, aspectsMaskSize: 1024});
new System1(world);
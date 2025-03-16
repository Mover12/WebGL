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

class Aspect2 extends EcsAspect {
    t1: EcsPool<TestComponent1> = this.Incluede(TestComponent1);
};

class System1 extends EcsSystem {
    a1: Aspect1;
    a2: Aspect2;

    Init() {
        this.a1 = new Aspect1(this._world);
        this.a2 = new Aspect2(this._world);

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
            this.a1.t2.Del(this.a1.entity);
            this.a1.t3.Del(this.a1.entity);
            this.a1.t4.Del(this.a1.entity);
        }
        for (this.a2.begin();this.a2.next();) {
            this.a1.t2.Add(this.a2.entity);
            this.a1.t3.Add(this.a2.entity);
            this.a1.t4.Add(this.a2.entity);
        }
    }
};

var world = new EcsWorld({ maxEntityCount: 500000, aspectsMaskSize: 1024});
new System1(world);
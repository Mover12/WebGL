import World from '../ECS/World.js';
import TestComponent1 from './TestComponent1.js';
import TestComponent2 from './TestComponent2.js';

var _world = new World();

_world.AddEntity(); 
_world.AddEntity();
_world.AddEntity();
_world.DebugEntity();  
_world.AddComponent(0,0,new TestComponent1);
_world.AddComponent(0,1,new TestComponent2);
_world.DebugEntity();



_world.RemoveComponent(0,0);

 console.log(_world.GetComponentData(0,0))
 console.log(_world.GetComponentData(0,1))
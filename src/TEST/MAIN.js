import World from '../ECS/World.js';


class TestComponent0
{  
   test=0;    
}
class TestComponent1
{
   test=0;    
}
class TestComponent2
{
   test=0;    
}
class TestComponent3 
{
   test=0;    
}

var _world = new World();

   for (let i = 0; i<10000; i++) 
   {
      _world.AddEntity();  
      _world.AddComponent(i,0,new TestComponent0);
      _world.AddComponent(i,1,new TestComponent1);
      _world.AddComponent(i,2,new TestComponent2);
      _world.AddComponent(i,3,new TestComponent3);
   }
   
function update()
{
  
   
   for (var e of _world.GetFiltred(1))
   {
      _world.RemoveComponent(e,1);
      var c1 = _world.GetComponentData(e,1)
   } 
   for (var e of _world.GetFiltred(0))
   {
      _world.AddComponent(e,1,new TestComponent1);         
   } 
 
}


function main() 
{
   setInterval(() => { 
      update();
    }, 1 / 60);

}

main();




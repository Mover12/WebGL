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

    for (let i = 0; i<10; i++) 
    {
        _world.AddEntity();  
        _world.AddComponent(i,0,new TestComponent0);
        _world.AddComponent(i,1,new TestComponent1);
        _world.AddComponent(i,2,new TestComponent2);
        _world.AddComponent(i,3,new TestComponent3);
    }


var filter = [0,1,2,3];

while(true)
{
    

    for (var it = 0; it <_world.GetFiltred(filter).length; it++)
    {
       _world.GetComponentData(_world.GetFiltred(filter)[it],0).test++;
       _world.GetComponentData(_world.GetFiltred(filter)[it],1).test++; 
       _world.GetComponentData(_world.GetFiltred(filter)[it],2).test++;
       _world.GetComponentData(_world.GetFiltred(filter)[it],3).test++;   
    } 
       
}





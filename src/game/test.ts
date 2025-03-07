import { Pool } from "../../pools";
import EcsPool from "./EcsPool";
import EcsAspect from "./EcsAspect";

class TestComponent1 {
    ass : number = 0;
}

class TestComponent2 {
    test2 : number = 0;
}
class TestComponent3 {
    test3 : number = 0;
} 

class TestComponent4 {
    test2 : number = 0;
}
class TestComponent5 {
    test : number = 0;
    test2 : number = 0;
}
class TestComponent6 {
    test2 : number = 0;
}
class TestComponent7 {
    test2 : number = 0;
}
class TestComponent8 {
    test2 : number = 0;
}
class TestComponent9 {
    test : number = 0;
    test2 : number = 0;
}
class TestComponent10 {
    test2 : number = 0;
}
class TestComponent11 {
    test2 : number = 0;
}
class TestComponent12 {
    test2 : number = 0;
}
class TestComponent13 {
    test : number = 0;
    test2 : number = 0;
}
class TestComponent14 {
    test2 : number = 0;
}
class TestComponent15 {
    test2 : number = 0;
}
class TestComponent16 {
    test2 : number = 0;
}


class Helpers
{
    UpdateBit(n: number, bitPosition: number, bitValue/* 0 или 1 */: number): number 
    {
        const normalized = bitValue ? 1 : 0;
        const mask = ~(1 << bitPosition);
        return (n & mask) | (normalized << bitPosition);
    }
}

class FilterMask 
{
    h = new Helpers;
    
    mask : number[] = [];
    
    UpdateComponent(maskchunk : number , position : number,value : number)
    {             
        this.mask[maskchunk] = this.h.UpdateBit(this.mask[maskchunk],position,value)                 
    }
    
    
    
}

class ComponentPosition
{
    chunknumber : number = 0;
    indexinchunk : number = 0;
}

class World
{  
    entities : number[] = [];
    eidcounter : number = 0;
    
    int32lenght : number = 30;
    
    cncounter : number = 0;
    ixcounter : number = 0;
    
    componentscount: number = 0;
    
    mappool : Map<string, ComponentPosition> = new Map;
    maskpool : FilterMask[] = [];
    
    
    NewEntity() : number
    {       
        this.entities.push(this.eidcounter) 
        this.eidcounter++;          
        return this.eidcounter-1;
    }
    
    RegisterComponent(name:string)
    {     
        var p = new ComponentPosition;
        p.chunknumber = this.cncounter;
        p.indexinchunk = this.ixcounter;
        
        this.mappool.set(name,p)
        
        if(this.ixcounter >= this.int32lenght)
            {
                this.cncounter++;
                this.ixcounter = 0;
                this.componentscount = this.cncounter;          
                return;
            }
            
            this.ixcounter++;
        }
        
        NewFilter(masknames : any[]) : FilterMask
        {
            var f = new FilterMask
            
            for (let i = 0; i <= this.componentscount; i++) {
                
                f.mask[i] = 0;
            }
            
            for (let i = 0; i < masknames.length; i++) {
                
                var cn = this.mappool.get(masknames[i].name).chunknumber
                var indx = this.mappool.get(masknames[i].name).indexinchunk
                
                f.UpdateComponent(cn,indx,1)           
            }
            
            this.maskpool.push(f)  
            
            return f   
        }
        
}
    
var world = new World
    
   

class Aspect1 extends EcsAspect
{      
    c0 = new EcsPool(TestComponent1);
}

class Aspect2 
{
    c1 = new EcsPool(TestComponent2);
}

new Aspect1().init(world)
new Aspect2().init(world)



   

    // world.RegisterComponent(TestComponent1.name);
    // world.RegisterComponent(TestComponent2.name);
    
    
    // var f = world.NewFilter([TestComponent1,TestComponent2]);
    
   
    
    // console.log(f)
    
    // var e ;
    
    // for (let i = 0; i < 10; i++) {
    //     e = world.NewEntity();
    //     //cp1.Add(e);
        
    // }
    
   
    

    // System(filter(pos vel))

    // a1 = Aspe
    // a1. set pos
    
    /*var f1 = new FilterMask;
    console.log(f1.mask);
    console.log(f1.GetMask[0].toString(2))*/
    
    
    
    
    
    
    
    //console.log(f1);
    
    
    
    
    //b1 = h1.UpdateBit(b1,0,1)
    
    
    
    
    
    //console.log(b1.toString(2));
    //console.log(h1.setBit(b1,2).toString(2));
    
    
    
    /*var c0 = new EcsPool(TestComponent);
    var c1 = new EcsPool(TestComponent2);
    
    c0.Add(1);
    c0.Add(2);
    c0.Add(3);
    c0.Del(2);
    c0.Add(2);
    console.log(c0.items)
    c1.Add(1);
    
    console.log(c0.Get(1), c1.Get(1));*/
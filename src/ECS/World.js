class DataPool
{   
    datapool = new Map();// [entityid, componentdata]    
}


export default class World
{
    i=0;
    world= new Array();    
    componentpool = new Map(); // [componentid, datapool]
  

    constructor() {
      
    }

    
       
    AddEntity() 
    {     
        this.world[this.i] = [0,0,0,0]; 
        this.i++;   
    }

    AddComponent(entid,componentid,typedata) 
    {   
        this.world[entid][componentid] = 1; 
        this.AddComponentData(entid,componentid,typedata);       
    }

    RemoveComponent(entid,componentid) 
    {   
        this.world[entid][componentid] = 0; 
        this.RemoveComponentData(entid,componentid)         
    }
   
    AddComponentData(entid,componentid,typedata)
    {
        if(!this.componentpool.has(componentid))
        {
            var pool = new DataPool;
            this.componentpool.set(componentid,pool.datapool);
        }
        this.componentpool.get(componentid).set(entid,typedata )
    }

    RemoveComponentData(entid,componentid)
    {      
        this.componentpool.get(componentid).delete(entid)
    }

    GetComponentData(entid,componentid)
    {
        if(this.componentpool.has(componentid))
        {
            return this.componentpool.get(componentid).get(entid);
        }
    }


    GetFiltred(filter)
    {
        var pool = []
        var poolit = 0
        var no = -1;
       
        for(let entid =0; entid<this.world.length;entid++)
        {
            for(let componentid =0; componentid < filter.length;componentid++)
            {
                if(this.world[entid][filter[componentid]] != 1)
                {  
                  
                    no = entid;        
                    break;
                }
            }
            if(entid != no)
            {
                pool[poolit] = entid;
                poolit++;
            }
        }
        return pool;
    }




    DebugEntity() 
    {   
        for (let j = 0;j<this.world.length;j++) 
        {
            console.log(this.world[j])   
        }
    }

}

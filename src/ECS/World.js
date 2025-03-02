class DataPool
{   
    datapool = new Map();// [entityid, componentdata]    
}



export default class World
{
    i=0;
    world= new Array();    
    componentpool = new Map(); // [componentid, datapool]
  

    filterpool = [1,3,15,15,15]; 
    
    filteredpool = [new Set(),new Set(),new Set(),new Set(),new Set()]

    constructor() {
      
    }

    
       
    AddEntity() 
    {     
        this.world[this.i] = 0; 
        this.i++;   
    }

    AddComponent(entid,componentid,typedata) 
    {   
        this.world[entid] |= (1<<componentid);
        
        for(let fid =0; fid<this.filterpool.length;fid++)
        {
            if((this.filterpool[fid] & this.world[entid]) ==  this.filterpool[fid])
            {
                this.filteredpool[fid].add(entid)
            }
        }

        this.AddComponentData(entid,componentid,typedata);       
    }

    RemoveComponent(entid,componentid) 
    {   
        
        this.world[entid] ^= (1<<componentid); 

        for(let fid =0; fid<this.filterpool.length;fid++)
        {
                if((this.filterpool[fid] & this.world[entid]) !=  this.filterpool[fid])
                {
                    this.filteredpool[fid].delete(entid)
                }
        }
        
         

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
        //this.componentpool.get(componentid).delete(entid).delete()
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
        return this.filteredpool[filter];
    }

    DebugEntity() 
    {   
        for (let j = 0;j<this.world.length;j++) 
        {
            console.log(this.world[j])   
        }
    }

}

import {separateCrowd} from './crowd-separation.js';

// Keep sorted, contiguous cell ranges, but rebuild only the occupied rectangle.
// All consumers clamp to that rectangle, so stale entries outside it are inert.
export class CrowdGrid {
  constructor(capacity,cell=3){
    this.cell=cell;this.dim=Math.ceil(420/cell)+2;
    this.counts=new Int32Array(this.dim*this.dim);this.starts=new Int32Array(this.counts.length+1);
    this.touched=new Int32Array(this.counts.length);this.touchedCount=0;
    for(const key of ['items','cellOf','result'])this[key]=new Int32Array(capacity);
    for(const key of ['px','pz','pr'])this[key]=new Float32Array(capacity);
    this.separationTurns=new Uint32Array(capacity);this.resultCount=0;this.sepX=this.sepZ=0;
    this.minX=this.minZ=0;this.maxX=this.maxZ=-1;this.buildCells=0;
  }
  key(x,z){
    const last=this.dim-1;
    return Math.max(0,Math.min(last,Math.floor((z+210)/this.cell)+1))*this.dim+
      Math.max(0,Math.min(last,Math.floor((x+210)/this.cell)+1));
  }
  build(n,x,z,alive,radius,dying){
    this.separationCandidates=this.separationVisits=this.buildCells=0;
    for(let i=0;i<this.touchedCount;i++)this.counts[this.touched[i]]=0;
    this.touchedCount=0;this.minX=this.minZ=this.dim;this.maxX=this.maxZ=-1;
    for(let i=0;i<n;i++){
      if(!alive[i]){this.cellOf[i]=-1;continue;}
      const key=this.key(x[i],z[i]),col=key%this.dim,row=(key-col)/this.dim;
      this.cellOf[i]=key;
      if(this.counts[key]++===0)this.touched[this.touchedCount++]=key;
      this.minX=Math.min(this.minX,col);this.maxX=Math.max(this.maxX,col);
      this.minZ=Math.min(this.minZ,row);this.maxZ=Math.max(this.maxZ,row);
    }
    let offset=0;
    for(let row=this.minZ;row<=this.maxZ;row++){
      const left=row*this.dim+this.minX,right=row*this.dim+this.maxX;
      for(let key=left;key<=right;key++){
        this.starts[key]=offset;offset+=this.counts[key];this.counts[key]=0;this.buildCells++;
      }
      this.starts[right+1]=offset;
    }
    for(let i=0;i<n;i++){
      const key=this.cellOf[i];if(key<0)continue;
      const index=this.starts[key]+this.counts[key]++;
      this.items[index]=i;this.px[index]=x[i];this.pz[index]=z[i];
      this.pr[index]=dying?.[i]>0?NaN:radius?.[i]??0;
    }
  }
  separate(id,x,z,radius,budget){separateCrowd(this,id,x,z,radius,budget);}
  within(x,z,radius,actors,result){
    // Keep the existing four-unit broad-phase padding and cell/ID order.
    // Test live positions directly: movement since build and nested combat
    // queries must not use cached positions or a shared result array.
    const reach=radius+4;
    const left=Math.max(this.minX,Math.floor((x-reach+210)/this.cell)+1),right=Math.min(this.maxX,Math.floor((x+reach+210)/this.cell)+1);
    const top=Math.max(this.minZ,Math.floor((z-reach+210)/this.cell)+1),bottom=Math.min(this.maxZ,Math.floor((z+reach+210)/this.cell)+1);
    result.length=0;
    if(left<=right)for(let row=top;row<=bottom;row++){
      for(let i=this.starts[row*this.dim+left],end=this.starts[row*this.dim+right+1];i<end;i++){
        const id=this.items[i];if(!actors.alive[id]||actors.dying[id]>0)continue;
        const dx=actors.x[id]-x,dz=actors.z[id]-z,r=radius+actors.radius[id];
        if(dx*dx+dz*dz<=r*r)result.push(id);
      }
    }
    return result;
  }
  query(x,z,radius){
    const left=Math.max(this.minX,Math.floor((x-radius+210)/this.cell)+1),right=Math.min(this.maxX,Math.floor((x+radius+210)/this.cell)+1);
    const top=Math.max(this.minZ,Math.floor((z-radius+210)/this.cell)+1),bottom=Math.min(this.maxZ,Math.floor((z+radius+210)/this.cell)+1);
    let count=0;
    if(left<=right)for(let row=top;row<=bottom;row++){
      for(let i=this.starts[row*this.dim+left],end=this.starts[row*this.dim+right+1];i<end;i++)this.result[count++]=this.items[i];
    }
    this.resultCount=count;return count;
  }
}

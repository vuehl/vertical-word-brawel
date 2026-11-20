// Shared flow fields: one search per target cell/body size, not per monster.
export function createDeskNavigation(terrain) {
  const step=.75, {x:width,z:depth}=terrain.deskBounds;
  const cols=Math.ceil(width*2/step)+1, rows=Math.ceil(depth*2/step)+1;
  const fields=new Map(), directions=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
  const cell=(x,z)=>[Math.round((x+width)/step),Math.round((z+depth)/step)];
  const inside=(x,z)=>x>=0&&z>=0&&x<cols&&z<rows;
  return (x,z,targetX,targetZ,radius,out)=>{
    const size=Math.ceil(radius*2)/2;
    let field=fields.get(size);
    if(!field){
      const open=new Uint8Array(cols*rows);
      // The extra half diagonal keeps whole cells clear of silhouette seams.
      const clearance=size+step*Math.SQRT1_2;
      for(let iz=0;iz<rows;iz++)for(let ix=0;ix<cols;ix++){
        const px=ix*step-width,pz=iz*step-depth;
        open[iz*cols+ix]=terrain.inBounds(px,pz,clearance)&&!terrain.hitProp(px,0,pz,clearance);
      }
      field={open,distance:new Int32Array(open.length),queue:new Int32Array(open.length),goal:-1};
      fields.set(size,field);
    }
    const {open,distance,queue}=field;
    const clear=(ax,az,bx,bz)=>{
      const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/(step*.4)));
      for(let i=0;i<=n;i++){
        const [cx,cz]=cell(ax+(bx-ax)*i/n,az+(bz-az)*i/n);
        if(!inside(cx,cz)||!open[cz*cols+cx])return false;
      }
      return true;
    };
    if(clear(x,z,targetX,targetZ))return false;
    let [gx,gz]=cell(targetX,targetZ),goal=-1,best=Infinity;
    // A player can stand closer to a prop than a large monster can.
    for(let dz=-6;dz<=6;dz++)for(let dx=-6;dx<=6;dx++){
      const cx=gx+dx,cz=gz+dz,d=dx*dx+dz*dz;
      if(inside(cx,cz)&&open[cz*cols+cx]&&d<best){goal=cz*cols+cx;best=d;}
    }
    if(goal<0)return false;
    if(field.goal!==goal){
      field.goal=goal;distance.fill(-1);distance[goal]=0;queue[0]=goal;
      let tail=1;
      for(let head=0;head<tail;head++){
        const id=queue[head],cx=id%cols,cz=Math.floor(id/cols);
        for(const [dx,dz] of directions){
          const nx=cx+dx,nz=cz+dz,next=nz*cols+nx;
          if(!inside(nx,nz)||!open[next]||distance[next]>=0)continue;
          if(dx&&dz&&(!open[cz*cols+nx]||!open[nz*cols+cx]))continue;
          distance[next]=distance[id]+1;queue[tail++]=next;
        }
      }
    }
    const [cx,cz]=cell(x,z);
    let waypoint=-1,score=Infinity;
    // Look ahead across several cells to avoid a stop at each grid corner.
    for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){
      const nx=cx+dx,nz=cz+dz,id=nz*cols+nx;
      if(!inside(nx,nz)||distance[id]<0)continue;
      const px=nx*step-width,pz=nz*step-depth,d=Math.hypot(px-x,pz-z);
      const cost=distance[id]+d*.01;
      if(d<.1||cost>=score)continue;
      // Allow entry from the narrow margin outside the conservative grid.
      let safe=true;
      for(let q=1,n=Math.ceil(d/(step*.4));q<=n;q++)
        if(terrain.hitProp(x+(px-x)*q/n,0,z+(pz-z)*q/n,radius+.02)){safe=false;break;}
      if(safe){waypoint=id;score=cost;}
    }
    if(waypoint<0)return false;
    const dx=waypoint%cols*step-width-x,dz=Math.floor(waypoint/cols)*step-depth-z,d=Math.hypot(dx,dz);
    out.x=dx/d;out.z=dz/d;return true;
  };
}

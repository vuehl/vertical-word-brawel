// Shared flow fields: one search per target cell/body size, not per monster.
export function createDeskNavigation(terrain) {
  const step=.75, {x:width,z:depth}=terrain.deskBounds;
  const cols=Math.ceil(width*2/step)+1, rows=Math.ceil(depth*2/step)+1;
  const fields=new Map(), directions=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
  const cell=(x,z)=>[Math.round((x+width)/step),Math.round((z+depth)/step)];
  const inside=(x,z)=>x>=0&&z>=0&&x<cols&&z<rows;
  // All monster sizes and co-op targets share one queue per zone.
  const jobs=[];
  function* mapFloor(field,size){
    const clearance=size+step*Math.SQRT1_2;
    for(let id=0;id<field.open.length;id++){
      const px=(id%cols)*step-width,pz=Math.floor(id/cols)*step-depth;
      field.open[id]=terrain.inBounds(px,pz,clearance)&&!terrain.hitProp(px,0,pz,clearance);
      if((id+1)%128===0)yield;
    }
    field.ready=true;
  }
  function* buildRoute(open,route,goal){
    const distance=route.spare,queue=route.queue;
    distance.fill(-1);distance[goal]=0;queue[0]=goal;
    let tail=1;
    for(let head=0;head<tail;head++){
      const id=queue[head],cx=id%cols,cz=Math.floor(id/cols);
      for(const [dx,dz] of directions){
        const nx=cx+dx,nz=cz+dz,next=nz*cols+nx;
        if(!inside(nx,nz)||!open[next]||distance[next]>=0)continue;
        if(dx&&dz&&(!open[cz*cols+nx]||!open[nz*cols+cx]))continue;
        distance[next]=distance[id]+1;queue[tail++]=next;
      }
      if((head+1)%128===0)yield;
    }
    route.spare=route.distance;route.distance=distance;route.goal=goal;route.pending=false;
  }
  function steer(x,z,targetX,targetZ,radius,out,targetSlot=0){
    const size=Math.ceil(radius*2)/2;
    let field=fields.get(size);
    if(!field){
      field={open:new Uint8Array(cols*rows),ready:false,targets:new Map()};
      fields.set(size,field);jobs.push(mapFloor(field,size));
    }
    if(!field.ready)return false;
    const {open}=field;
    const clear=(ax,az,bx,bz)=>{
      const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/(step*.4)));
      for(let i=0;i<=n;i++){
        const [cx,cz]=cell(ax+(bx-ax)*i/n,az+(bz-az)*i/n);
        if(!inside(cx,cz)||!open[cz*cols+cx])return false;
      }
      return true;
    };
    const [gx,gz]=cell(targetX,targetZ);
    const targetOpen=inside(gx,gz)&&open[gz*cols+gx];
    if(targetOpen&&clear(x,z,targetX,targetZ))return false;
    let goal=gz*cols+gx;
    if(!targetOpen){
      // All pursuers of this size see the same clearance grid at the wall.
      if(field.blockedX!==gx||field.blockedZ!==gz){
        let best=Infinity;
        field.blockedX=gx;field.blockedZ=gz;field.nearestGoal=-1;
        for(let dz=-6;dz<=6;dz++)for(let dx=-6;dx<=6;dx++){
          const cx=gx+dx,cz=gz+dz,d=dx*dx+dz*dz;
          if(inside(cx,cz)&&open[cz*cols+cx]&&d<best){field.nearestGoal=cz*cols+cx;best=d;}
        }
      }
      goal=field.nearestGoal;
    }
    if(goal<0)return false;
    let target=field.targets.get(targetSlot);
    if(!target){
      target={goal:-1,pending:false,distance:new Int32Array(open.length),spare:new Int32Array(open.length),queue:new Int32Array(open.length)};
      field.targets.set(targetSlot,target);
    }
    if(target.goal!==goal&&!target.pending){
      target.pending=true;jobs.push(buildRoute(open,target,goal));
    }
    if(target.goal<0)return false;
    const distance=target.distance;
    const [cx,cz]=cell(x,z);
    let waypoint=-1,score=Infinity;
    function clearWaypoint(id){
      const dx=(id%cols)*step-width-x,dz=Math.floor(id/cols)*step-depth-z;
      const n=Math.ceil(Math.hypot(dx,dz)/(step*.4));
      for(let q=1;q<=n;q++){
        if(terrain.hitProp(x+dx*q/n,0,z+dz*q/n,radius+.02))return false;
      }
      return true;
    }
    // Look ahead across several cells to avoid a stop at each grid corner.
    // Usually the best candidate is clear. Check just that segment first.
    for(let pass=0;pass<2;pass++){
      for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){
        const nx=cx+dx,nz=cz+dz,id=nz*cols+nx;
        if(!inside(nx,nz)||distance[id]<0)continue;
        const px=nx*step-width,pz=nz*step-depth,d=Math.hypot(px-x,pz-z);
        const cost=distance[id]+d*.01;
        if(d<.1||cost>=score)continue;
        if(!pass||clearWaypoint(id)){waypoint=id;score=cost;}
      }
      if(waypoint<0||pass||clearWaypoint(waypoint))break;
      waypoint=-1;score=Infinity;
    }
    if(waypoint<0)return false;
    const dx=waypoint%cols*step-width-x,dz=Math.floor(waypoint/cols)*step-depth-z,d=Math.hypot(dx,dz);
    out.x=dx/d;out.z=dz/d;return true;
  }
  steer.advance=()=>{
    for(let chunk=0;chunk<8&&jobs.length;chunk++){
      const job=jobs.shift();
      if(!job.next().done)jobs.push(job);
    }
  };
  return steer;
}

// Placement uses the entry-connected floor for each body size. A half-cell
// diagonal of clearance keeps the corridor between adjacent cell centres open.
export function createSpawnPlacement(terrain) {
  const bounds=terrain.deskBounds || {x:terrain.play,z:terrain.play};
  const step=terrain.desk2d ? .75 : 1.5;
  const cols=Math.ceil(2*bounds.x/step)+1, rows=Math.ceil(2*bounds.z/step)+1;
  const xAt=col=>col*step-bounds.x, zAt=row=>row*step-bounds.z;
  const fields=new Map();
  function fieldFor(radius) {
    const size=Math.max(1,Math.ceil(radius*2)/2);
    if(fields.has(size))return fields.get(size);
    const open=new Uint8Array(cols*rows), queue=new Int32Array(open.length);
    const clearance=size+step*Math.SQRT1_2;
    let seed=-1,nearest=Infinity;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const x=xAt(col),z=zAt(row),id=row*cols+col;
      if(!terrain.inBounds(x,z,clearance)||Math.hypot(x,z)+clearance>terrain.arenaR||
          terrain.hitProp(x,terrain.height(x,z)+.01,z,clearance))continue;
      open[id]=1;
      const distance=(x-terrain.spawn.x)**2+(z-terrain.spawn.z)**2;
      if(distance<nearest){nearest=distance;seed=id;}
    }
    let count=0;
    function visit(id){
      if(open[id]!==1)return;
      open[id]=2;queue[count++]=id;
    }
    if(seed>=0)visit(seed);
    for(let head=0;head<count;head++){
      const id=queue[head],col=id%cols;
      if(col>0)visit(id-1);
      if(col+1<cols)visit(id+1);
      visit(id-cols);visit(id+cols);
    }
    fields.set(size,open);return open;
  }
  return function place(x,z,radius,out){
    const open=fieldFor(radius);
    const col=Math.round((x+bounds.x)/step),row=Math.round((z+bounds.z)/step);
    const clear=(px,pz)=>!terrain.hitProp(px,terrain.height(px,pz)+.01,pz,radius);
    if(col>=0&&row>=0&&col<cols&&row<rows&&open[row*cols+col]===2&&clear(x,z)){
      if(out){out.x=x;out.z=z;}
      return true;
    }
    if(!out)return false;
    // Search outwards around the requested point. Most rejected spawns only
    // need to move a few cells to clear an edge.
    const cx=Math.max(0,Math.min(cols-1,col)),cz=Math.max(0,Math.min(rows-1,row));
    let best=Infinity;
    function consider(ix,iz){
      if(ix<0||iz<0||ix>=cols||iz>=rows||open[iz*cols+ix]!==2)return;
      const px=xAt(ix),pz=zAt(iz),distance=(px-x)**2+(pz-z)**2;
      if(distance<best&&clear(px,pz)){best=distance;out.x=px;out.z=pz;}
    }
    for(let ring=0;ring<Math.max(cols,rows);ring++){
      for(let dx=-ring;dx<=ring;dx++){
        consider(cx+dx,cz-ring);
        if(ring)consider(cx+dx,cz+ring);
      }
      for(let dz=1-ring;dz<ring;dz++){
        consider(cx-ring,cz+dz);consider(cx+ring,cz+dz);
      }
      if(best<=((ring+.5)*step)**2)return true;
    }
    return Number.isFinite(best);
  };
}

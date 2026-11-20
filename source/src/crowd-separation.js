// Separation is a steering force, not a hit/damage query. Small groups retain
// exact results. Dense groups sample evenly across the entire local range,
// rotating samples between actors/frames rather than favouring the first IDs.
export function separateCrowd(grid,id,x,z,radius,budget=64){
  const reach=radius*2+1,cell=grid.cell,dim=grid.dim;
  const left=Math.max(grid.minX??0,Math.floor((x-reach+210)/cell)+1),right=Math.min(grid.maxX??dim-1,Math.floor((x+reach+210)/cell)+1);
  const top=Math.max(grid.minZ??0,Math.floor((z-reach+210)/cell)+1),bottom=Math.min(grid.maxZ??dim-1,Math.floor((z+reach+210)/cell)+1);
  if(left>right||top>bottom){grid.sepX=grid.sepZ=0;return;}
  const {starts,items,px,pz,pr}=grid;
  let candidates=0;
  for(let row=top;row<=bottom;row++)candidates+=starts[row*dim+right+1]-starts[row*dim+left];
  const step=Math.max(1,Math.ceil(candidates/budget));
  // Advance when this actor actually steers, not on the global frame clock:
  // every-other-frame or distant LOD updates must not keep sampling one parity.
  let offset=(id*17+grid.separationTurns[id]++)%step,sx=0,sz=0,visited=0;
  for(let row=top;row<=bottom;row++){
    const begin=starts[row*dim+left],end=starts[row*dim+right+1];
    let index=begin+offset;
    for(;index<end;index+=step){
      visited++;
      const reach=radius+pr[index],dx=x-px[index],dz=z-pz[index],squared=dx*dx+dz*dz;
      if(squared<reach*reach&&squared>1e-5&&items[index]!==id){
        const distance=Math.sqrt(squared),weight=(reach-distance)/reach*step/distance;
        sx+=dx*weight;sz+=dz*weight;
      }
    }
    offset=index-end;
  }
  grid.sepX=sx;grid.sepZ=sz;
  grid.separationCandidates=(grid.separationCandidates||0)+candidates;
  grid.separationVisits=(grid.separationVisits||0)+visited;
}

// A north-up paper print of the current zone. Keep moving objects and UI markers
// out of the cached sheet so filters, panning and peer updates share one base.
const sheets=new WeakMap();

function drawWorkshop(ctx,terrain){
  // Use the authored geometry, including batches outside the gameplay camera.
  const layers=[];
  for(const surface of terrain.workshopGroundSurfaces??[]){
    layers.push({shape:surface,height:surface.y,ink:'#b1bab1'});
  }
  for(const prop of terrain.zxProps??[]){
    layers.push({shape:prop,height:prop.baseY+prop.h,ink:prop.walkable?'#92a3ae':'#718792'});
  }
  for(const mesh of terrain.group.children){
    const image=mesh.material?.map?.image;
    const batch=mesh.userData.paperInstances;
    if(!image?.width||!batch||mesh.geometry!==terrain.paperAssets?.planes)continue;
    const m=batch.matrices;
    for(let i=0;i<m.length;i+=16){
      // Only horizontal painted faces belong in a plan. The tabletop itself
      // uses tiled wood grain and is represented by the paper ground colour.
      if(Math.abs(m[i+1])>.03||Math.abs(m[i+5])>.03||Math.abs(m[i])>terrain.world||Math.abs(m[i+6])>terrain.world)continue;
      layers.push({image,m,i,height:m[i+13]});
    }
  }
  layers.sort((a,b)=>a.height-b.height);
  for(const layer of layers){
    ctx.save();
    if(layer.shape){
      const s=layer.shape;
      ctx.translate(s.x,s.z);ctx.rotate(-(s.angle??s.a??0));
      ctx.fillStyle=layer.ink;ctx.strokeStyle='#617885';ctx.lineWidth=.22;
      ctx.fillRect(-s.w/2,-s.d/2,s.w,s.d);ctx.strokeRect(-s.w/2,-s.d/2,s.w,s.d);
    }else{
      const {m,i,image}=layer;
      // XY plane UVs start at bottom left; image space starts at top left.
      ctx.transform(m[i],m[i+2],-m[i+4],-m[i+6],m[i+12],m[i+14]);
      ctx.drawImage(image,-.5,-.5,1,1);
    }
    ctx.restore();
  }
}

export function regionAtlas(terrain){
  if(terrain.desk2d)return terrain.deskAtlas;
  if(sheets.has(terrain))return sheets.get(terrain);
  const x=terrain.world/2,z=x;
  const art=document.createElement('canvas'),density=640/(2*Math.max(x,z));
  art.width=Math.round(2*x*density);art.height=Math.round(2*z*density);
  const ctx=art.getContext('2d');
  ctx.fillStyle='#e7dfcd';ctx.fillRect(0,0,art.width,art.height);
  ctx.save();ctx.translate(art.width/2,art.height/2);ctx.scale(art.width/(2*x),art.height/(2*z));
  drawWorkshop(ctx,terrain);
  ctx.restore();
  // Limit the ink density of the illustration alone. A little local colour
  // keeps copper wood and blue stationery distinguishable beneath the markers.
  const pixels=ctx.getImageData(0,0,art.width,art.height),p=pixels.data;
  for(let i=0;i<p.length;i+=4){
    const r=p[i],g=p[i+1],b=p[i+2],light=(r*.24+g*.59+b*.17)/255;
    p[i]=129+light*106+r*.045;
    p[i+1]=151+light*82+g*.045;
    p[i+2]=166+light*62+b*.045;
  }
  ctx.putImageData(pixels,0,0);
  // Feather the scene into the margin at its real bounds, before caching it.
  ctx.save();ctx.globalCompositeOperation='destination-in';
  const shortSide=Math.min(art.width,art.height);
  // The workshop fills its non-playable perimeter with boundary props.
  // Start the ink wash at the playable edge instead of printing a second frame.
  const inset=Math.max(0,Math.min(.2,(1-terrain.play/Math.max(x,z))/2+.012));
  for(const [dx,dy,reach] of [[0,art.height,.15],[art.width,0,.075]]){
    const ink=ctx.createLinearGradient(0,0,dx,dy);
    const band=shortSide*reach/(dx||dy);
    for(const [offset,alpha] of [[0,0],[band*.25,.14],[band*.65,.72],[band,1]]){
      const color='rgba(255,255,255,'+alpha+')';
      ink.addColorStop(inset+offset,color);ink.addColorStop(1-inset-offset,color);
    }
    ctx.fillStyle=ink;ctx.fillRect(0,0,art.width,art.height);
  }
  ctx.restore();
  const sheet={art,x,z};
  sheets.set(terrain,sheet);
  return sheet;
}


export function atlasSymbol(){
  const art=document.createElement('canvas');art.width=art.height=66;art.className='zx-atlas-symbol';art.dataset.static='true';art.setAttribute('aria-hidden','true');
  const c=art.getContext('2d');c.scale(2,2);
  function face(points,fill){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=fill;c.fill();}
  face([[1,10],[11,6],[11,26],[1,30]],'#C1D7E7');
  face([[11,6],[21,10],[21,30],[11,26]],'#839DBA');
  face([[21,10],[31,6],[31,26],[21,30]],'#DCE8F1');
  c.beginPath();c.moveTo(4,22);c.lineTo(11,16);c.lineTo(16,20);c.lineTo(26,14);c.lineWidth=1.3;c.strokeStyle='#587493';c.stroke();
  face([[19,7],[23,2],[28,6],[25,11],[22,14]],'#E89BA0');
  c.beginPath();c.arc(23.8,6.9,1.6,0,2*Math.PI);c.fillStyle='#FFF4ED';c.fill();return art;
}

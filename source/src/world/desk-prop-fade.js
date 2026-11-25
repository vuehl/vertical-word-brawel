import contours from '../../../resources/public/config/desk-fade-contours.json' with {type:'json'};
import layout from '../../../resources/public/config/desk2d-layout.json' with {type:'json'};
import {deskPixelsPerUnit as ppu,deskTilt} from './desk-framing.js';

function bounds(points){
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  return {points,left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
}
const cup=bounds(contours.cup),tissue=bounds(contours.zhi);
const left=Math.min(cup.left,tissue.left),right=Math.max(cup.right,tissue.right);

// Test the actor's ground footprint against the painted outline, including
// five display pixels of clearance in the current orthographic projection.
function touches(shape,px,py,rx,ry){
  if(px<shape.left-rx||px>shape.right+rx||py<shape.top-ry||py>shape.bottom+ry)return false;
  const pts=shape.points;
  const invX=1/rx,invY=1/ry,last=pts[pts.length-1];
  let ax=(last[0]-px)*invX,ay=(last[1]-py)*invY,inside=false;
  for(const curr of pts){
    const bx=(curr[0]-px)*invX,by=(curr[1]-py)*invY;
    if((ay>0)!==(by>0)&&ax+(bx-ax)*ay/(ay-by)>0)inside=!inside;
    const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
    const along=len?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/len)):0;
    if((ax+along*dx)**2+(ay+along*dy)**2<=1+1e-9)return true;
    ax=bx;ay=by;
  }
  return inside;
}

export function updateDeskPropFade(run){
  const {camera,canvas}=run.r;
  if(!canvas.clientHeight)return;
  const margin=5*2*ppu/(camera.projectionMatrix.elements[5]*canvas.clientHeight);
  const {player,coop}=run;
  let atCup=false,atTissue=false;
  function check(x,z,radius){
    const px=layout.width/2+x*ppu,rx=radius*ppu+margin;
    if(px<left-rx||px>right+rx)return;
    const py=layout.height/2+z*ppu*deskTilt,ry=radius*ppu*deskTilt+margin;
    if(!atCup)atCup=touches(cup,px,py,rx,ry);
    if(!atTissue)atTissue=touches(tissue,px,py,rx,ry);
  }
  if(!player.dead)check(player.pos.x,player.pos.z,player.radius);
  if(coop)for(const peer of coop.visiblePeers())check(peer.x,peer.z,player.radius);
  const materials=run.terrain.deskFadeMaterials;
  for(const material of materials.cup)material.opacity=atCup?.5:1;
  for(const material of materials.zhi)material.opacity=atTissue?.5:1;
}

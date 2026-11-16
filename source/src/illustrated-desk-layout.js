import {illustratedDeskProps} from './illustrated-desk-props.js';

// Authored object groups occupy the desk. Low books/pads are traversable floor;
// taller objects have real footprints. The negative space is a connected route,
// rather than a uniform scatter of miniature obstacles on empty terrain.
export function* buildIllustratedDesk(api){
  const {terrain,stage,group,box,roundedBox,groundY,bookStack,ballpoint,eraser,tapeRoll,penCup,placeMarble,looseMarbles,deskLamp,notebook,paperPile,handheld}=api;
  const p=illustratedDeskProps(api),layout=terrain.workshopLayout={style:'illustrated-desktop',anchors:[],giantScale:true,sceneText:true,reference:'desk-01-02-08',version:1};
  const turnPoint=(x,z,a,dx,dz)=>[x+Math.cos(a)*dx+Math.sin(a)*dz,z-Math.sin(a)*dx+Math.cos(a)*dz];
  function cluster(kind,x,z,s=1,a=0){
    const at=(dx,dz)=>turnPoint(x,z,a,dx*s,dz*s);
    const put=(fn,dx,dz,scale=1,turn=0)=>fn(...at(dx,dz),s*scale,a+turn);
    const pen=(dx,dz,angle,color,scale=1)=>ballpoint(...at(dx,dz),a+angle,color,s*scale);
    layout.anchors.push({kind,x,z,size:s,turn:a});
    if(kind==='studio'){
      put(p.tablet,2.7,1,.81);put(p.keyboard,3,-8.7,.80);
      put(p.fan,-6.9,-3.8,.70,-.24);put(p.paintTube,-4.8,7.3,.87,.27);
      put(p.cube,5.8,-1.8,.72,.16);pen(6.8,6.3,.27,'#556b83',.83);
      put(p.paperNote,-6,-11,.72,.24);looseMarbles(...at(4,10),3);
    }else if(kind==='travel'){
      put(p.planner,0,0,1.08,.10);put(p.phone,-2,-1,1,-.21);
      put(p.camera,-10,7,.85,-.20);put(p.mug,11,4,.81,.10);
      put(p.paperNote,4,-5,1,.12);pen(7,1,.2,'#b2586c',1.0);
      put(p.headphones,-7,-12,.73,.14);put(p.paintTube,5,12,.7,-.25);
    }else if(kind==='milk'){
      put(p.cuttingMat,0,3,.86,.02);
      put(p.bottle,-6,-3,.95,-.10);put(p.crate,4,-8,1,.02);
      put(p.correctionTape,1,3,1.1,-.40);put(p.phone,8,9,.84,.13);
      put(p.succulent,-10,-12,.73,.10);put(p.cube,11,-2,.62,-.1);
      put(p.paperNote,-5,10,.72,-.2);pen(-9,7,-.28,'#d2aa64',.84);
    }else if(kind==='study'){
      put(p.cuttingMat,1,3,1,.09);put(p.laptop,0,-8,1.02,-.07);
      put(p.mug,-10,6,.89,-.12);put(p.succulent,-11,-9,.82,.12);
      put(p.phone,1,5,.87,-.3);put(p.cube,10,3,.80,.12);
      put(p.paperNote,8,-6,.80,.14);pen(9,11,-.36,'#d2ac68',1.0);
      eraser(...at(-3,13),a+.2);looseMarbles(...at(7,12),3);
    }else if(kind==='artist'){
      notebook(...at(0,2),15*s,20*s,a-.12,.24);
      put(p.planner,5,-9,.75,.13);put(p.mug,-10,-2,.83,.2);
      penCup(...at(-10,-10),.66*s,a+.2);put(p.paintTube,9,8,.9,.55);
      put(p.paintTube,11,1,.72,.2);put(p.correctionTape,-5,11,.8,.18);
      pen(5,7,.2,'#548d8b',1);put(p.paperNote,3,-3,.70,-.07);tapeRoll(...at(11,-9),.60*s,a-.1);
    }else{
      put(p.cuttingMat,0,3,.92,.02);put(p.headphones,0,-7,1,.10);
      put(p.crate,-10,-7,.9,-.07);put(p.cube,7,-5,1,.10);
      put(p.phone,-5,5,.94,-.23);put(p.mug,10,7,.81,.1);
      handheld(...at(3,9),1.0*s,a+.24);pen(-11,8,-.25,'#b9747e',.85);
      looseMarbles(...at(1,1),4);
    }
  }
  // This first composition closely follows the drawing-tablet / keyboard / fan
  // scale hierarchy in the gameplay reference. Spawn stays on the clear pad.
  if(stage===4){
    // The sanctuary enters at (0,39), not the regular origin. Its boss and
    // authored arena pillars require an open centre and a southern approach.
    p.cuttingMat(0,0,1.60,-.08);p.planner(-13,25,1.12,-.18,'#797b98');yield;
    cluster('travel',-35,-5,.85,.16);yield;
    cluster('study',34,-10,.84,-.13);yield;
    cluster('artist',0,-37,.82,-.10);yield;
    p.mug(-27,24,.80,.15);p.paintTube(15,31,.94,.30);p.paperNote(-3,24,1.1,-.2);looseMarbles(12,18,4);
    // Flank the entrance like the regular desk without putting a solid object
    // in its central approach. Thin overlapping journals remain walkable.
    p.planner(-11,42,.92,.15,'#9a7d90');p.bottle(8.5,33,.85,.12);
    p.paintTube(5.5,45,.90,-.32);p.paperNote(-.8,45,.90,.12);
    layout.anchors.push({kind:'sanctuary',x:0,z:0,size:1.6,turn:-.08});
  }else{
    cluster('studio',0,0,1,-.16);yield;
    cluster(stage===2?'play':'travel',-27,3,1.03,.16);yield;
    cluster(stage===3?'study':'milk',28,-1,.98,-.13);yield;
    cluster('study',0,-28,.95,.17);yield;
    cluster('artist',-3,28,1.02,-.22);yield;
  }
  // Offset clusters use fixed, reproducible compositions, varied rotations and
  // shared meshes. Every area changes the activity mix without a tiled floor.
  let seed=(terrain.seed^0x7d312ac)>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const themes=['travel','milk','artist','study','play','studio'],limit=terrain.play-19;
  for(let row=-3;row<=3;row++)for(let col=-3;col<=3;col++){
    if(stage===4)continue;
    let x=col*27+(row%2?4:-2)+(random()-.5)*3,z=row*27+(random()-.5)*3;
    if(Math.abs(x)>limit||Math.abs(z)>limit||layout.anchors.some(c=>Math.hypot(x-c.x,z-c.z)<24))continue;
    // The final arena can be smaller than the standard desk. Respect its edge
    // and entry point as well as the standard spawn clearance.
    if(Number.isFinite(terrain.arenaR)&&Math.hypot(x,z)>terrain.arenaR-15)continue;
    const s=.90+random()*.10,a=(random()-.5)*.46;
    cluster(themes[(col*3+row*7+stage*2+70)%themes.length],x,z,s,a);yield;
  }
  // Keep the existing moving marble toys, in clearly authored side niches.
  for(const [kind,x,z] of [['switchback',-48,-22],['funnel',49,27],['twin',-46,45]]){
    if(stage!==4&&Math.max(Math.abs(x),Math.abs(z))<terrain.play-12)placeMarble(kind,x,z,.33,.10,13);yield;
  }
  // Larger stacks and storage form the edge of a real desk. The near edge is a
  // cutaway, so opaque walls never cover the character or combat view.
  const edge=terrain.play+5;
  terrain.workshopBoundary={edge,height:12,sides:4,groups:[],style:'desk-storage'};
  for(let side=0;side<4;side++){
    const a=side*Math.PI/2,g=group(0,0,a),near=side===2;
    // The continuous desktop already supplies the slab. An extra frame with
    // its top at y=0 fights that same floor and flashes along the near edge.
    if(!near){box(g,0,5.5,-edge-2,edge*2+8,11,1.1,['#b5b9ad','#c8aaa8','#adb7be'][stage%3]);roundedBox(g,0,.75,-edge+.4,edge*2,1.5,1.7,'#d2b98e');}
    for(let k=-2;k<=2;k++){
      const [x,z]=turnPoint(0,0,a,k*37,-edge+8);
      terrain.workshopBoundary.groups.push({side,x,z,kind:near?'papers':'storage'});
      if(near){p.planner(x,z,.9,a+.08,'#787f91');p.paintTube(...turnPoint(x,z,a,10,2),.85,a+.3);}
      else if((k+side+stage)%3===0){p.laptop(x,z,1.2,a+.05);p.succulent(...turnPoint(x,z,a,12,0),.9,a);}
      else if((k+side)%2){p.crate(x,z,1.3,a-.10);p.bottle(...turnPoint(x,z,a,11,0),1.1,a);}
      else {bookStack(x,z,.80,a+.11);p.headphones(...turnPoint(x,z,a,13,2),.9,a-.15);}
    }
    yield;
  }
  terrain.spawn.y=groundY(terrain.spawn.x,terrain.spawn.z);
}

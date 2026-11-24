// A few flush pieces of differently cut timber, not raised mats or new terrain.
// Most of the accepted continuous honey desktop remains exactly as it was.
export function addTabletopInlays({terrain,root,plane,texture,texMat}){
  const s=terrain.play/108;
  const regions=[
    {kind:'weathered-oak',label:'灰褐宽木板',x:-21*s,z:35*s,w:58*s,d:44*s},
    {kind:'warm-slats',label:'暖橙细拼板',x:-31*s,z:-27*s,w:58*s,d:48*s},
    {kind:'golden-ash',label:'淡金细木纹',x:69*s,z:31*s,w:62*s,d:64*s},
  ];
  terrain.workshopDesktopInlays=regions;
  for(const region of regions){
    const map=texture('desktop-inlay-'+region.kind,1024,512,(c,w,h)=>drawTimber(c,w,h,region.kind));
    const material=texMat('desktop-inlay-'+region.kind,map);
    material.name='flush-desktop-'+region.kind;
    material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;
    plane(root,region.x,.002,region.z,region.w,region.d,material);
  }
}

function drawTimber(c,w,h,kind){
  let seed={ 'weathered-oak':781,'warm-slats':931,'golden-ash':1291 }[kind];
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const palettes={
    'weathered-oak':['#b3a083','#ac997f','#b7a589','#af9e84','#b6a388'],
    'warm-slats':['#c79c74','#cda17a','#c89d76','#cba17c','#c49a74'],
    'golden-ash':['#c9a777'],
  };
  c.fillStyle=palettes[kind][0];c.fillRect(0,0,w,h);c.lineCap='round';
  function stroke(points,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.stroke();}
  if(kind==='weathered-oak'){
    const rows=7,step=h/rows;
    for(let j=0;j<rows;j++){
      const y=j*step;c.fillStyle=palettes[kind][j%5];c.fillRect(0,y,w,step);
      if(j)stroke([[0,y],[w,y]],'#70634e70',1.3);
      // Broad, gently varying plank faces and a handful of broken pen lines.
      for(let i=0;i<6;i++){
        const x=random()*w*.91,yy=y+8+random()*(step-16),length=45+random()*190;
        stroke([[x,yy],[x+length*.40,yy-1],[Math.min(w,x+length),yy+.5]],i%3?'#6f665333':'#e1d2b742',i%3?1.1:1.8);
      }
    }
  }else if(kind==='warm-slats'){
    const cols=17,step=w/cols;
    for(let j=0;j<cols;j++){
      const x=j*step;c.fillStyle=palettes[kind][j%5];c.fillRect(x,0,step,h);
      if(j)stroke([[x,0],[x,h]],'#936f5155',1.1);
      for(let i=0;i<3;i++){
        const xx=x+7+random()*(step-14),y=random()*h,len=40+random()*130;
        stroke([[xx,y],[xx+1,y+len*.6],[xx-.7,Math.min(h,y+len)]],'#8f694e1c',.9);
      }
    }
  }else{
    // Quiet ash grain from the third reference; few curves, no regular bands.
    for(let i=0;i<45;i++){
      const x=random()*w,y=random()*h,len=160+random()*420,bend=(random()-.5)*5;
      c.strokeStyle=i%4?'#86653f44':'#f2d8a94a';c.lineWidth=i%4?1.2:1.7;
      c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+len*.3,y+bend,x+len*.7,y-bend,x+len,y+1);c.stroke();
    }
    for(const [x,y,rx,ry] of [[w*.28,h*.32,62,7],[w*.78,h*.74,79,9]]){
      c.strokeStyle='#916d4245';c.lineWidth=1.4;
      c.beginPath();c.ellipse(x,y,rx,ry,-.015,0,Math.PI*2);c.stroke();
    }
  }
  // One hairline butt joint. No thick border, bevel, gap, cast shadow or step.
  c.strokeStyle=kind==='weathered-oak'?'#89745c65':'#9a785449';c.lineWidth=1;c.strokeRect(.5,.5,w-1,h-1);
}

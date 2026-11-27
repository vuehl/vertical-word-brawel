import {Bone,Skeleton,D as DataTexture,rt as RGBA,N as FloatType} from '../vendor/three-DmSYIDKK.js';
import {glyphSpace} from './glyph-geometry.js';
import models from '../../../resources/public/config/glyph-solids.json' with {type:'json'};
import poses from '../../../resources/public/config/glyph-motion.json' with {type:'json'};
import rigs from '../../../resources/public/config/hero-rigs.json' with {type:'json'};
import {heroActionCatalog} from './hero-action-catalog.js';

export {models as glyphModels};
const heroByWord=new Map(Object.entries(rigs).map(([id,rig])=>[rig.word,{rig,clips:heroActionCatalog[id]?.clips}]));
const actions=['idle','walk','attack','hurt'];
const samples=16;

function joint(parent,name,pivot){
  const bone=new Bone();
  bone.name=name;bone.matrixAutoUpdate=false;bone.userData.pivot=pivot;
  parent?.add(bone);
  return bone;
}

// A bone matrix in bind space, with a world-space pivot and an optional authored
// replacement pivot. Children still inherit the complete parent transform.
function transformJoint(bone,a=1,b=0,c=0,d=1,x=0,y=0,z=0,pivot=bone.userData.pivot){
  const [bx,by]=bone.userData.pivot,[px,py]=pivot,[ox,oy]=bone.parent?.userData.pivot??[0,0];
  bone.matrix.set(a,b,0,px+x+a*(bx-px)+b*(by-py)-ox,
    c,d,0,py+y+c*(bx-px)+d*(by-py)-oy,0,0,1,z,0,0,0,1);
}

export function createGlyphSkeleton(word){
  const model=models[word],hero=heroByWord.get(word),space=glyphSpace(model.frame);
  const root=joint(null,word,[0,0]),groups=[],bones=[];
  if(hero){
    for(const g of hero.rig.groups){
      const group=joint(root,g.name,space.point(g.px,g.py));groups.push(group);
      for(const s of g.strokes)bones.push(joint(group,s.name,space.point(s.px,s.py)));
    }
  }else{
    for(const [i,stroke] of model.strokes.entries()){
      const points=stroke.flatMap(polygon=>polygon[0]);
      let x=0,y=0;
      for(let k=0;k<points.length;k+=2){x+=points[k];y+=points[k+1];}
      bones.push(joint(root,String(i+1),space.point(x*2/points.length,y*2/points.length)));
    }
  }
  function reset(){root.traverse(bone=>transformJoint(bone));}
  reset();root.updateMatrixWorld(true);
  const skeleton=new Skeleton(bones);
  const authored=poses[word]??[],firstAuthored=1+samples*actions.length,customRow=firstAuthored+authored.length;
  const stride=bones.length*16,rows=customRow+1,data=new Float32Array(rows*stride);
  function write(row){
    root.updateMatrixWorld(true);skeleton.update();
    data.set(skeleton.boneMatrices,row*stride);
  }
  write(0);
  // Crowd instances read their own row of the shared skeleton palette. All
  // timing comes from the actor's existing animation clock, including pause.
  for(const [index,action] of actions.entries()){
    for(let k=0;k<samples;k++){
      const cycle=k/samples*Math.PI*2,progress=k/(samples-1);
      const breath=action==='idle'?Math.sin(cycle)*.009:0;
      const step=action==='walk'?Math.sin(cycle):0;
      const strike=action==='attack'?Math.sin(progress*Math.PI):0;
      const recoil=action==='hurt'?Math.sin(progress*Math.PI*.8):0;
      transformJoint(root,1+.055*strike,step*.026-strike*.085,0,1+breath-.055*recoil,
        0,Math.abs(step)*.021,strike*.054);
      for(const [i,bone] of bones.entries()){
        const [x,y]=bone.userData.pivot,side=x<0?-1:1;
        const angle=(step*.046+strike*.065-recoil*.042)*side+breath*Math.sin(i+1);
        transformJoint(bone,Math.cos(angle),-Math.sin(angle),Math.sin(angle),Math.cos(angle),
          step*.008*(y-.5),side*step*.012,strike*(y-.4)*.045);
      }
      write(1+index*samples+k);
    }
  }
  reset();
  for(const [i,frame] of authored.entries()){
    for(const [j,bone] of bones.entries()){
      const n=j*6,[px,py]=bone.parent.userData.pivot,[bx,by]=bone.userData.pivot;
      const a=frame[n]/4096,b=frame[n+1]/4096,x=frame[n+2]/4096;
      const c=frame[n+3]/4096,d=frame[n+4]/4096,y=frame[n+5]/4096;
      bone.matrix.set(a,b,0,a*bx+b*by+x-px,c,d,0,c*bx+d*by+y-py,0,0,1,0,0,0,0,1);
    }
    write(firstAuthored+i);
  }
  const palette=new DataTexture(data,bones.length*4,rows,RGBA,FloatType);
  palette.needsUpdate=true;
  let previousPose;
  function setLocal(bone,part){
    if(!part){transformJoint(bone);return;}
    const angle=-(part.angle??0)*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
    const sx=part.scaleX??1,sy=part.scaleY??1;
    const bind=bone.userData.pivot;
    const pivot=[part.px==null?bind[0]:space.point(part.px,0)[0],part.py==null?bind[1]:space.point(0,part.py)[1]];
    transformJoint(bone,cos*sx,-sin*sy,sin*sx,cos*sy,(part.x??0)*space.unit,-(part.y??0)*space.unit,0,pivot);
  }
  function poseRow(action,time,normalized,frame,pose){
    if(pose&&pose.word===word){
      if(previousPose!==pose){
        reset();
        for(const group of groups){
          setLocal(group,pose.groups?.[group.name]);
          for(const bone of group.children)setLocal(bone,pose.strokes?.[group.name]?.[bone.name]);
        }
        write(customRow);palette.needsUpdate=true;previousPose=pose;
      }
      return customRow;
    }
    if(frame && (frame.action==='faint'||(action!=='attack'&&action!=='hurt')))
      return firstAuthored+hero.clips[frame.action].first+frame.index;
    const index=actions.indexOf(action);
    if(index<0)return 0;
    const phase=normalized?Math.max(0,Math.min(1,time)):time-Math.floor(time);
    return 1+index*samples+Math.min(samples-1,Math.floor(phase*samples));
  }
  return {skeleton,palette,poseRow,dispose(){palette.dispose();skeleton.dispose();}};
}

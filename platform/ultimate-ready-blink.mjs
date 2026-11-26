import {VFX_SCALE} from '../source/src/effects/visual-scale.js';
import {clearFrame,createFrame,painterFor} from '../source/src/vendor/pixelfx-blink-in.js';
import {blinkDuration,flashTail,readyBreathPhase} from '../source/src/effects/ultimate-ready-timing.js';
import {tile,silhouette,drawReadyPixels,packLightPixels,createReadyEmbers} from './ultimate-ready-pixels.mjs';
import {readyIrisLayer} from './ultimate-ready-iris.mjs';

const margin=Math.ceil(48*VFX_SCALE),width=tile+2*margin,height=width,fullRect=[0,0,1,1];

// Project the same instance and camera-facing plane as the glyph vertex shader.
function heroBounds(run,batch,index){
  const group=batch.zxGroup??batch,camera=run.r.camera.matrixWorld.elements;
  const pos=group.aPos.array,size=group.aSize.array,squash=group.aFx.array[index*4+3];
  const lean=group.material.uniforms.uLean.value;
  const ux=camera[4]*lean,uy=1-lean+camera[5]*lean,uz=camera[6]*lean;
  const height=size[index*2+1],up=height*(1-squash*.3)/Math.hypot(ux,uy,uz);
  const halfWidth=size[index*2]*(1+squash*.35)/2,depth=.25+height*.05;
  const x=pos[index*3]+camera[8]*depth,y=pos[index*3+1]+camera[9]*depth,z=pos[index*3+2]+camera[10]*depth;
  const bottom=run.ui.project(run,x,y,z),top=run.ui.project(run,x+ux*up,y+uy*up,z+uz*up);
  const mid=run.ui.project(run,x+ux*up/2,y+uy*up/2,z+uz*up/2);
  const side=run.ui.project(run,x+ux*up/2+camera[0]*halfWidth,y+uy*up/2+camera[1]*halfWidth,z+uz*up/2+camera[2]*halfWidth);
  return {x:mid.x,y:top.y,width:2*Math.abs(side.x-mid.x),height:bottom.y-top.y,visible:mid.vis};
}

function createLayer(makeCanvas,slot,ramp,drawEmbers){
  const sample=makeCanvas(),canvas={width,height};
  sample.width=sample.height=tile;
  const reader=sample.getContext('2d'),frame=createFrame(width,height),pixels=new Uint8Array(width*height*4);
  let oldImage,cache,lastShape,lastStage,lastStep;
  return function draw(image,rect,revision,stage,progress,opacity,x,y,w,h,view,scale,face,faceSize){
    if(!image||w<=0||h<=0)return null;
    if(oldImage!==image){oldImage=image;cache=new Map();}
    let entry=cache.get(rect);
    if(!entry||entry.revision!==revision||entry.face!==face||entry.faceSize!==faceSize){
      const [u,v,r,b]=rect;
      reader.clearRect(0,0,tile,tile);
      reader.drawImage(image,u*image.width,(1-b)*image.height,(r-u)*image.width,(b-v)*image.height,0,0,tile,tile);
      entry={revision,face,faceSize,shape:silhouette(reader.getImageData(0,0,tile,tile).data)};
      if(face){
        entry.shape.cx=entry.shape.cy=tile/2;
        // Keep the flash aligned with the full-size, centered attribute artwork.
        reader.clearRect(0,0,tile,tile);
        const side=faceSize*tile/84;
        reader.drawImage(face,(tile-side)/2,(tile-side)/2,side,side);
        entry.shape.face=silhouette(reader.getImageData(0,0,tile,tile).data);
      }
      cache.set(rect,entry);
    }
    const steps=30;
    const step=Math.floor(progress*steps);
    const changed=lastShape!==entry.shape||lastStage!==stage||lastStep!==step;
    if(changed){
      clearFrame(frame);
      const p=painterFor(frame);p.place(margin,margin);
      drawReadyPixels(p,entry.shape,stage,step/steps,ramp);
      if(drawEmbers&&stage!=='charge')drawEmbers(p,entry.shape,step/steps,ramp);
      packLightPixels(frame,pixels);
      lastShape=entry.shape;lastStage=stage;lastStep=step;
    }
    const px=w/tile,py=h/tile;
    return {slot,canvas,pixels,changed,opacity,x:(view.x+x-width*px/2)*scale,y:(view.y+y-margin*py)*scale,
      width:width*px*scale,height:height*py*scale};
  };
}

export function createReadyBlink(makeCanvas){
  let owner,palette,body,button;
  return function layers(run,view,scale){
    const player=run.player,ult=run.ult;
    if(player.dead||ult.active>0||ult.readyBlinkAt==null){
      owner=body=button=null;
      return [];
    }
    const currentPalette=ult.readyPalette;
    if(owner!==run||palette!==currentPalette){
      palette=currentPalette;owner=run;
      // Combat and scenic menus are exclusive; reuse their slots without touching
      // the boss health (27), cast (29/30), or joystick (0/31) textures.
      body=createLayer(makeCanvas,25,palette.ramp,createReadyEmbers());
      button=createLayer(makeCanvas,26,palette.ramp);
    }
    let stage='charge',progress=Math.min(blinkDuration,Math.max(0,run.time-ult.readyBlinkAt)),opacity=1;
    if(ult.ready&&ult.readyFlashAt!=null){
      stage='flash';progress=Math.max(0,run.time-ult.readyFlashAt);
      if(progress>=flashTail){
        stage='breath';
        const phase=readyBreathPhase(run.time,ult.readyFlashAt);
        opacity=.42+.58*(1+Math.cos(phase*2*Math.PI))/2;
      }
    }
    const result=[],rig=player.readyBatch,pose=player.readyFrame;
    const image=rig?.material.uniforms.zxGlyph?.value.image;
    if(image&&player.readyIndex!=null){
      const box=heroBounds(run,rig,player.readyIndex);
      // An atlas frame is immutable. The procedural pose canvas can repaint in place.
      const revision=!pose&&(player.heroPose||player.firePose)?Math.floor(run.time*15):0;
      if(box.visible)result.push(body(image._surface??image,pose?.rect??rig.zxGlyphRect??fullRect,revision,
        stage,progress,opacity,box.x,box.y,box.width,box.height,view,scale));
    }
    const seal=run.ui.touch?.ult?.querySelector('.zx-ult-progress');
    if(seal?._surface){
      const box=seal.getBoundingClientRect();
      const face=seal.readyFace;
      const buttonOpacity=ult.ready?opacity*.48:opacity;
      result.push(button(seal._surface,fullRect,0,stage,stage==='breath'?0:progress,buttonOpacity,box.x+box.width/2,box.y,box.width,box.height,view,scale,
        face?._surface??face,seal.readyFaceSize));
      if(ult.ready&&ult.readyFlashAt!=null&&!seal.readyStill)
        result.push(readyIrisLayer(box,view,scale,run.time-ult.readyFlashAt,palette.base));
    }
    return result;
  };
}

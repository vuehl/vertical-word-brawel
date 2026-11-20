import {ht as Vector3} from '../assets/three-DmSYIDKK.js';

// All registration is in the artist's original, top-left-origin canvas.
// The packaged face and highlight have their transparent margins trimmed.
export function installBillGaze(sprite,textures,frame){
  const {width,height,socket:[x,y,w,h],pupil:[pw,ph]}=frame;
  const active={value:false},pupilCenter={value:[x+w/2,y+h/2]};
  const cx=x+w/2,cy=y+h/2,travelX=(w-pw)*.46,travelY=(h-ph)*.46;
  const material=sprite.material;
  // Premultiply before filtering/mipmap generation: the artist's transparent
  // pixels retain blue/black RGB, which must not bleed into the visible ink.
  for(const texture of Object.values(textures)){
    texture.premultiplyAlpha=true;
    texture.needsUpdate=true;
  }
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{
      billActive:active,billFace:{value:textures.face},billPupil:{value:textures.pupil},billGlint:{value:textures.highlight},
      billSheet:{value:[width,height]},faceRect:{value:frame.face},glintRect:{value:frame.highlight},
      pupilSize:{value:frame.pupil},pupilCenter,
    });
    shader.fragmentShader=`
      uniform bool billActive;
      uniform sampler2D billFace,billPupil,billGlint;
      uniform vec4 faceRect,glintRect;
      uniform vec2 billSheet,pupilSize,pupilCenter;
      vec4 billLayer(sampler2D img,vec2 at,vec4 rect){
        vec2 uv=(at-rect.xy)/rect.zw;
        // Sample unconditionally so adjacent fragments keep valid mip derivatives
        // at the rectangular layer boundary, including on mobile GPUs.
        vec4 ink=texture2D(img,vec2(uv.x,1.-uv.y));
        vec2 inside=step(vec2(0.),uv)*step(uv,vec2(1.));
        return ink*inside.x*inside.y;
      }
      vec4 billOver(vec4 under,vec4 over){
        return over+under*(1.-over.a);
      }
    `+shader.fragmentShader.replace('#include <map_fragment>',`
      vec4 body=texture2D(map,vMapUv);
      if(billActive){
        vec2 at=vec2(vMapUv.x,1.-vMapUv.y)*billSheet;
        vec4 face=billLayer(billFace,at,faceRect);
        vec4 layered=billOver(body,face);
        vec4 eye=billLayer(billPupil,at,vec4(pupilCenter-pupilSize*.5,pupilSize));
        // The cyan ink itself clips the pupil at the curved rim.
        eye*=face.a*smoothstep(.10,.36,face.g-face.r)*smoothstep(.015,.075,face.g-face.b);
        layered=billOver(layered,eye);
        layered=billOver(layered,billLayer(billGlint,at,glintRect));
        body=layered;
      }
      body.rgb/=max(body.a,.00001);
      diffuseColor*=body;
    `);
  };
  const eye=new Vector3(),playerNdc=new Vector3(),lo=new Vector3(),hi=new Vector3();
  sprite.geometry.computeBoundingBox();
  const bounds=sprite.geometry.boundingBox;
  function overlap(a,b){
    return a.z>=-1&&a.z<=1&&a.x<=1&&b.x>=-1&&a.y<=1&&b.y>=-1;
  }
  return (camera,player,visible,dt)=>{
    // Keep the flat art facing the camera on both the desk and later maps.
    sprite.quaternion.copy(camera.quaternion);
    sprite.position.set(0,sprite.scale.y*.39,0).applyQuaternion(camera.quaternion);
    if(visible){
      sprite.updateWorldMatrix(true,false);
      lo.copy(bounds.min).applyMatrix4(sprite.matrixWorld).project(camera);
      hi.copy(bounds.max).applyMatrix4(sprite.matrixWorld).project(camera);
      visible=overlap(lo,hi);
    }
    if(visible){
      // Test the player's visible body as well as the facility. The camera
      // can stop following at a map boundary or turn away during a cutscene.
      playerNdc.copy(player.pos);playerNdc.y+=player.radius;
      playerNdc.applyMatrix4(camera.matrixWorldInverse);
      lo.copy(playerNdc);hi.copy(playerNdc);
      lo.x-=player.radius;hi.x+=player.radius;lo.y-=player.radius;hi.y+=player.radius;
      lo.applyMatrix4(camera.projectionMatrix);hi.applyMatrix4(camera.projectionMatrix);
      visible=overlap(lo,hi);
    }
    if(visible){
      playerNdc.applyMatrix4(camera.projectionMatrix);
      eye.set(cx/width-.5,.5-cy/height,0).applyMatrix4(sprite.matrixWorld).project(camera);
      const dx=(playerNdc.x-eye.x)*camera.aspect,dy=eye.y-playerNdc.y;
      const length=Math.max(.055,Math.hypot(dx,dy));
      const blend=active.value?1-Math.exp(-16*dt):1;
      const p=pupilCenter.value;
      p[0]+=(cx+travelX*dx/length-p[0])*blend;
      p[1]+=(cy+travelY*dy/length-p[1])*blend;
    }
    active.value=visible;
  };
}

import {G as Matrix4} from '../assets/three-DmSYIDKK.js';
import {deskPixelsPerUnit} from './desk-framing.js';

export function installMagnet(root,body,shadow,frame){
  const ink={value:0},home=body.position.clone();
  const {width:w,height:h}=frame,drop=32;
  const shadowPose=new Matrix4();
  shadow.updateMatrix();
  const shadowHome=shadow.matrix.clone();
  shadow.matrixAutoUpdate=false;
  shadow.material.depthWrite=false;
  body.material.onBeforeCompile=shader=>{
    shader.uniforms.magnetSpent=ink;
    shader.fragmentShader='uniform float magnetSpent;\n'+shader.fragmentShader.replace('#include <map_fragment>',`
      #include <map_fragment>
      vec3 rgb=sRGBTransferOETF(vec4(diffuseColor.rgb,1.)).rgb;
      float gray=.315*(max(max(rgb.r,rgb.g),rgb.b)+min(min(rgb.r,rgb.g),rgb.b));
      diffuseColor.rgb=mix(diffuseColor.rgb,sRGBTransferEOTF(vec4(vec3(gray),1.)).rgb,magnetSpent);
    `);
  };
  let used=false,start=0,releaseLift=0,lastLand=-1;
  function liftAt(time){return 8*Math.sin(time*2*Math.PI/1.6);}
  function update(time){
    const t=used?Math.min(1,Math.max(0,(time-start)/.24)):0;
    const land=t*t*(3-2*t);
    const lift=used?releaseLift*(1-land)-drop*land:liftAt(time);
    body.position.copy(home);
    body.translateY(lift/deskPixelsPerUnit);
    ink.value=land;
    if(land===lastLand)return;
    lastLand=land;
    // Match the contact shadow in the spent-state reference. Both sheets
    // share a canvas, so register the shadow in the body's pixel coordinates.
    const cx=1.19*(w/2-86)+.35*(h/2-137)+88;
    const cy=-.05*(w/2-86)+1.426*(h/2-137)+83+drop;
    shadowPose.set(1+.19*land,-.35*h/w*land,0,(cx-w/2)/w*land,
      .05*w/h*land,1+.426*land,0,(h/2-cy)/h*land,0,0,1,0,0,0,0,1);
    shadow.matrix.multiplyMatrices(shadowHome,shadowPose);
    shadow.matrixWorldNeedsUpdate=true;
  }
  root.userData.updateMagnet=update;
  root.userData.setMagnetUsed=(spent,time,settled=false)=>{
    if(spent!==used){
      releaseLift=liftAt(time);used=spent;start=settled?time-.25:time;
    }
    update(time);
  };
}

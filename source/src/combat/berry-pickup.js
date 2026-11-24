import {ht as Vector3} from '../vendor/three-DmSYIDKK.js';

const kickPx=11, kickSeconds=.13, returnSeconds=.30;
const a=new Vector3(),b=new Vector3();

export function createBerryPickup(model,graphics){
  const home=model.position.clone(),scale=model.scale.clone(),parent=model.parent;
  const center=new Vector3(),offset=new Vector3(),kicked=new Vector3(),target=new Vector3(),pos=new Vector3();
  let elapsed=0;
  function bodyPosition(player){
    return target.setFromMatrixColumn(graphics.camera.matrixWorld,1)
      .multiplyScalar(player.radius*1.8).add(player.pos);
  }
  function begin(player){
    elapsed=0;
    const {camera,canvas}=graphics;
    camera.updateMatrixWorld();
    offset.copy(model.userData.pickupCenter).multiply(scale).applyQuaternion(model.quaternion);
    center.copy(home).add(offset);
    const world=parent.localToWorld(pos.copy(center));
    const depth=a.copy(world).applyMatrix4(camera.matrixWorldInverse).z;
    const m=camera.projectionMatrix.elements;
    const step=kickPx*2*(m[11]*depth+m[15])/(m[5]*canvas.clientHeight);
    a.subVectors(world,bodyPosition(player));
    b.setFromMatrixColumn(camera.matrixWorld,2);a.addScaledVector(b,-a.dot(b));
    if(a.lengthSq()<1e-8)a.setFromMatrixColumn(camera.matrixWorld,0);
    parent.worldToLocal(kicked.copy(world).addScaledVector(a.normalize(),step));
  }
  function advance(dt,player){
    elapsed+=dt;
    const u=Math.min(1,Math.max(0,(elapsed-kickSeconds)/returnSeconds));
    const pull=u*u,shrink=1-pull;
    if(elapsed<kickSeconds)pos.lerpVectors(center,kicked,1-(1-elapsed/kickSeconds)**2);
    else pos.lerpVectors(kicked,parent.worldToLocal(bodyPosition(player)),pull);
    model.scale.copy(scale).multiplyScalar(shrink);
    model.position.copy(pos).addScaledVector(offset,-shrink);
    if(u<1)return false;
    model.visible=false;return true;
  }
  function reset(){model.position.copy(home);model.scale.copy(scale);model.visible=true;}
  return {begin,advance,reset};
}

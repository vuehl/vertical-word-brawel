import {ht as Vector3} from '../vendor/three-DmSYIDKK.js';
import {heroActionCatalog} from '../actors/hero-action-catalog.js';
import {glyphBillboardSize} from '../actors/hero-actions.js';
import reference from '../../../resources/public/assets/vfx/evolution-screen.json' with {type:'json'};
import {EVOLUTION_DURATION} from './evolution-timing.js';

// Match the reference's 80 px character size by changing the actual camera
// projection so the desk, glyph and world-space orbits share the same zoom.
export class EvolutionCamera {
  constructor(run){this.run=run;this.point=new Vector3();this.savedProjection=run.r.camera.projectionMatrix.clone();}
  start(actor){
    this.actor=actor;this.started=this.run.realTime;
    const id=actor.speciesId;
    this.inkHeight=glyphBillboardSize(this.run.sprites.get(id).bodyHeight())*
      (heroActionCatalog[id]?.scale??1)*(reference.camera.inkHeights[id]??.6);
    this.focusHeight=this.inkHeight*(reference.camera.feetY-368)/reference.camera.inkPixels;
  }
  restore(){
    if(!this.base)return;
    const c=this.run.r.camera;
    if(c.aspect===this.aspect){c.projectionMatrix.copy(this.base);c.projectionMatrixInverse.copy(this.base).invert();}
    this.base=null;
  }
  apply(){
    if(!this.actor)return;
    const age=this.run.realTime-this.started;
    if(age>=EVOLUTION_DURATION+.35||this.actor.dead){this.actor=null;return;}
    const c=this.run.r.camera;
    c.updateMatrixWorld();
    this.base=this.savedProjection.copy(c.projectionMatrix);this.aspect=c.aspect;
    const spanY=Math.min(1,(reference.width/reference.height)/c.aspect);
    this.point.copy(this.actor.pos);this.point.y+=.08;this.point.applyMatrix4(c.matrixWorldInverse);
    const p=this.base.elements,w=p[3]*this.point.x+p[7]*this.point.y+p[11]*this.point.z+p[15];
    const inkNdc=this.inkHeight*p[5]/w;
    const targetInkNdc=2*reference.camera.inkPixels/reference.height/spanY;
    const zoom=targetInkNdc/inkNdc;
    const anchorX=(p[0]*this.point.x+p[4]*this.point.y+p[8]*this.point.z+p[12])/w;
    const anchorY=(p[1]*this.point.x+p[5]*this.point.y+p[9]*this.point.z+p[13])/w;
    const targetY=(1-2*reference.camera.feetY/reference.height)/spanY;
    let blend=Math.max(0,Math.min(1,(EVOLUTION_DURATION+.35-age)/.35));blend=blend*blend*(3-2*blend);
    // The paper camera already puts the player at the center of the projection.
    const centered=this.run.terrain.zxPaper;
    const scale=1+(zoom-1)*blend,dx=centered?0:-anchorX*zoom*blend,dy=centered?0:(targetY-anchorY*zoom)*blend;
    const out=c.projectionMatrix.elements;
    for(let col=0;col<4;col++){
      const i=col*4;out[i]=p[i]*scale+p[i+3]*dx;out[i+1]=p[i+1]*scale+p[i+3]*dy;
    }
    c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
  }
  lift(pixels){
    // Character lift is in world Y; the authored distance is in screen Y.
    const vertical=Math.max(.1,Math.abs(this.run.r.camera.matrixWorldInverse.elements[5]));
    return this.inkHeight*pixels/reference.camera.inkPixels/vertical;
  }
  clear(){this.restore();this.actor=null;}
}

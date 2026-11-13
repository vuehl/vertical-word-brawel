// Indoor stationery theme park. Shared GPU assets survive area changes.
import {ht as Vector3} from '../assets/three-DmSYIDKK.js';
import {runLoadingSteps} from './loading-work.js';
import {createWorkshopAssets,workshopWorldSteps,applyWorkshopLight,updateWorkshopScene} from './workshop-world.js';
import {disposeForegroundLights} from './workshop-foreground-lights.js';
export {updateWorkshopScene};
export const paperStages=['童年文具乐园','弹珠梦工厂','四驱幻想城','星灯书庭'];
export const PAPER_CAMERA={yaw:0,pitch:Math.PI*.30,distance:42,fov:37};
export const createPaperAssets=createWorkshopAssets;
export function disposePaperAssets(assets){
  if(!assets||assets.disposed)return;assets.disposed=true;
  for(const value of Object.values(assets))if(value?.isBufferGeometry)value.dispose();
  for(const mat of assets.mats.values())mat.dispose();
  for(const texture of assets.textures.values())texture.dispose();
  assets.mats.clear();assets.textures.clear();assets.colors.clear();
  assets.photos?.clear();if(assets.photoJobs)assets.photoJobs.length=0;
}
export function disposePaperWorld(terrain){
  disposeForegroundLights(terrain);
  const sun=terrain.workshopShadowLight;
  if(sun){
    sun.castShadow=false;sun.target.position.set(0,0,0);sun.target.updateMatrixWorld();
    sun.shadow.map?.dispose();sun.shadow.map=null;sun.shadow.autoUpdate=true;
    terrain.workshopShadowRenderer.shadowMap.enabled=false;
    terrain.workshopShadowLight=null;terrain.workshopShadowRenderer=null;
  }
  terrain.group.traverse(mesh=>{if(mesh.isInstancedMesh)mesh.dispose();if(mesh.isPointLight)mesh.dispose();});
  terrain.group.parent?.remove(terrain.group);terrain.group.clear();
  if(terrain.ownsPaperAssets)disposePaperAssets(terrain.paperAssets);
  terrain.workshopPointLights=[];terrain.workshopLamps=[];terrain.workshopGlows=[];terrain.workshopMarbleRuns=[];terrain.workshopRollingMarbles=null;terrain.workshopFillLight=null;terrain.mats=[];terrain.textures=[];
  terrain.workshopLooseMarbles=[];terrain.workshopLooseMesh=null;terrain.workshopLooseCores=null;terrain.workshopMarblePlayer=null;
}
export function buildPaperWorld(terrain){for(const _ of workshopWorldSteps(terrain)){} }
export function buildPaperWorldAsync(terrain,options){return runLoadingSteps(workshopWorldSteps(terrain),options);}
export const applyPaperLight=applyWorkshopLight;
const focus=new Vector3();
export function updatePaperCamera(run,dt){
  const p=run.player.pos,c=run.r.camera,k=1-Math.exp(-Math.max(0,dt)*12);
  if(!Number.isFinite(run.camTarget.x+run.camTarget.y+run.camTarget.z))run.camTarget.copy(p);
  run.camTarget.lerp(p,k);run.camYaw=PAPER_CAMERA.yaw;run.camPitch=PAPER_CAMERA.pitch;run.camDist=PAPER_CAMERA.distance;
  const distance=PAPER_CAMERA.distance*Math.max(1,.46/Math.max(.25,c.aspect));
  focus.set(run.camTarget.x,run.camTarget.y+.5,run.camTarget.z-2.5);
  c.position.set(focus.x,focus.y+Math.sin(PAPER_CAMERA.pitch)*distance,focus.z+Math.cos(PAPER_CAMERA.pitch)*distance);
  c.lookAt(focus);if(c.fov!==PAPER_CAMERA.fov){c.fov=PAPER_CAMERA.fov;c.updateProjectionMatrix();}
  const trauma=Math.max(0,(run.trauma||0)-Math.max(0,dt)*2.4);
  run.trauma=trauma;const strength=trauma*trauma*.2,time=run.realTime*39;
  if(strength>1.e-5){c.position.x+=Math.sin(time)*strength;c.position.y+=Math.cos(time*1.17)*strength;}
  run.camLift=0;
}

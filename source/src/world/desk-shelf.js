import shelf from '../../../resources/public/config/desk2d-shelf.json' with {type:'json'};
import layout from '../../../resources/public/config/desk2d-layout.json' with {type:'json'};
import {deskPixelsPerUnit,deskPitch,deskTilt} from './desk-framing.js';
import {hitsPaperBox,moveEnemyPastProps} from './paper-collision.js';

const [left,top,right,bottom]=shelf.maskBounds;
const [frontLeft,frontRight]=shelf.shadowEdge;
const [wallTop,wallRight,wallCorner,rimCorner]=shelf.shadowWall;
const pixel=deskPixelsPerUnit;
const span=shelf.maskDepthRange;
const allyRegionEnd=(Math.max(...shelf.rim.map(p=>p[1]),frontRight[1])+64-layout.height/2)/(pixel*deskTilt);
const num=value=>Number(value).toFixed(7);
// Signed perpendicular distance in original artwork pixels.
function edge(a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  return `dot(foot-vec2(${num(a[0])},${num(a[1])}),vec2(${num(-dy/length)},${num(dx/length)}))`;
}
const varying='varying vec4 vShelf; uniform bool uShelfActive;';
const vertex=`
${varying}
void projectShelf(vec3 world,vec3 anchor){
  vShelf=vec4(0.);
  if(!uShelfActive)return;
  vec2 scale=vec2(${num(pixel)},${num(pixel*deskTilt)});
  vec2 origin=vec2(${num(layout.width/2)},${num(layout.height/2)});
  vec2 foot=origin+anchor.xz*scale;
  vec2 art=origin+world.xz*scale;
  art.y-=(world.y+.05)*${num(pixel*Math.cos(deskPitch))};
  vShelf.xy=(art-vec2(${num(left)},${num(top)}))/vec2(${num(right-left)},${num(bottom-top)});
  vShelf.z=foot.y/${num(span)};
  float floorSide=${edge(frontLeft,rimCorner)};
  float wallSide=min(${edge(wallCorner,wallTop)},${edge(rimCorner,wallCorner)});
  float shadow=min(${edge(frontRight,frontLeft)},${edge(wallTop,wallRight)});
  vShelf.w=smoothstep(-16.,16.,min(shadow,max(floorSide,wallSide)));
}`;
const fragment=`
${varying}
uniform sampler2D uShelfDepth;
float shelfCoverage(){
  if(any(lessThan(vShelf.xy,vec2(0.)))||any(greaterThan(vShelf.xy,vec2(1.))))return 0.;
  vec2 mask=texture2D(uShelfDepth,vec2(vShelf.x,1.-vShelf.y)).rg;
  return step(vShelf.z,mask.r)*mask.g;
}
vec3 shelfColour(vec3 ink){
  if(vShelf.w<=0.)return ink;
  float gray=max(0.,dot(ink,vec3(.2126,.7152,.0722)));
  vec3 cool=mix(ink,vec3(gray),.36)*vec3(.49,.59,.75)+sqrt(gray)*vec3(.008,.018,.045);
  return mix(ink,cool,vShelf.w);
}`;

// Both opaque atlas actors and the original translucent hero use the same
// world registration. The shadow batch projects its own floor quadrilateral.
export function applyShelfMaterial(material,uniforms,world='world',anchor='iPos',shade=true){
  Object.assign(material.uniforms,uniforms);
  const position=`projectShelf(${world},${anchor}); gl_Position =`;
  material.vertexShader=vertex+'\n'+material.vertexShader.replace(/\bgl_Position\s*=/,position);
  const base=material.fragmentShader.replace(/void main\s*\(/,'void paintActor(');
  const light=shade?'gl_FragColor.rgb=shelfColour(gl_FragColor.rgb);':'';
  const clip=material.transparent?'gl_FragColor.a*=1.-cover; if(gl_FragColor.a<.005)discard;':'if(cover>=.5)discard;';
  material.fragmentShader=fragment+'\n'+base+`
    void main(){
      paintActor();
      if(!uShelfActive)return;
      float cover=shelfCoverage();
      ${clip}
      ${light}
    }`;
}

// Desk sprites and the dock's skin materials are per instance. Run the
// original atlas, eye and charge shaders before applying the common tint.
export function shadeDeskDevice(model,foot,uniforms){
  const anchor={value:foot};
  model.traverse(mesh=>{
    if(!mesh.isMesh||mesh.userData.portalTransient)return;
    const mat=mesh.material,compile=mat.onBeforeCompile,key=mat.customProgramCacheKey();
    mat.customProgramCacheKey=()=>key+'-desk-shelf';
    mat.onBeforeCompile=function(shader,renderer){
      compile.call(this,shader,renderer);
      Object.assign(shader.uniforms,uniforms,{uShelfFoot:anchor});
      shader.vertexShader=vertex+'\nuniform vec3 uShelfFoot;\n'+shader.vertexShader.replace(
        '#include <project_vertex>','projectShelf((modelMatrix*vec4(transformed,1.)).xyz,uShelfFoot);\n#include <project_vertex>');
      shader.fragmentShader=fragment+'\n'+shader.fragmentShader.replace('#include <colorspace_fragment>',`
        if(uShelfActive){
          float cover=shelfCoverage();
          ${mat.transparent?'gl_FragColor.a*=1.-cover; if(gl_FragColor.a<.005)discard;':'if(cover>=.5)discard;'}
          gl_FragColor.rgb=shelfColour(gl_FragColor.rgb);
        }
        #include <colorspace_fragment>`);
    };
    mat.needsUpdate=true;
  });
}

// Allies follow and lunge independently of the player/enemy controller. In
// the shelf area run their attempted displacement through the same resolver.
export function moveShelfAlly(terrain,ally,fromX,fromZ,warp=false){
  if(!terrain.shelfBarriers)return;
  const distance=Math.hypot(ally.x-fromX,ally.z-fromZ);
  const radius=.45,reach=warp?radius:radius+distance/2;
  const midX=warp?ally.x:(ally.x+fromX)/2,midZ=warp?ally.z:(ally.z+fromZ)/2;
  const byShelf=Math.min(ally.z,fromZ)<=allyRegionEnd && terrain.shelfBarriers.some(b=>hitsPaperBox(b,midX,midZ,reach));
  if(!byShelf&&!terrain.blocksFacility(midX,midZ,reach)){
    if(ally.shelfMove)ally.shelfMove.side=0;
    return;
  }
  const out=ally.shelfMove??={};
  if(warp){
    if(!terrain.placeSpawn(ally.x,ally.z,radius,out)){out.x=fromX;out.z=fromZ;}
  }
  else moveEnemyPastProps(terrain,fromX,fromZ,ally.x,ally.z,radius,0,distance,out.side||0,out);
  ally.x=out.x;ally.z=out.z;
}

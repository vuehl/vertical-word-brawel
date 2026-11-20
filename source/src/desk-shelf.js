import shelf from './desk2d-shelf.json';
import layout from './desk2d-layout.json';
import {deskPixelsPerUnit,deskPitch,deskTilt} from './desk-framing.js';
import {hitsPaperBox,moveEnemyPastProps} from './paper-collision.js';

const [left,top,right,bottom]=shelf.maskBounds;
const [[ax,ay],[bx,by]]=shelf.shadowEdge;
const pixel=deskPixelsPerUnit;
const span=shelf.maskDepthRange;
const allyRegionEnd=(Math.max(...shelf.rim.map(p=>p[1]),by)+64-layout.height/2)/(pixel*deskTilt);
const num=value=>Number(value).toFixed(7);
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
  // Only the tabletop side of the illustrated shadow is walkable. Fade over
  // 32 source pixels at its sunlit edge, using one weight per actor.
  float edge=${num(ay)}+(foot.x-${num(ax)})*${num((by-ay)/(bx-ax))};
  vShelf.w=smoothstep(-16.,16.,edge-foot.y)*smoothstep(-16.,16.,foot.x-${num(ax)});
}`;
const fragment=`
${varying}
uniform sampler2D uShelfDepth;
float shelfCoverage(){
  if(any(lessThan(vShelf.xy,vec2(0.)))||any(greaterThan(vShelf.xy,vec2(1.))))return 0.;
  vec2 mask=texture2D(uShelfDepth,vec2(vShelf.x,1.-vShelf.y)).rg;
  return step(vShelf.z,mask.r)*mask.g;
}`;

// Both opaque atlas actors and the original translucent hero use the same
// world registration. The shadow batch projects its own floor quadrilateral.
export function applyShelfMaterial(material,uniforms,world='world',anchor='iPos',shade=true){
  Object.assign(material.uniforms,uniforms);
  const position=`projectShelf(${world},${anchor}); gl_Position =`;
  material.vertexShader=vertex+'\n'+material.vertexShader.replace(/\bgl_Position\s*=/,position);
  const base=material.fragmentShader.replace(/void main\s*\(/,'void paintActor(');
  const light=!shade?'':`
    vec3 ink=gl_FragColor.rgb;
    float gray=dot(ink,vec3(.2126,.7152,.0722));
    vec3 cool=mix(ink,vec3(gray),.36)*vec3(.49,.59,.75)+sqrt(gray)*vec3(.008,.018,.045);
    gl_FragColor.rgb=mix(ink,cool,vShelf.w);`;
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

// Allies follow and lunge independently of the player/enemy controller. In
// the shelf area run their attempted displacement through the same resolver.
export function moveShelfAlly(terrain,ally,fromX,fromZ){
  if(!terrain.shelfBarriers||Math.min(ally.z,fromZ)>allyRegionEnd)return;
  const distance=Math.hypot(ally.x-fromX,ally.z-fromZ);
  const warp=distance>12,radius=.45,reach=warp?radius:radius+distance/2;
  const midX=warp?ally.x:(ally.x+fromX)/2,midZ=warp?ally.z:(ally.z+fromZ)/2;
  if(!terrain.shelfBarriers.some(b=>hitsPaperBox(b,midX,midZ,reach))){
    if(ally.shelfMove)ally.shelfMove.side=0;
    return;
  }
  const out=ally.shelfMove??={};
  if(warp)terrain.resolve(ally.x,ally.z,radius,0,out);
  else moveEnemyPastProps(terrain,fromX,fromZ,ally.x,ally.z,radius,0,distance,out.side||0,out);
  ally.x=out.x;ally.z=out.z;
}

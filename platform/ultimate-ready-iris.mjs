/*! Iris adapted from patch-gg/pixelfx, src/fx/transitions/iris.js and _lib.js.
 * MIT, Copyright (c) 2026 Patch and Hugo Duprez. See pixelfx-soul-drain-LICENSE.txt. */
import {ease} from '../source/src/vendor/pixelfx-blink-in.js';

const closeSeconds = 0.62, turn = Math.PI * 2;

export function readyIrisLayer(box, view, scale, elapsed, tone) {
  if (!(box.width > 0 && box.height > 0)) return null;
  const unit = Math.min(box.width, box.height) / 84;
  const cx = view.x + box.x + box.width / 2, cy = view.y + box.y + box.height / 2;
  const farthest = Math.hypot(Math.max(cx, view.width - cx), Math.max(cy, view.height - cy));
  const time = Math.max(0, elapsed), progress = ease.inOutCubic(Math.min(1, time / closeSeconds));
  const target = 39.4 * unit, radius = target + (farthest + 15 * unit - target) * (1 - progress);
  const pad = 14 * unit;
  const left = Math.max(0, Math.floor(cx - radius - pad)), top = Math.max(0, Math.floor(cy - radius - pad));
  const right = Math.min(view.width, Math.ceil(cx + radius + pad)), bottom = Math.min(view.height, Math.ceil(cy + radius + pad));
  if (right <= left || bottom <= top) return null;
  // Continue the glint from the closing rim onto the button without restarting its angle.
  const angle = -2.4 + turn * (Math.min(time, closeSeconds) / .82 + Math.max(0, time - closeSeconds) / 2.4);
  return {x: left * scale, y: top * scale, width: (right - left) * scale, height: (bottom - top) * scale,
    iris: {bounds: [(left - cx) / unit, (top - cy) / unit, (right - left) / unit, (bottom - top) / unit],
      radius: radius / unit, angle: angle % turn, tone}};
}

// The source iris darkens the rest of the screen. Here only its bevel, local light
// and orbiting glints are painted. The quad shrinks to the button as the rim lands.
export const irisFragment = `
uniform bool irisActive;
uniform vec4 irisBounds;
uniform vec2 irisMotion;
uniform vec3 irisTone;

float irisRay(vec2 p, float lengthPx) {
  vec2 a=abs(p);
  return (1.-smoothstep(.25,1.15,min(a.x,a.y))) * (1.-smoothstep(1.,lengthPx,max(a.x,a.y)));
}
vec2 irisStar(vec2 p, float angle, float reach) {
  float s=sin(angle), c=cos(angle);
  vec2 q=mat2(c,-s,s,c)*p;
  float axes=irisRay(q,reach);
  float diagonals=irisRay(vec2(q.x+q.y,q.y-q.x)*.7071,reach*.45);
  float d=length(p);
  return vec2(max(max(axes,diagonals*.85),1.-smoothstep(.65,1.55,d)), exp2(-.62*d));
}
vec4 readyIris(vec2 at) {
  vec2 p=floor(irisBounds.xy + at*irisBounds.zw)+.5;
  float r=irisMotion.x, angle=irisMotion.y, distancePx=length(p), d=distancePx-r;
  if (abs(d)>13.) return vec4(0.);
  float lit=.5-.5*dot(p/max(distancePx,.01),vec2(.7));
  float widthPx=4.2;
  float band=smoothstep(-.45,.25,d)*(1.-smoothstep(widthPx-.45,widthPx+.4,d));
  float q=d/widthPx;
  vec3 warm=mix(irisTone,vec3(1.),.68);
  vec3 edge=q<.22 ? mix(warm,vec3(1.),lit) : q<.46 ? mix(irisTone,warm,.55+.35*lit)
    : q<.72 ? mix(irisTone,warm,.12+.25*lit) : irisTone*(.46+.3*lit);
  float light=pow(max(0.,1.-abs(d+1.)/9.),2.)*.52;
  float alpha=band*.9;
  vec3 rgb=edge*alpha+warm*light;
  vec2 stars=vec2(0.);
  for(int i=0;i<3;i++){
    float index=float(i), a=angle+index*2.13;
    vec2 pos=(r+1.4)*vec2(cos(a),sin(a));
    float reach=(i==0?8.:i==1?5.1:3.8)*(.85+.15*cos(angle*3.+index));
    stars=max(stars,irisStar(p-pos,a*.5,reach));
  }
  rgb=mix(rgb,vec3(1.),stars.x)+warm*(stars.y*1.02);
  return vec4(rgb,alpha+(1.-alpha)*stars.x);
}`;

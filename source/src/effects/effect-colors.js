import {PAL,fit} from '../vendor/pixelfx-blink-in.js';

export const effectColors={fire:0xff641c,water:0x169bea,grass:0x63c848,electric:0xffcc20,ice:0x57cbe8,ground:0xc99560,rock:0xa88764,steel:0x9db6cc,poison:0xb55ae0,ghost:0x9b88ce,psychic:0xe46fdb,fairy:0xf782bd,bug:0xa7c665,flying:0x5dd7d6,dragon:0x8995da,dark:0x8a739e,fighting:0xe8a276,normal:0xffcf89};

function hsv(color){
  const r=color>>16,g=color>>8&255,b=color&255;
  const value=Math.max(r,g,b),delta=value-Math.min(r,g,b);
  let hue=0;
  if(delta){
    if(value===r)hue=(g-b)/delta;
    else if(value===g)hue=2+(b-r)/delta;
    else hue=4+(r-g)/delta;
  }
  return {hue,saturation:value?delta/value:0,value};
}

const reference=hsv(effectColors.fire),palettes=new Map();
// Retain the approved fire ramp's relative hues and brightness at each stop,
// including the pale tips. Shift the entire ramp to the current element once.
export function readyPaletteForType(type){
  const base=Object.hasOwn(effectColors,type)?effectColors[type]:effectColors.normal;
  if(palettes.has(base))return palettes.get(base);
  const target=hsv(base);
  function tint(color){
    const {hue,saturation,value}=hsv(color);
    const h=(hue+target.hue-reference.hue+12)%6;
    const chroma=value*Math.min(1,saturation*target.saturation/reference.saturation);
    const channel=offset=>Math.round(value-chroma*Math.max(0,Math.min(1,(offset+h)%6,4-(offset+h)%6)));
    return channel(5)<<16|channel(3)<<8|channel(1);
  }
  const css=color=>'#'+tint(color).toString(16).padStart(6,'0');
  const channels=color=>{const rgb=tint(color);return [rgb>>16,rgb>>8&255,rgb&255].join(',');};
  const palette={
    base,ramp:fit(PAL.fire.map(stop=>css(parseInt(stop.slice(1),16))),8),
    ring:tint(0xffd23a),rim:css(0xffdc91),glint:css(0xfff3cc),core:css(0xfffdf4),
    outerGlow:'rgba('+channels(0xffa432)+',.28)',innerGlow:'rgba('+channels(0xffc044)+',.58)',
    rimChannels:channels(0xffd88b),spark:css(0xf8dba0),label:css(0xf8d694)
  };
  palettes.set(base,palette);
  return palette;
}

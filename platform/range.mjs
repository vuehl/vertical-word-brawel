// linkedom does not reflect input min/max/step attributes onto DOM properties.
export function rangeBounds(input) {
  const number=(name,fallback)=>{
    const raw=input.getAttribute(name),value=raw===null||raw===''?NaN:Number(raw);
    return Number.isFinite(value)?value:fallback;
  };
  const min=number('min',0),max=Math.max(min,number('max',100));
  const rawStep=input.getAttribute('step');
  const step=rawStep==='any'?0:Math.max(0,number('step',1))||1;
  return {min,max,step};
}

export function rangeValueAt(input,fraction) {
  const {min,max,step}=rangeBounds(input);
  const value=min+Math.max(0,Math.min(1,fraction))*(max-min);
  const snapped=step?min+Math.round((value-min)/step)*step:value;
  return Math.max(min,Math.min(max,Number(snapped.toFixed(8))));
}

export function repairVolumeSettings(settings) {
  let changed=false;
  for(const key of ['master','music','sfx','cries']){
    const value=settings[key];
    // Earlier native sliders saved their 0..100 position instead of 0..1.
    if(typeof value==='number'&&Number.isFinite(value)&&(value<0||value>1)){
      settings[key]=Math.max(0,Math.min(1,value>1&&value<=100?value/100:value));
      changed=true;
    }
  }
  return changed;
}

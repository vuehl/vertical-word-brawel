// Preview-only failure pop: launch, short airborne phase, then landing squash.
export function escapeMotion(progress){
  const t=Math.max(0,Math.min(1,progress)),flight=Math.min(1,t/.68);
  const advance=1-Math.pow(1-flight,1.35);
  const pop=Math.min(1,t/.12);
  const scale=.12+.88*(1-Math.pow(1-pop,3));
  const lift=t<.68?4*flight*(1-flight)*30:0;
  let stretch;
  if(t<.68)stretch=1.5*Math.pow(1-flight,2);
  else {const landing=(t-.68)/.32;stretch=-.95*Math.sin(landing*Math.PI*2)*Math.exp(-landing*2.5);}
  return {advance,scale,lift,stretch};
}

// The announcement, compact toast and HUD timer share one visual identity.
const styles = {
  eclipse:     ['#E7D7FF','#352848','#6C4986','#F0E9F8'],
  storm:       ['#FFDE84','#614914','#8A621B','#FAEFCA'],
  'spectral-fog':['#E3CBFF','#49365E','#70528C','#F0E9F8'],
  blizzard:    ['#F2FCFF','#3C576B','#638398','#EAF6FA'],
  spout:       ['#A6F1E8','#245460','#387A83','#E0F3F0'],
  rain:        ['#A7DBFF','#304D70','#466F96','#E5F0FA'],
  sun:         ['#FFD7A0','#71442C','#975F37','#FAEBDD'],
  sand:        ['#EDCC90','#5B4A31','#806642','#F4ECDE'],
  hail:        ['#BBF4FF','#365B72','#517F98','#E2F4F7'],
  fog:         ['#D5E6EF','#424F63','#63758A','#EAF0F4'],
  ash:         ['#E7C8BC','#58454C','#7A5D61','#F3E8E6'],
  clear:       ['#DBE9AC','#49583E','#687A4F','#EDF3DE'],
};
export function weatherStyle(kind){return styles[kind];}

export function weatherFill(kind,step){
  const [,low,high]=styles[kind];
  return 'rgba('+[1,3,5].map(i=>{
    const a=parseInt(low.slice(i,i+2),16),b=parseInt(high.slice(i,i+2),16);
    return Math.round(a+(b-a)*step/12);
  }).join(',')+',.94)';
}

// Keep the icon and countdown above a receding weather-colored background.
// One canvas gives the browser and native HUD the same slanted paper edge.
export function drawWeatherCountdown(canvas,{kind,label,fraction,step,mark}){
  const c=canvas.getContext('2d'),w=canvas.width/2,h=29;
  const progress=Math.max(0,Math.min(1,fraction)),edge=w*progress;
  const polygon=points=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();};
  c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,w,h);c.save();
  polygon([[4,0],[w,0],[w-4,h],[0,h]]);c.clip();
  c.fillStyle='#302B34';c.fillRect(0,0,w,h);
  c.fillStyle=weatherFill(kind,step);
  if(progress>0){polygon([[0,0],[edge+2,0],[edge-2,h],[0,h]]);c.fill();}
  if(progress>0&&progress<1){
    c.beginPath();c.moveTo(edge+1.5,0);c.lineTo(edge-2.5,h);c.strokeStyle=styles[kind][0];c.lineWidth=1;c.stroke();
  }
  c.drawImage(mark,6,4,21,21);
  c.textBaseline='middle';c.textAlign='right';c.font='bold 20px sans-serif';c.fillStyle='#FFF8E9';c.fillText(label,w-7,15);
  c.restore();
}

export function drawWeatherMark(canvas,kind,plate=false){
  const c=canvas.getContext('2d'),size=canvas.width;
  c.setTransform(size/16,0,0,size/16,0,0);c.clearRect(0,0,16,16);
  c.save();
  const style=styles[kind];
  const path=points=>{c.beginPath();c.moveTo(...points[0]);for(const point of points.slice(1))c.lineTo(...point);};
  const line=(...points)=>{path(points);c.stroke();};
  const fill=(...points)=>{path(points);c.closePath();c.fill();};
  const dot=(x,y,r)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
  if(plate){
    c.fillStyle=style[1];fill([0,3],[3,0],[16,0],[16,12.5],[12.5,16],[0,16]);
    c.translate(2.2,2.2);c.scale(.725,.725);
  }
  c.strokeStyle=c.fillStyle=style?.[0]||'#F4D88C';c.lineWidth=1.55;c.lineJoin='round';c.lineCap='round';
  switch(kind){
    case 'storm':
      fill([8.6,.5],[2,9.5],[7.1,9.5],[5.8,15.5],[14,6.1],[9.2,6.1]);break;
    case 'blizzard':
      for(let arm=0;arm<6;arm++){
        c.save();c.translate(8,8);c.rotate(arm*Math.PI/3);
        line([0,0],[0,-6.8]);line([-2.1,-4.4],[0,-3],[2.1,-4.4]);c.restore();
      }
      break;
    case 'spout':
      c.beginPath();c.ellipse(8,3.3,6.3,1.8,0,0,Math.PI*2);c.stroke();
      line([3,7],[10.8,7],[7.6,10],[10.2,10],[6.5,14]);break;
    case 'spectral-fog':
      c.beginPath();c.arc(8,7.2,4.8,Math.PI,0);c.lineTo(12.8,11);c.lineTo(10.6,9.5);
      c.lineTo(8,11.2);c.lineTo(5.5,9.5);c.lineTo(3.2,11);c.closePath();c.fill();
      c.fillStyle=style[1];dot(6.4,6.9,1);dot(9.7,6.9,1);line([2,13.4],[12.6,13.4]);break;
    case 'fog':
      line([3.4,3.6],[12.6,3.6]);line([1,7.7],[11,7.7]);line([5,12],[15,12]);break;
    case 'rain':
      c.beginPath();c.moveTo(3,9);c.arc(4.3,6.6,2.6,1.9,4.9);c.arc(8.1,5.2,3.3,3.5,6);
      c.quadraticCurveTo(15.7,4.5,14,8.6);c.lineTo(3,9);c.fill();
      line([5.2,11.5],[3.8,14.2]);line([10.2,11.5],[8.8,14.2]);break;
    case 'eclipse':case 'sun':case 'clear':
      dot(8,8,3.4);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;line([8+5.3*Math.cos(a),8+5.3*Math.sin(a)],[8+7*Math.cos(a),8+7*Math.sin(a)]);}
      break;
    case 'sand':
      line([1.5,5],[9.4,5],[11.3,3.7],[10.4,2.2]);line([3,8.3],[14,8.3]);
      dot(4,12.6,1.15);dot(8,11.8,.9);dot(12.3,13.7,1.3);break;
    case 'hail':
      fill([4,3],[7,6],[4,9],[1,6]);fill([11.8,1],[15,4.3],[11.8,7.6],[8.6,4.3]);
      fill([9,9],[12,12],[9,15],[6,12]);break;
    case 'ash':
      line([2,12.8],[6.5,7],[8.7,8.6],[10,6.8],[14.4,12.8],[2,12.8]);
      dot(6.1,4.7,1);dot(9,2,1.4);dot(12.2,3.6,.85);break;
    default:fill([8,2],[13,8],[8,14],[3,8]);
  }
  c.restore();canvas.dataset.frame=kind;
}
export function weatherMark(kind,plate=false){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=plate?68:36;canvas.className='zx-weather-mark';
  canvas.setAttribute('aria-hidden','true');canvas.dataset.static='true';
  drawWeatherMark(canvas,kind,plate);return canvas;
}

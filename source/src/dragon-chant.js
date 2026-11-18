const words = '万字归一';
const beat = .38;
export const dragonChantSeconds = beat * 3 + .68;

// Outlines in a 100-unit square. Tapered hooks and split brush tips stay
// identical on phones with different fonts and during the first loading frame.
const outlines = [
  'M5 24 C27 23 61 17 82 11 L97 15 L91 21 C57 24 29 29 12 32 Z ' +
  'M40 25 L55 23 C49 38 46 43 43 47 L67 40 L78 44 C72 64 70 83 55 94 L40 79 L52 82 C58 74 63 60 65 51 L39 57 C30 72 17 85 2 91 C23 70 36 46 40 25 Z',
  'M43 4 C51 5 60 10 60 17 L51 22 L42 10 Z ' +
  'M12 23 L18 27 C42 25 66 20 82 17 L95 23 L78 40 L79 27 L20 34 C18 44 14 49 8 47 Z ' +
  'M28 42 C42 41 54 37 63 35 L73 41 L53 56 L54 60 L81 55 L94 60 L86 65 L55 68 C57 79 55 87 48 96 L33 82 L46 85 C48 81 48 74 47 69 L13 75 L5 68 L46 61 L42 55 L48 54 L58 44 L34 49 Z',
  'M16 28 L24 30 C23 40 23 50 19 58 L13 60 L15 44 Z ' +
  'M34 8 L45 14 C39 44 44 71 12 93 C29 69 32 51 32 32 Z ' +
  'M48 26 C59 25 71 22 81 18 L93 23 C90 41 88 62 88 78 L79 88 L77 79 L45 84 L39 77 L78 70 L80 53 L48 59 L43 52 L81 44 L82 29 L53 34 Z',
  'M0 54 C18 54 52 44 74 40 L85 35 L100 41 L94 47 L98 46 L89 52 C64 51 33 59 13 65 L4 62 L8 60 Z',
];
const directions = [[-1,.25],[.55,-1],[-.65,.85],[1,.08]];

function paintGlyph(ctx, path, t, index) {
  const arrival = Math.max(0, 1-t/.14);
  const pop = Math.sin(Math.min(1,t/.22)*Math.PI);
  const [dx,dy] = directions[index];
  ctx.save();
  ctx.translate(arrival*arrival*dx*42, arrival*arrival*dy*30);
  ctx.rotate(-.065 + arrival*dx*.2);
  const size = 1 + .15*pop + .53*arrival;
  ctx.scale(size,size);
  ctx.translate(-50,-50);
  ctx.lineJoin='round';
  ctx.save();
  ctx.translate(-4*dx,5);
  ctx.lineWidth=7; ctx.strokeStyle='#211027'; ctx.stroke(path);
  ctx.fillStyle='#a13c69'; ctx.fill(path);
  ctx.restore();
  ctx.lineWidth=2.3; ctx.strokeStyle='#451733'; ctx.stroke(path);
  const gold=ctx.createLinearGradient(28,12,60,90);
  gold.addColorStop(0,'#fffbe3'); gold.addColorStop(.48,'#ffdf87'); gold.addColorStop(1,'#eca14d');
  ctx.fillStyle=gold; ctx.fill(path);
  ctx.restore();
}

export function startDragonChant(ui, onBeat) {
  const canvas=document.createElement('canvas');
  canvas.className='zx-dragon-chant';
  canvas.dataset.uiRegion='game-screen';
  canvas.setAttribute('aria-label',words);
  Object.assign(canvas.style,{position:'fixed',left:'0',top:'0',width:'100vw',height:'100vh',objectFit:'cover',opacity:'1',zIndex:'100',pointerEvents:'none'});
  const screen=document.getElementById('game').getBoundingClientRect();
  const width=canvas.width=Math.min(640,Math.max(320,screen.width));
  const height=canvas.height=Math.round(width*screen.height/screen.width);
  const ctx=canvas.getContext('2d'), paths=outlines.map(shape=>new Path2D(shape));
  const unit=Math.min(width*.006,height*.0036);
  const shade=ctx.createRadialGradient(width/2,height/2,0,width/2,height/2,Math.max(width,height)*.62);
  shade.addColorStop(0,'rgba(28,10,34,.89)');
  shade.addColorStop(.48,'rgba(28,13,38,.74)');
  shade.addColorStop(1,'rgba(21,10,32,.46)');
  let lastBeat=-1, lastFrame=-1;
  // The touch controls and portrait HUD are siblings of the cinematic layer.
  // Hide both while the glyph and the following sacrifice own the screen.
  const chrome=Array.from(ui.root.querySelectorAll('.zx-hud, .tc')).filter(node=>!node.hidden);
  for(const node of chrome)node.hidden=true;
  ui.hudEl.classList.add('cinematic');
  ui.hudEl.append(canvas);

  function draw(seconds) {
    const index=Math.min(3,Math.floor(seconds/beat)), t=seconds-index*beat;
    const frame=Math.floor(seconds*30);
    if(frame===lastFrame && index===lastBeat)return;
    lastFrame=frame;
    if(index!==lastBeat){
      lastBeat=index;
      canvas.dataset.word=words[index];
      onBeat(index);
    }
    const fade=Math.min(1,(dragonChantSeconds-seconds)/.16);
    ctx.clearRect(0,0,width,height);
    ctx.save();
    ctx.globalAlpha=fade;
    ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);
    ctx.translate(width*.5,height*.5);
    ctx.scale(unit,unit);
    // A broken sweep of flying ink, with a fresh direction on each impact.
    ctx.save();
    ctx.rotate([-.32,-.62,.32,-.17][index]);
    const sweep=Math.min(1,t/.22);
    for(let i=0;i<11;i++){
      const y=(i-5)*2.2, reach=44+(i*31%48)+18*sweep, shift=(1-sweep)*38;
      ctx.fillStyle=i===1||i===8?'#ae764e':i%3?'#372036':'#612b49';
      ctx.beginPath();ctx.moveTo(-reach-shift,y+4);ctx.lineTo(-21-shift,y-2);
      ctx.lineTo(reach*.87-shift,y-5);ctx.lineTo(26-shift,y+1);ctx.fill();
    }
    ctx.restore();
    for(let i=0;i<15;i++){
      const angle=i*2.4+index*.7, r=44+((i*13)%17)+sweep*16;
      ctx.save();ctx.rotate(angle);ctx.translate(r,0);
      ctx.fillStyle=i%4?'#d69e68':'#ffde91';
      ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(0,-.75);
      ctx.lineTo((i%3+1)*1.8,0);ctx.lineTo(0,.75);ctx.fill();ctx.restore();
    }
    paintGlyph(ctx,paths[index],t,index);
    ctx.restore();
    window.invalidateUI?.();
  }
  draw(0);
  return {draw,clearWords:()=>canvas.remove(),end(){
    canvas.remove();
    for(const node of chrome)node.hidden=false;
  }};
}

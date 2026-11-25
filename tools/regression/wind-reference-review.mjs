import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {createHash} from 'node:crypto';

export async function recordWindReference(page,sourceDir,destination){
  fs.mkdirSync(destination,{recursive:true});
  // Optional local iteration only. Delivery/audit always runs without this
  // filter and records every original exposure.
  const selectedFrames=process.env.WIND_RECORD_FRAMES?new Set(process.env.WIND_RECORD_FRAMES.split(',').map(Number)):null;
  const capture=await page.evaluate(()=>({scale:window.devicePixelRatio,
    worldWidth:app.r.composer.inputBuffer.width,worldHeight:app.r.composer.inputBuffer.height,
    canvasWidth:app.r.canvas.width,canvasHeight:app.r.canvas.height}));
  if(capture.scale<2||capture.worldWidth<780)throw Error('Review must render at least 780 px wide, not enlarge a low-resolution capture: '+JSON.stringify(capture));
  const buildRoot=path.resolve(process.env.POKEBONK_GAME||path.join(import.meta.dirname,'../../minigame'));
  const buildFiles=['assets.js','play/combat.js','play/game-data.js','play/gameplay.js','play/presentation.js'];
  const report={environment:'编译后的微信运行包，桌面 Chrome SwiftShader 模拟；真实技能与伤害。场景、HUD、角色位置不同，未宣称全屏像素相等。',
    capture,buildRoot,previewOnly:!!selectedFrames,build:Object.fromEntries(buildFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(buildRoot,file))).digest('hex')])),clips:[]};
  const prior=process.env.WIND_RECORD_SKILLS&&fs.existsSync(path.join(destination,'逐帧索引.json'))
    ?JSON.parse(fs.readFileSync(path.join(destination,'逐帧索引.json'))):null;
  if(prior&&JSON.stringify(prior.build)!==JSON.stringify(report.build))throw Error('Cannot combine recordings from different builds');
  await page.evaluate(()=>{
    const terrain=app.run.terrain,offsets=[0,4,-4,8,-8,12,-12,16,-16];
    for(const z of offsets)for(const x of offsets){
      const open=Array.from({length:8},(_,i)=>[x+i*.26,z-i*1.35]).every(([xx,zz])=>
        terrain.inBounds(xx,zz,3)&&terrain.isFlatOpen(xx,zz)&&
        !terrain.hitProp(xx,terrain.surface(xx,zz)+.5,zz,3));
      if(open){window.windRecordingOrigin={x,z};return;}
    }
    window.windRecordingOrigin=windLane;
  });
  const spells=[
    ['电光一闪',98],['撞击',33],['起风',49001],['翅膀攻击',17],['羽毛舞',332],['空气斩',403],
    ['大招/一阵风刮来',0,16],['大招/刮倒一片',0,18],['大招/跑得没影',0,59],
    ['融合/残气乱刮',50006],['融合/卷着打转',50106]
  ];
  for(const [name,id,species=16] of spells){
    if(process.env.WIND_RECORD_SKILLS&&!process.env.WIND_RECORD_SKILLS.split(',').includes(name)){
      const saved=prior?.clips.find(clip=>clip.name===name);if(saved)report.clips.push(saved);continue;
    }
    const local=id===49001||id===332||id===403;
    const referenceDir=local?path.resolve(import.meta.dirname,'../../resources/art/wind-supplement'):sourceDir;
    const file=path.join(referenceDir,name+'.gif'),meta=await sharp(file,{animated:true}).metadata();
    const delays=meta.delay,frameStart=[];let total=0;
    for(const duration of delays){frameStart.push(total);total+=duration;}
    const top=name.includes('融合')||species!==16?96:190;
    const raw=[],width=390,height=480;
    const frameDir=path.join(destination,path.basename(name));fs.mkdirSync(frameDir,{recursive:true});
    const record={name,id,species,sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sourceFrames:delays.length,durationMs:total,frames:[]};
    await page.evaluate(async({id,species})=>{
      setupWind();const r=app.run,p=r.player,e=r.enemies;
      r.hints.on=false;
      p.setSpecies(species);p.buffs.clear();p.recompute();
      let {x,z}=windRecordingOrigin;
      if(species===59){
        const terrain=r.terrain;
        let longest=0;
        for(let zz=-22;zz<=22;zz+=3)for(let xx=-22;xx<=10;xx+=3){
          let length=0;
          while(length<26&&terrain.inBounds(xx+length,zz,1.4)&&terrain.isFlatOpen(xx+length,zz)&&
            r.interactables.list.every(f=>f.used||Math.hypot(f.x-xx-length,f.z-zz)>4)&&
            !terrain.hitProp(xx+length,terrain.surface(xx+length,zz)+.5,zz,1.4))length++;
          if(length>longest){longest=length;x=xx;z=zz;}
        }
        r.camYaw=0;
        window.speedCaptureTravel={origin:x,max:0};
      }
      p.pos.set(x,r.terrain.surface(x,z),z);r.camTarget.copy(p.pos);
      await r.sprites.prepareHeroForm(species);
      if(id===332||id===17||id===403){
        e.clear();
        const target=e.spawn(147,x+1.85,z-7.35,1,1,0);
        e.hp[target]=e.maxHp[target]=1e7;
        e.y[target]=r.terrain.surface(e.x[target],e.z[target]);
        p.stats.critChance=p.stats.megaCrit=0;
      }else for(let i=0;i<e.n;i++){
        e.x[i]=p.pos.x+1.65+i*2.5;e.z[i]=p.pos.z-5.6-i*3;e.y[i]=r.terrain.surface(e.x[i],e.z[i]);
      }
      if(id===403)r.vfx.enabledText=false;
      e.update();r.lockTarget=id===332||id===403?-1:0;r.input.stickX=0;
      if(id||species===18){p.addMove(id||98);p.moves[0].timer=999;
        await r.vfx.crafted.prepareMoveTexture(p.moves[0].def.effectKey??p.moves[0].def.key);}
      if(!id)await r.vfx.crafted.prepareMoveTexture('wind-ultimate');
      r.updateCamera(1);vfxDraw();
    },{id,species});
    let fired=false,previous=0,refFrame=0;
    const castTime=frameStart[(name.includes('融合')||species!==16)?4:5];
    // Every original exposure is retained, including 20/30/60/70 ms frames and
    // the entire ending. No nominal-FPS sampling or truncated previews.
    const exposures=frameStart;
    for(const [exposureIndex,ms] of exposures.entries()){
      const captureFrame=!selectedFrames||selectedFrames.has(exposureIndex);
      const fire=!fired&&ms>=castTime;
      const state=await page.evaluate(({ms,previous,castTime,fire,id,species,captureFrame})=>{
        const r=app.run,p=r.player;
        const advance=delta=>{
          if(delta<=0)return;
          if(species===59){
            r.input.keys.delete('KeyD');r.input.keys.delete('KeyA');
            if(p.buffs.has('ziling-wind-speed')&&ms>=castTime&&ms<castTime+140)r.input.keys.add('KeyD');
            if(ms>castTime+930&&ms<castTime+1070)r.input.keys.add('KeyA');
          }
          const steps=Math.ceil(delta*.06);
          // Present exactly once below, after simulation and HUD update. The
          // intermediate GPU draw was identical and not a recorded exposure.
          vfxAdvance(steps,delta/(steps*1000),false);
        };
        if(fire){
          advance(castTime-previous);
          if(!id){r.ult.charge=1;r.ult.fire();}
          if(p.moves[0]){
            // Ultimate buffs apply via the real 30 ms cast callback. A manual
            // ordinary shot before that callback incorrectly gets the old CD.
            if(!id)p.moves[0].timer=.03;
            else {p.moves[0].timer=0;r.castMove(0,p.moves[0],0);p.moves[0].timer=999;}
          }
          advance(ms-castTime);
        }else advance(ms-previous);
        if(id&&ms>castTime)p.moves[0].timer=999;
        if(species===59)speedCaptureTravel.max=Math.max(speedCaptureTravel.max,Math.abs(p.pos.x-speedCaptureTravel.origin));
        vfxDraw(captureFrame,captureFrame);
        return {gameTime:r.time,projectiles:r.projectiles.used,moveTimer:p.moves[0]?.timer??null,
          attackSpeed:p.stats.attackSpeed,windFrames:[r.vfx.crafted.windSkills,r.vfx.crafted.windMoves,r.vfx.crafted.windReplacements,r.vfx.crafted.windVortex].filter(Boolean).flatMap(a=>Array.from({length:a.mesh.count},(_,i)=>a.pose.getX(i)))};
      },{ms,previous,castTime,fire,id,species,captureFrame});
      fired||=fire;previous=ms;
      while(refFrame+1<delays.length&&frameStart[refFrame+1]<=ms)refFrame++;
      if(!captureFrame)continue;
      const source=await sharp(file,{page:refFrame}).extract({left:0,top,width,height}).png().toBuffer();
      const live=await page.screenshot({clip:{x:0,y:52,width,height}});
      const stem=String(refFrame).padStart(3,'0');
      const sourceFile=path.basename(name)+'/source-'+stem+'.png',liveFile=path.basename(name)+'/game-'+stem+'.png';
      fs.writeFileSync(path.join(destination,sourceFile),source);
      fs.writeFileSync(path.join(destination,liveFile),live);
      // Keep the compact side-by-side GIF for playback/export. The viewer uses
      // the independent lossless PNGs above, never this downsampled preview.
      // Match the hero scale and origin in the Air Slash recording. Retain the
      // uncropped capture separately so both the effect and battle are inspectable.
      const previewImage=sharp(live);
      if(id===403)previewImage.extract({left:195,top:394,width,height});
      const preview=await previewImage.resize(width,height).png().toBuffer();
      const pair=await sharp({create:{width:width*2+2,height,channels:3,background:'#212c32'}})
        .composite([{input:source,left:0,top:0},{input:preview,left:width+2,top:0}]).png().toBuffer();
      const frameFile=String(refFrame).padStart(3,'0')+'.png';
      fs.writeFileSync(path.join(frameDir,frameFile),pair);
      record.frames.push({index:refFrame,timeMs:ms,delayMs:delays[refFrame],file:path.basename(name)+'/'+frameFile,sourceFile,liveFile,state});
      raw.push(await sharp(pair).removeAlpha().raw().toBuffer());
    }
    if(species===59){
      const travel=await page.evaluate(()=>speedCaptureTravel.max);
      if(travel<3)throw Error('Speed recording did not traverse the open lane: '+travel);
    }
    if(!selectedFrames)await sharp(Buffer.concat(raw),{raw:{width:width*2+2,height:height*raw.length,channels:3,pageHeight:height}})
      .gif({delay:delays,loop:0,dither:.2,effort:3}).toFile(path.join(destination,path.basename(name)+'.gif'));
    report.clips.push(record);
    fs.writeFileSync(path.join(destination,'逐帧索引.json'),JSON.stringify(report,null,2));
    console.log('Recorded',name,record.frames.length,'/',delays.length,'frames');
  }
  if(!selectedFrames)fs.writeFileSync(path.join(destination,'逐帧对照.html'),frameViewer(report));
}

function frameViewer(report){
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>风系技能逐帧对照 · 高清</title>
<style>*{box-sizing:border-box}body{font:15px/1.5 system-ui;background:#17212b;color:#eee;margin:0 auto;padding:20px 16px;max-width:1040px}h1{font-size:23px;margin:0 0 10px}p{color:#bdceda;margin:8px 0 16px}select,button{font:inherit;color:inherit;background:#263746;border:1px solid #526a7d;border-radius:5px;padding:8px 11px;cursor:pointer}button:hover{background:#34536b}button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #8bc9ff;outline-offset:2px}.controls{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.timeline{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:14px 0}input{width:min(360px,100%);flex:1 1 220px}output{font-variant-numeric:tabular-nums}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}figure{margin:0;min-width:0;background:#0e1922;border-radius:7px;overflow:hidden}figcaption{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:10px 12px;color:#c4d7e4;font-size:14px}.stage{overflow:auto;display:flex;justify-content:center}img{display:block;width:390px;max-width:100%;height:auto;flex:none;image-rendering:auto}a{color:#93d0ff;text-underline-offset:3px}.zoom .stage{justify-content:flex-start;max-height:78vh}.zoom img{width:auto;max-width:none}details{color:#91a9bc;margin-top:18px;font-size:13px}code{overflow-wrap:anywhere}#mode{margin:8px 0;font-size:13px;color:#a3bdd0}@media(max-width:850px){.comparison{grid-template-columns:1fr;max-width:600px;margin:auto}h1{font-size:21px}figcaption{padding:9px 12px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}</style>
<h1>风系技能逐帧对照</h1><p>原片与当前实战同步逐帧查看。方向键切帧，空格播放或暂停。窄窗口上下排列，避免把两张图挤小。</p>
<div class="controls"><select id="skill" aria-label="选择技能"></select><button id="prev">上一帧</button><button id="play">播放</button><button id="next">下一帧</button><button id="zoom" aria-pressed="false">原尺寸查看</button></div>
<div class="timeline"><input id="frame" type="range" min="0" value="0" aria-label="选择帧"><output id="info"></output></div>
<div id="comparison" class="comparison"><figure><figcaption><span>原始 GIF · 390 × 480</span><a id="sourceLink" target="_blank" rel="noopener">打开原图</a></figcaption><div class="stage"><img id="reference" alt="原始 GIF 当前帧"></div></figure><figure><figcaption><span>当前游戏 · 780 × 960 高清</span><a id="liveLink" target="_blank" rel="noopener">打开高清图</a></figcaption><div class="stage"><img id="live" alt="当前游戏高清帧"></div></figure></div>
<p id="mode">游戏画面使用 2 倍分辨率的无损 PNG。原片保留录屏原尺寸；场景和 HUD 不同，此页用于核对特效。</p><details><summary>查看参考文件校验信息</summary><code id="hash"></code></details>
<script>const report=${JSON.stringify(report).replace(/</g,'\\u003c')};const $=id=>document.getElementById(id);const revision=report.build['assets.js'].slice(0,12)+report.build['play/game-data.js'].slice(0,12);let selected=Math.max(0,report.clips.findIndex(c=>c.name==='融合/残气乱刮')),index=19,timer=null,playing=false,paintVersion=0;
report.clips.forEach((c,i)=>$('skill').add(new Option(c.name,i)));
$('skill').value=selected;
function url(file){return file+'?v='+revision;}
async function show(){const version=++paintVersion,c=report.clips[selected],f=c.frames[index];$('frame').max=c.frames.length-1;$('frame').value=index;$('reference').src=url(f.sourceFile);$('live').src=url(f.liveFile);$('sourceLink').href=url(f.sourceFile);$('liveLink').href=url(f.liveFile);$('info').textContent=(index+1)+' / '+c.frames.length+' 帧 · '+f.timeMs+' ms · 停留 '+f.delayMs+' ms';$('hash').textContent='SHA-256：'+c.sha256;await Promise.allSettled([$ ('reference').decode(),$('live').decode()]);return version===paintVersion;}
function stop(){playing=false;clearTimeout(timer);timer=null;$('play').textContent='播放';}
function step(n){stop();index=Math.max(0,Math.min(report.clips[selected].frames.length-1,index+n));show();}
async function tick(){const start=performance.now();if(!await show()||!playing)return;$('play').textContent='暂停';timer=setTimeout(()=>{index=(index+1)%report.clips[selected].frames.length;tick();},Math.max(0,report.clips[selected].frames[index].delayMs-(performance.now()-start)));}
$('skill').onchange=e=>{stop();selected=+e.target.value;index=0;show();};$('frame').oninput=e=>{stop();index=+e.target.value;show();};$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);$('play').onclick=()=>{if(playing)stop();else{playing=true;tick();}};$('zoom').onclick=()=>{const on=$('comparison').classList.toggle('zoom');$('zoom').setAttribute('aria-pressed',on);$('zoom').textContent=on?'适合窗口':'原尺寸查看';};document.onkeydown=e=>{if(['INPUT','SELECT'].includes(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}if(e.code==='Space'){e.preventDefault();$('play').click();}};show();</script></html>`;
}

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {createHash} from 'node:crypto';

export async function recordWindReference(page,sourceDir,destination){
  fs.mkdirSync(destination,{recursive:true});
  const buildFiles=['assets.js','play/combat.js','play/gameplay.js','play/presentation.js'];
  const report={environment:'编译后的微信运行包，桌面 Chrome SwiftShader 模拟；真实技能与伤害。场景、HUD、角色位置不同，未宣称全屏像素相等。',
    build:Object.fromEntries(buildFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(import.meta.dirname,'../minigame',file))).digest('hex')])),clips:[]};
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
    ['电光一闪',98],['撞击',33],['环形扩散.讽',49001],['翅膀攻击',17],['燕返',332],['龙卷风',239],
    ['大招/一阵风刮来',0,16],['大招/刮倒一片',0,18],['大招/跑得没影',0,59],
    ['融合/残气乱刮',50006],['融合/卷着打转',50106]
  ];
  for(const [name,id,species=16] of spells){
    if(process.env.WIND_RECORD_SKILLS&&!process.env.WIND_RECORD_SKILLS.split(',').includes(name)){
      const saved=prior?.clips.find(clip=>clip.name===name);if(saved)report.clips.push(saved);continue;
    }
    const file=path.join(sourceDir,name+'.gif'),meta=await sharp(file,{animated:true}).metadata();
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
      if(id===332||id===17){
        e.clear();
        const target=e.spawn(147,x+1.85,z-7.35,1,1,0);
        e.hp[target]=e.maxHp[target]=1e7;
        e.y[target]=r.terrain.surface(e.x[target],e.z[target]);
        p.stats.critChance=p.stats.megaCrit=0;
      }else for(let i=0;i<e.n;i++){
        e.x[i]=p.pos.x+1.65+i*2.5;e.z[i]=p.pos.z-5.6-i*3;e.y[i]=r.terrain.surface(e.x[i],e.z[i]);
      }
      e.update();r.lockTarget=id===332?-1:0;r.input.stickX=0;
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
    for(const ms of exposures){
      const fire=!fired&&ms>=castTime;
      const state=await page.evaluate(({ms,previous,castTime,fire,id,species})=>{
        const r=app.run,p=r.player;
        const advance=delta=>{
          if(delta<=0)return;
          if(species===59){
            r.input.keys.delete('KeyD');r.input.keys.delete('KeyA');
            if(p.buffs.has('ziling-wind-speed')&&ms>=castTime&&ms<castTime+140)r.input.keys.add('KeyD');
            if(ms>castTime+930&&ms<castTime+1070)r.input.keys.add('KeyA');
          }
          const steps=Math.ceil(delta*.06);
          vfxAdvance(steps,delta/(steps*1000));
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
        vfxDraw();
        return {gameTime:r.time,projectiles:r.projectiles.used,moveTimer:p.moves[0]?.timer??null,
          attackSpeed:p.stats.attackSpeed,windFrames:[r.vfx.crafted.windSkills,r.vfx.crafted.windMoves,r.vfx.crafted.windAce,r.vfx.crafted.windVortex].filter(Boolean).flatMap(a=>Array.from({length:a.mesh.count},(_,i)=>a.pose.getX(i)))};
      },{ms,previous,castTime,fire,id,species});
      fired||=fire;previous=ms;
      while(refFrame+1<delays.length&&frameStart[refFrame+1]<=ms)refFrame++;
      const source=await sharp(file,{page:refFrame}).extract({left:0,top,width,height}).png().toBuffer();
      const live=await page.screenshot({clip:{x:0,y:52,width,height}});
      const pair=await sharp({create:{width:width*2+2,height,channels:3,background:'#212c32'}})
        .composite([{input:source,left:0,top:0},{input:live,left:width+2,top:0}]).png().toBuffer();
      const frameFile=String(refFrame).padStart(3,'0')+'.png';
      fs.writeFileSync(path.join(frameDir,frameFile),pair);
      record.frames.push({index:refFrame,timeMs:ms,delayMs:delays[refFrame],file:path.basename(name)+'/'+frameFile,state});
      raw.push(await sharp(pair).removeAlpha().raw().toBuffer());
    }
    if(species===59){
      const travel=await page.evaluate(()=>speedCaptureTravel.max);
      if(travel<3)throw Error('Speed recording did not traverse the open lane: '+travel);
    }
    await sharp(Buffer.concat(raw),{raw:{width:width*2+2,height:height*raw.length,channels:3,pageHeight:height}})
      .gif({delay:delays,loop:0,dither:.2,effort:3}).toFile(path.join(destination,path.basename(name)+'.gif'));
    report.clips.push(record);
    fs.writeFileSync(path.join(destination,'逐帧索引.json'),JSON.stringify(report,null,2));
    console.log('Recorded',name,record.frames.length,'/',delays.length,'frames');
  }
  fs.writeFileSync(path.join(destination,'逐帧对照.html'),frameViewer(report));
}

function frameViewer(report){
  return `<!doctype html><meta charset="utf-8"><title>风系技能逐帧对照</title>
<style>body{font:16px system-ui;background:#17212b;color:#eee;margin:24px auto;max-width:1000px}h1{font-size:24px}select,button,input{font:inherit;padding:8px;margin:4px}input{width:360px}img{display:block;max-width:100%;image-rendering:auto}p{color:#b6c9d6;line-height:1.6}.labels{display:flex;width:782px;max-width:100%;text-align:center}.labels span{width:50%}</style>
<h1>风系技能逐帧对照</h1><p>左侧为原始 GIF，右侧为当前游戏实战。按原片每帧时间采样，不跳帧。方向键逐帧，空格播放/暂停。场景和 HUD 不同，此页用于核对特效，不代表全屏像素一致。</p>
<select id="skill"></select><button id="prev">上一帧</button><button id="play">播放</button><button id="next">下一帧</button><br><input id="frame" type="range" min="0" value="0"><output id="info"></output>
<div class="labels"><span>原始 GIF</span><span>当前游戏</span></div><img id="pair"><p id="hash"></p>
<script>const report=${JSON.stringify(report).replace(/</g,'\\u003c')};const $=id=>document.getElementById(id);let selected=0,index=0,timer=null;
report.clips.forEach((c,i)=>$('skill').add(new Option(c.name,i)));
function show(){const c=report.clips[selected],f=c.frames[index];$('frame').max=c.frames.length-1;$('frame').value=index;$('pair').src=f.file;$('info').textContent=(index+1)+' / '+c.frames.length+' 帧 · '+f.timeMs+' ms · 停留 '+f.delayMs+' ms';$('hash').textContent='参考文件 SHA-256：'+c.sha256;}
function stop(){clearTimeout(timer);timer=null;$('play').textContent='播放';}
function step(n){stop();index=Math.max(0,Math.min(report.clips[selected].frames.length-1,index+n));show();}
function tick(){show();$('play').textContent='暂停';timer=setTimeout(()=>{index=(index+1)%report.clips[selected].frames.length;tick();},report.clips[selected].frames[index].delayMs);}
$('skill').onchange=e=>{stop();selected=+e.target.value;index=0;show();};$('frame').oninput=e=>{stop();index=+e.target.value;show();};$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);$('play').onclick=()=>timer?stop():tick();document.onkeydown=e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}if(e.code==='Space'){e.preventDefault();$('play').click();}};show();</script>`;
}

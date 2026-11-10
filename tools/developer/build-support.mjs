import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export function fontKey(){
  const chars=[...new Set(fs.readFileSync(path.join(import.meta.dirname,'panel.mjs'),'utf8'))].sort().join('');
  return createHash('sha256').update(chars).digest('hex').slice(0,16);
}

// This file is imported by the build tool only for --dev. Game sources never
// import the panel. A separate project, bundle and save namespace are used.
function replaceOnce(code,from,to){
  if(!code.includes(from)||code.indexOf(from)!==code.lastIndexOf(from))throw Error('Developer build anchor changed: '+from);
  return code.replace(from,to);
}
export function instrumentGame(code){
  code=replaceOnce(code,'await this.run.openStage(onLoadProgress),',
    'await this.run.openStage(onLoadProgress),window.__zixingDeveloper.attachRun(this.run),');
  return 'import {installDeveloperMode} from "../../tools/developer/panel.mjs";\n'+
    replaceOnce(code,'await app.boot();return app;',`await app.boot();installDeveloperMode(app,{
      skills:{
        pool:run=>Vb(run.player.speciesId,run.player.roster,run.player.types,id=>run.meta.inLeague(id)),
        move:id=>O_(id),
        upgrade:(run,slot)=>Gb(run,{kind:'upMove',slot,ups:P_(run.player.moves[slot],E[0])})
      },speciesName:id=>k.get(id).name
    });return app;`);
}
export function isolatedStoragePlugin(platform){
  return {name:'isolated-developer-storage',setup(build){
    build.onLoad({filter:/src[\\/]zixing-ui\.js$/},args=>({resolveDir:path.dirname(args.path),
      contents:replaceOnce(fs.readFileSync(args.path,'utf8'),'hud.experienceReady=()=>xpRing.ready;',
        'hud.experienceReady=()=>xpRing.ready;hud.developerSyncExperience=()=>{Object.assign(xpRing,new ExperienceRing(run.player,performance.now()));last=-Infinity;};')}));
    build.onLoad({filter:/platform[\\/]store\.mjs$/},args=>({resolveDir:platform,
      contents:replaceOnce(fs.readFileSync(args.path,'utf8'),'/pokebonk-save.json','/pokebonk-dev-save.json')}));
    build.onLoad({filter:/platform[\\/]host\.mjs$/},args=>{
      let code=fs.readFileSync(args.path,'utf8');
      code=replaceOnce(code,"storage('pokebonk.web.')","storage('pokebonk.dev.web.')");
      code=replaceOnce(code,"storage('pokebonk.session.')","storage('pokebonk.dev.session.')");
      code=replaceOnce(code,'invalidateUI:()=>uiFrames.invalidate(false,true),',
        'invalidateUI:()=>uiFrames.invalidate(false,true),developerInvalidateUI:()=>uiFrames.invalidate(true,true),');
      return {contents:code,resolveDir:platform};
    });
  }};
}
export function writeProject(root,out){
  const config=JSON.parse(fs.readFileSync(path.join(root,'project.config.json'),'utf8'));
  config.projectname='字行 · 开发测试（独立存档）';
  config.description='仅供开发测试，禁止上传发布；正式工程位于上两级目录。';
  fs.writeFileSync(path.join(out,'project.config.json'),JSON.stringify(config,null,2)+'\n');
  const main=path.join(out,'minigame/game.js'),play=path.join(out,'minigame/play.js');
  const stamped=stampRuntime(fs.readFileSync(main,'utf8'),fs.readFileSync(play,'utf8'));
  fs.writeFileSync(main,stamped.main);fs.writeFileSync(play,stamped.play);
}

// Main and gameplay must come from the same developer build. A stale release
// subpackage must fail visibly instead of silently starting without the panel.
export function stampRuntime(main,play){
  const id='dev8-'+createHash('sha256').update(main).update(play).digest('hex').slice(0,12);
  return {id,
    main:replaceOnce(main,"if (api && typeof api.setup==='function' && typeof api.run==='function') resolve(api);",
      `if (api && api.developerBuild===${JSON.stringify(id)} && typeof api.setup==='function' && typeof api.run==='function') resolve(api);`)
      .replace('玩法入口无效，请重新进入当前预览版本。','开发测试包版本不一致，请完全退出小游戏后扫描最新开发测试码。'),
    play:replaceOnce(play,'box.api={setup,run};',`box.api={setup,run,developerBuild:${JSON.stringify(id)}};`)};
}

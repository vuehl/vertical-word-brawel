import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export function assetKey(){
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
  return 'import {movePool,applyUpgrade} from "./combat/upgrade-offers.js";\n'+
    'import {formMove,upgradeMoveStats} from "./combat/skills.js";\n'+
    'import {Dr as upgradeTiers} from "./data/config.js";\n'+
    'import {installDeveloperMode} from "../../tools/developer/panel.mjs";\n'+
    replaceOnce(code,'  await app.boot();\n  return app;',`  await app.boot();
  installDeveloperMode(app,{
      skills:{
        pool:run=>movePool(run.player.speciesId,run.player.roster,run.player.types,id=>run.meta.inLeague(id)),
        move:(id,species)=>formMove(id,species),
        upgrade:(run,slot)=>applyUpgrade(run,{kind:'upMove',slot,ups:upgradeMoveStats(run.player.moves[slot],upgradeTiers[0])})
      },speciesName:id=>gameData.get(id).name
  });
  return app;`);
}
export function isolatedStoragePlugin(platform){
  return {name:'isolated-developer-storage',setup(build){
    build.onLoad({filter:/combat[\\/]enemy-population\.js$/},args=>({
      resolveDir:path.dirname(args.path),
      contents:replaceOnce(fs.readFileSync(args.path,'utf8'),'if(!allowOrdinarySpawn(',
        'if(!this.run.developerSpawning&&!allowOrdinarySpawn(')
    }));
    build.onLoad({filter:/ui[\\/]zixing-ui\.js$/},args=>({resolveDir:path.dirname(args.path),
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
  config.projectname='字由搏击 · 开发测试（独立存档）';
  config.description='仅供开发测试，禁止上传发布；正式工程位于上两级目录。';
  fs.writeFileSync(path.join(out,'project.config.json'),JSON.stringify(config,null,2)+'\n');
  const main=path.join(out,'minigame/game.js'),directory=path.join(out,'minigame/play'),play=path.join(directory,'game.js');
  const modules=fs.readdirSync(directory).filter(name=>name.endsWith('.js')&&name!=='game.js').sort()
    .map(name=>[name,fs.readFileSync(path.join(directory,name))]);
  const stamped=stampRuntime(fs.readFileSync(main,'utf8'),fs.readFileSync(play,'utf8'),modules);
  fs.writeFileSync(main,stamped.main);fs.writeFileSync(play,stamped.play);
}

// Main and gameplay must come from the same developer build. A stale release
// subpackage must fail visibly instead of silently starting without the panel.
export function stampRuntime(main,play,modules=[]){
  const hash=createHash('sha256').update(main).update(play);
  for(const [name,content] of modules)hash.update('\0').update(name).update('\0').update(content);
  const id='dev8-'+hash.digest('hex').slice(0,12);
  return {id,
    main:replaceOnce(main,"if (api && typeof api.setup==='function' && typeof api.run==='function') resolve(api);",
      `if (api && api.developerBuild===${JSON.stringify(id)} && typeof api.setup==='function' && typeof api.run==='function') resolve(api);`)
      .replace('玩法入口无效，请重新进入当前预览版本。','开发测试包版本不一致，请完全退出小游戏后扫描最新开发测试码。'),
    play:replaceOnce(play,'box.api={setup,run};',`box.api={setup,run,developerBuild:${JSON.stringify(id)}};`)};
}

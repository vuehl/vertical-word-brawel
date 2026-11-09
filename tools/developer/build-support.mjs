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
  return 'import {installDeveloperMode} from "../../tools/developer/panel.mjs";\n'+
    replaceOnce(code,'await app.boot();return app;','await app.boot();installDeveloperMode(app);return app;');
}
export function isolatedStoragePlugin(platform){
  return {name:'isolated-developer-storage',setup(build){
    build.onLoad({filter:/platform[\\/]store\.mjs$/},args=>({resolveDir:platform,
      contents:replaceOnce(fs.readFileSync(args.path,'utf8'),'/pokebonk-save.json','/pokebonk-dev-save.json')}));
    build.onLoad({filter:/platform[\\/]host\.mjs$/},args=>{
      let code=fs.readFileSync(args.path,'utf8');
      code=replaceOnce(code,"storage('pokebonk.web.')","storage('pokebonk.dev.web.')");
      code=replaceOnce(code,"storage('pokebonk.session.')","storage('pokebonk.dev.session.')");
      return {contents:code,resolveDir:platform};
    });
  }};
}
export function writeProject(root,out){
  const config=JSON.parse(fs.readFileSync(path.join(root,'project.config.json'),'utf8'));
  config.projectname='字行 · 开发测试（独立存档）';
  config.description='仅供开发测试，禁止上传发布；正式工程位于上两级目录。';
  fs.writeFileSync(path.join(out,'project.config.json'),JSON.stringify(config,null,2)+'\n');
}

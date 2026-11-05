// Always preview this checkout, even when another project uses the same AppID.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..');
const cli=process.env.WECHAT_DEVTOOLS_CLI||'D:/微信工具/微信web开发者工具/cli.bat';
const output=path.join(root,'验收','手机预览');
if(!fs.existsSync(cli))throw Error('找不到微信开发者工具，请用 WECHAT_DEVTOOLS_CLI 指定 cli.bat 的完整路径。');

function runCLI(args){
  if(process.platform==='win32'){
    // Pass paths as data, never interpolate them into shell source.
    execFileSync('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-Command',
      '$previewArgs = ConvertFrom-Json $env:POKEBONK_PREVIEW_ARGS; & $env:POKEBONK_PREVIEW_CLI @previewArgs; exit $LASTEXITCODE'],{
      cwd:root,stdio:'inherit',windowsHide:true,
      env:{...process.env,POKEBONK_PREVIEW_CLI:path.resolve(cli),POKEBONK_PREVIEW_ARGS:JSON.stringify(args)}
    });
  }else execFileSync(cli,args,{cwd:root,stdio:'inherit'});
}

execFileSync(process.execPath,[path.join(import.meta.dirname,'build.mjs')],{cwd:root,stdio:'inherit',windowsHide:true});
fs.mkdirSync(output,{recursive:true});
runCLI(['cache','--clean','compile','--project',root]);
const qr=path.join(output,'预览二维码.jpg');
runCLI(['preview','--project',root,'--qr-format','image','--qr-output',qr,
  '--info-output',path.join(output,'preview-info.json')]);
const hashes={};
for(const name of ['game.js','game.json','play.js','assets.js','packs/text/assets.br'])
  hashes[name]=createHash('sha256').update(fs.readFileSync(path.join(root,'minigame',name))).digest('hex');
fs.writeFileSync(path.join(output,'build-info.json'),JSON.stringify({project:root,createdAt:new Date().toISOString(),hashes},null,2)+'\n');
console.log('预览二维码：'+qr);

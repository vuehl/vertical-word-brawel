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
const buildHashes=()=>Object.fromEntries(['game.js','game.json','play.js','assets.js','packs/text/assets.br'].map(name=>
  [name,createHash('sha256').update(fs.readFileSync(path.join(root,'minigame',name))).digest('hex')]));
const hashes=buildHashes();
runCLI(['cache','--clean','compile','--project',root]);
const qr=path.join(output,'预览二维码.jpg');
// Some IDE versions return exit code 0 even after a compilation error. Write
// to fresh paths and validate the result before replacing a usable preview.
const stamp=Date.now(),nextQR=path.join(output,'preview-'+stamp+'.jpg'),nextInfo=path.join(output,'preview-'+stamp+'.json');
let preview;
try{
  runCLI(['preview','--project',root,'--qr-format','image','--qr-output',nextQR,'--info-output',nextInfo]);
  if(!fs.existsSync(nextQR)||!fs.existsSync(nextInfo))throw Error('微信预览没有生成新二维码，旧预览未更新；请重新打开工程后重试。');
  preview=JSON.parse(fs.readFileSync(nextInfo,'utf8'));
  if(!(preview.size?.total>0)||fs.statSync(nextQR).size===0)throw Error('微信预览结果不完整');
  const declared=JSON.parse(fs.readFileSync(path.join(root,'minigame/game.json'),'utf8')).subpackages;
  const expected=['TOTAL','main',...declared.map(p=>'/'+p.root.replace(/\/$/,'')+(p.root.endsWith('.js')?'':'/'))].sort();
  const actual=preview.size.packages.map(p=>p.name).sort();
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('预览分包清单仍是旧版，请重新打开工程后重试');
  if(JSON.stringify(buildHashes())!==JSON.stringify(hashes))throw Error('预览期间运行包发生变化，请重新生成预览');
  fs.renameSync(nextQR,qr);fs.renameSync(nextInfo,path.join(output,'preview-info.json'));
}finally{
  for(const file of [nextQR,nextInfo])fs.rmSync(file,{force:true});
}
fs.writeFileSync(path.join(output,'build-info.json'),JSON.stringify({project:root,createdAt:new Date().toISOString(),previewTotalBytes:preview.size.total,hashes},null,2)+'\n');
console.log('预览二维码：'+qr);

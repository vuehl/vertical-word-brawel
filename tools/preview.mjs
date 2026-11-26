// Preview a verified immutable copy of this checkout, with a fresh IDE index.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createPreviewSnapshot,verifyPreviewSnapshot} from './build/preview-snapshot.mjs';
import {verifyDeveloperPreview,writeDeveloperPreviewPage} from './developer/preview-support.mjs';

const root=path.resolve(import.meta.dirname,'..');
const development=process.argv.includes('--dev');
const projectRoot=development?path.join(root,'验收','开发者工程'):root;
const cli=process.env.WECHAT_DEVTOOLS_CLI||['D:/Program Files (x86)/微信web开发者工具/cli.bat','D:/微信工具/微信web开发者工具/cli.bat'].find(file=>fs.existsSync(file));
const output=path.join(root,'验收',development?'开发者手机预览':'手机预览');
if(!cli||!fs.existsSync(cli))throw Error('找不到微信开发者工具，请用 WECHAT_DEVTOOLS_CLI 指定 cli.bat 的完整路径。');

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

execFileSync(process.execPath,[path.join(import.meta.dirname,'build.mjs'),...(development?['--dev']:[])],{cwd:root,stdio:'inherit',windowsHide:true});
fs.mkdirSync(output,{recursive:true});
const stamp=Date.now();
const snapshot=createPreviewSnapshot({sourceProject:projectRoot,output,stamp});
const {snapshotProject,sourceProject,hashes,projectConfigHash}=snapshot;
const developerBuild=development?verifyDeveloperPreview(snapshotProject):null;
if(development){
  console.log('开发测试工程快照：'+snapshotProject+'\n开发构建：'+developerBuild);
}
console.log('预览来源：'+sourceProject+'\n本次工程快照：'+snapshotProject);
// Register the fresh project before compiling. Reusing the mutable checkout
// can leave renamed versioned subpackages absent from DevTools' file index.
runCLI(['open','--project',snapshotProject]);
runCLI(['cache','--clean','compile','--project',snapshotProject]);
const qr=path.join(output,'预览二维码.jpg');
// Some IDE versions return exit code 0 even after a compilation error. Write
// to fresh paths and validate the result before replacing a usable preview.
const nextQR=path.join(output,'preview-'+stamp+'.jpg'),nextInfo=path.join(output,'preview-'+stamp+'.json');
let preview;
try{
  runCLI(['preview','--project',snapshotProject,'--qr-format','image','--qr-output',nextQR,'--info-output',nextInfo]);
  if(!fs.existsSync(nextQR)||!fs.existsSync(nextInfo))throw Error('微信预览没有生成新二维码，旧预览未更新；请重新打开工程后重试。');
  preview=JSON.parse(fs.readFileSync(nextInfo,'utf8'));
  if(!(preview.size?.total>0)||fs.statSync(nextQR).size===0)throw Error('微信预览结果不完整');
  const declared=JSON.parse(fs.readFileSync(path.join(snapshotProject,'minigame/game.json'),'utf8')).subpackages;
  const expected=['TOTAL','main',...declared.map(p=>'/'+p.root.replace(/\/$/,'')+(p.root.endsWith('.js')?'':'/'))].sort();
  const actual=preview.size.packages.map(p=>p.name).sort();
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('预览分包清单仍是旧版，请重新打开工程后重试');
  verifyPreviewSnapshot(snapshot);
  fs.renameSync(nextQR,qr);fs.renameSync(nextInfo,path.join(output,'preview-info.json'));
}finally{
  for(const file of [nextQR,nextInfo])fs.rmSync(file,{force:true});
}
const createdAt=new Date().toISOString();
fs.writeFileSync(path.join(output,'build-info.json'),JSON.stringify({project:snapshotProject,sourceProject,snapshotProject,
  development,developerBuild,createdAt,previewTotalBytes:preview.size.total,projectConfigHash,hashes},null,2)+'\n');
console.log('预览二维码：'+qr);
if(development){
  // A fresh filename also prevents a chat/image viewer from reusing old pixels.
  const sharedQR=path.join(output,'开发测试-'+stamp+'.jpg');fs.copyFileSync(qr,sharedQR);
  console.log('本次开发测试二维码：'+sharedQR);
  const page=path.join(output,'开发测试入口-'+stamp+'.html');
  writeDeveloperPreviewPage({file:page,qr:sharedQR,project:snapshotProject,buildId:developerBuild,createdAt:new Date(createdAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})+'（北京时间）'});
  console.log('本次扫码页面：'+page+'\n扫码后请确认首页显示：开发测试版 DEV 8');
  if(process.platform==='win32'&&!process.argv.includes('--no-open')){
    try{
      // This is the visible scan target the user needs, not a background helper.
      execFileSync('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-Command','Start-Process -FilePath $env:POKEBONK_PREVIEW_PAGE'],{
        windowsHide:true,stdio:'inherit',env:{...process.env,POKEBONK_PREVIEW_PAGE:page}
      });
    }catch(error){console.warn('扫码页面未能自动打开，请打开上面的 HTML 文件。'+error.message);}
  }
}

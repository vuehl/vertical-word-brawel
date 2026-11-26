import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildHashes,verifyAssetPackages} from './preview-files.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function regularFile(file){
  if(!fs.lstatSync(file).isFile())throw Error('预览快照只接受普通文件：'+file);
}
function inputs(project){
  const configFile=path.join(project,'project.config.json');regularFile(configFile);
  const configBytes=fs.readFileSync(configFile),config=JSON.parse(configBytes.toString('utf8'));
  if(path.resolve(project,config.miniprogramRoot||'')!==path.join(project,'minigame'))
    throw Error('预览工程的 miniprogramRoot 必须指向本工程的 minigame 目录');
  if(!fs.lstatSync(path.join(project,'minigame')).isDirectory())throw Error('预览运行目录不能是符号链接');
  const hashes=buildHashes(project);
  for(const file of Object.keys(hashes))regularFile(path.join(project,'minigame',file));
  return {hashes,projectConfigHash:digest(configBytes)};
}

export function verifyPreviewSnapshot(snapshot){
  const current=inputs(snapshot.snapshotProject);
  if(!same(current.hashes,snapshot.hashes)||current.projectConfigHash!==snapshot.projectConfigHash)
    throw Error('预览快照发生变化，请重新生成预览');
  verifyAssetPackages(snapshot.snapshotProject);
}

// A new project directory avoids DevTools retaining the old filesystem index
// when content-addressed resource directories have just been renamed. Once
// copied and verified, later edits in the working checkout cannot alter the QR.
export function createPreviewSnapshot({sourceProject,output,stamp=Date.now(),copyFile=fs.copyFileSync}){
  sourceProject=fs.realpathSync(path.resolve(sourceProject));
  const token=String(stamp);
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(token))throw Error('Invalid preview snapshot stamp');
  const outputPath=path.resolve(output),game=path.join(sourceProject,'minigame');
  if(outputPath===sourceProject||outputPath===game||outputPath.startsWith(game+path.sep))
    throw Error('预览快照输出目录必须位于运行包目录之外');
  const before=inputs(sourceProject);verifyAssetPackages(sourceProject);
  fs.mkdirSync(outputPath,{recursive:true});
  const outputRoot=fs.realpathSync(outputPath);
  if(outputRoot===sourceProject||outputRoot===game||outputRoot.startsWith(game+path.sep))
    throw Error('预览快照输出目录不能指回运行包目录');
  const snapshotProject=fs.mkdtempSync(path.join(outputRoot,'工程快照-'+token+'-'));
  if(path.dirname(snapshotProject)!==outputRoot)throw Error('Unsafe preview snapshot path');
  for(const file of ['project.config.json',...Object.keys(before.hashes).map(file=>'minigame/'+file)]){
    const target=path.resolve(snapshotProject,file);
    if(!target.startsWith(snapshotProject+path.sep))throw Error('Unsafe preview snapshot file '+file);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    copyFile(path.join(sourceProject,file),target);
  }
  const after=inputs(sourceProject);
  if(!same(before,after))throw Error('复制预览快照期间运行包发生变化，请重新生成预览');
  const snapshot={sourceProject,snapshotProject,...before};
  verifyPreviewSnapshot(snapshot);
  return snapshot;
}

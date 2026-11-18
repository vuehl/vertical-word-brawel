import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runtimeData} from './runtime-data.mjs';

test('packaging retains every enabled actor record and special altar without changing gameplay data',()=>{
  const ids=[...Array.from({length:151},(_,i)=>i+1),201];
  for(const file of ['pokemon','sprites','learnsets']){
    const bytes=fs.readFileSync(new URL('../source/public/data/'+file+'.json',import.meta.url));
    const original=JSON.parse(bytes),packed=JSON.parse(runtimeData('data/'+file+'.json',bytes));
    if(file==='pokemon'){
      const families=new Set(original.filter(p=>ids.includes(p.id)).map(p=>p.family));
      assert.deepEqual(packed.map(p=>p.id),original.filter(p=>ids.includes(p.id)||families.has(p.id)).map(p=>p.id));
      for(const actor of packed)assert.deepEqual(actor,original.find(p=>p.id===actor.id));
      for(const id of ids){
        const actor=packed.find(p=>p.id===id),root=packed.find(p=>p.id===actor.family);
        assert.ok(root&&Number.isFinite(root.bst),'Every enabled actor needs its original research family metadata');
      }
      assert.deepEqual(packed.filter(p=>p.id<=151).map(p=>p.id),ids.filter(id=>id<=151),'Metadata must not expand the active roster');
    }else{
      assert.deepEqual(Object.keys(packed).map(Number),ids.filter(id=>Object.hasOwn(original,id)));
      for(const [id,record] of Object.entries(packed))assert.deepEqual(record,original[id]);
    }
  }
});

test('localized names follow the enabled actors while all moves, abilities, items and types remain',()=>{
  const bytes=fs.readFileSync(new URL('../source/public/data/i18n/zh.json',import.meta.url));
  const original=JSON.parse(bytes),packed=JSON.parse(runtimeData('data/i18n/zh.json',bytes));
  for(const [kind,records] of Object.entries(original)){
    if(['pokemon','flavor'].includes(kind)){
      for(const [id,value] of Object.entries(records)){
        if(Number(id)<=151||Number(id)===201)assert.deepEqual(packed[kind][id],value);
        else assert.equal(packed[kind][id],undefined);
      }
    }else assert.deepEqual(packed[kind],records);
  }
  for(const file of ['moves','abilities','items','types']){
    const bytes=fs.readFileSync(new URL('../source/public/data/'+file+'.json',import.meta.url));
    assert.deepEqual(runtimeData('data/'+file+'.json',bytes),bytes);
  }
});

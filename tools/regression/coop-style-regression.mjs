import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Run the compiled mini-game and native Canvas layout, including touch hit tests.
// Only the room transport is local: no cloud account or live room is modified.
export async function reviewCoopStyle({page,tap,resize,dir,sleep}){
  const reports=[];
  await page.evaluate(()=>{
    app.halted=true;
    window.coopLayoutTimer=setInterval(()=>inspected.layout.refresh(),100);
    const fixture=window.coopStyleFixture={requests:[],holdCreate:true};
    inspected.env.createCoopSocket=callbacks=>{
      let room,me,closed=false;
      const send=value=>{if(!closed)callbacks.message(JSON.stringify(value));};
      fixture.peer=patch=>{
        let peer=room.members.find(member=>member.id!==me);
        if(!peer){peer={id:'peer',slot:1,name:'同行伙伴',species:4,ready:false};room.members.push(peer);}
        Object.assign(peer,patch);send({op:'room',room});
      };
      setTimeout(()=>callbacks.open(),0);
      return {close(){closed=true;},send(json){
        const message=JSON.parse(json);fixture.requests.push(message.op);
        if(message.op==='ping'){send({op:'pong'});return true;}
        const reply=()=>{
          if(message.op==='join'&&message.code==='000000'){
            send({op:'reply',id:message.id,error:'房间不存在，请检查房间号'});return;
          }
          if(message.op==='create'||message.op==='join'){
            const join=message.op==='join';me=join?'guest':'me';
            room={code:join?message.code:'123456',host:join?'host':me,state:'lobby',members:join
              ?[{id:'host',slot:0,name:'房主伙伴',species:4,ready:true},{id:me,slot:1,name:'你',species:message.species,ready:false}]
              :[{id:me,slot:0,name:'你',species:message.species,ready:false}]};
          }
          if(message.op==='ready')room.members.find(member=>member.id===me).ready=message.ready;
          if(message.op==='pick')room.members.find(member=>member.id===me).species=message.species;
          if(message.op==='kick')room.members=room.members.filter(member=>member.id!==message.to);
          send({op:'reply',id:message.id,me,...(message.op==='leave'?{}:{room})});
        };
        if(message.op==='create'&&fixture.holdCreate)fixture.releaseCreate=reply;
        else setTimeout(reply,0);
        return true;
      }};
    };
  });

  async function capture(name,{dialog=false}={}){
    await sleep(180);
    await page.evaluate(()=>{inspected.layout.refresh();app.r.render(0);inspected.env.drawUI(app.r.renderer);});
    const result=await page.evaluate(dialog=>{
      const root=app.screen,box=element=>element&&inspected.layout.box(element),issues=[];
      const compact=element=>{const b=box(element);return b&&{text:element.textContent.slice(0,65),x:b.x,y:b.y,w:b.w,h:b.h,clip:b.clip};};
      function inside(element,parent,label){
        const a=box(element),b=box(parent);
        if(!a||!b||a.w<1||a.h<1){issues.push(label+' is missing or has no size');return;}
        if(a.x<b.x-1||a.x+a.w>b.x+b.w+1||a.y<b.y-1||a.y+a.h>b.y+b.h+1)
          issues.push(label+' exceeds container '+JSON.stringify([a.x,a.y,a.w,a.h,b.x,b.y,b.w,b.h]));
      }
      const selectors=dialog?['.paper-prompt','.paper-prompt-hint','.coop-code-display','.coop-code-pad','.paper-decision-actions']
        :['.coop-ticket','.coop-seats','.coop-roster','.zc-library-scroll','.coop-status','.zx-footer'];
      if(dialog){
        const panel=inspected.doc.querySelector('.paper-prompt');
        inside(panel,panel.parentElement,'Prompt');
        for(const element of panel.querySelectorAll('.coop-code-digit,.coop-pad-key,.paper-decision-actions>button'))inside(element,panel,'Prompt control '+element.textContent);
      }else{
        const body=root.querySelector('.zx-body'),footer=root.querySelector('.zx-footer');
        for(const selector of selectors)inside(root.querySelector(selector),root,selector);
        for(const seat of root.querySelectorAll('.coop-seat')){
          inside(seat,seat.parentElement,'Seat');
          for(const element of seat.querySelectorAll('.coop-name,.coop-seat-art,.coop-state')){
            if(element.textContent||element.childElementCount)inside(element,seat,'Seat content');
          }
        }
        for(const action of footer.querySelectorAll('button'))inside(action,footer,'Footer action '+action.textContent);
        const blocks=[...body.children].map(box).filter(Boolean);
        for(let i=1;i<blocks.length;i++)if(blocks[i-1].y+blocks[i-1].h>blocks[i].y+1)issues.push('Body blocks overlap');
        if(box(body).y+box(body).h>box(footer).y+1)issues.push('Body overlaps fixed actions');
        const scroll=root.querySelector('.zc-library-scroll');
        if(box(scroll)?.h<40)issues.push('Character list has no usable scroll area');
      }
      return {issues,viewport:[innerWidth,innerHeight],native:[inspected.env.innerWidth,inspected.env.innerHeight],
        state:root.dataset.roomState,journal:root.classList.contains('collection-journal'),
        boxes:Object.fromEntries(selectors.map(selector=>[selector,compact(inspected.doc.querySelector(selector))]))};
    },dialog);
    await page.screenshot({path:path.join(dir,name+'.png')});
    reports.push({name,...result});
    fs.writeFileSync(path.join(dir,'coop-style-report.json'),JSON.stringify({mode:'Compiled WeChat bundle / native Canvas UI / fixture room transport',screens:reports},null,2)+'\n');
    assert.ok(result.journal,'Co-op keeps the shared journal theme');
    assert.deepEqual(result.issues,[],name+' native layout');
    return result;
  }
  async function scrollRoster(){
    const distance=await page.evaluate(()=>{
      const list=app.screen.querySelector('.zc-library-scroll'),r=list.getBoundingClientRect(),screen=inspected.doc.getElementById('game').getBoundingClientRect();
      list.scrollTop=0;inspected.layout.refresh();
      const x=r.x+r.width*.55-screen.x,y=r.y+r.height*.8-screen.y;
      window.tap(x,y,'down');window.tap(x,y-Math.min(85,r.height*.65),'move');window.tap(x,y-Math.min(85,r.height*.65),'up');
      return list.scrollTop;
    });
    assert.ok(distance>12,'Character roster responds to a native swipe');
    await page.evaluate(()=>{app.screen.querySelector('.zc-library-scroll').scrollTop=0;});
  }
  async function state(value){await page.waitForFunction(value=>app.screen.dataset.roomState===value,{},value);}
  const action=key=>tap('[data-action="'+key+'"]');
  async function digits(code){for(const digit of code)await tap('.coop-pad-key[data-key="'+digit+'"]');}
  async function leave(){
    await tap('.coop-actions .paper-back');await action('coop-confirm-leave');await state('lobby');
  }
  try{
    await action('multiplayer');await state('lobby');
    for(const [width,height] of [[320,568],[390,844],[430,932]]){
      await resize(width,height);await capture('coop-lobby-'+width);await scrollRoster();
    }
    await resize(390,844);
    await action('coop-second');await digits('123');
    assert.ok(await page.evaluate(()=>inspected.doc.querySelector('[data-action="coop-join-submit"]').disabled),'Incomplete room code cannot submit');
    await capture('coop-join-incomplete',{dialog:true});
    await action('coop-join-close');
    assert.equal(await page.evaluate(()=>coopStyleFixture.requests.length),0,'Cancelling code entry sends no room request');

    await action('coop-first');
    await page.waitForFunction(()=>typeof coopStyleFixture.releaseCreate==='function');
    assert.match(await page.evaluate(()=>app.screen.querySelector('.coop-note').textContent),/正在创建/);
    await capture('coop-creating');
    await page.evaluate(()=>coopStyleFixture.releaseCreate());await state('waiting');
    assert.equal(await page.evaluate(()=>app.screen.querySelector('.coop-number').textContent),'123 456');
    await capture('coop-created-waiting');
    assert.equal(await page.evaluate(()=>app.screen.querySelector('[data-action="coop-copy"]')),null);
    await tap('.coop-roster [data-species="16"]');
    await page.waitForFunction(()=>app.coopRoom.mine.species===16);
    await page.evaluate(()=>coopStyleFixture.peer({ready:false}));await state('preparing');
    assert.ok(await page.evaluate(()=>app.screen.querySelector('[data-action="coop-second"]').disabled));
    await action('coop-first');
    await page.evaluate(()=>coopStyleFixture.peer({ready:true}));await state('ready');
    assert.equal(await page.evaluate(()=>app.screen.querySelector('[data-action="coop-second"]').disabled),false);
    await capture('coop-both-ready');
    await resize(320,568);await capture('coop-ready-320');await resize(390,844);
    await page.evaluate(()=>coopStyleFixture.peer({offline:true}));await state('waiting');
    assert.ok(await page.evaluate(()=>app.screen.querySelector('.coop-seat.offline .coop-kick')));
    await capture('coop-peer-offline');
    await page.evaluate(()=>coopStyleFixture.peer({offline:false}));await state('ready');

    await tap('.coop-actions .paper-back');await capture('coop-leave-confirm',{dialog:true});
    await action('coop-leave-close');await state('ready');
    await leave();
    await action('coop-second');await digits('000000');await action('coop-join-submit');
    await page.waitForFunction(()=>inspected.doc.querySelector('.coop-code-hint')?.textContent.includes('房间不存在'));
    await capture('coop-join-error',{dialog:true});
    for(let i=0;i<6;i++)await tap('.coop-pad-key[data-key="删除"]');
    await digits('654321');
    await resize(320,568);await capture('coop-join-320',{dialog:true});
    await action('coop-join-submit');await state('preparing');
    await resize(390,844);await capture('coop-joined-guest');
    await action('coop-first');await state('ready');
    assert.ok(await page.evaluate(()=>app.screen.querySelector('[data-action="coop-second"]').disabled),'Guest cannot start the room');
    await capture('coop-guest-ready');
    await leave();await tap('.coop-actions .paper-back');
    await page.waitForFunction(()=>app.screen.dataset.page==='home');
    fs.writeFileSync(path.join(dir,'coop-style-report.json'),JSON.stringify({passed:true,
      mode:'Compiled WeChat bundle / native Canvas UI / fixture room transport',
      checks:['phone layout and native swiping','cancel without room request','create and display code without copy button','change character',
        'both players ready','offline peer','leave confirmation','join error retry','guest start restriction'],screens:reports},null,2)+'\n');
    console.log('Co-op journal verified: lobby, create, pick, ready, offline, room code, join retry, leave, native swiping and 3 phone sizes.');
  }finally{
    await page.evaluate(()=>{clearInterval(window.coopLayoutTimer);app.coopRoom?.end('Fixture finished',false);app.halted=false;});
  }
}

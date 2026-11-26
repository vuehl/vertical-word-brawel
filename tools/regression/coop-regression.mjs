import assert from 'node:assert/strict';
import {RelayRoom} from '../../source/src/network/multiplayer.js';
import {multiplayerConfig} from '../../source/src/network/multiplayer-config.js';
import {cloudSocket} from '../../platform/cloud-coop.mjs';
import {prepareReturningPlayer} from './entry-regression.mjs';

export async function reviewCoop(browser, gamePort) {
  const endpoint = new URL(process.env.COOP_TEST_URL || 'ws://127.0.0.1:8787/ws');
  assert.equal(endpoint.hostname, '127.0.0.1');
  const userPrefix='coop-'+Date.now()+'-';
  const sqlTest=process.env.COOP_TEST_MYSQL==='1';
  async function cloudRequest(user,method,path,data){
    const address=new URL(path,endpoint);address.protocol='http:';
    const headers={'Content-Type':'application/json'};
    if(path.startsWith('/v1/progress')){
      headers['X-WX-APPID']='wxa545e5ead35ffb1b';
      headers['X-WX-OPENID']=userPrefix+user;
    }
    const response=await fetch(address,{method,headers,body:data?JSON.stringify(data):undefined});
    return {statusCode:response.status,data:await response.json()};
  }
  const clients = [], errors = [];
  async function click(page, label) {
    await page.waitForFunction(label=>{
      const target=[...app.screen.querySelectorAll('button')].find(b=>(b.textContent===label || b.getAttribute('aria-label')===label) && !b.disabled);
      if(!target)return false;
      const rect=target.getBoundingClientRect(),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
      if(!target.contains(inspected.layout.hit(x,y))){target.scrollIntoView();return false;}
      const screen=inspected.doc.getElementById('game').getBoundingClientRect();
      window.tap(x-screen.left,y-screen.top);
      return true;
    },{polling:100},label);
  }
  // The new host retains slot 1. A replacement guest reuses slot 0.
  let loginSequence=0;
  const testWx={
    login({success}){success({code:userPrefix+(++loginSequence)});},
    cloud:{
      init(){},
      callContainer:({method,path,data})=>cloudRequest(0,method,path,data),
      async connectContainer({path}){
        const ws=new WebSocket(new URL(path,endpoint));
        ws.binaryType='arraybuffer';
        return {socketTask:{get readyState(){return ws.readyState;},
          onOpen:f=>ws.onopen=f,onClose:f=>ws.onclose=f,onMessage:f=>ws.onmessage=f,onError:f=>ws.onerror=f,
          send:({data,complete})=>{ws.send(data);complete?.();},close:()=>ws.close()}};
      },
    },
  };
  const makeRoom=(code,species)=>RelayRoom.connect({factory:e=>cloudSocket(testWx,e),code,species});
  const first=await makeRoom(undefined,4);
  const second=await makeRoom(first.code,4);
  let third;
  try {
    await assert.rejects(makeRoom(first.code,16),/最多两人/);
    await assert.rejects(first.start(),/准备/);
    await assert.rejects(second.start(),/房主/);
    const migrated=new Promise(resolve=>{second.ev.change=()=>{if(second.isHost)resolve();};});
    await first.leave();
    await migrated;
    await assert.rejects(second.start(),/两位/);
    third=await makeRoom(second.code,16);
    const bothReady=new Promise(resolve=>{second.ev.change=()=>{if(second.canStart)resolve();};});
    await Promise.all([second.setReady(true),third.setReady(true),bothReady]);
    const startedOnThird=new Promise(resolve=>{third.ev.start=resolve;});
    await Promise.all([second.start(),startedOnThird]);
    await assert.rejects(makeRoom(second.code,4),/已开局/);
    const times=await Promise.all([second.waitForBattleStart(),third.waitForBattleStart()]);
    assert.equal(times[0].startAt,times[1].startAt);
  } finally { await Promise.all([first.leave(),second.leave(),third?.leave()]); }
  try {
    const configure=[];
    let cardQuery,code,defaultCard;
    for (let i = 0; i < 2; i++) {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      clients.push(page);
      await page.evaluateOnNewDocument(platform=>{window.fixturePlatform=platform;},i===1?'ios':'android');
      if(i===1)await page.evaluateOnNewDocument(query=>{
        if(!sessionStorage.getItem('opened-invite')){
          window.fixtureLaunchOptions={query};
          const oldCode=query.roomCode==='000000'?'000001':'000000';
          localStorage.setItem('pokebonk.web.ziling.coop.seat.1',JSON.stringify({code:oldCode,seat:'old-seat'}));
          sessionStorage.setItem('opened-invite','1');
        }
      },cardQuery);
      if(i===0)await page.evaluateOnNewDocument(()=>{
        const gl=WebGL2RenderingContext.prototype;
        for(const name of ['texImage2D','texSubImage2D']){
          const original=gl[name];
          gl[name]=function(...args){
            const audit=window.teamUploadAudit;
            if(audit && args.at(-1)===inspected.uiCanvas)audit.full++;
            if(audit && args.at(-1)===audit.canvas)audit.tile++;
            return original.apply(this,args);
          };
        }
      });
      page.on('pageerror', e => {errors.push(e.message);console.error('client',i,e.stack);});
      page.on('console', async m => {
        if(m.type()!=='error')return;
        console.error('client',i,m.text().slice(0,350));
        if(m.text().includes('Error en el fotograma')){
          errors.push(m.text());
          for(const arg of m.args())console.error(await arg.evaluate(value=>value?.stack||'').catch(()=>''));
        }
      });
      await page.setViewport({width:360,height:740,deviceScaleFactor:i===1?2:1});
      await page.exposeFunction('fixtureLogin',opts=>cloudRequest(i,opts.method,opts.path,opts.data));
      if(sqlTest){
        await page.exposeFunction('fixtureProgress',({method,path,data})=>cloudRequest(i,method,path,data));
        if(i===0)assert.equal((await cloudRequest(0,'POST','/v1/progress',{progress:{
          stardust:150,totalStardust:150,lab:{},stages:{forest:1}}})).statusCode,200);
      }
      await page.goto('http://127.0.0.1:'+gamePort);
      configure[i]=()=>page.evaluate(({config,url,loginCode}) => {
        function openRelay(path) {
          const ws = new WebSocket(new URL(path,url));
          window.dropRelay = () => ws.close();
          ws.addEventListener('close',event=>{window.testRelayClose={code:event.code,reason:event.reason};});
          ws.binaryType = 'arraybuffer';
          return {
            get readyState(){return ws.readyState;},
            onOpen:f=>ws.onopen=f, onMessage:f=>ws.onmessage=f, onError:f=>ws.onerror=f, onClose:f=>ws.onclose=f,
            send:({data,complete})=>{ws.send(data);complete?.();},close:()=>ws.close(),
          };
        }
        window.routes = [];
        wx.login=({success})=>{window.routes.push('login');success({code:loginCode});};
        const previousCloud=wx.cloud;
        wx.cloud = {...previousCloud,
          init({env}) { if(env !== config.env) throw Error('Wrong environment'); },
          callContainer(opts){
            if(opts.path!=='/v1/coop/login')return previousCloud.callContainer(opts);
            if(opts.header['X-WX-SERVICE']!==config.service || opts.config.env!==config.env)throw Error('Wrong login route');
            window.routes.push('exchange');
            return window.fixtureLogin(opts);
          },
          async connectContainer(opts) {
            if(opts.service !== config.service || !/^\/ws\/[a-f0-9]{32}$/.test(opts.path) || opts.config.env !== config.env) throw Error('Wrong socket route');
            window.routes.push('cloud');
            if(window.holdRelay)await new Promise(resolve=>{window.releaseRelay=()=>{window.holdRelay=false;resolve();};});
            return {socketTask:openRelay(opts.path)};
          },
        };
        wx.showModal = opts => opts.success({confirm:true,content:window.roomCode});
      }, {config:multiplayerConfig,url:endpoint.href,loginCode:userPrefix+'seat-'+i});
      await configure[i]();
      if(i===0){
        // Forwarding must already use the approved cover while the game assets are held.
        await page.waitForFunction(()=>typeof window.fixtureMenuCard==='function');
        assert.deepEqual(await page.evaluate(()=>window.fixtureShareMenus),['shareAppMessage']);
        defaultCard=await page.evaluate(()=>fixtureMenuCard());
        assert.match(defaultCard.imageUrl,/^https:\/\/mmocgame\.qpic\.cn\/wechatgame\//);
        assert.ok(defaultCard.imageUrlId);
        assert.equal(defaultCard.query,undefined);
      }
      await page.evaluate(() => { releaseTextDownload(); releaseOptionalDownloads(); });
      if(i===0){
        await page.waitForFunction(()=>window.app?.screen?.dataset.page==='home',{timeout:90000});
        await prepareReturningPlayer(page);
      }
      if(sqlTest && i===0){
        await page.evaluate(()=>app.screen.querySelector('[data-action="lab"]').click());
        await page.waitForFunction(()=>app.screen?.dataset.page==='lab' && app.meta.profile.stardust===150);
        await page.evaluate(()=>app.screen.querySelector('[data-research="dmg"]').click());
        await page.evaluate(()=>inspected.doc.querySelector('[data-action="confirm-research"]').click());
        await page.waitForFunction(()=>app.meta.profile.lab.dmg===1 && app.meta.profile.stardust===65);
        assert.equal((await cloudRequest(0,'GET','/v1/progress/research')).data.dmg,1);
        await click(page,'返回');
        const secondDevice=await browser.createBrowserContext();
        try{
          const other=await secondDevice.newPage();
          await other.setViewport({width:360,height:740});
          await other.exposeFunction('fixtureProgress',({method,path,data})=>cloudRequest(0,method,path,data));
          await other.goto('http://127.0.0.1:'+gamePort);
          await other.evaluate(()=>{releaseTextDownload();releaseOptionalDownloads();});
          await other.waitForFunction(()=>window.app?.screen?.querySelector('[data-action="journey"]'),{timeout:90000});
          await other.evaluate(()=>app.screen.querySelector('[data-action="journey"]').click());
          await other.waitForFunction(()=>app.screen?.dataset.page==='choose');
          assert.deepEqual(await other.evaluate(()=>[app.meta.profile.stardust,app.meta.lab('dmg'),app.meta.biomeTier('forest')]),[65,1,1]);
          await click(other,'选择关卡  →');
          await other.waitForFunction(()=>app.screen?.dataset.page==='map' &&
            app.screen.querySelectorAll('.zx-lock').length===3);
          await click(other,'选择难度  →');
          await other.waitForFunction(()=>app.screen?.dataset.page==='difficulty' &&
            !app.screen.querySelector('[data-tier="1"]').disabled && app.screen.querySelector('[data-tier="2"]').disabled);
        }finally{await secondDevice.close();}
      }
      if(i===0){
        await click(page,'双人前行');
        assert.deepEqual(await page.evaluate(()=>fixtureMenuCard()),defaultCard);
        await click(page,'创建房间');
        await page.waitForFunction(()=>app.coopRoom?.code);
        code=await page.evaluate(()=>app.coopRoom.code);
        assert.equal(await page.evaluate(()=>app.screen.querySelector('[data-action="coop-copy"]').textContent),'');
        await click(page,'复制房间号');
        assert.equal(await page.evaluate(()=>window.fixtureClipboard),code);
        assert.equal(await page.evaluate(()=>window.sharedCard),undefined);
        assert.deepEqual(await page.evaluate(()=>fixtureMenuCard()),defaultCard);
        cardQuery={roomCode:code}; // Previously sent invitations still open the room.
      }else{
        await page.waitForFunction(code=>window.app?.coopRoom?.code===code,{timeout:90000},code);
        await prepareReturningPlayer(page);
        await click(page,'离开房间');
        await click(page,'返回首页');
        await page.evaluate(()=>fixtureShow({query:{roomCode:'invalid'}}));
        assert.equal(await page.evaluate(()=>app.screen.dataset.page),'home');
        await click(page,'双人前行');
        await page.evaluate(code=>{window.roomCode=code==='000000'?'000001':'000000';},code);
        await click(page,'加入房间');
        await page.waitForFunction(()=>app.screen.textContent.includes('房间不存在'));
        await click(page,'创建房间');
        await page.waitForFunction(()=>app.coopRoom?.code);
        await page.evaluate(query=>{
          window.routes=[];
          fixtureShow({query});fixtureShow({query});
        },cardQuery);
        await page.waitForFunction(code=>window.app?.coopRoom?.code===code,{timeout:90000},code);
        await page.evaluate(query=>fixtureShow({query}),cardQuery);
        await click(page,'风');
      }
      console.log('Lobby ready', i+1);
    }
    const [host,...guests]=clients;
    await Promise.all(clients.map(page=>page.evaluate(()=>{
      app.frameGap=()=>80;
      app.meta.profile.settings.quality='low';
      app.applySettings();
    })));
    assert.deepEqual(await Promise.all(clients.map(page=>page.evaluate(()=>window.routes))),
      clients.map(()=>['login','exchange','cloud']));
    await assert.rejects(makeRoom(code,4),/最多两人/);
    for(const page of clients){
      await page.waitForFunction(()=>app.screen?.querySelectorAll('.zx-stat-row').length===2);
      await page.evaluate(()=>{
        const root=app.screen, nodes=[...root.querySelectorAll('button,.zx-stat-row,.zx-body')];
        const body=root.querySelector('.zx-body');
        body.scrollTop=18;
        const scroll=body.scrollTop;
        window.checkLobby=()=>root===app.screen && nodes.every(n=>root.contains(n)) && body.scrollTop===scroll;
      });
    }
    // Hold the host's request to check the UI while the network reply is pending.
    await host.evaluate(()=>{
      const room=app.coopRoom,setReady=room.setReady.bind(room);
      room.setReady=async value=>{
        room.setReady=setReady;
        await new Promise(resolve=>window.releaseReady=resolve);
        return setReady(value);
      };
    });
    await click(host,'准备');
    await host.waitForFunction(()=>typeof releaseReady==='function');
    assert.ok(await host.evaluate(()=>checkLobby() &&
      app.screen.querySelector('[data-action="coop-copy"]').disabled===false));
    await host.evaluate(()=>releaseReady());
    async function checkHostReady(ready){
      await Promise.all(clients.map(page=>page.waitForFunction(ready=>
        [...app.screen.querySelectorAll('.zx-stat-row')].find(row=>row.firstElementChild.textContent.startsWith('房主'))
          ?.lastElementChild.textContent===(ready?'已准备':'未准备'),{},ready)));
      for(const page of clients)assert.ok(await page.evaluate(()=>checkLobby()));
    }
    await checkHostReady(true);
    await Promise.all(guests.map(page=>click(page,'准备')));
    const startEnabled=enabled=>[...app.screen.querySelectorAll('button')]
      .find(b=>b.textContent==='开始冒险').disabled===!enabled;
    await host.waitForFunction(startEnabled,{},true);
    await click(host,'取消准备');
    await checkHostReady(false);
    await host.waitForFunction(startEnabled,{},false);
    await click(host,'准备');
    await checkHostReady(true);
    // Hold the guest scene-ready signal until the host loading page
    // is visibly waiting. Lobby readiness alone must never display 100%.
    await guests[0].evaluate(()=>{
      const room=app.coopRoom,ready=room.waitForBattleStart.bind(room);
      const held=new Promise(resolve=>window.releaseLastScene=resolve);
      room.waitForBattleStart=async progress=>{await held;return ready(progress);};
    });
    await click(host,'开始冒险');
    console.log('Starting two clients');
    await host.waitForFunction(()=>
      app.screen?.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')==='90' &&
      app.screen.querySelector('[role="progressbar"]').getAttribute('aria-valuetext').includes('等待小伙伴加载完成'),{timeout:90000});
    // Keep both software rasterizers from stalling the relay heartbeat
    // when the shared start signal releases the first combat frame.
    await Promise.all(clients.map(page=>page.evaluate(()=>{
      window.renderDuringCoop=app.r.render;app.r.render=()=>{};
    })));
    await guests[0].evaluate(()=>window.releaseLastScene());
    await Promise.all(clients.map(page=>page.waitForFunction(()=>app.run?.state==='play' && !app.screen && [...app.run.coop.active()].length===1, {timeout:110000,polling:200})));
    const sample=await Promise.all(clients.map(p=>p.evaluate(()=>({seed:app.run.seed,species:app.run.startSpecies,received:app.coopRoom.traffic.snapReceived}))));
    assert.deepEqual(sample.map(r=>r.species),[4,16]);
    assert.equal(new Set(sample.map(r=>r.seed)).size,1);
    assert.ok(sample.every(s=>s.received>0));
    assert.ok((await Promise.all(clients.map(p=>p.evaluate(()=>app.zixing.entryDiagnostics.percentages.at(-1))))).every(n=>n===100));
    assert.deepEqual(errors,[]);
    console.log('Room card passed: cold launch, warm lobby switch, repeated opens and two-player start');
    if(process.env.COOP_TEST_INVITES_ONLY==='1'){
      const next=await makeRoom(undefined,4);
      try{
        const guest=guests[0];
        await guest.evaluate(roomCode=>fixtureShow({query:{roomCode}}),next.code);
        assert.equal(await guest.evaluate(()=>app.run.coop.room.code),code);
        await guest.evaluate(()=>{app.run.endHow='quit';return app.run.finish(false);});
        await click(guest,'重新组队');
        await guest.waitForFunction(code=>app.coopRoom?.code===code && app.screen?.dataset.page==='coop',{},next.code);
      }finally{await next.leave();}
      return;
    }
    // Keep this networking scenario in live combat through both players’ casts
    // and the late-game crowd. Random defeats or upgrade menus end the sample.
    await Promise.all(clients.map(page=>page.evaluate(()=>{
      app.run.player.iframes=3600;
      app.run.godMode=true;
      app.run.queueLevelUp=()=>{};
      // Exercise one shared capture explicitly before the sanctuary.
      Object.assign(app.run.capture,{spawnAt:Infinity,shinyAt:Infinity,classicAt:Infinity,shinyStage:app.run.stage});
      app.run.stageTime=120;
    })));
    // Follow a slow marching enemy across a seeded eraser on both seats.
    const obstacle=await host.evaluate(()=>{
      const t=app.run.terrain,p=t.zxProps.find(p=>p.kind==='eraser');
      return {x:p.x,z:p.z,sin:Math.sin(p.angle),cos:Math.cos(p.angle),top:t.workshopGroundY(p.x,p.z)};
    });
    await Promise.all(clients.map(page=>page.evaluate(p=>{
      app.run.player.pos.set(p.x+6,app.run.terrain.height(p.x+6,p.z),p.z);
    },obstacle)));
    const crossing=await host.evaluate(b=>{
      const r=app.run,e=r.enemies;
      const id=e.spawn(129,b.x-4*b.sin,b.z-4*b.cos,1,1,1024);
      if(id<0)throw Error('Could not spawn the obstacle test enemy');
      e.flags[id]=1024;e.dirX[id]=b.sin;e.dirZ[id]=b.cos;e.speed[id]=1.5;
      e.hp[id]=e.maxHp[id]=1000000;
      return {id,slot:r.coop.mySlot,gen:e.gen[id],top:b.top};
    },obstacle);
    await Promise.all(clients.map(page=>page.waitForFunction(({id,slot,gen,top})=>{
      const {enemies:e,coop}=app.run,entry=coop.monsters.worldSlots.get(slot*4096+id);
      return entry?.gen===gen && !e.air[entry.id] && Math.abs(e.y[entry.id]-top)<.001;
    },{timeout:20000,polling:50},crossing)));
    await host.evaluate(id=>app.run.enemies.kill(id),crossing.id);
    await Promise.all(clients.map(page=>page.evaluate(()=>app.run.player.pos.copy(app.run.terrain.spawn))));
    console.log('Monster landed on the eraser on both clients');
    // Rescue from proximity alone.
    const downAt=await host.evaluate(()=>{
      const r=app.run;r.player.dead=true;r.player.hp=0;r.coop.onDowned();return {x:r.player.pos.x,z:r.player.pos.z};
    });
    await guests[0].evaluate(p=>{app.run.player.pos.x=p.x+1;app.run.player.pos.z=p.z;},downAt);
    await host.waitForFunction(()=>app.run.coop.reviveK>.3 && !app.hud.coopHud.lift.hidden &&
      +app.hud.coopHud.rescueRing.dataset.frame>0,{timeout:15000});
    await guests[0].evaluate(p=>{app.run.player.pos.x=p.x+12;},downAt);
    await host.waitForFunction(()=>app.run.player.dead && app.run.coop.reviveK===0);
    await guests[0].evaluate(p=>{app.run.player.pos.x=p.x+1;},downAt);
    await host.waitForFunction(()=>!app.run.player.dead && app.run.player.hp>0,{timeout:20000});
    await host.evaluate(()=>{app.r.render=window.renderDuringCoop;});
    const origin=await host.evaluate(()=>({x:app.run.player.pos.x,z:app.run.player.pos.z}));
    const mate=guests[0];
    await mate.evaluate(({x,z})=>{
      const p=app.run.player;p.pos.x=x+1;p.pos.z=z;p.hp=p.maxHp*.5;p.shield=12;p.overheal=12;p.iframes=3600;
    },origin);
    await host.waitForFunction(()=>{
      const bars=inspected.doc.querySelectorAll('.zx-peer-health');
      return [...bars].some(bar=>!bar.hidden && bar.getAttribute('aria-label').includes('护盾与额外生命') &&
        +bar.getAttribute('aria-valuenow')>0 && +bar.getAttribute('aria-valuenow')<+bar.getAttribute('aria-valuemax')*.6);
    });
    // Locate seat 1's green marker in actual canvas pixels.
    await host.evaluate(()=>{
      window.greenFriendX=canvas=>{
        const {width:w,height:h}=canvas,p=canvas.getContext('2d').getImageData(0,0,w,h).data;
        let x=0,n=0;
        for(let i=0;i<w*h;i++)if(p[i*4]===21&&p[i*4+1]===130&&p[i*4+2]===107){x+=i%w;n++;}
        return n?x/n/w:-1;
      };
    });
    await mate.evaluate(({x,z})=>{app.run.player.pos.x=x+60;app.run.player.pos.z=z;},origin);
    await host.waitForFunction(()=>window.greenFriendX(app.hud.minimap)>.77 &&
      /[→↘↓↙←↖↑↗] 友 · .*厘米/.test(inspected.doc.querySelector('.zx-peer-tag').dataset.frame));
    await host.evaluate(()=>app.run.openMap());
    await host.waitForFunction(()=>{const c=inspected.doc.querySelector('.zx-battle-map-art');return c && window.greenFriendX(c)>.65;});
    await mate.evaluate(({x})=>{app.run.player.pos.x=x-60;},origin);
    await host.waitForFunction(()=>{const x=window.greenFriendX(inspected.doc.querySelector('.zx-battle-map-art'));return x>=0&&x<.35;});
    await host.evaluate(()=>app.run.resume());
    await mate.evaluate(({x,z})=>{app.run.player.pos.x=x+3;app.run.player.pos.z=z;},origin);
    await host.evaluate(()=>{app.r.render=()=>{};});
    console.log('Delayed scene readiness, teammate health, distance and both live maps passed');
    // Verify a known enemy from this seat even if the opening wave is empty.
    const remoteEnemy=await mate.evaluate(()=>{
      const {enemies,player,coop}=app.run;
      const originalTime=app.run.stageTime;app.run.stageTime=600;
      const id=enemies.spawn(52,player.pos.x+8,player.pos.z,1,1,0);
      app.run.stageTime=originalTime;
      if(id<0)throw Error('Could not spawn snapshot test enemy');
      enemies.frozen[id]=600;
      enemies.hp[id]=enemies.maxHp[id]=100000;
      return {slot:coop.mySlot,id,key:(enemies.gen[id]&15)<<12|id};
    });
    await host.waitForFunction(({slot,id,key})=>{
      const coop=app.run.coop,proxy=coop.proxies.get(slot<<12|id);
      return proxy!==undefined && coop.pKey[proxy]===key && app.run.enemies.alive[proxy];
    },{timeout:30000},remoteEnemy);
    const peers=await host.evaluate(()=>app.run.coop.proxies.size);
    const teamWork=await host.evaluate(()=>{
      const run=app.run, hud=run.ui.coopHud, layout=inspected.layout;
      const refresh=layout.refresh, originalAt=hud.at;
      const peer=[...run.coop.active()][0];
      const sample={...peer,last:{...peer.last},ultUntil:0,castUntil:0};
      const scene=Object.create(run);
      scene.coop=Object.create(run.coop);
      scene.coop.peers=new Map([[sample.id,sample]]);
      let layouts=0;
      const nativeNow=performance.now.bind(performance), start=nativeNow();
      try{
        const step=i=>{
          scene.realTime=run.realTime+i*.3;sample.lastAt=scene.realTime;
          performance.now=()=>start+i*300;
          hud.update(scene);
          inspected.env.drawUI(app.r.renderer);
        };
        step(1);
        layout.refresh=function(...args){layouts++;return refresh.apply(this,args);};
        const layer=inspected.hudLayers.find(layer=>layer.owns(hud.team));
        window.teamUploadAudit={full:0,tile:0,canvas:layer.canvas};
        for(let i=2;i<=13;i++){
          sample.last.hpNow=40+i;sample.last.maxHp=100;sample.last.hp=sample.last.hpNow/100;
          step(i);
        }
        return {layouts,uploads:window.teamUploadAudit.full,tiles:window.teamUploadAudit.tile,
          tilePixels:layer.canvas.width*layer.canvas.height,screenPixels:inspected.uiCanvas.width*inspected.uiCanvas.height,
          health:hud.mates.get(sample.id).barTx.textContent};
      }finally{layout.refresh=refresh;delete performance.now;hud.at=originalAt;delete window.teamUploadAudit;inspected.env.invalidateUI();}
    });
    console.log('12 teammate HP updates',teamWork);
    assert.equal(teamWork.health,'53/100');
    assert.equal(teamWork.layouts,0);
    assert.equal(teamWork.uploads,0);
    assert.equal(teamWork.tiles,12);
    assert.ok(teamWork.tilePixels<teamWork.screenPixels);
    // Count only visuals emitted while handling a teammate's cast.
    await Promise.all(clients.map(page=>page.evaluate(()=>{
      const {coop,vfx}=app.run;
      const seen=window.peerVisuals={};
      const labels=window.peerLabels=new Map(),hud=app.hud.coopHud,update=hud.update.bind(hud);
      hud.update=(...args)=>{
        const result=update(...args);
        for(const [id,card] of hud.mates){
          if(!labels.has(id))labels.set(id,new Set());
          labels.get(id).add(card.sub.textContent);
        }
        return result;
      };
      let caster;
      for(const method of ['castFx','ultFx']){
        const original=coop[method].bind(coop);
        coop[method]=(peer,event)=>{
          caster=peer.id+'/'+method;
          try{return original(peer,event);}finally{caster=null;}
        };
      }
      for(const pool of [vfx.beams,vfx.rings]){
        const spawn=pool.spawn.bind(pool);
        pool.spawn=(...args)=>{
          if(caster)seen[caster]=(seen[caster]||0)+1;
          return spawn(...args);
        };
      }
    })));
    const target=await host.evaluate(()=>{
      const r=app.run, e=r.enemies, p=r.player.pos;
      const previousTime=r.stageTime;r.stageTime=600;
      const i=e.spawn(52,p.x+12,p.z-3,1,1,0);
      r.stageTime=previousTime;
      if(i<0)throw Error('Could not allocate the shared damage target');
      e.hp[i]=e.maxHp[i]=100000; e.frozen[i]=3600;
      return {slot:r.coop.mySlot,key:((e.gen[i]&15)<<12)|(i&4095),index:i};
    });
    await guests[0].waitForFunction(({slot,key})=>{
      const c=app.run.coop;
      return [...c.proxies.values()].some(i=>c.pKey[i]===key && c.pSlot[i]===slot);
    },{},target);
    await guests[0].evaluate(({slot,key})=>{
      const r=app.run,c=r.coop;
      const i=[...c.proxies.values()].find(i=>c.pKey[i]===key && c.pSlot[i]===slot);
      r.combat.hit(i,30000,{type:'normal',cls:'physical',fixed:true,noReact:true,silent:true,knock:0});
    },target);
    await host.waitForFunction(i=>app.run.enemies.hp[i]<80000,{},target.index);
    for(const caster of clients){
      const id=await caster.evaluate(()=>{
        const r=app.run,p=r.player.pos,time=r.stageTime;r.stageTime=600;
        const i=r.enemies.spawn(52,p.x+2,p.z+2,1,1,0);r.stageTime=time;
        if(i<0)throw Error('Could not allocate skill target');
        r.enemies.hp[i]=r.enemies.maxHp[i]=100000;r.enemies.frozen[i]=3600;
        return app.coopRoom.me;
      });
      const others=clients.filter(p=>p!==caster);
      await Promise.all(others.map(page=>page.waitForFunction(id=>{
        const peer=app.run.coop.peers.get(id);
        return window.peerVisuals[id+'/castFx']>0 && peer.castName &&
          window.peerLabels.get(id)?.has('技能 · '+peer.castName);
      },{timeout:40000},id)));
      const name=await caster.evaluate(()=>{
        const r=app.run,names=r.ult.def.names,name=names[Math.min(r.ult.form,names.length-1)];
        r.ult.charge=1;r.ult.fire();return name;
      });
      console.log('Checking skill and ultimate from seat',clients.indexOf(caster)+1,name);
      await Promise.all(others.map(page=>page.waitForFunction((id,name)=>
        window.peerVisuals[id+'/ultFx']>0 && window.peerLabels.get(id)?.has('大招 · '+name),{},id,name)));
    }
    const catchable=await host.evaluate(()=>{
      const r=app.run,c=r.capture;c.spawnShiny();
      if(c.state!=='roaming')throw Error('Missing capturable partner');
      r.combat.killEnemy(c.index,{});return c.species;
    });
    await Promise.all(clients.map(page=>page.waitForFunction(species=>app.run.capture.state==='weakened' &&
      app.run.capture.species===species,{timeout:15000},catchable)));
    await host.evaluate(()=>{
      const r=app.run,c=r.capture;r.player.pos.x=r.enemies.x[c.index];r.player.pos.z=r.enemies.z[c.index];
      c.sure=true;c.throwBall();
    });
    await host.waitForFunction(()=>app.run.capture.state==='done',{timeout:25000});
    await host.evaluate(({x,z})=>app.run.player.pos.set(x,app.run.terrain.height(x,z),z),origin);
    console.log('Both clients synchronized the partner capture');
    // Exercise dense network traffic and simulation separately from the
    // two SwiftShader rasterizers. The preceding battle uses normal rendering.
    const filled=await Promise.all(clients.map(page=>page.evaluate(()=>{
      const run=app.run, enemies=run.enemies, p=run.player.pos;
      run.player.iframes=3600;
      app.r.render=()=>{};
      const originalTime=run.stageTime;
      let created=0;
      try{
        run.stageTime=600;
        for(let i=0;i<200;i++){
          const x=p.x+10+(i%20)*.2, z=p.z+Math.floor(i/20)*.3;
          const id=enemies.spawn(52,x,z,1,1,0);
          if(id<0)break;
          enemies.frozen[id]=600;
          enemies.hp[id]=750000;enemies.maxHp[id]=1000000;created++;
        }
      }finally{run.stageTime=originalTime;}
      return {created,owned:enemies.count,stage:run.stage,actors:enemies.n,cap:run.enemyCap,slot:run.coop.mySlot};
    })));
    console.log('Dense fixture actors',filled);
    const crowds=await Promise.all(clients.map(async page=>{
      const result=await page.waitForFunction(()=>{
        const run=app.run, coop=run.coop, enemies=run.enemies;
        const counts=[...coop.peers.values()].map(peer=>{
          let count=0;
          for(const id of coop.proxies.values()){
            if(coop.pSlot[id]!==peer.slot || !coop.monsters.ownsProxy(id) || enemies.maxHp[id]!==1000000)continue;
            // A stationary frozen actor receives no update until its state changes.
            if(enemies.frozen[id]<=0 ||
               Math.abs(enemies.hp[id]/enemies.maxHp[id]-.75)>.02 ||
               !Number.isFinite(enemies.x[id]+enemies.y[id]+enemies.z[id]))continue;
            count++;
          }
          return count;
        });
        return counts.every(count=>count>=50 && count<=100) && counts;
      },{timeout:30000,polling:100});
      return result.jsonValue();
    }));
    console.log('Live frozen monsters retained from Go interest deltas',crowds);
    const sameBytes=await host.evaluate(()=>{
      const coop=app.run.coop, writer=new coop.writer.constructor();
      const ids=Array.from({length:app.run.enemies.n},(_,i)=>i).filter(i=>app.run.enemies.alive[i]).slice(0,170);
      const second=ids.slice(40).reverse();
      const first=ids.slice(0,110);
      const player={...coop.peers.values().next().value.last,bonus:8};
      writer.begin(1,player,null,app.run.stage);
      const expected=writer.finish(second,coop).slice();
      writer.begin(1,player,null,app.run.stage);
      writer.finish(first,coop,true);
      const actual=writer.finish(second,coop);
      return ids.length===170 && expected.length===actual.length && expected.every((byte,i)=>byte===actual[i]);
    });
    assert.ok(sameBytes,'A partially overlapping view must match independent encoding byte for byte');
    const totem=await host.evaluate(()=>{
      const r=app.run,p=r.player.pos;
      if(!r.minibosses.spawnTotem(20,{x:p.x+5,z:p.z}))throw Error('Missing totem');
      const id=r.minibosses.lastIndex;
      r.enemies.hp[id]=r.enemies.maxHp[id]=1000000;
      return {id,gen:r.enemies.gen[id],seat:r.coop.mySlot};
    });
    await Promise.all(clients.map(page=>page.evaluate(()=>{
      const mini=app.run.minibosses,act=mini.roomAction.bind(mini);
      window.totemMoves=[];
      mini.roomAction=(id,kind,...args)=>{window.totemMoves.push([id,kind]);return act(id,kind,...args);};
    })));
    const physical=await Promise.all(clients.map(async page=>{
      const result=await page.waitForFunction(({id,gen,seat})=>{
        const entry=app.run.coop.monsters.worldSlots.get(seat*4096+id);
        return entry?.gen===gen && window.totemMoves.find(([who,kind])=>who===entry.id && (kind===3||kind===7))?.[1];
      },{timeout:30000},totem);
      return result.jsonValue();
    }));
    assert.equal(new Set(physical).size,1);
    console.log('Server-selected totem attack on both clients',physical);
    await Promise.all(clients.map(page=>page.evaluate(()=>{
      const boss=app.run.boss,attack=boss.roomAttack.bind(boss);
      window.roomBossMoves=[];
      boss.roomAttack=(id,move)=>{window.roomBossMoves.push(move);return attack(id,move);};
    })));
    await host.evaluate(()=>{const r=app.run,p=r.player.pos;r.spawnBoss(p.x,p.z);});
    const bossMoves=await Promise.all(clients.map(async page=>{
      const result=await page.waitForFunction(()=>{
        const world=app.run.coop.monsters;
        return app.run.boss.alive && world.bossPose && world.completedTurn>0 && window.roomBossMoves.find(move=>move!=='escorts');
      },{timeout:45000,polling:100});
      return result.jsonValue();
    }));
    assert.equal(new Set(bossMoves).size,1);
    console.log('Server-selected guardian skill on both clients',bossMoves);
    const returning=guests[0];
    const seat=await returning.evaluate(()=>{
      const run=app.run;
      run.player.level=17;run.gold=543;run.pause();
      // The fixture's filesystem is in memory. Preserve the native save
      // across this cold launch just as wx.env.USER_DATA_PATH does on device.
      sessionStorage.setItem('resume-fixture-save',wx.getFileSystemManager().readFileSync('/userdata/pokebonk-save.json','utf8'));
      return {id:app.coopRoom.me,party:run.coop.party,seed:run.seed,level:run.player.level,ticket:app.meta.ticket.id};
    });
    await returning.reload();
    await returning.evaluate(()=>wx.getFileSystemManager().writeFileSync('/userdata/pokebonk-save.json',sessionStorage.getItem('resume-fixture-save')));
    await configure[1]();
    await returning.evaluate(()=>{releaseTextDownload();releaseOptionalDownloads();});
    await returning.waitForFunction(()=>window.app?.run?.state==='play' && !app.screen && app.run.coop.room.returning,{timeout:100000});
    const recovered=await returning.evaluate(()=>({id:app.coopRoom.me,party:app.run.coop.party,seed:app.run.seed,level:app.run.player.level,ticket:app.meta.ticket.id}));
    assert.deepEqual(recovered,seat);
    await host.waitForFunction(id=>{const p=app.run.coop.peers.get(id);return !p.gone && p.last?.level===17;},{},seat.id);
    await returning.waitForFunction(()=>app.run.boss.alive && app.run.coop.monsters.bossPose,{timeout:25000});
    // Test each role independently. Backgrounding never retires a seat, and
    // the foreground player's run and connection must remain untouched.
    for(const index of [0,1]){
      const away=clients[index],online=clients[1-index];
      await Promise.all(clients.map(page=>page.evaluate(()=>{
        app.run.player.iframes=3600;app.run.resume();
        window.backgroundRun=app.run;window.backgroundRoom=app.coopRoom;
        window.backgroundTime=app.run.time;window.menuVisits=0;
        const original=app.toMenu.bind(app);app.toMenu=()=>{window.menuVisits++;return original();};
      })));
      const identity=await away.evaluate(()=>{
        window.holdRelay=true;
        const id={id:app.coopRoom.me,party:app.run.coop.party};
        fixtureHide();return id;
      });
      await online.waitForFunction(id=>app.coopRoom.others.some(m=>m.id===id && m.away) &&
        app.run.coop.peers.get(id)?.gone,{timeout:10000},identity.id);
      assert.equal(await online.evaluate(()=>{
        const r=app.run,c=r.coop,p=r.player;
        const saved={dead:p.dead,bleed:c.bleed,out:c.out,wipeT:c.wipeT};
        p.dead=true;c.bleed=30;c.out=false;c.wipeT=999;
        c.downedTick(.1);
        const survived=!c.ended && c.wipeT===0;
        p.dead=saved.dead;c.bleed=saved.bleed;c.out=saved.out;c.wipeT=saved.wipeT;
        return survived;
      }),true,'an away teammate must not be counted as a defeated teammate');
      assert.equal(await away.evaluate(()=>app.run===backgroundRun && app.coopRoom.open &&
        app.run.coop.suspended && !menuVisits),true);
      if(index===0){
        // The socket can actually time out while the owner reads messages.
        await away.evaluate(()=>dropRelay());
        await away.waitForFunction(()=>app.run?.coop.reconnecting && !app.coopRoom.open);
      }
      await online.waitForFunction(()=>app.run===backgroundRun && app.coopRoom===backgroundRoom &&
        app.coopRoom.open && app.run.time>backgroundTime+.5 && !menuVisits,{timeout:15000});
      await away.evaluate(()=>fixtureShow({}));
      await away.waitForFunction(()=>window.releaseRelay && app.run===backgroundRun && app.run.coop.reconnecting &&
        !app.screen && inspected.doc.querySelector('.zx-reconnect'),{timeout:15000});
      assert.equal(await away.evaluate(()=>menuVisits),0,'disconnected client must stay in the battle recovery view');
      await away.evaluate(()=>releaseRelay());
      await away.waitForFunction(()=>app.run!==backgroundRun && app.run?.state==='play' && app.run.coop.room.open && !app.screen,{timeout:100000});
      assert.deepEqual(await away.evaluate(()=>({id:app.coopRoom.me,party:app.run.coop.party})),identity);
      assert.equal(await online.evaluate(()=>app.run===backgroundRun && app.coopRoom===backgroundRoom && !menuVisits),true);
      await online.waitForFunction(id=>!app.run.coop.peers.get(id)?.gone && !!app.run.coop.peers.get(id)?.last,{timeout:15000},identity.id);
      console.log(index===0?'Host background/transport loss: guest continued, host resumed without menu':'Guest background: host continued, guest resumed without menu');
    }
    // Both phones lose their sockets together; recovery must not depend on a
    // third, still-running client to answer resume-query.
    const beforeDrop=await Promise.all(clients.map(page=>page.evaluate(()=>{
      const r=app.run;r.pause();
      window.beforeDrop={room:app.coopRoom.code,id:app.coopRoom.me,party:r.coop.party,seed:r.seed,
        level:r.player.level,gold:r.gold,stage:r.stage};
      window.dropRelay();
      return window.beforeDrop;
    })));
    await Promise.all(clients.map(page=>page.waitForFunction(()=>window.app?.run?.state==='play' &&
      app.run.coop.room.returning && !app.screen,{timeout:100000})));
    for(const [i,page] of clients.entries()){
      const actual=await page.evaluate(()=>({room:app.coopRoom.code,id:app.coopRoom.me,party:app.run.coop.party,
        seed:app.run.seed,level:app.run.player.level,gold:app.run.gold,stage:app.run.stage}));
      assert.deepEqual(actual,beforeDrop[i]);
    }
    // Then cold-restart both apps, retaining only the native persistent save.
    await Promise.all(clients.map(page=>page.evaluate(()=>{
      app.run.pause();
      sessionStorage.setItem('resume-fixture-save',wx.getFileSystemManager().readFileSync('/userdata/pokebonk-save.json','utf8'));
    })));
    await Promise.all(clients.map(page=>page.reload()));
    for(const [i,page] of clients.entries()){
      await page.evaluate(()=>wx.getFileSystemManager().writeFileSync('/userdata/pokebonk-save.json',sessionStorage.getItem('resume-fixture-save')));
      await configure[i]();
      await page.evaluate(()=>{releaseTextDownload();releaseOptionalDownloads();});
    }
    await Promise.all(clients.map(page=>page.waitForFunction(()=>window.app?.run?.state==='play' &&
      app.run.coop.room.returning && !app.screen,{timeout:100000})));
    for(const [i,page] of clients.entries()){
      const actual=await page.evaluate(()=>({room:app.coopRoom.code,id:app.coopRoom.me,party:app.run.coop.party,
        seed:app.run.seed,level:app.run.player.level,gold:app.run.gold,stage:app.run.stage}));
      assert.deepEqual(actual,beforeDrop[i]);
    }
    console.log('Both-player socket loss and cold restart recovered room, seat, party, seed, level, gold and stage');
    // Enter the final sanctuary through the game's normal zone builder.
    await Promise.all(clients.map(page=>page.evaluate(async()=>{
      const r=app.run;r.stage=2;await r.coopAdvance(false);
      r.player.iframes=3600;r.queueLevelUp=()=>{};app.r.render=()=>{};
    })));
    await Promise.all(clients.map(page=>page.evaluate(()=>{
      // Auto-dismiss player-only upgrade choices while exercising a shared fight.
      const r=app.run,update=r.update.bind(r);
      r.update=dt=>{if(r.state==='modal')r.resume();return update(dt);};
      r.pendingLevels=0;r.pendingBlessings.length=0;r.player.iframes=3600;
    })));
    await host.evaluate(()=>{
      const r=app.run,[clock]=r.interactables.list;
      if(r.bossSpawned||clock.kind!=='boss')throw Error('Expected a waiting sanctuary clock');
      r.player.pos.set(clock.x,clock.y,clock.z);
    });
    await Promise.all(clients.map(page=>page.waitForFunction(()=>app.run.stage===4 && app.run.boss.kit &&
      app.run.coop.monsters.completedTurn>0 && app.run.boss.roomAim,{timeout:45000})));
    // The original health gates trigger both phase transitions. Inject only
    // test damage and elapsed barrier time to avoid a multi-minute encounter.
    for(const phase of [2,3]){
      await host.evaluate(()=>{const r=app.run,b=r.boss;b.kit.phaseT=60;b.kit.immune=0;
        r.enemies.hp[b.bossIndex]=1;b.kit.clampHp();});
      await Promise.all(clients.map(page=>page.waitForFunction(phase=>app.run.boss.kit.phase===phase,{timeout:25000},phase)));
    }
    await Promise.all(clients.map(page=>page.waitForFunction(()=>app.run.boss.roomAim?.move==='ultimate',{timeout:45000})));

    await host.evaluate(()=>{const r=app.run,b=r.boss;b.kit.immune=0;b.kit.phaseT=60;
      r.enemies.hp[b.bossIndex]=0;r.combat.killEnemy(b.bossIndex,{});});
    await Promise.all(clients.map(page=>page.waitForFunction(()=>app.run.stageCleared && !app.run.boss.alive &&
      app.run.interactables.list.some(item=>item.kind==='portal'),{timeout:25000})));
    console.log('Sanctuary phases, ultimate, and victory portal passed');
    await returning.evaluate(()=>{app.run.endHow='quit';return app.run.finish(false);});
    await returning.waitForFunction(()=>app.screen?.dataset.page==='summary');
    if(sqlTest){
      const remote=await cloudRequest(1,'GET','/v1/progress/stardust');
      assert.equal(remote.statusCode,200);assert.equal(remote.data.stardust,await returning.evaluate(()=>app.meta.profile.stardust));
    }
    assert.deepEqual(errors,[]);
    console.log('2-player battle passed',JSON.stringify({sample,sharedEnemies:peers}));
  } catch(error) {
    for(const page of clients) console.error(await page.evaluate(()=>({boss:window.app?.run?.boss && {alive:app.run.boss.alive,phase:app.run.boss.kit?.phase,move:app.run.boss.roomAim?.move,turn:app.run.coop.monsters?.turn,auth:app.run.coop.bossAuth,capture:app.run.capture.state},screen:window.app?.screen?.textContent.slice(-420),state:window.app?.run?.state,
      rescue:window.app?.run && [app.run.coop.reviveK,app.run.coop.bleed,app.run.player.dead,app.run.player.pos.x,app.run.player.pos.z],error:window.app?.lastStartError?.message,gate:window.app?.coopRoom?.startGate?.error?.message,proxies:window.app?.run?.coop?.proxies.size,
      end:window.app?.run?.endHow,close:window.testRelayClose,traffic:window.app?.coopRoom?.traffic,enemyCount:window.app?.run?.enemies?.count,
      monsterWorld:window.app?.run?.coop?.monsters && {stage:app.run.stage,seq:app.run.coop.monsters.seq,published:app.run.coop.monsters.published.size,latest:app.run.coop.monsters.poses.size,samples:[...app.run.coop.proxies.values()].slice(-3).map(i=>[app.run.coop.pSlot[i],app.run.enemies.hp[i],app.run.enemies.maxHp[i],app.run.enemies.frozen[i]])},peerVisuals:window.peerVisuals,skillNames:window.app?.run?.coop && [...app.run.coop.peers.values()].map(p=>[p.castName,p.ultName]),problem:window.problem})).catch(()=>null));
    throw error;
  }
}

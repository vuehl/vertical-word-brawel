import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {facilityNames} from '../source/src/active-content.js';

export async function reviewDeviceEffects(page, dir) {
  const inventory = await page.evaluate(async () => {
    const account = await app.backend.guest();
    await app.meta.load(account);
    Object.assign(app.meta.profile.settings, {quality: 'high', showBanners: false});
    app.applySettings();
    if (!await app.startRun({species: 4, biome: 'forest', tier: 0, boosts: [], mode: 'standard'})) throw Error('Entry failed');
    // Stage one uses PNGs. Stage two exercises the GLB path and world-outline mask.
    await app.run.changeZone();
    app.halted = true;
    const run = app.run, facilities = run.interactables, host = app.r;
    const portal = facilities.spawnPortal(0, 0, false, true);
    const sanct = facilities.spawnPortal(10, 0, true, true);
    const gift = facilities.spawnChest(2, 0, false, true);
    const reward = facilities.spawnChest(4, 0, true);
    const removed = facilities.add('magnet', 0, 1);
    facilities.remove(removed);
    await Promise.all([portal, sanct, gift, reward, removed].map(f => f.modelReady));
    run.stepAnims(1);
    facilities.render();
    if (run.events.start('eclipse') || 'eclipse' in host.sky.material.uniforms) throw Error('Eclipse still active');
    if (run.terrain.paperAssets.textures.has('scenery-foot-ring')) throw Error('Decorative scenery has dashed rings');
    const inventory = {};
    for (const f of facilities.list) {
      const kind = f.data?.gift ? 'freechest' : f.kind, model = f.model;
      if (!facilities.hasVisual(f) || !model?.userData.deviceScreenFx) throw Error('Missing ' + kind);
      const expectedScale = kind === 'berry' ? .5 : 1;
      const ring = f.halo;
      if (!ring || !ring.visible || ring.parent !== f.group || ring.position.y <= 0 ||
          ring.scale.x <= model.userData.footprintRadius * expectedScale) throw Error('Missing ground ring on ' + kind);
      if (ring&&(ring.position.x || ring.position.z ||
          ring.geometry !== facilities.dwellRing.geometry || ring.material.fragmentShader !== facilities.dwellRing.material.fragmentShader || ring.material.uniforms.dwell.value !== -1))
        throw Error('Idle building must show only the empty interaction track: ' + kind);
      if (['freechest','chest'].includes(kind) && f.beacon) throw Error('Unexpected gacha beam');
      if (model.scale.toArray().some(x => x !== expectedScale) || f.group.scale.toArray().some(x => x !== 1) ||
          f.group.userData.h !== model.userData.displayHeight * expectedScale) throw Error('Wrong display scale for ' + kind);
      if(kind==='bill'){
        if(!model.userData.updateGaze)throw Error('Missing layered stapler');
      }else if (model.userData.deviceModel !== ({boss:'portal',portal:'boss'}[kind]??kind))throw Error('Wrong GLB for ' + kind);
      model.traverse(m => {
        if (!m.isMesh || m.userData.portalTransient) return;
        if (m.material.name === 'MAT_DemonEyeEmission' && m.material.emissiveMap?.image?.width > 0) return;
        if (!m.material.isMeshBasicMaterial || !(m.material.map?.image?.width > 0)) throw Error('Texture or legacy hull on ' + kind);
      });
      inventory[kind] = (inventory[kind] || 0) + 1;
    }
    if (removed.model || gift.model === facilities.list.find(f => f.kind === 'freechest').model) throw Error('Stale or shared scene root');
    const sample = facilities.list.find(f => f.kind === 'chest' && !f.data?.gift);
    run.player.pos.copy(sample.group.position);
    run.player.pos.z += 3;
    run.camTarget.copy(run.player.pos);
    run.updateCamera(1);
    run.renderWorld(0);
    host.shared.uTime.value = .85;
    host.render(0);
    inspected.env.drawUI(host.renderer);
    window.deviceProbe = {run, host, facilities, sample};
    return inventory;
  });
  assert.deepEqual(Object.keys(inventory).sort(),
    ['chest','freechest','altar','boss','portal','magnet','berry','nest','bill'].sort());
  await page.screenshot({path: path.join(dir, 'devices-in-game.png')});
  await page.evaluate(() => {
    const {host, facilities, sample, run} = deviceProbe;
    for (const child of host.scene.children) child.visible = child === facilities.group;
    for (const child of facilities.group.children) child.visible = child === sample.group;
    sample.group.rotation.y = 0;
    const center = sample.model.localToWorld(run.player.pos.clone().fromArray(sample.model.userData.deviceScreenFx.centerXYZ));
    // Observe the actual triangles submitted for this device, including sparks
    // that overlap each other or fall behind the ink at this camera angle.
    const draw = host.renderer.render;
    deviceProbe.restoreDraw = () => {host.renderer.render = draw;};
    host.renderer.render = function(scene, camera) {
      const geometry = scene.children[0]?.geometry;
      const sprites = geometry?.attributes.spriteFrame;
      if (sprites) {
        const {position, anchorUv} = geometry.attributes;
        deviceProbe.sprites = [];
        for (let i = 0; i < geometry.drawRange.count; i += 6) {
          deviceProbe.sprites.push({
            anchor: [anchorUv.getX(i), anchorUv.getY(i)],
            center: [(position.getX(i)+position.getX(i+2))/2, (position.getY(i)+position.getY(i+2))/2],
            frame: sprites.getX(i), opacity: sprites.getY(i),
          });
        }
      }
      return draw.call(this, scene, camera);
    };
    deviceProbe.pointCamera = angle => {
      host.camera.position.set(center.x + 16*Math.sin(angle), center.y + 6, center.z + 16*Math.cos(angle));
      host.camera.lookAt(center);
      host.camera.updateMatrixWorld();
    };
    deviceProbe.cover = () => {
      const mesh = sample.model.getObjectByProperty('isMesh', true).clone(false);
      mesh.geometry = run.paperAssets.boxes;
      mesh.material = mesh.material.clone();
      mesh.material.map = null;
      mesh.material.color.set(0x336699);
      mesh.position.copy(center).lerp(host.camera.position, .5);
      mesh.quaternion.copy(host.camera.quaternion);
      mesh.scale.set(4, 4, .2);
      host.scene.add(mesh);
      deviceProbe.coverMesh = mesh;
    };
  });
  async function frame(time, filename) {
    const url = await page.evaluate(time => {
      const {host} = deviceProbe;
      deviceProbe.sprites = [];
      host.shared.uTime.value = time;
      host.renderer.resetState();
      host.render(0);
      const gl = host.renderer.getContext(), error = gl.getError();
      if (error) throw Error('WebGL error ' + error);
      return host.canvas.toDataURL('image/png');
    }, time);
    const png = Buffer.from(url.split(',')[1], 'base64');
    if (filename) fs.writeFileSync(path.join(dir, filename + '.png'), png);
    return sharp(png).removeAlpha().raw().toBuffer({resolveWithObject: true});
  }
  function delta(a, b, i) {
    return Math.max(Math.abs(a.data[i]-b.data[i]),Math.abs(a.data[i+1]-b.data[i+1]),Math.abs(a.data[i+2]-b.data[i+2]));
  }
  function changedPixels(a, b) {
    let count = 0;
    for (let i = 0; i < a.data.length; i += 3) if (delta(a,b,i) > 5) count++;
    return count;
  }
  const report = {inventory, views: []};
  for (const [name, angle] of [['front', 0], ['turned', .9]]) {
    const bounds = await page.evaluate(angle => {
      const {host, sample} = deviceProbe;
      deviceProbe.pointCamera(angle);
      const p = host.camera.position.clone(), points = sample.model.userData.deviceScreenFx.supportXYZ;
      const xs = [], ys = [];
      for (let i = 0; i < points.length; i += 3) {
        sample.model.localToWorld(p.fromArray(points, i)).project(host.camera);
        xs.push((p.x+1)*host.canvas.width/2);
        ys.push((1-p.y)*host.canvas.height/2);
      }
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }, angle);
    const base = await frame(0, name + '-body');
    if (name === 'front') {
      await page.evaluate(() => {
        if (!app.r.outlinePass.enabled || !app.r.outline.uniforms.get('uHasDeviceMask').value) throw Error('High-quality device exclusion is inactive');
        app.r.outlinePass.enabled = false;
      });
      report.oldOutlineOnDevice = changedPixels(base, await frame(0));
      assert.equal(report.oldOutlineOnDevice, 0, 'Legacy outline is still drawing on the GLB');
      await page.evaluate(() => {app.r.outlinePass.enabled = true;});
    }
    const [x0, y0, x1, y1] = bounds, view = {name, stars: []};
    for (const time of [.8, 1.06]) {
      assert.equal(changedPixels(base,await frame(time)),0,'Facility sweep at '+time);
    }
    for (const [time, beat] of [[1.65,'ringed-star'],[1.87,'gap'],[2.20,'scatter'],[2.56,'rest']]) {
      const shot = await frame(time, name + '-' + beat);
      const sprites = await page.evaluate(() => deviceProbe.sprites);
      if (beat === 'ringed-star') {
        assert.equal(sprites.length, 1);
        assert.ok(sprites[0].frame >= 0);
        view.starAnchor = sprites[0].anchor;
      } else if (beat === 'scatter') {
        assert.equal(sprites.length, 8);
        assert.equal(new Set(sprites.map(s => s.center.join(','))).size, 8);
        assert.ok(new Set(sprites.map(s => s.opacity)).size > 1);
        for (const sprite of sprites) {
          assert.equal(sprite.frame, -1);
          assert.deepEqual(sprite.anchor, view.starAnchor);
        }
      } else assert.equal(sprites.length, 0);
      let count = 0, wrongCorner = 0, minX = Infinity, maxX = -Infinity;
      for (let i = 0; i < shot.data.length; i += 3) {
        if (delta(shot, base, i) < 15) continue;
        const x = i/3 % shot.info.width, y = Math.floor(i/3/shot.info.width);
        if (x < x0+.5*(x1-x0) || y > y0+.5*(y1-y0)) wrongCorner++;
        minX = Math.min(minX,x); maxX = Math.max(maxX,x); count++;
      }
      view.stars.push({beat, count, minX: count ? minX : null, maxX: count ? maxX : null});
      assert.ok(['gap','rest'].includes(beat) ? count === 0 : count > 20 && wrongCorner === 0, JSON.stringify(view));
      if (beat === 'scatter') assert.ok(shot.data.equals((await frame(time+3)).data), 'Scatter must repeat after three seconds');
    }
    const anchorX = view.starAnchor[0] * base.info.width;
    assert.ok(view.stars[2].minX < anchorX && view.stars[2].maxX > anchorX,
      'Small stars must spread to both sides of their origin');
    report.views.push(view);
  }
  await page.evaluate(() => deviceProbe.restoreDraw());
  if (process.argv.includes('--device-preview')) {
    const {execFileSync} = await import('node:child_process');
    const {default: ffmpeg} = await import('@ffmpeg-installer/ffmpeg');
    const frames = [], fps = 15;
    let size;
    for (let i = 0; i < fps*3; i++) {
      const angle = .47 - .42*Math.cos(i/(fps*3)*Math.PI*2);
      await page.evaluate(angle => deviceProbe.pointCamera(angle), angle);
      const shot = await frame(i/fps);
      frames.push(shot.data);
      size = shot.info.width+'x'+shot.info.height;
    }
    execFileSync(ffmpeg.path,['-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',size,
      '-framerate',String(fps),'-i','pipe:0','-filter_complex',
      'crop=iw:ih*0.62:0:(ih-oh)/2,split[a][b];[a]palettegen[p];[b][p]paletteuse=dither=bayer',
      '-loop','0',path.join(dir,'装置流光.gif')],{input:Buffer.concat(frames),windowsHide:true});
  }
  await page.evaluate(() => {deviceProbe.cover();});
  const covered = await frame(0);
  for (const t of [.8, 1.65, 2.12]) assert.ok((await frame(t)).data.equals(covered.data), 'Effects passed through opaque foreground at '+t);
  await page.evaluate(() => {app.r.outlinePass.enabled = false;});
  report.worldOutlinePixels = changedPixels(covered, await frame(0));
  assert.ok(report.worldOutlinePixels > 0, 'World outline must still draw on the foreground object');
  await page.evaluate(() => {
    deviceProbe.coverMesh.visible = false;
    app.r.outlinePass.enabled = true;
  });
  const tiles = [], tileSize = 192, caption = 30;
  report.devices = {};
  for (const [index, [kind, title]] of Object.entries(facilityNames).entries()) {
    await page.evaluate(kind => {
      const {host, facilities, run} = deviceProbe;
      const f = facilities.list.find(f => f.kind === kind && !f.data?.gift);
      for (const child of facilities.group.children) child.visible = child === f.group;
      f.group.rotation.y = 0;
      run.player.pos.copy(f.group.position);
      const {supportXYZ, centerXYZ} = f.model.userData.deviceScreenFx;
      const center = run.player.pos.clone().fromArray(centerXYZ), point = center.clone();
      let radius = 0;
      for (let i = 0; i < supportXYZ.length; i += 3) radius = Math.max(radius, point.fromArray(supportXYZ,i).distanceTo(center));
      f.model.localToWorld(center);
      const tangent = Math.tan(host.camera.fov*Math.PI/360)*host.camera.aspect;
      host.camera.position.set(.34,.45,.83).normalize().multiplyScalar(radius*1.25/tangent).add(center);
      host.camera.lookAt(center);
      host.camera.updateMatrixWorld();
    }, kind);
    const body = await frame(0), sweep = await frame(.85), stars = await frame(2.12);
    const counts = report.devices[kind] = {sweep: changedPixels(body,sweep), stars: changedPixels(body,stars)};
    assert.ok(counts.sweep === 0 && counts.stars > 10, title+' '+JSON.stringify(counts));
    if (process.argv.includes('--device-preview')) {
      const {width,height,channels} = stars.info;
      const tile = await sharp(stars.data,{raw:{width,height,channels}})
        .extract({left:0,top:Math.floor((height-width)/2),width,height:width}).resize(tileSize,tileSize).png().toBuffer();
      const left = (index%5)*tileSize, top = Math.floor(index/5)*(tileSize+caption);
      const label = Buffer.from(`<svg width="${tileSize}" height="${caption}"><text x="50%" y="19" text-anchor="middle" font-family="Microsoft YaHei,sans-serif" font-size="16" fill="#ffffff">${title}</text></svg>`);
      tiles.push({input:tile,left,top},{input:label,left,top:top+tileSize});
    }
  }
  if (tiles.length) await sharp({create:{width:5*tileSize,height:2*(tileSize+caption),channels:3,background:'#30465d'}})
    .composite(tiles).png().toFile(path.join(dir,'十种装置.png'));
  report.presets = {};
  for (const quality of ['low','medium','high']) {
    await page.evaluate(quality => {
      app.meta.profile.settings.quality = quality;
      app.applySettings();
    }, quality);
    const body = await frame(0);
    const count = report.presets[quality] = changedPixels(body, await frame(.85));
    assert.equal(count,0,'Device sweep visible at ' + quality);
  }
  report.dockClock = await page.evaluate(() => {
    const {host, facilities, run} = deviceProbe;
    const door = facilities.list.find(f => f.kind === 'boss');
    door.group.visible = true;
    const center = door.model.localToWorld(run.player.pos.clone().fromArray(door.model.userData.deviceScreenFx.centerXYZ));
    // Decode the seven lit segments from the texture actually assigned to the GLB.
    const masks = [63,6,91,79,102,109,125,7,127,111];
    const segments = [[45,0],[88,45],[88,138],[45,182],[3,138],[3,45],[45,91]];
    deviceProbe.readDockDigits = model => {
      const screen = model.getObjectByName('Idle_screen');
      const {data,width} = screen.material.map.image;
      let digits = '';
      for (let i=0; i<3; i++) {
        let mask = 0;
        segments.forEach(([x,y],bit) => {
          const px = Math.round(183 + 119*i + 6 + x - .055*y);
          if (data[(width*(62+y) + px)*4] > 235) mask |= 1 << bit;
        });
        digits += masks.indexOf(mask);
      }
      return digits;
    };
    function sample() {
      host.camera.position.copy(center);
      host.camera.position.z += 25;
      host.camera.lookAt(center);
      host.camera.updateMatrixWorld();
      facilities.render();
      run.ui.hud(run);
      return [deviceProbe.readDockDigits(door.model), inspected.doc.querySelector('.zx-hud-clock').textContent, door.dock.state];
    }
    const samples = [];
    for (const elapsed of [0,59.99,60,359.99,360]) {
      run.stageTime = elapsed;
      samples.push(sample());
      if (elapsed === 60) {
        run.pause();
        run.update(.05);
        samples.push(sample());
        run.resume();
      }
    }
    if (door.model.userData.portalCreamPhase !== -1) throw Error('Cream effects still active during transformation');
    host.render(0);
    run.stageTime += 3;
    host.shared.uTime.value += 3;
    facilities.render();
    host.render(0);
    const phase = door.model.userData.portalCreamPhase;
    if (!(phase >= 0 && phase < 3)) throw Error('Cream cycle did not resume on the open dock');
    samples.push(door.dock.state);
    return samples;
  });
  assert.deepEqual(report.dockClock, [
    ['360','06:00','idle'], ['301','05:01','idle'], ['300','05:00','idle'], ['300','05:00','idle'],
    ['001','00:01','idle'], ['000','00:00','playing'], 'open',
  ]);
  await page.evaluate(async () => {
    const {facilities, host, run, sample} = deviceProbe;
    sample.group.visible = true;
    facilities.nearest = sample;
    facilities.dwellTime = facilities.dwellDuration * .5;
    facilities.render();
    if (sample.halo.visible || !facilities.dwellRing.visible) throw Error('Overlapping interaction rings');
    facilities.updateDwell(null, 0, 0);
    facilities.render();
    if (!sample.halo.visible || facilities.dwellRing.visible) throw Error('Idle ring did not return');
    const free = facilities.list.find(f => f.kind === 'freechest');
    const emitRing = run.vfx.ring;
    run.vfx.ring = () => {throw Error('Unexpected ring on gacha open');};
    try {
      for (const chest of [sample, free]) {
        chest.group.visible = true;
        facilities.openChest(chest, chest === free);
        facilities.render();
        if (!chest.used || chest.halo.visible) throw Error('Opened gacha still marked');
      }
    } finally {
      run.vfx.ring = emitRing;
    }
    const oldDoor = facilities.list.find(f => f.kind === 'boss');
    await run.enterPortal();
    const newDoor = run.interactables.list.find(f => f.kind === 'boss');
    run.ui.hud(run);
    if (run.stage !== 2 || oldDoor.dock || newDoor.dock.state !== 'idle' || deviceProbe.readDockDigits(newDoor.model) !== '360' ||
        inspected.doc.querySelector('.zx-hud-clock').textContent !== '06:00') throw Error('Dock did not reset in the new zone');
    run.stageTime = 300;
    run.interactables.summonGuardian(newDoor, newDoor);
    run.interactables.render();
    if (!newDoor.used || !run.bossSpawned || newDoor.dock.state !== 'playing') throw Error('Early summons did not open the dock');
    run.interactables.dispose();
    if (host.composer.passes.some(p => ['Visible devices','Device screen effects'].includes(p.name))) throw Error('Device passes survived unload');
  });
  fs.writeFileSync(path.join(dir,'device-effects.json'), JSON.stringify(report,null,2));
  console.log('Device effects verified', JSON.stringify(report));
}

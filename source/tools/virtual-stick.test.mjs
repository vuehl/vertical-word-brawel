// 虚拟摇杆模块的自检：node --test tools/virtual-stick.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { createStickConfig } from '../src/virtual-stick/stick-config.js';
import { StickSampler } from '../src/virtual-stick/stick-input.js';
import { StickFilter } from '../src/virtual-stick/stick-filter.js';
import { MoveBody } from '../src/virtual-stick/stick-physics.js';
import { FixedStepRunner, RenderState } from '../src/virtual-stick/stick-render.js';
import { encodeInput, decodeInput, InputSender, RemoteStick } from '../src/virtual-stick/stick-net.js';
import { VirtualStickController } from '../src/virtual-stick/index.js';

const cfg = createStickConfig();

test('配置：权重归一化、单步钳位不小于正常步长', () => {
  assert.ok(Math.abs(cfg.filterWeights.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.equal(cfg.filterTaps, 3);
  assert.ok(cfg.maxStepDistance >= cfg.maxSpeed * cfg.fixedStep);
});

test('采样：事件进队列，按仿真时间消费，不平滑也不丢顺序', () => {
  let clock = 1000;
  const s = new StickSampler(cfg, () => clock);
  s.begin(1, 100, 300, 1000);
  clock = 1016;
  s.move(1, 164, 300, 1016);  // +64px = 半径 -> x=1
  assert.equal(s.consume(1000).x, 0);        // 时间没到，还是按下那一刻
  const at = s.consume(1016);
  assert.ok(Math.abs(at.x - 1) < 1e-6);
  assert.equal(at.held, true);
  clock = 1032;
  s.end(1, 1032);
  const after = s.consume(1032);
  assert.equal(after.held, false);
});

test('采样：迟到事件保留事件时间戳，但会被当前步立刻消费', () => {
  let clock = 0;
  const s = new StickSampler(cfg, () => clock);
  s.begin(1, 0, 0, 0);
  clock = 500;
  s.move(1, 64, 0, 100);   // 严重迟到：事件时间 100，实际 500 才到
  const out = s.consume(500);
  assert.equal(out.t, 100, '保留原始时间，不做假');
  assert.ok(Math.abs(out.x - 1) < 1e-6, '仍然立刻生效');
  assert.ok(s.stats.late >= 1, '迟到被计数');
});

test('滤波：死区内为 0，超过阈值有输出', () => {
  const f = new StickFilter(cfg);
  let r = f.update({ t: 0, x: 0.1, y: 0, held: true }, cfg.fixedStep);
  for (let i = 0; i < 30; i++) r = f.update({ t: i, x: 0.1, y: 0, held: true }, cfg.fixedStep);
  assert.equal(r.mag, 0, '0.10 应落在死区');
  for (let i = 0; i < 60; i++) r = f.update({ t: i, x: 0.9, y: 0, held: true }, cfg.fixedStep);
  assert.ok(r.x > 0.85 && r.x <= 1.0001, `死区外应有明显输出，实际 ${r.x}`);
});

test('滤波：成批抖动被平滑，方向不会跳变', () => {
  const f = new StickFilter(cfg);
  const seq = [0.9, 0.2, 0.95, 0.3, 1.0];
  let r;
  for (let i = 0; i < seq.length; i++) r = f.update({ t: i, x: seq[i], y: 0, held: true }, cfg.fixedStep);
  assert.ok(r.x < 1, '单帧极端值不应直接顶满');
  assert.ok(r.x > 0.3, '整体方向仍然朝右');
});

test('物理：位移与帧率基本无关（dt 积分，允许一步欧拉的微小差异）', () => {
  const a = new MoveBody(cfg);
  const b = new MoveBody(cfg);
  for (let i = 0; i < 60; i++) a.step({ x: 1, y: 0 }, 1 / 60);   // 60fps 一步
  for (let i = 0; i < 120; i++) b.step({ x: 1, y: 0 }, 1 / 120);  // 120fps 半步
  const diff = Math.abs(a.x - b.x);
  assert.ok(diff / a.x < 0.01, `两次积分差 ${diff}，相对误差应 < 1%`);
});

test('物理：单帧 deltaTime 暴增被钳位，位移不飞出', () => {
  const body = new MoveBody(cfg);
  body.step({ x: 1, y: 0 }, 5);   // 模拟卡顿 5 秒
  assert.ok(body.x <= cfg.maxSpeed * cfg.maxFrameDelta + 1e-9);
  assert.ok(body.x <= cfg.maxStepDistance + 1e-9);
});

test('物理：松手平滑减速而不是硬停', () => {
  const body = new MoveBody(cfg);
  for (let i = 0; i < 120; i++) body.step({ x: 1, y: 0 }, cfg.fixedStep);
  const v0 = body.speed;
  body.step({ x: 0, y: 0 }, cfg.fixedStep);
  assert.ok(body.speed < v0, '开始减速');
  assert.ok(body.speed > v0 * 0.5, '一帧不会停死');
  for (let i = 0; i < 300; i++) body.step({ x: 0, y: 0 }, cfg.fixedStep);
  assert.equal(body.speed, 0, '最终完全停住');
});

test('固定步长：卡顿时丢弃积压而不是无限补帧', () => {
  let n = 0;
  const runner = new FixedStepRunner(cfg, () => n++);
  runner.advance(1.0);             // 1 秒的卡顿
  assert.ok(n <= cfg.maxSubSteps);
  assert.ok(runner.dropped > 0);
  assert.equal(runner.alpha < 1, true);
});

test('渲染插值：alpha 在两步之间线性过渡', () => {
  const r = new RenderState();
  const body = new MoveBody(cfg);
  r.capture(body);
  body.x = 1;
  r.capture(body);
  assert.equal(r.sample(0, 0, 0).x, 0);
  assert.equal(r.sample(1, 0, 0).x, 1);
  assert.equal(r.sample(0.5, 0, 0).x, 0.5);
});

test('快照：量化编解码可往返，held 位不串位', () => {
  for (const [x, y, held] of [[0, 0, false], [1, -1, true], [-0.5, 0.25, true], [0.15, -0.9, false]]) {
    const d = decodeInput(encodeInput(7, x, y, held, 1234));
    assert.ok(Math.abs(d.x - x) < 0.002, `${d.x} vs ${x}`);
    assert.ok(Math.abs(d.y - y) < 0.002, `${d.y} vs ${y}`);
    assert.equal(d.held, held);
    assert.equal(d.seq, 7);
  }
});

test('快照：发送器按间隔节流，变化小不发，心跳会发', () => {
  const s = new InputSender(cfg);
  assert.ok(s.sample({ x: 0, y: 0, held: false }, 0));    // 首帧发
  assert.equal(s.sample({ x: 0, y: 0, held: false }, 10), null);
  assert.ok(s.sample({ x: 1, y: 0, held: true }, 60));    // 有变化且到间隔
  assert.equal(s.sample({ x: 1, y: 0, held: true }, 70), null);
  assert.ok(s.sample({ x: 1, y: 0, held: true }, 400));   // 心跳
});

test('远端：只插值输入向量，平滑校正不硬拽', () => {
  const r = new RemoteStick(cfg);
  r.receive({ s: 1, t: 0, x: 1, y: 0, held: true }, 1000, 0, 0);
  r.receive({ s: 2, t: 50, x: 1, y: 0, held: true }, 1050, 0.5, 0);
  const out = r.advance(1200);
  assert.ok(out.x > 0.9, '输入向量保持');
  assert.equal(out.snap, false);

  // 权威位置差 2 个单位：应该逐步贴回，而不是一帧跳过去
  const r2 = new RemoteStick(cfg);
  r2.receive({ s: 1, t: 0, x: 0, y: 0, held: false }, 1000, 0, 0);
  r2.setAuthority(2, 0, 0, 0);
  const a = r2.advance(1000);
  assert.ok(a.errorX > 0 && a.errorX < 2, '首步只补偿一小部分');
  let total = 0;
  for (let i = 0; i < 400; i++) total += r2.advance(1000 + i * 16).errorX;
  // 首步受 correctionMaxSpeed 限速，所以累计略小于 2，但必须基本补齐。
  assert.ok(total > 1.8 && total <= 2.001, `应累计补回约 2，实际 ${total}`);
  assert.ok(Math.abs(r2.offX) < 0.005, '残余误差已收敛');
});

test('远端：真实传送走 snap，不做慢速拉扯', () => {
  const r = new RemoteStick(cfg);
  r.receive({ s: 1, t: 0, x: 0, y: 0, held: false }, 1000, 0, 0);
  r.setAuthority(50, 0, 0, 0);
  assert.equal(r.advance(1000).snap, true);
});

test('控制器：开局不动、按住不动也不漂', () => {
  let clock = 0;
  const ctl = new VirtualStickController({
    now: () => clock,
    rectProvider: () => ({ left: 0, top: 0, width: 400, height: 800 }),
  });
  const ev = (id, x, y) => ({ changedTouches: [{ identifier: id, x, y, timeStamp: clock }], touches: [{ identifier: id }] });
  assert.equal(ctl.handle('start', ev(0, 100, 600)), true);
  clock = 16;
  for (let i = 0; i < 300; i++) {
    clock += 16;
    ctl.update(0.016);
  }
  assert.ok(Math.abs(ctl.body.x) < 1e-6 && Math.abs(ctl.body.z) < 1e-6, '没动手指就不该位移');
});

test('控制器：拖动方向正确，且抬起后停下', () => {
  let clock = 0;
  const ctl = new VirtualStickController({
    now: () => clock,
    rectProvider: () => ({ left: 0, top: 0, width: 400, height: 800 }),
  });
  const mk = (id, x, y) => ({ changedTouches: [{ identifier: id, x, y, timeStamp: clock }], touches: [{ identifier: id }] });
  ctl.handle('start', mk(0, 100, 600));
  for (let i = 0; i < 60; i++) {
    clock += 16;
    ctl.handle('move', mk(0, 100, 540));  // 向上 60px
    ctl.update(0.016);
  }
  assert.ok(ctl.body.z > 0.5, `向上移动 z=${ctl.body.z}`);
  assert.ok(Math.abs(ctl.body.x) < 0.2, '不该横向漂');

  ctl.handle('end', { changedTouches: [{ identifier: 0, timeStamp: clock }], touches: [] });
  for (let i = 0; i < 240; i++) {
    clock += 16;
    ctl.update(0.016);
  }
  assert.equal(ctl.body.speed, 0, '抬起后完全停住');
});

/* ------------------------------------------------------------------ *
 * 压力 / 回归测试：直接对应线上“怪多就乱飘”的故障场景
 * ------------------------------------------------------------------ */

// 固定种子的线性同余随机数：压力测试必须可复现，不能用 Math.random()。
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

test('压力：抖动帧率 + 事件成批迟到 + 触摸噪声，横向漂移必须极小', () => {
  let clock = 0;
  const rand = seeded(20261123);
  const ctl = new VirtualStickController({
    now: () => clock,
    rectProvider: () => ({ left: 0, top: 0, width: 400, height: 800 }),
  });

  const mk = (id, x, y, ts) => ({ changedTouches: [{ identifier: id, x, y, timeStamp: ts }] });
  ctl.handle('start', mk(0, 100, 600, 0));
  let maxX = 0;
  let steps = 0;
  for (let i = 0; i < 600; i++) {
    const dt = 1 / (15 + rand() * 75);        // 帧率在 15~90fps 之间波动
    clock += dt * 1000;
    if (i % 3 === 0) {                        // 高负载：3 帧才投递一次事件
      const lag = rand() * 40;                // 且时间戳滞后 0~40ms
      const tx = 100 + (rand() - 0.5) * 0.02 * 128;   // ±2% 半径的触摸抖动
      const ty = 600 - 64 + (rand() - 0.5) * 0.02 * 128;
      ctl.handle('move', mk(0, tx, ty, clock - lag));
    }
    ctl.update(dt);
    steps++;
    maxX = Math.max(maxX, Math.abs(ctl.body.x));
  }
  assert.ok(steps > 500, '主循环确实在跑');
  assert.ok(maxX < 0.35, `横向漂移 ${maxX} 过大（应 < 0.35）`);
  assert.ok(ctl.body.z > 2, `纵向应持续前进，实际 ${ctl.body.z}`);
});

test('压力：30fps 与 120fps 跑同样输入，最终位移误差 < 2%', () => {
  const run = (fps) => {
    let clock = 0;
    const ctl = new VirtualStickController({
      now: () => clock,
      rectProvider: () => ({ left: 0, top: 0, width: 400, height: 800 }),
    });
    const mk = (x, y, ts) => ({ changedTouches: [{ identifier: 0, x, y, timeStamp: ts }] });
    ctl.handle('start', mk(100, 600, 0));
    const dt = 1 / fps;
    for (let i = 0; i < fps * 3; i++) {
      clock += dt * 1000;
      if (i % 2 === 0) ctl.handle('move', mk(100, 536, clock));
      ctl.update(dt);
    }
    return ctl.body.z;
  };
  const a = run(30);
  const b = run(120);
  const err = Math.abs(a - b) / a;
  assert.ok(err < 0.02, `30fps=${a} 120fps=${b}，误差 ${(err * 100).toFixed(2)}%`);
});

test('压力：单帧卡 1 秒，人不会飞出屏幕', () => {
  let clock = 0;
  const ctl = new VirtualStickController({
    now: () => clock,
    rectProvider: () => ({ left: 0, top: 0, width: 400, height: 800 }),
  });
  const mk = (x, y, ts) => ({ changedTouches: [{ identifier: 0, x, y, timeStamp: ts }] });
  ctl.handle('start', mk(100, 600, 0));
  for (let i = 0; i < 120; i++) {
    clock += 16;
    ctl.handle('move', mk(100, 536, clock));
    ctl.update(0.016);
  }
  const before = ctl.body.z;
  clock += 1000;
  ctl.update(1.0);   // 卡了整整 1 秒
  const jump = ctl.body.z - before;
  assert.ok(jump < cfg.maxSpeed * cfg.maxFrameDelta + cfg.maxStepDistance, `单帧位移 ${jump} 过大`);
});

/* ------------------------------------------------------------------ *
 * 回归：方向不同步 / 输入滞后 / 联机断流 等缺陷的最小复现
 * ------------------------------------------------------------------ */

const RECT = { left: 0, top: 0, width: 400, height: 800 };
function makeCtl(extra = {}) {
  const env = { clock: 0 };
  env.ctl = new VirtualStickController({ now: () => env.clock, rectProvider: () => RECT, ...extra });
  return env;
}
// 微信小游戏真实事件形状：timeStamp 在 event 上，Touch 只有 identifier/clientX/clientY。
const wxEv = (x, y, ts, up = false) => ({
  timeStamp: ts,
  changedTouches: [{ identifier: 0, clientX: x, clientY: y }],
  touches: up ? [] : [{ identifier: 0, clientX: x, clientY: y }],
});

test('回归：一帧跑多步时，插值区间仍然只是“最后一步”', () => {
  const env = makeCtl();
  const { ctl } = env;
  ctl.handle('start', wxEv(100, 600, 0));
  for (let i = 0; i < 120; i++) {
    env.clock += 20;
    ctl.handle('move', wxEv(164, 600, env.clock));
    ctl.update(0.02);
  }
  env.clock += 45;
  const n = ctl.update(0.045);
  assert.ok(n >= 2, `这一帧应补多步，实际 ${n}`);
  const span = ctl.view.cx - ctl.view.px;
  const one = cfg.maxSpeed * cfg.fixedStep;
  assert.ok(Math.abs(span - one) < one * 0.2, `插值跨度 ${span} 应约等于一步 ${one}`);
});

test('回归：teleport 之后渲染不从原点插值过来', () => {
  const env = makeCtl();
  const { ctl } = env;
  ctl.teleport(10, 0, 5);
  assert.equal(ctl.render().x, 10);
  env.clock += 20;
  ctl.update(0.02);
  const p = ctl.render();
  assert.equal(p.x, 10);
  assert.equal(p.z, 5);
});

test('回归：暂停一段时间 / 调用方传钳位 dt，输入也必须下一步就生效', () => {
  const env = makeCtl();
  const { ctl } = env;
  // 高负载：真实每帧 100ms，但游戏主循环把 dt 钳到 33ms 再传进来。
  for (let i = 0; i < 20; i++) {
    env.clock += 100;
    ctl.update(0.033);
  }
  env.clock += 300;                        // 再叠一段完全没调 update 的暂停
  ctl.handle('start', wxEv(100, 600, env.clock));
  ctl.handle('move', wxEv(164, 600, env.clock));
  env.clock += 20;
  ctl.update(0.02);
  assert.equal(ctl.input.held, true, '按下必须在下一步被消费');
  assert.equal(ctl.sampler.queue.length - ctl.sampler.cursor, 0, '队列不应有“未到点”的积压');
});

test('回归：微信事件的 timeStamp 在 event 上，也要参与时序映射', () => {
  const env = makeCtl();
  const { ctl } = env;
  env.clock = 1000;
  ctl.handle('start', wxEv(100, 600, 5000));
  env.clock = 1100;                        // 事件实际发生在按下后 40ms，却拖到 100ms 才投递
  ctl.handle('move', wxEv(164, 600, 5040));
  const q = ctl.sampler.queue;
  assert.equal(q[q.length - 1].t, 1040, '应按事件间隔还原时间，而不是到达时间');
  assert.ok(ctl.sampler.stats.late >= 1, '迟到应被统计');
});

test('回归：快速甩向后停住不动，方向必须收敛到手指当前位置', () => {
  const f = new StickFilter(cfg);
  let r;
  for (let i = 0; i < 60; i++) r = f.update({ t: 1, x: 1, y: 0, held: true }, cfg.fixedStep);
  r = f.update({ t: 2, x: 0.7, y: 0.7, held: true }, cfg.fixedStep);
  // 手指停住后不再有 touchmove，采样器每步返回同一个样本。
  for (let i = 0; i < 120; i++) r = f.update({ t: 3, x: 0, y: 1, held: true }, cfg.fixedStep);
  assert.ok(Math.abs(r.x) < 0.02, `不应残留旧方向，实际 x=${r.x}`);
  assert.ok(r.y > 0.95, `应指向正上，实际 y=${r.y}`);
});

test('回归：滤波权重“由新到旧”，最新样本权重最大', () => {
  const c = createStickConfig({ smoothAlpha: 0.001, deadZone: 0, deadZoneRelease: 0 });
  const f = new StickFilter(c);
  f.update({ t: 1, x: 0, y: 0, held: true }, c.fixedStep);
  f.update({ t: 2, x: 0, y: 0, held: true }, c.fixedStep);
  const r = f.update({ t: 3, x: 1, y: 0, held: true }, c.fixedStep);
  assert.ok(Math.abs(r.x - 0.5) < 0.01, `最新样本权重应为 0.5，实际 ${r.x}`);
});

test('回归：联机松手——不补发旧向量，下一步立刻发 held=false', () => {
  const sent = [];
  const env = makeCtl({ netMode: 'coop-local', onSendInput: (s) => sent.push(s) });
  const { ctl } = env;
  ctl.handle('start', wxEv(100, 600, 0));
  for (let i = 0; i < 30; i++) {
    env.clock += 20;
    ctl.handle('move', wxEv(164, 600, env.clock));
    ctl.update(0.02);
  }
  const n = sent.length;
  ctl.handle('end', wxEv(164, 600, env.clock, true));
  assert.equal(sent.length, n, '松手瞬间不应把还按着的旧输入再发一遍');
  env.clock += 20;
  ctl.update(0.02);
  assert.equal(sent.length, n + 1, '松手后的第一步必须立刻发，不等节流窗口');
  assert.equal(sent[sent.length - 1].held, false);
  assert.ok(Number.isInteger(sent[sent.length - 1].tick), '快照带固定步 tick');
});

test('回归：切后台（wx.onHide 不带参数）立刻发零输入', () => {
  const sent = [];
  const env = makeCtl({ netMode: 'coop-local', onSendInput: (s) => sent.push(s) });
  const { ctl } = env;
  ctl.handle('start', wxEv(100, 600, 0));
  for (let i = 0; i < 30; i++) {
    env.clock += 20;
    ctl.handle('move', wxEv(164, 600, env.clock));
    ctl.update(0.02);
  }
  assert.equal(ctl.handle('hide'), true);
  const last = sent[sent.length - 1];
  assert.equal(last.held, false);
  assert.equal(last.x, 0);
  assert.equal(last.y, 0);
});

test('回归：远端序号 16 位回绕后仍然收包，旧包仍然丢', () => {
  const r = new RemoteStick(cfg);
  assert.equal(r.receive({ s: 65535, t: 0, x: 1, y: 0, held: true }, 1000), true);
  assert.equal(r.receive({ s: 0, t: 50, x: 1, y: 0, held: true }, 1050), true, '回绕后的新包');
  assert.equal(r.receive({ s: 65535, t: 60, x: 0, y: 1, held: true }, 1060), false, '旧包');
});

test('回归：远端断流超时后输入归零，不会一直跑下去', () => {
  const r = new RemoteStick(cfg);
  r.receive({ s: 1, t: 0, x: 1, y: 0, held: true }, 1000);
  assert.ok(r.advance(1200).x > 0.9, '短时间内保持输入');
  const out = r.advance(1000 + cfg.remoteTimeoutMs + 500);
  assert.equal(out.x, 0);
  assert.equal(out.held, false);
  // 对端重连后序号/时钟都重置，也必须能重新接上。
  assert.equal(r.receive({ s: 1, t: 0, x: 0, y: 1, held: true }, 9000), true);
});


// 摇杆总装：触摸事件 → 采样器 → 固定步长（滤波 → 物理）→ 渲染插值 → 联机快照。
//
// 这一层只做“接线”，方便单独调试任一环节：
//   controller.sampler   原始输入队列（看事件有没有堆积/迟到）
//   controller.filter    滤波后的方向（看死区与平滑是否合理）
//   controller.body      物理状态（看速度/位移是否被钳位）
//   controller.view      渲染插值结果（与 body 对比即可判断是否抖动）

import { createStickConfig } from './stick-config.js';
import { StickSampler, nowMs } from './stick-input.js';
import { StickFilter } from './stick-filter.js';
import { MoveBody } from './stick-physics.js';
import { FixedStepRunner, RenderState } from './stick-render.js';
import { InputSender, RemoteStick } from './stick-net.js';

// 把微信小游戏 / 浏览器两种触摸事件统一成 {id, x, y, t}。
// 注意：timeStamp 在“事件对象”上，不在 Touch 上（微信与 DOM 都是如此），
// 所以必须由调用方把 event.timeStamp 传进来，否则时序映射永远拿不到时间戳。
// 微信 Touch 只有 identifier / clientX / clientY / pageX / pageY；
// x/y 分支留给已经换算好画布坐标的自定义事件。
export function readTouchPoint(touch, rect, dpr = 1, eventStamp) {
  if (!touch) return null;
  const t = Number.isFinite(touch.timeStamp) ? touch.timeStamp : eventStamp;
  if (Number.isFinite(touch.x) && Number.isFinite(touch.y)) {
    return { id: touch.identifier ?? 0, x: touch.x * dpr, y: touch.y * dpr, t };
  }
  const cx = Number.isFinite(touch.clientX) ? touch.clientX : 0;
  const cy = Number.isFinite(touch.clientY) ? touch.clientY : 0;
  return {
    id: touch.identifier ?? 0,
    x: (cx - (rect?.left || 0)) * dpr,
    y: (cy - (rect?.top || 0)) * dpr,
    t,
  };
}

export class VirtualStickController {
  constructor(options = {}) {
    this.cfg = createStickConfig(options.stick || {});
    const now = options.now || nowMs;
    this.now = now;
    this.sampler = new StickSampler(this.cfg, now);
    this.filter = new StickFilter(this.cfg);
    this.body = new MoveBody(this.cfg);
    this.view = new RenderState();
    this.sender = new InputSender(this.cfg, now);
    this.remotes = new Map();

    this.clockMs = now();                   // 本地仿真时钟（毫秒）——与采样器同一时间基准
    this.simOrigin = this.clockMs;          // 仿真时钟起点
    this.input = { x: 0, y: 0, held: false };
    this.dpr = options.dpr || 1;
    this.rectProvider = options.rectProvider || (() => null);

    // 联机开关：mode = 'solo' | 'coop-local' | 'coop-authority'
    this.netMode = options.netMode || 'solo';
    this.onSendInput = options.onSendInput || null;
    this.tick = 0;                 // 固定步序号，随输入快照一起导出，供帧同步对齐
    this._flushPending = false;    // 松手后，消费到 held=false 的那一步立刻补发

    this.runner = new FixedStepRunner(this.cfg, (dt, lag) => this._step(dt, this.clockMs - lag * 1000));
    this.view.reset();
  }

  /* ---------------- 触摸接线 ---------------- */

  // 统一入口。返回 true 表示这次事件被摇杆消费（调用方应 preventDefault）。
  handle(type, event) {
    if (type === 'blur' || type === 'hide') {
      // 切后台/失焦（wx.onHide 不带事件参数）：立刻松手，避免回来时“旧方向还在走”。
      // 后台期间主循环不跑，所以零输入必须在这里直接发出去，不能等下一个物理步。
      this.sampler.abort();
      this.filter.reset();
      this.input.x = this.input.y = 0;
      this.input.held = false;
      this._flushPending = false;
      if (this.netMode !== 'solo') {
        const snap = this.sender.flush(this.input, this.now());
        if (snap) {
          snap.tick = this.tick;
          this.onSendInput?.(snap);
        }
      }
      return true;
    }
    if (!event) return false;
    const stamp = event.timeStamp;
    const rect = this.rectProvider();
    const list = event.changedTouches || event.touches || [event];
    let consumed = false;

    if (type === 'start') {
      for (const t of list) {
        const p = readTouchPoint(t, rect, this.dpr, stamp);
        if (!p) continue;
        if (this.sampler.active) continue;                  // 只认第一根手指
        if (!this._inZone(p.x, p.y)) continue;
        const fixed = this.cfg.fixedStick;
        this.sampler.begin(
          p.id, p.x, p.y, p.t,
          fixed ? fixed.x : undefined,
          fixed ? fixed.y : undefined,
        );
        consumed = true;
      }
      return consumed;
    }

    if (type === 'move') {
      for (const t of list) {
        const p = readTouchPoint(t, rect, this.dpr, stamp);
        if (!p) continue;
        if (this.sampler.move(p.id, p.x, p.y, p.t)) consumed = true;
      }
      return consumed;
    }

    if (type === 'end' || type === 'cancel') {
      // touchend 里手指已不在 touches 中，必须用 changedTouches 拿到 id。
      // 松手事件此刻只是进了队列，this.input 还是“按着”的旧向量，不能在这里发；
      // 置标记，等物理步真正消费到 held=false 时再跳过节流立刻发。
      const touches = event.touches;
      if (touches && touches.length === 0 && this.sampler.active) {
        this.sampler.end(undefined, stamp);
        this._flushPending = true;
        return true;
      }
      for (const t of list) {
        const id = t.identifier ?? t.id ?? 0;
        if (this.sampler.end(id, Number.isFinite(t.timeStamp) ? t.timeStamp : stamp)) {
          consumed = true;
          this._flushPending = true;
        }
      }
      return consumed;
    }
    return false;
  }

  // 绑定到 canvas（浏览器）。微信小游戏请用 wx.onTouchStart 手动转发到 handle。
  attach(target) {
    const onStart = (e) => {
      if (this.handle('start', e)) e.preventDefault?.();
    };
    const onMove = (e) => {
      if (this.handle('move', e)) e.preventDefault?.();
    };
    const onEnd = (e) => {
      this.handle('end', e);
    };
    const onCancel = (e) => {
      this.handle('cancel', e);
    };
    target.addEventListener('touchstart', onStart, { passive: false });
    target.addEventListener('touchmove', onMove, { passive: false });
    target.addEventListener('touchend', onEnd, { passive: true });
    target.addEventListener('touchcancel', onCancel, { passive: true });
    return () => {
      target.removeEventListener('touchstart', onStart);
      target.removeEventListener('touchmove', onMove);
      target.removeEventListener('touchend', onEnd);
      target.removeEventListener('touchcancel', onCancel);
    };
  }

  // 微信小游戏：一次性接好四个事件。
  attachWx(wx = globalThis.wx) {
    if (!wx?.onTouchStart) return () => {};
    const onStart = (e) => {
      if (this.handle('start', e)) e.preventDefault?.();
    };
    const onMove = (e) => {
      if (this.handle('move', e)) e.preventDefault?.();
    };
    const onEnd = (e) => this.handle('end', e);
    const onCancel = (e) => this.handle('cancel', e);
    wx.onTouchStart(onStart);
    wx.onTouchMove(onMove);
    wx.onTouchEnd(onEnd);
    wx.onTouchCancel(onCancel);
    const offs = [onStart, onMove, onEnd, onCancel].map((fn, i) => {
      const names = ['offTouchStart', 'offTouchMove', 'offTouchEnd', 'offTouchCancel'];
      return () => wx[names[i]]?.(fn);
    });
    return () => offs.forEach((f) => f());
  }

  _inZone(x, y) {
    const z = this.cfg.zone;
    const rect = this.rectProvider();
    const w = (rect && rect.width) || this.viewportW || 0;
    const h = (rect && rect.height) || this.viewportH || 0;
    if (!w || !h) return true; // 拿不到屏幕尺寸时不做区域限制，避免摇杆完全失效
    const nx = x / w;
    const ny = y / h;
    return nx >= z.left && nx <= z.right && ny >= z.top && ny <= z.bottom;
  }

  /* ---------------- 主循环 ---------------- */

  // 每帧调用一次：frameDeltaSeconds 建议用真实 elapsed（未钳位），内部再钳。
  update(frameDeltaSeconds) {
    const rawDt = Math.max(0, frameDeltaSeconds || 0);
    // 仿真时钟每帧直接对齐采样器用的同一个时钟，不用 dt 累加：
    // 暂停期间不调 update、或调用方传进来的是钳位/缩放后的 dt 时，累加出来的时钟
    // 会落后于事件时间戳，队列里的输入“永远还没到点”→ 方向滞后、越卡越不同步。
    this.clockMs = this.now();
    this.distanceLeft = this.cfg.maxFrameDistance;

    // 物理步长本身仍由 runner 钳位，卡顿不会变成“一步走很远”。
    return this.runner.advance(rawDt);
  }

  // 传送/出生/复活：物理与渲染快照一起重置，否则首帧会从旧位置插值滑过来。
  teleport(x, y, z) {
    this.body.teleport(x, y, z);
    this.view.reset(x, y, z, this.body.facing);
  }

  _step(dt, simMs) {
    this.tick++;
    const raw = this.sampler.consume(simMs);
    const filtered = this.filter.update(raw, dt);

    this.input.x = filtered.x;
    this.input.y = filtered.y;
    this.input.held = raw.held;

    const startX = this.body.x, startZ = this.body.z;
    this.body.step(filtered, dt, this.distanceLeft);
    this.distanceLeft = Math.max(0, this.distanceLeft - Math.hypot(this.body.x-startX, this.body.z-startZ));
    // 每个物理步都推进一次快照：prev/curr 始终是“相邻两步”。
    // 若一帧跑 N 步只推一次，prev 会退到 N 步之前，帧率在 1 步/2 步间波动时画面忽快忽慢。
    this.view.capture(this.body);

    if (this.netMode !== 'solo') {
      // 只导出滤波后的输入向量（+ 序号/时间/tick），绝不带渲染插值坐标。
      const flush = this._flushPending && !raw.held;
      if (flush) this._flushPending = false;
      const snap = flush ? this.sender.flush(this.input, simMs) : this.sender.sample(this.input, simMs);
      if (snap) {
        snap.tick = this.tick;
        this.onSendInput?.(snap);
      }
    } else {
      this._flushPending = false;
    }
  }

  // 渲染：alpha 由 runner 提供，返回插值后的可见位置。
  render(dt = 0, out) {
    return this.view.sample(this.runner.alpha, this.cfg.renderSmoothing, dt, out);
  }

  // 供 UI 画摇杆头：返回归一化方向 + 强度（无则 0）。
  getVisual() {
    return { x: this.input.x, y: this.input.y, mag: Math.hypot(this.input.x, this.input.y), held: this.input.held };
  }

  /* ---------------- 联机 ---------------- */

  // 注册/获取远端玩家输入通道。
  remote(id) {
    let r = this.remotes.get(id);
    if (!r) {
      r = new RemoteStick(this.cfg, id);
      r.reset();
      this.remotes.set(id, r);
    }
    return r;
  }

  getRemoteInput(id, out) {
    const r = this.remotes.get(id);
    if (!r) return null;
    return r.advance(this.clockMs, out);
  }

  // 给服务端/调试面板的完整状态。
  debugState() {
    return {
      sampler: { active: this.sampler.active, queued: this.sampler.queue.length - this.sampler.cursor, ...this.sampler.stats },
      input: { ...this.input },
      body: { x: this.body.x, z: this.body.z, speed: this.body.speed, facing: this.body.facing },
      clock: { simMs: this.clockMs, tick: this.tick, steps: this.runner.steps, dropped: this.runner.dropped, alpha: this.runner.alpha },
    };
  }
}

export { createStickConfig, StickSampler, StickFilter, MoveBody, FixedStepRunner, RenderState, InputSender, RemoteStick };

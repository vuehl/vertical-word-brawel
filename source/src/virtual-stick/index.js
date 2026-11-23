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
// 微信的 x/y 已经相对 canvas；DOM 的需要减掉画布矩形。
export function readTouchPoint(touch, rect, dpr = 1) {
  if (!touch) return null;
  if (Number.isFinite(touch.x) && Number.isFinite(touch.y)) {
    // 微信小游戏：x/y 是逻辑像素
    return { id: touch.identifier ?? 0, x: touch.x * dpr, y: touch.y * dpr, t: touch.timeStamp };
  }
  const cx = Number.isFinite(touch.clientX) ? touch.clientX : 0;
  const cy = Number.isFinite(touch.clientY) ? touch.clientY : 0;
  return {
    id: touch.identifier ?? 0,
    x: (cx - (rect?.left || 0)) * dpr,
    y: (cy - (rect?.top || 0)) * dpr,
    t: touch.timeStamp,
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

    this.runner = new FixedStepRunner(this.cfg, (dt) => this._step(dt));
    this.view.reset();
  }

  /* ---------------- 触摸接线 ---------------- */

  // 统一入口。返回 true 表示这次事件被摇杆消费（调用方应 preventDefault）。
  handle(type, event) {
    if (!event) return false;
    const rect = this.rectProvider();
    const list = event.changedTouches || event.touches || [event];
    let consumed = false;

    if (type === 'start') {
      for (const t of list) {
        const p = readTouchPoint(t, rect, this.dpr);
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
        const p = readTouchPoint(t, rect, this.dpr);
        if (!p) continue;
        if (this.sampler.move(p.id, p.x, p.y, p.t)) consumed = true;
      }
      return consumed;
    }

    if (type === 'end' || type === 'cancel') {
      // touchend 里手指已不在 touches 中，必须用 changedTouches 拿到 id。
      const touches = event.touches;
      if (touches && touches.length === 0 && this.sampler.active) {
        this.sampler.end(undefined, undefined);
        if (this.netMode !== 'solo') this._flushInput(true);
        return true;
      }
      for (const t of list) {
        const id = t.identifier ?? t.id ?? 0;
        if (this.sampler.end(id, t.timeStamp)) {
          consumed = true;
          if (this.netMode !== 'solo') this._flushInput(true);
        }
      }
      return consumed;
    }

    if (type === 'blur' || type === 'hide') {
      // 切后台/失焦：立刻松手，避免回来时“旧方向还在走”。
      this.sampler.abort();
      this.sampler.end(undefined, undefined);
      this.filter.reset();
      if (this.netMode !== 'solo') this._flushInput(true);
      return true;
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
    // 仿真时钟必须跟着真实时间走，否则采样队列里的事件会“永远还没到点”。
    // 超过 0.5s 视为切后台/严重卡顿：直接把时钟对齐回真实时间。
    if (rawDt > 0.5) this.clockMs = this.now();
    else this.clockMs += rawDt * 1000;

    // 物理步长本身仍由 runner 钳位，卡顿不会变成“一步走很远”。
    const steps = this.runner.advance(rawDt);
    if (steps > 0) this.view.capture(this.body);
    return steps;
  }

  _step(dt) {
    const simMs = this.clockMs;
    const raw = this.sampler.consume(simMs);
    const filtered = this.filter.update(raw, dt);

    this.input.x = filtered.x;
    this.input.y = filtered.y;
    this.input.held = raw.held;

    this.body.step(filtered, dt);

    if (this.netMode !== 'solo') {
      const snap = this.sender.sample({ x: filtered.x, y: filtered.y, held: raw.held }, simMs);
      if (snap) this.onSendInput?.(snap);
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

  // 强制补发一次（松手、暂停时调用，确保对端立刻停住）。
  _flushInput(force) {
    if (!force) return;
    const snap = this.sender.flush(
      { x: this.input.x, y: this.input.y, held: this.input.held },
      this.clockMs,
    );
    if (snap) this.onSendInput?.(snap);
  }

  // 给服务端/调试面板的完整状态。
  debugState() {
    return {
      sampler: { active: this.sampler.active, queued: this.sampler.queue.length - this.sampler.cursor, ...this.sampler.stats },
      input: { ...this.input },
      body: { x: this.body.x, z: this.body.z, speed: this.body.speed, facing: this.body.facing },
      clock: { simMs: this.clockMs, steps: this.runner.steps, dropped: this.runner.dropped, alpha: this.runner.alpha },
    };
  }
}

export { createStickConfig, StickSampler, StickFilter, MoveBody, FixedStepRunner, RenderState, InputSender, RemoteStick };

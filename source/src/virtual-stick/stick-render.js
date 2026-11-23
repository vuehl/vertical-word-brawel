// 固定步长累加器 + 渲染插值。
//
// 逻辑跑固定步长（默认 60Hz），渲染帧率任意；渲染时用 prev/curr 两个物理快照
// 做线性插值，所以“帧率波动”只影响画面平滑度，不影响位移正确性。

export class FixedStepRunner {
  constructor(cfg, onStep) {
    this.cfg = cfg;
    this.onStep = onStep;     // (dt) => void，dt 恒为 cfg.fixedStep
    this.acc = 0;
    this.dropped = 0;         // 因卡顿丢弃的时间（秒），用于埋点
    this.steps = 0;
  }

  reset() {
    this.acc = 0;
    this.steps = 0;
  }

  // 每帧调用一次。返回本帧实际执行的步数（0 表示没有推进）。
  advance(frameDeltaSeconds) {
    const cfg = this.cfg;
    const maxDt = Math.min(cfg.maxFrameDelta, Math.max(0, frameDeltaSeconds));
    if (frameDeltaSeconds > maxDt) this.dropped += frameDeltaSeconds - maxDt;
    this.acc += maxDt;
    const step = cfg.fixedStep;
    let n = 0;
    while (this.acc >= step && n < cfg.maxSubSteps) {
      this.onStep(step);
      this.acc -= step;
      n++;
      this.steps++;
    }
    if (this.acc >= step) {
      // 补帧达到上限仍追不上：直接清空积压，绝不允许“越卡越补、越补越卡”。
      this.dropped += this.acc;
      this.acc = 0;
    }
    return n;
  }

  get alpha() {
    return Math.min(1, this.acc / this.cfg.fixedStep);
  }
}

// 双缓冲快照，供渲染插值使用。位置用 x/z，朝向单独插值（按最短弧）。
export class RenderState {
  constructor() {
    this.px = 0; this.py = 0; this.pz = 0; this.pf = 0;  // 上一物理步
    this.cx = 0; this.cy = 0; this.cz = 0; this.cf = 0;  // 当前物理步
    this.ready = false;
  }

  reset(x = 0, y = 0, z = 0, f = 0) {
    this.px = this.cx = x;
    this.py = this.cy = y;
    this.pz = this.cz = z;
    this.pf = this.cf = f;
    this.ready = true;
  }

  capture(body) {
    if (!this.ready) return this.reset(body.x, body.y, body.z, body.facing);
    this.px = this.cx; this.py = this.cy; this.pz = this.cz; this.pf = this.cf;
    this.cx = body.x; this.cy = body.y; this.cz = body.z; this.cf = body.facing;
  }

  // alpha 来自 FixedStepRunner.alpha；返回复用对象。
  sample(alpha, smoothing = 0, dt = 0, out = this._tmp || (this._tmp = { x: 0, y: 0, z: 0, facing: 0 })) {
    const t = Math.max(0, Math.min(1, alpha));
    let x = this.px + (this.cx - this.px) * t;
    let y = this.py + (this.cy - this.py) * t;
    let z = this.pz + (this.cz - this.pz) * t;
    let f = this.pf;
    let d = this.cf - this.pf;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    f += d * t;

    if (smoothing > 0 && dt > 0) {
      // 可选的视觉二次平滑：用于高负载下渲染跳变，代价是少量延迟。
      const k = 1 - Math.exp(-dt / smoothing);
      if (!out._init) { out.x = x; out.y = y; out.z = z; out.facing = f; out._init = true; }
      out.x += (x - out.x) * k;
      out.y += (y - out.y) * k;
      out.z += (z - out.z) * k;
      out.facing += (f - out.facing) * k;
      return out;
    }
    out.x = x; out.y = y; out.z = z; out.facing = f;
    return out;
  }
}

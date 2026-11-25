// 固定步长移动体。
//
// 关键点（对应“按帧固定像素”的 bug）：
//   * 所有位移都来自 dt 积分，帧率高低只影响插值密度，不影响速度；
//   * 单帧 deltaTime 有上限，单步位移还有硬钳位，卡顿/切后台不会把人甩出去；
//   * 加速/减速都用指数逼近（与帧率无关），松手后惯性滑行而不是硬停；
//   * 朝向收敛跟速度分离，手指停住时朝向不乱转。

// 共用的速度响应；战斗的地形碰撞、击退、冲刺仍由玩家物理处理。
export function steerVelocity(current, target, rate, dt, epsilon) {
  const next = target + (current - target) * Math.exp(-rate * dt);
  return target === 0 && Math.abs(next) < epsilon ? 0 : next;
}

export class MoveBody {
  constructor(cfg) {
    this.cfg = cfg;
    this.x = 0;
    this.y = 0;       // 世界高度（本模块只负责平面，留给上层地形）
    this.z = 0;
    this.vx = 0;
    this.vz = 0;
    this.facing = 0;  // 弧度，朝 +z 为 0
    this.lastInputX = 0;
    this.lastInputY = 0;
  }

  setPosition(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  teleport(x, y, z) {
    this.setPosition(x, y, z);
    this.vx = this.vz = 0;
    this.lastInputX = this.lastInputY = 0;
  }

  get speed() {
    return Math.hypot(this.vx, this.vz);
  }

  // 一步物理。input = {x,y}（已滤波、已死区），dt 会被钳位。
  step(input, dt, distanceLeft = Infinity) {
    const cfg = this.cfg;
    const h = Math.min(cfg.maxFrameDelta, Math.max(0, dt));

    const mag = Math.min(1, Math.hypot(input.x, input.y));
    this.lastInputX = input.x;
    this.lastInputY = input.y;

    // 目标速度：摇杆幅度线性映射到最大速度。
    const targetVx = input.x * cfg.maxSpeed * (mag > 0 ? 1 : 0);
    const targetVz = input.y * cfg.maxSpeed * (mag > 0 ? 1 : 0);

    // 指数逼近：k = 1 - e^(-rate*dt)，同一 rate 下 30fps / 60fps 结果一致。
    const rate = mag > 0 ? cfg.accel : cfg.decel;
    this.vx = steerVelocity(this.vx, targetVx, rate, h, cfg.stopEpsilon);
    this.vz = steerVelocity(this.vz, targetVz, rate, h, cfg.stopEpsilon);

    // 位移积分 + 单步硬钳位。
    let dx = this.vx * h;
    let dz = this.vz * h;
    const dist = Math.hypot(dx, dz);
    const limit = Math.min(cfg.maxStepDistance, distanceLeft);
    if (dist > limit && dist > 0) {
      const s = limit / dist;
      dx *= s;
      dz *= s;
      // 速度同步收紧，防止“位置被钳但速度还在疯跑”。
      this.vx *= s;
      this.vz *= s;
    }
    this.x += dx;
    this.z += dz;

    // 朝向：只有输入足够大才转，并且按最短弧收敛。
    if (mag > 0.05) {
      const want = Math.atan2(input.x, input.y);
      let diff = want - this.facing;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const turn = 1 - Math.exp(-cfg.turnRate * h);
      this.facing += diff * turn;
    }
    return this;
  }
}

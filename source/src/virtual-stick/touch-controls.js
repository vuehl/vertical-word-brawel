import {gameStick} from "./stick-config.js";
import {StickSampler} from "./stick-input.js";
import {StickFilter} from "./stick-filter.js";
import {chineseText as c} from "../data/chinese-text.js";
import {Da, uo} from "../ui/controls.js";
import {createElement as X, Z, Q, $} from "../ui/game-elements.js";

var TE = 46,
  DE = 1.15,
  OE = 400,
  kE = 300,
  AE = 3;
function jE(e, t) {
  try {
    e.setPointerCapture(t);
  } catch {}
}
// 微信使用原生采样时刻，浏览器使用 PointerEvent 的时间戳。
const touchTime = event => 'nativeTouchTime' in event ? event.nativeTouchTime : event.timeStamp;
var ME = class {
    el;
    ult;
    run = null;
    // 触摸事件入队，每个逻辑 tick 取样并应用死区。
    stickCfg = gameStick;
    stickSampler = new StickSampler(this.stickCfg);
    stickFilter = new StickFilter(this.stickCfg);
    stickEngaged = !1; // 摇杆还有没走完的输入：按住中，或松手后仍在减速
    stickDriving = !1; // 本 tick 的移动是否由触摸摇杆驱动（按住或减速中）
    stick;
    knob;
    act;
    actText = ``;
    stickId = -1;
    sx = 0;
    sy = 0;
    looks = new Map();
    pinch = 0;
    shown = !1;
    touches = 0;
    lastType = ``;
    btnIds = new Set();
    fixed = !1;
    centeredStick = !1;
    swipeMove = !1;
    swipeActive = !1;
    k = 1;
    setScale(e) {
      ((this.k = Math.max(0.7, Math.min(1.5, e || 1))), this.el.style.setProperty(`--tcs`, String(this.k)));
    }
    off;
    constructor(e) {
      ((this.knob = X(`i`)),
        (this.stick = X(`div`, { class: `tc-stick` }, this.knob)),
        (this.ult = X(
          `div`,
          { class: `ult tc-btn tc-ultb` },
          X(`div`, { class: `ult-ring` }),
          X(`div`, { class: `ult-core` }),
          X(`kbd`, {}, `R`),
          X(`div`, { class: `ult-nm` }),
        )),
        (this.act = X(`div`, { class: `tc-btn tc-act`, style: { display: `none` } }, X(`i`), X(`span`))));
      const pause = X(`div`, {class:`tc-btn tc-sm tc-pause`, title:c(`Pausa`)}, Z(`pause`, 26));
      this.el = X(`div`, {class:`tc`}, this.stick, this.act, this.ult, pause);
      (
        this.key(this.ult, `KeyR`),
        this.key(this.act, `KeyE`),
        this.key(pause, `Escape`),
        this.el.addEventListener(`pointerdown`, this.down),
        this.el.addEventListener(`pointermove`, this.move),
        this.el.addEventListener(`pointerup`, this.up),
        this.el.addEventListener(`pointercancel`, this.up),
        this.el.addEventListener(`lostpointercapture`, this.up),
        this.el.addEventListener(`contextmenu`, (e) => e.preventDefault()));
      let a = (e) => {
        e.cancelable && e.preventDefault();
      };
      (this.el.addEventListener(`touchstart`, a, { passive: !1 }),
        this.el.addEventListener(`touchmove`, a, { passive: !1 }));
      let o = (e) => {
        (e.pointerId === this.stickId || this.looks.has(e.pointerId) || e.pointerId === this.mapTap?.id) &&
          this.up(e);
      };
      const listeners = [];
      const listen = (target,type,handler,options) => {
        target.addEventListener(type,handler,options);
        listeners.push(() => target.removeEventListener(type,handler,options));
      };
      listen(window,'pointerup',o,true);
      listen(window,'pointercancel',o,true);
      let s = (e) => {
        e.touches.length
          ? this.looks.size + +(this.stickId >= 0) > e.touches.length &&
            (this.looks.clear(), (this.pinch = 0))
          : (this.releaseStick(false, touchTime(e)), this.looks.clear(), (this.pinch = 0));
      };
      listen(window,'touchend',s,true);
      listen(window,'touchcancel',s,true);
      let l = (e) => {
        this.touches = e.touches.length;
      };
      for (let e of [`touchstart`, `touchmove`, `touchend`, `touchcancel`])
        listen(window,e,l,{capture:true,passive:true});
      listen(window,'blur',() => {
        (this.letGo(), this.show(!1));
      });
      listen(window,'pagehide',() => this.letGo());
      listen(window,'resize',() => this.letGo());
      listen(document,'visibilitychange',() => {if(document.hidden)this.show(false);});
      e.append(this.el);
      this.off = () => {for(const remove of listeners)remove();};
    }
    button(e, t, n) {
      if(!e)return;
      e.addEventListener(`pointerdown`, (n) => {
        (n.stopPropagation(),
          n.preventDefault(),
          jE(e, n.pointerId),
          (this.lastType = n.pointerType),
          this.btnIds.add(n.pointerId),
          e.classList.add(`on`),
          t());
      });
      let r = (t) => {
        (this.btnIds.delete(t.pointerId), e.classList.contains(`on`) && (e.classList.remove(`on`), n?.()));
      };
      (e.addEventListener(`pointerup`, r),
        e.addEventListener(`pointercancel`, r),
        e.addEventListener(`lostpointercapture`, r));
    }
    key(e, t) {
      this.button(
        e,
        () => this.run?.input.touchKey(t, !0),
        () => this.run?.input.touchKey(t, !1),
      );
    }
    mapTap = null;
    down = (e) => {
      if (!this.run || this.run.state !== `play` || this.run.player.dead || document.hidden) return;
      if (
        (e.preventDefault(),
        jE(this.el, e.pointerId),
        (this.lastType = e.pointerType),
        e.pointerType === `touch` && this.touches === 0)
      ) {
        this.stickId >= 0 && this.releaseStick(false, touchTime(e));
        for (let t of [...this.looks.keys()]) t !== e.pointerId && this.looks.delete(t);
        this.pinch = 0;
      }
      let t = !window.castHidesUI?.(this.run) && document.querySelector(`.minimap`);
      if (t && !this.mapTap && t.offsetWidth) {
        let n = t.getBoundingClientRect();
        if (
          e.clientX >= n.left - 8 &&
          e.clientX <= n.right + 8 &&
          e.clientY >= n.top - 8 &&
          e.clientY <= n.bottom + 8
        ) {
          this.mapTap = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
          return;
        }
      }
      const stickBounds=this.centeredStick?this.stick.getBoundingClientRect():null;
      const inStick=this.floatingStick|| (stickBounds
        ? Math.hypot(e.clientX-stickBounds.left-stickBounds.width/2,e.clientY-stickBounds.top-stickBounds.height/2)<=stickBounds.width*.6
        : e.clientX < innerWidth * 0.42);
      if(this.swipeMove && !(this.centeredStick && inStick)){
        if(this.stickId < 0){
          this.swipeActive=true;this.stickId=e.pointerId;this.sx=e.clientX;this.sy=e.clientY;
          this.stickBegin(e);
        }
        return;
      }
      if (this.stickId < 0 && inStick) {
        this.swipeActive=false;
        this.run.autoRun=false;
        this.stickBegin(e);
        if (((this.stickId = e.pointerId), this.fixed)) {
          let t = this.stick.getBoundingClientRect();
          ((this.sx = t.left + t.width / 2),
            (this.sy = t.top + t.height / 2),
            this.stick.classList.add(`on`, `fixed`),
            this.move(e));
          return;
        }
        ((this.sx = e.clientX),
          (this.sy = e.clientY),
          this.stick.classList.add(`on`),
          (this.stick.style.left = this.sx + `px`),
          (this.stick.style.top = this.sy + `px`),
          (this.stick.style.bottom = `auto`),
          (this.knob.style.transform = ``));
        return;
      }
      if(this.run.terrain?.zxPaper)return;
      let n = performance.now();
      (this.looks.set(e.pointerId, { x: e.clientX, y: e.clientY, t: n, t0: n }),
        (this.pinch = this.looks.size === 2 ? this.spread() : 0));
    };
    move = (e) => {
      let t = this.run?.input;
      if (!t || e.pointerId === this.mapTap?.id || this.btnIds.has(e.pointerId)) return;
      if(this.run.state !== `play` || this.run.player.dead || document.hidden){this.releaseStick(!0);return;}
      if(this.swipeActive){
        if(e.pointerId !== this.stickId)return;
        const dx=e.clientX-this.sx,dy=e.clientY-this.sy,distance=Math.hypot(dx,dy);
        // Follow each deliberate swipe, so turning never requires returning to
        // an invisible joystick origin. Keep the heading while the finger rests.
        if(distance < 4)return;
        if(this.stickSampler.pushVector(e.pointerId,dx/distance,-dy/distance,touchTime(e))){
          this.sx=e.clientX;this.sy=e.clientY;
        }
        return;
      }
      if (e.pointerId === this.stickId) {
        if(this.centeredStick){
          const bounds=this.stick.getBoundingClientRect();
          this.sx=bounds.left+bounds.width/2;this.sy=bounds.top+bounds.height/2;
        }
        let n = e.clientX - this.sx,
          r = e.clientY - this.sy,
          i = Math.hypot(n, r);
        // 尺寸在一次手势内稳定。缩放或屏幕旋转会重置手势。
        const radius=this.dragRadius ??= this.centeredStick||this.floatingStick
          ? Math.max(8,(this.stick.getBoundingClientRect().width-this.knob.getBoundingClientRect().width)/2-8)
          : TE*this.k;
        const reach=TE*this.k*DE;
        if (i > reach && !this.floatingStick && !this.fixed && !this.centeredStick) {
          let e = (i - reach) / i;
          ((this.sx += n * e),
            (this.sy += r * e),
            (n -= n * e),
            (r -= r * e),
            (i = reach),
            (this.stick.style.left = this.sx + `px`),
            (this.stick.style.top = this.sy + `px`));
        }
        if (this.floatingStick) {
          // Filter a few pixels of cross-axis jitter. Keep the band narrow
          // on long drags so the heading follows the thumb around a circle.
          const vertical = Math.abs(r) > Math.abs(n);
          const major = Math.abs(vertical ? r : n), minor = Math.abs(vertical ? n : r);
          const tolerance = Math.min(4, major * 0.45);
          const blend = Math.min(1, Math.max(0, (minor - tolerance) / Math.max(1, tolerance)));
          if (vertical) n *= blend;
          else r *= blend;
        }
        const length = Math.hypot(n, r) || 1;
        const dx = n / length, dy = r / length;
        const strength = Math.min(1, i / radius);
        if (!this.stickSampler.pushVector(e.pointerId, strength * dx, -strength * dy, touchTime(e))) return;
        const knobTravel = Math.min(i, radius);
        this.knob.style.transform = `translate(${dx * knobTravel}px, ${dy * knobTravel}px)`;
        return;
      }
      if(this.run.terrain?.zxPaper)return;
      let n = this.looks.get(e.pointerId);
      if (!n) {
        if (e.pointerType === `mouse`) return;
        ((n = { x: e.clientX, y: e.clientY, t: 0, t0: 0 }), this.looks.set(e.pointerId, n));
      }
      let r = performance.now(),
        i = [...this.looks.entries()].filter(([t]) => t !== e.pointerId).map(([, e]) => e);
      if (i.length && i.every((e) => r - e.t < OE || Math.abs(e.t0 - n.t0) < kE)) {
        ((n.x = e.clientX), (n.y = e.clientY), (n.t = r));
        let i = this.spread();
        (this.pinch && t.zoom((this.pinch - i) / 55), (this.pinch = i));
      } else
        ((this.pinch = 0),
          t.look((e.clientX - n.x) * AE, (e.clientY - n.y) * AE),
          (n.x = e.clientX),
          (n.y = e.clientY),
          (n.t = r));
    };
    up = (e) => {
      let t = this.mapTap;
      t && e.pointerId === t.id
        ? ((this.mapTap = null),
          e.type === `pointerup` &&
            Math.hypot(e.clientX - t.x, e.clientY - t.y) < 16 &&
            performance.now() - t.t < 700 &&
            this.run?.openMap())
        : e.pointerId === this.stickId
          ? this.releaseStick(false, touchTime(e))
          : this.looks.delete(e.pointerId) && (this.pinch = 0);
    };
    spread() {
      let [e, t] = [...this.looks.values()];
      return t ? Math.hypot(e.x - t.x, e.y - t.y) : 0;
    }
    // 松手/滑动中断：只入队一个“抬起”样本，由 driveStick 平滑减速到停。
    // hard=true（暂停、死亡、切后台、隐藏控件）才立刻清零，避免回来时旧方向还在走。
    releaseStick(hard, stamp) {
      ((this.stickId = -1),
        (this.swipeActive = !1),
        this.stick.classList.remove(`on`, `fixed`),
        (this.stick.style.left = this.stick.style.top = this.stick.style.bottom = ``),
        (this.knob.style.transform = ``));
      hard === !0 ? this.stickStop() : this.stickSampler.end(undefined, stamp);
    }
    // 按下：绑定手指，方向从 0 开始（手指没动就不该走）。
    stickBegin(e) {
      this.dragRadius = undefined;
      const stamp = touchTime(e);
      this.stickSampler.end(undefined, stamp);
      this.stickSampler.begin(e.pointerId, 0, 0, stamp);
      this.stickEngaged = !0;
    }
    stickStop() {
      if (this.stickDriving && this.run) {
        this.run.player.vel.x = this.run.player.vel.z = 0;
        this.run.coop?.recordStick(0, 0, false, performance.now(), true);
      }
      this.stickSampler.abort();
      this.stickFilter.reset();
      this.stickEngaged = this.stickDriving = !1;
      this.run && ((this.run.input.stickX = 0), (this.run.input.stickY = 0));
    }
    // 每个逻辑 tick 调一次（Run.simulate 开头），dt = 本 tick 时长（秒）。
    // 读取截至 sampleMs 的最新采样，联机快照仍使用固定步时刻 stepMs。
    // 摇杆没参与时什么都不写，手柄/键盘的输入不会被覆盖。
    driveStick(input, dt, stepMs, sampleMs = stepMs) {
      if (!this.stickEngaged) return;
      const raw = this.stickSampler.consume(sampleMs);
      const out = this.stickFilter.update(raw, dt);
      input.stickX = out.x;
      input.stickY = out.y;
      const velocity = this.run.player.vel;
      this.stickDriving = raw.held || out.mag > 0 || (this.stickDriving && (velocity.x !== 0 || velocity.z !== 0));
      this.run.coop?.recordStick(out.x, out.y, raw.held, stepMs);
      // 松手后减速走完：交还控制权（上面已经写过一次 0）。
      if (!this.stickDriving && this.stickSampler.cursor === this.stickSampler.queue.length) {
        this.stickEngaged = false;
        this.stickFilter.reset();
      }
    }
    show(e) {
      e !== this.shown && ((this.shown = e), this.el.classList.toggle(`on`, e), !e && this.letGo());
    }
    letGo() {
      for (let e of [this.stickId, ...this.looks.keys()])
        if (e >= 0)
          try {
            this.el.releasePointerCapture(e);
          } catch {}
      (this.releaseStick(!0), this.looks.clear(), this.btnIds.clear(), (this.pinch = 0), (this.mapTap = null));
      for (let e of this.el.querySelectorAll(`.tc-btn.on`)) e.classList.remove(`on`);
      let e = this.run?.input;
      if (e) for (let t of [`Space`, `ShiftLeft`, `KeyR`, `KeyE`, `Escape`, `KeyQ`]) e.touchKey(t, !1);
    }
    update(e, t) {
      if (((this.run = e), this.show(uo && !Da && e.state === `play` && !e.player.dead), !this.shown)) return;
      (this.touches === 0 &&
          this.lastType === `touch` &&
          (this.stickId >= 0 || this.looks.size || this.el.querySelector(`.tc-btn.on`)) &&
          this.letGo());
      let r = t ? t.replace(/^\[E\] /, ``) : ``;
      r !== this.actText &&
        ((this.actText = r),
        (this.act.style.display = r ? `` : `none`),
        this.act.setAttribute('aria-label', r),
        (this.act.lastChild.textContent = r),
        $(this.act.firstChild).append(
          r.includes(c(`Poké Ball`)) || r.startsWith(c(`Capturar`)) ? Q(`poke-ball`) : X(`b`, {}, `E`),
        ));
      this.el.classList.toggle(`locking`, e.lockTarget >= 0);
    }
    destroy() {
      (this.off(), this.show(!1), this.el.remove(), this.run=null);
    }
  };

export {
  ME as TouchControls
};

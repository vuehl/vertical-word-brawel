// Keep deadlines on the selected cadence. Resetting to now + gap on every
// callback turns small alternating delays into unnecessary skipped frames.
export class FramePacer {
  next=0;
  gap=0;
  nativeCadence=false;
  constructor(setFrameRate){this.setFrameRate=setFrameRate;}
  reset(){this.next=0;this.gap=0;this.nativeCadence=false;}
  ready(now,gap,force=false){
    if(!gap){this.reset();return true;}
    if(this.setFrameRate&&this.gap!==gap){
      const fps=Math.round(1000/gap);
      this.nativeCadence=false;
      if(fps>=1&&fps<=60){
        try{this.setFrameRate(fps);this.nativeCadence=true;}catch{}
      }
    }
    // WeChat already paces the callback. Accept its normal jitter, but keep
    // the deadline so a host that ignores 30 FPS cannot render at 60.
    const tolerance=this.nativeCadence?gap*.4:Math.min(2,gap*.12);
    if(this.gap!==gap||!this.next||now<this.next-gap-tolerance){
      this.gap=gap;this.next=now+gap;return true;
    }
    if(now<this.next-tolerance){
      if(!force)return false;
      // Resize/transition draws must never build up a future deadline.
      this.next=now+gap;return true;
    }
    // A long stall starts a fresh interval; don't emit catch-up frames a
    // millisecond apart (including floating-point drift near a deadline).
    this.next=now-this.next>=gap?now+gap:this.next+gap;
    return true;
  }
}

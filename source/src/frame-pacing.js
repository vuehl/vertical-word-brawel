// Keep deadlines on the selected cadence. Resetting to now + gap on every
// callback turns small alternating delays into unnecessary skipped frames.
export class FramePacer {
  next=0;
  gap=0;
  reset(){this.next=0;this.gap=0;}
  ready(now,gap,force=false){
    if(!gap){this.reset();return true;}
    const tolerance=Math.min(2,gap*.12);
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

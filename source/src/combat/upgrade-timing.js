// Presentation time advances only during play. Keep the ultimate's actual
// simulation running until its last hit, then leave a short quiet tail.
export class UpgradeTiming {
  minimum=0;
  tail=0;
  beginUltimate(){this.minimum=1.5;this.tail=.2;}
  update(dt,ultimate,playing){
    if(!playing)return;
    this.minimum=Math.max(0,this.minimum-dt);
    if(ultimate.active>0||ultimate.castPending)this.tail=.2;
    else this.tail=Math.max(0,this.tail-dt);
  }
  waiting(ultimate){return this.minimum>0||this.tail>0||ultimate.active>0||ultimate.castPending;}
  clear(){this.minimum=this.tail=0;}
}

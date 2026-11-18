import {bossDistanceText,drawBattleHealth,friendColor} from './paper-hud-art.js';

// Use one movable texture per label/bar. A moving teammate only changes its
// screen coordinates; it does not force the entire portrait HUD to be painted.
export function createPeerHud(run,node,el) {
  const views=new Map();
  for(const peer of run.coop.peers.values()){
    const index=views.size;
    const tile=(name,width,height,attrs={})=>{
      const canvas=el('canvas','zx-peer-'+name,[],{width:2*width,height:2*height,'data-static':'true','data-ui-layer':'peer-'+name+'-'+index,...attrs});
      canvas.hidden=true;node.append(canvas);return canvas;
    };
    views.set(peer.id,{bar:tile('health',88,20,{role:'progressbar','aria-label':peer.name+' · 生命','aria-valuemin':0}),tag:tile('tag',100,26)});
  }
  run.ui.portraitPeerHud=true;
  const move=(canvas,x,y)=>{
    const transform='translate('+Math.round(x)+'px, '+Math.round(y)+'px)';
    if(canvas.style.transform!==transform)canvas.style.transform=transform;
  };
  return ()=>{
    let previousX,previousY;
    const now=performance.now();
    for(const view of views.values())view.seen=false;
    for(const peer of run.coop.visiblePeers()){
      const view=views.get(peer.id),{bar,tag}=view;
      const foot=run.ui.project(run,peer.x,peer.y-.15,peer.z);
      const head=run.ui.project(run,peer.x,peer.y+2.4,peer.z);
      const w=innerWidth,h=innerHeight, on=head.vis && head.x>50 && head.x<w-50 && head.y>35 && head.y<h-35;
      view.seen=true;
      if(tag.hidden)tag.hidden=false;
      const showHP=foot.vis&&foot.x>=0&&foot.x<=w&&foot.y>=0&&foot.y<h-10&&peer.last.hpNow>0;
      if(bar.hidden===showHP)bar.hidden=!showHP;
      if(showHP){
        move(bar,foot.x-44,foot.y+10);
        const current=Math.ceil(peer.last.hpNow),maximum=Math.max(1,Math.round(peer.last.maxHp));
        const fraction=Math.round(peer.last.hp*1000)/1000,bonus=peer.last.bonus;
        const key=[current,maximum,fraction,bonus].join('/');
        if(view.hp!==key){
          drawBattleHealth(bar,fraction,current,bonus);
          bar.setAttribute('aria-valuenow',current);bar.setAttribute('aria-valuemax',maximum);
          bar.setAttribute('aria-label',peer.name+' · 生命 '+current+' / '+maximum+(bonus?'，护盾与额外生命 '+bonus:''));
          bar.dataset.frame=key;view.hp=key;
        }
      }
      let x=head.x,y=head.y-15,arrow='';
      if(!on){
        const sign=head.vis?1:-1,dx=(head.x-w/2)*sign,dy=(head.y-h/2)*sign,a=Math.atan2(dy,dx);
        const r=Math.min(w,h)*.4;
        x=Math.max(51,Math.min(w-51,w/2+r*Math.cos(a)));y=h/2+r*Math.sin(a);
        arrow=['→','↘','↓','↙','←','↖','↑','↗'][(Math.round(a/(Math.PI/4))+8)%8];
      }
      if(Math.abs(x-previousX)<100 && Math.abs(y-previousY)<22)
        y=previousY>40?previousY-23:previousY+23;
      previousX=x;previousY=y;move(tag,x-50,y-13);
      // Position is frame-synchronous; the small text texture only needs
      // refreshing ten times per second, or when the edge arrow turns.
      if(view.arrow===arrow && now<view.nextLabel)continue;
      view.arrow=arrow;view.nextLabel=now+100;
      const label=(arrow?arrow+' ':'')+'友 · '+bossDistanceText(Math.hypot(peer.x-run.player.pos.x,peer.z-run.player.pos.z));
      if(view.label!==label){
        const c=tag.getContext('2d');c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,100,26);
        c.font='bold 13px sans-serif';c.textAlign='center';c.textBaseline='middle';
        c.lineJoin='round';c.lineWidth=3;c.strokeStyle='#fffdf6';c.strokeText(label,50,13,98);
        c.fillStyle=friendColor(peer.slot);c.fillText(label,50,13,98);
        tag.setAttribute('aria-label',peer.name+' · '+label);tag.dataset.frame=label;view.label=label;
      }
    }
    for(const {seen,tag,bar} of views.values())if(!seen){if(!tag.hidden)tag.hidden=true;if(!bar.hidden)bar.hidden=true;}
  };
}

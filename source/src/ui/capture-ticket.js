// Printed capture tag. Coordinates are logical HUD pixels.
export function createCaptureTicket(portrait, word, { friend, shiny, master }) {
  const tag = document.createElement('div');
  tag.className = 'zx-catch-track';
  tag.setAttribute('role', 'status');
  tag.setAttribute('aria-live', 'polite');
  tag.dataset.word = word;

  const trait = [shiny && '异色', master && !friend && '宝葫芦'].filter(Boolean).join(' · ');
  const extra = Math.max(0, trait.length - 2) * 9;
  const width = 185 + extra;
  const height = 57;
  const canvas = document.createElement('canvas');
  canvas.className = 'zx-catch-art';
  canvas.dataset.static = 'true';
  canvas.dataset.glyph = portrait.dataset.glyph;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = width * 2;
  canvas.height = height * 2;
  tag.style.width = canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  tag.append(canvas);

  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  function fillShape(color, points) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  }

  function paint(phase, step) {
    const title = phase === 'progress' ? (friend ? '招募伙伴' : '抓字中')
      : (friend ? '招募' : '抓字') + (phase === 'success' ? '成功' : '失败');
    tag.dataset.phase = phase;
    tag.dataset.step = String(step);
    const label = [word, title];
    if (trait) label.push(trait);
    if (phase === 'progress') label.push(step + '/3');
    tag.setAttribute('aria-label', label.join(' · '));

    ctx.clearRect(0, 0, width, height);
    fillShape('#302832', [[4,11],[158+extra,2],[176+extra,15],[178+extra,37],[165+extra,48],[7,56]]);
    fillShape('#F6C748', [[2,8],[157+extra,1],[175+extra,13],[177+extra,34],[163+extra,44],[4,52]]);
    fillShape('#DD9E2E', [[4,43],[162+extra,35],[176+extra,25],[177+extra,34],[163+extra,44],[4,52]]);
    ctx.beginPath();
    ctx.moveTo(10,13);ctx.lineTo(trait ? 124 : 152,trait ? 7.4 : 6);
    ctx.lineWidth = 1.3;ctx.strokeStyle = '#FFF2B3';ctx.stroke();

    ctx.save();
    ctx.translate(85,27);ctx.rotate(-Math.PI/60);ctx.translate(-85,-27);
    ctx.fillStyle = '#997226';
    for (let y=10; y<43; y+=5) ctx.fillRect(46,y,.8,2);
    ctx.drawImage(portrait,8,9,35,35);
    ctx.textAlign = 'left';ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#28232B';ctx.font = 'bold 19px "Ziling Swei",sans-serif';
    ctx.fillText(title,55,30);
    ctx.fillStyle = '#563F18';ctx.font = 'bold 9px "Ziling Swei",sans-serif';
    if (trait) ctx.fillText(trait,134,18);
    for (let i=0; i<3; i++) {
      const x=55+i*29;
      fillShape(i<step?'#3C3030':'#BE9132', [[x,35],[x+25,35],[x+22,39],[x-3,39]]);
    }
    ctx.restore();

    const eyelet = 162 + extra;
    ctx.beginPath();ctx.arc(eyelet,22,4.5,0,2*Math.PI);ctx.fillStyle='#956324';ctx.fill();
    ctx.beginPath();ctx.arc(eyelet,22,2.9,0,2*Math.PI);ctx.fillStyle='#302832';ctx.fill();
    ctx.save();
    ctx.translate(extra,0);
    ctx.lineWidth=2.3;ctx.lineCap='round';ctx.strokeStyle='#3B3030';
    ctx.beginPath();ctx.moveTo(163,22);ctx.quadraticCurveTo(169,19,175,18.5);
    ctx.quadraticCurveTo(186,17.5,183,22.6);ctx.quadraticCurveTo(181.5,24.6,176.8,23.4);
    ctx.stroke();ctx.restore();
    window.invalidateUI?.();
  }
  paint('progress',0);
  return {
    element: tag,
    progress(step) {
      if (tag.dataset.phase === 'progress') paint('progress', Math.max(0,Math.min(3,step)));
    },
    result(success) {
      paint(success ? 'success' : 'failure', success ? 3 : Number(tag.dataset.step));
    },
  };
}

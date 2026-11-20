// The GLB ships a standalone five-minute demo. Bind its screen to the zone
// clock for both clients, retaining the two extracted modules byte-for-byte.
export function bindPortalZoneClock(source) {
  const bindings = [
    ['function screenPainter(canvas)', 'function screenPainter(canvas, duration)'],
    ['325*n/300', '325*n/duration'],
    ['screenPainter(factory(704,318))', 'screenPainter(factory(704,318), options.durationSeconds)'],
    ['keys=[300,0]', 'keys=[null,0]'],
    ['phase===0&&key===300', 'phase===0&&key===300&&options.durationSeconds===300'],
    ['Math.ceil(seconds):300,0,300', 'Math.ceil(seconds):options.durationSeconds,0,options.durationSeconds'],
    ['function update(camera,elapsedSeconds,viewportPx)', 'function update(camera,elapsedSeconds,remainingSeconds,viewportPx)'],
    ['remaining-Math.floor((now-epoch)/1000)', 'remainingSeconds'],
  ];
  for (const [original, replacement] of bindings) {
    if (!source.includes(original)) throw Error('PortalDock clock binding changed: ' + original);
    source = source.replace(original, replacement);
  }
  return source;
}

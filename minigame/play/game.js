const setup = require('./host.js');

async function run(environment) {
  const runtime = {environment, modules: Object.create(null)};
  return require('./gameplay.js')(runtime).start();
}

const box = GameGlobal.pokebonkPlayEntry || (GameGlobal.pokebonkPlayEntry = {});
box.api={setup,run};
if (box.receive) {
  box.receive(box.api);
  delete box.receive;
}

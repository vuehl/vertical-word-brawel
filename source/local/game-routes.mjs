import {constrainLiteProfile, validLiteRun, isLiteSpecies, SINGLE_STAGE, runRecordKey} from '../src/data/lite-rules.js';
import { applyAction as applyProfileAction, refreshTasks, rerollTask, settleRun } from './progression.mjs';
import { Zn as medalFor, cn as bagItems } from '../src/data/config.js';
import crypto from 'node:crypto';
import {
  now, newProfile, newAccount,
  SEASON, EVENTS, seasonPayload,
} from '../firebase/shared.mjs';

function json(response, status, data) {
  response.status = status;
  response.data = data;
}

function body(request) {
  return request.bodyText ? JSON.parse(request.bodyText) : undefined;
}

function accountByToken(req) {
  const auth = req.headers.authorization || '';
  const t = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!t) return null;
  return Object.values(req.store.accounts).find((a) => a.token === t) || null;
}

function accountByName(request, name) {
  const normalized = String(name || '').toLowerCase();
  return Object.values(request.store.accounts).find(account => account.name.toLowerCase() === normalized);
}

const routes = [];
const route = (method, pattern, handler) => routes.push({ method, pattern, handler });

// --- status / meta
route('GET', '/status', () => ({
  maintenance: { on: false, title: '', message: '', eta: 0 },
  bypass: false, season: seasonPayload(), events: EVENTS,
  registration: { inviteOnly: false },
}));

// --- auth
route('POST', '/auth/guest', async (req, res) => {
  const acc = newAccount(`Guest ${crypto.randomBytes(2).toString('hex').toUpperCase()}`, true);
  req.store.accounts[acc.id] = acc;
  req.dirty = true;
  json(res, 200, { id: acc.id, name: acc.name, token: acc.token, guest: true });
});

route('GET', '/auth/me', (req, res) => {
  const acc = accountByToken(req);
  if (!acc) return json(res, 401, { error: 'Invalid session.' });
  acc.lastSeen = now();
  json(res, 200, { id: acc.id, name: acc.name, guest: acc.guest, created: acc.created });
});

const requireAccount = (req, res) => {
  const acc = accountByToken(req);
  if (!acc) json(res, 401, { error: 'Invalid session.' });
  return acc;
};

route('GET', '/profile', (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  refreshTasks(acc.profile, now());
  json(res, 200, { profile: acc.profile, now: now() });
});

route('PUT', '/profile/prefs', async (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  const b = body(req) || {};
  const p = acc.profile;
  if (b.settings && typeof b.settings === 'object') p.settings = { ...p.settings, ...b.settings };
  if (b.firstJourneyPlayed === true) p.firstJourneyPlayed = true;
  for (const k of ['lastSpecies', 'lastBiome', 'avatar', 'frame', 'title', 'skins', 'team', 'collection']) {
    if (b[k] !== undefined) p[k] = b[k];
  }
  req.dirty = true;
  json(res, 204, undefined);
});

route('POST', '/profile/starter', async (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  const b = body(req) || {};
  const p = acc.profile;
  const id = Number(b.id);
  if(p.starter && p.starter !== id)return json(res,409,{error:'Starter already chosen.'});
  if (!isLiteSpecies(id)) return json(res, 400, { error: 'Invalid starter.' });
  p.starter = id;
  p.lastSpecies = id;
  if (!p.league.includes(id)) p.league.push(id);
  if (!p.unlocked.includes(id)) p.unlocked.push(id);
  req.dirty = true;
  json(res, 200, { profile: p });
});

route('POST', '/lab/buy', async (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  const b = body(req) || {};
  const p = acc.profile;
  if (!applyProfileAction(p, { k: 'lab', id: b.id, lv: b.lv }))
    return json(res, 409, {error:'星尘或研究等级已变化，请刷新后重试'});
  req.dirty = true;
  json(res, 200, { profile: p });
});

route('POST', '/items/buy', async (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  const b = body(req) || {};
  const p = acc.profile;
  applyProfileAction(p, { k: 'item', key: b.key });
  req.dirty = true;
  json(res, 200, { profile: p });
});

route('POST', '/items/archive', async (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  const b = body(req) || {};
  const p = acc.profile;
  applyProfileAction(p, { k: 'archive', key: b.key, off: b.off });
  req.dirty = true;
  json(res, 200, { profile: p });
});

route('POST', '/quests/claim', async (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  const b = body(req) || {};
  const p = acc.profile;
  applyProfileAction(p, { k: 'quest', id: b.id });
  req.dirty = true;
  json(res, 200, { profile: p });
});

route('POST', '/tasks/claim', async (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  const b = body(req) || {};
  const p = acc.profile;
  applyProfileAction(p, { k: 'task', period: b.period, slot: b.slot });
  req.dirty = true;
  json(res, 200, { profile: p });
});

// Batched profile mutations. The 0.8.29 client always has `backend.actions`, so
// lab/item/archive/quest/task go through here and never call the routes above.
route('POST', '/profile/actions', async (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  const b = body(req) || {};
  const list = Array.isArray(b.actions) ? b.actions.slice(0, 64) : [];
  let applied = 0;
  for (const a of list) if (applyProfileAction(acc.profile, a)) applied++;
  req.dirty = true;
  json(res, 200, { profile: acc.profile, applied });
});

route('POST', '/tasks/reroll', async (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  const b=body(req)||{};
  rerollTask(acc.profile,b.period,b.slot,now());
  req.dirty = true;
  json(res, 200, { profile: acc.profile });
});

route('GET', '/records', (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  json(res, 200, []);
});
route('GET', '/records/endless', (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  json(res, 200, []);
});

// --- players
route('GET', '/players', (req, res, url) => {
  const id = url.searchParams.get('id');
  const name = url.searchParams.get('name');
  const acc = id ? req.store.accounts[id] : accountByName(req, name);
  if (!acc) return json(res, 404, { error: 'Player not found.' });
  json(res, 200, {
    id: acc.id, name: acc.name, created: acc.created,
    species: acc.profile.lastSpecies, avatar: acc.profile.avatar,
    frame: acc.profile.frame, title: acc.profile.title, skins: acc.profile.skins,
    league: acc.profile.league, kills: {}, records: [], runs: [],
  });
});
// `/players/search` (name search, excluding yourself) is registered by the shared
// social route table below, so both backends answer identically.
route('POST', '/players/:id/report', (req, res) => json(res, 204, undefined));

// --- runs
route('POST', '/runs', async (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  const b = body(req) || {};
  if(!validLiteRun(b))return json(res,400,{error:'Invalid Forest Lite run configuration.'});
  if(b.party){
    const prior=Object.values(req.store.runs).find(r=>r.account===acc.id && r.cfg.party===b.party && r.seed===b.coopSeed && !r.finished);
    if(prior)return json(res,200,{id:prior.id,seed:prior.seed,party:b.party,ranked:true,boosts:[]});
  }
  const id = `run-${req.store.nextRun++}`;
  // Co-op: the seed belongs to the party so every member builds the same world.
  const seed = b.party ? b.coopSeed : (b.seed ?? crypto.randomInt(1, 2 ** 31));
  const boosts=[...new Set(Array.isArray(b.boosts)?b.boosts:[])].filter(k=>bagItems.some(item=>item.id===k)&&(acc.profile.bag[k]??0)>0);
  for(const k of boosts){acc.profile.bag[k]--;if(!acc.profile.bag[k])delete acc.profile.bag[k];}
  req.store.runs[id] = { id, account: acc.id, cfg: b, seed, started: now() };
  req.dirty = true;
  json(res, 200, { id, seed, party: b.party ?? null, ranked: true, boosts });
});

route('GET', '/runs/:id/build', (req, res, url, params) => {
  const run = req.store.runs[params.id];
  if (!run) return json(res, 404, { error: 'Run not found.' });
  json(res, 200, { run: run.cfg, seed: run.seed });
});

route('POST', '/runs/:id/checkpoint', async (req, res, url, params) => {
  const run = req.store.runs[params.id];
  if (!run) return json(res, 404, { error: 'Run not found.' });
  const b = body(req) || {};
  run.cps = (run.cps || []).concat(b.cps || []).slice(-600);
  json(res, 204, undefined);
});

route('POST', '/runs/:id/finish', async (req, res, url, params) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  const b = body(req) || {};
  const result = b.result || {};
  const p = acc.profile;
  const run = req.store.runs[params.id];
  if (!run || run.account !== acc.id) return json(res,404,{error:'Run not found.'});
  if(run.response)return json(res,200,{...run.response,profile:p});
  if(!validLiteRun(result) || result.species!==run.cfg.species || result.biome!==run.cfg.biome || (result.tier??0)!==(run.cfg.tier??0) ||
    (result.mode===SINGLE_STAGE)!==(run.cfg.mode===SINGLE_STAGE))return json(res,400,{error:'Result does not match this forest run.'});
  if ((result.coop?.party ?? null) !== (run.cfg.party ?? null))
    return json(res,400,{error:'合作对局与房间不匹配'});
  run.finished=now();
  const recordKey=runRecordKey(result);
  const prevKills=p.kills[recordKey]??null;
  const prevBest=p.times[recordKey]?.time??null;
  const medal=(!result.mode||['standard','classic'].includes(result.mode)) ? medalFor(result.biome,result.tier??0,result.time,!!result.victory) : 0;
  p.medals[recordKey]=Math.max(p.medals[recordKey]??0,medal);

  const entry = {
    ...result, id: params.id, date: now(), season: SEASON.n,
    score: result.kills || 0, ranked: false, medal,
  };
  p.runs = [entry, ...(p.runs || [])].slice(0, 50);
  const stardust = settleRun(p,result);
  req.dirty = true;

  run.response = {
    record: entry,
    ranked: false,
    guest: !!acc.guest,
    review: false,
    stardust,
    ends: SEASON.end,
    rewards: { stardust },
    kills: null,
    pb: !!result.victory && (prevBest===null || result.time<prevBest),
    prevBest,
    prevKills,
    weekPb: false,
    killsPb: prevKills===null || result.kills>prevKills,
    medal,
    medalDust: 0,
    mon: null,
  };
  req.dirty = true;
  json(res,200,{...run.response,profile:p});
});

route('POST', '/account/reset', async (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  acc.profile = newProfile(acc.name);
  req.dirty = true;
  json(res, 200, { ok: true });
});
route('POST', '/account/delete', (req, res) => {
  const acc = requireAccount(req, res);
  if (!acc) return;
  delete req.store.accounts[acc.id];
  req.dirty = true;
  json(res, 200, { ok: true });
});

function matchRoute(method, pathname) {
  for (const r of routes) {
    if (r.method !== method) continue;
    if (r.pattern === pathname) return { handler: r.handler, params: {} };
    if (!r.pattern.includes(':')) continue;
    const a = r.pattern.split('/');
    const b = pathname.split('/');
    if (a.length !== b.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < a.length; i++) {
      if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
      else if (a[i] !== b[i]) { ok = false; break; }
    }
    if (ok) return { handler: r.handler, params };
  }
  return null;
}

export async function localRoute(store, url, method, headers, bodyText, checkpoint) {
  store.coopParties ??= {};
  if (!checkpoint) {
    for (const account of Object.values(store.accounts)) constrainLiteProfile(account.profile);
  }
  const key = url.pathname.slice(4);
  if (key === '/coop/access') return {response:{status:200, data:{show:false, play:false}}};
  const route = matchRoute(method, key);
  if (!route) return {response:{status:404, data:{error:'Not found.'}}};
  const request = {store, dirty:false, bodyText, headers:{authorization:headers.Authorization || headers.authorization}};
  const response = {status:200, data:undefined};
  const value = await route.handler(request, response, url, route.params);
  if (value !== undefined) response.data = value;
  return {response, dirty:request.dirty};
}

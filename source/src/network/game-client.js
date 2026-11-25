import {savedSeat} from "./coop-resume.js";
import {chineseMessage as t, chineseText as c} from "../data/chinese-text.js";
import {fr as Gt} from "../data/config.js";
import {wO} from "../data/player-profile.js";

var Tk = 0,
  Ek = (e) => {
    Number.isFinite(e) && (Tk = e);
  };
var oL = () => {
    let e = sL.get(`pb.device`);
    if (typeof e != `string` || !/^[\w-]{16,64}$/.test(e)) {
      let t = new Uint8Array(16);
      (crypto.getRandomValues(t),
        (e = Array.from(t, (e) => e.toString(16).padStart(2, `0`)).join(``)),
        sL.set(`pb.device`, e));
    }
    return e;
  },
  sL = {
    get(e) {
      try {
        let t = localStorage.getItem(e);
        return t ? JSON.parse(t) : null;
      } catch {
        return null;
      }
    },
    set(e, t) {
      try {
        localStorage.setItem(e, JSON.stringify(t));
        return true;
      } catch { return false; }
    },
    del(e) {
      try {
        localStorage.removeItem(e);
      } catch {}
    },
  },
  cL = () => crypto.getRandomValues(new Uint32Array(1))[0] >>> 0;
var mL = new Set([400, 404, 409, 410, 413, 422]),
  hL = (e) => {
    let t = e;
    if (t.offline || t.maintenance) return !0;
    let n = t.status ?? 0;
    return n >= 500 || (n >= 400 && !mL.has(n));
  },
  vL = 300,
  yL = class {
    base;
    kind = `http`;
    q = null;
    clockSkew = 0;
    info = null;
    evs = null;
    constructor(e) {
      this.base = e;
    }
    season() {
      return this.info ?? Gt(Date.now());
    }
    events() {
      return this.evs ?? [];
    }
    async req(e, n = `GET`, r, i, a) {
      let o,
        s = new AbortController(),
        l = setTimeout(
          () => s.abort(),
          a?.timeout ?? (e.endsWith(`/finish`) ? 6e4 : n === `GET` ? 15e3 : 3e4),
        );
      try {
        o = await fetch(this.base + e, {
          method: n,
          signal: s.signal,
          ...(a?.keepalive ? { keepalive: !0 } : {}),
          headers: {
            ...(r === void 0 ? {} : { "Content-Type": `application/json` }),
            ...(i ? { Authorization: `Bearer ${i}` } : {}),
            "X-Device": oL(),
            "X-Client": `2`,
          },
          body: r === void 0 ? void 0 : JSON.stringify(r),
        });
      } catch {
        throw Object.assign(Error(c(`No hay conexión con el servidor.`)), { offline: !0 });
      } finally {
        clearTimeout(l);
      }
      if (o.status === 502 || o.status === 504)
        throw Object.assign(Error(c(`No hay conexión con el servidor.`)), { offline: !0 });
      if (!o.ok) {
        let n = `Error ${o.status}`,
          r,
          i = !1,
          a,
          s,
          c = !1;
        try {
          let e = await o.json();
          ((n = e.error ?? n),
            (r = e.maintenance),
            (i = !!e.inviteOnly),
            (a = e.banned),
            (s = e.coop),
            (c = !!e.update));
        } catch {}
        throw (
          Object.assign(Error(t(n)), {
            status: o.status,
            maintenance: r,
            inviteOnly: i,
            banned: a,
            ...(s ? { coop: s } : {}),
          })
        );
      }
      if (o.status !== 204)
        try {
          return await o.json();
        } catch {
          throw Object.assign(Error(c(`No hay conexión con el servidor.`)), { offline: !0 });
        }
    }
    store(e) {
      return (sL.set(`pb.session`, e), e.guest && sL.set(`pb.guest`, e), e);
    }
    async status() {
      let e = await this.req(`/status`);
      return (
        e.season && (this.info = e.season),
        Array.isArray(e.events) && (this.evs = e.events),
        e
      );
    }
    async restore() {
      let e = sL.get(`pb.session`);
      if (!e?.token) return null;
      try {
        let t = await this.req(`/auth/me`, `GET`, void 0, e.token);
        return this.store({ ...t, token: e.token });
      } catch (e) {
        if (e.status !== 401) throw e;
        return (sL.del(`pb.session`), null);
      }
    }
    async guest() {
      let e = sL.get(`pb.guest`);
      if (e?.token) {
        try {
          let t = await this.req(`/auth/me`, `GET`, void 0, e.token);
          if (t.guest) return this.store({ ...t, token: e.token });
        } catch (e) {
          if (e.status !== 401) throw e;
        }
        sL.del(`pb.guest`);
      }
      let t = await this.req(`/auth/guest`, `POST`, {});
      return this.store({ ...t, guest: !0 });
    }
    async loadProfile(e) {
      let t = this.flushPending(e),
        n = await Promise.race([t, new Promise((e) => setTimeout(() => e(-1), 6e3))]);
      n > 0
        ? this.retryLater(e)
        : n < 0 &&
          t.then(
            (t) => {
              t && this.retryLater(e);
            },
            () => {},
          );
      let r = await this.req(`/profile`, `GET`, void 0, e.token);
      return (
        typeof r.now == `number` && ((this.clockSkew = r.now - Date.now()), Ek(this.clockSkew)),
        wO(r.profile)
      );
    }
    async savePrefs(e, t, reportError=false) {
      await this.req(
        `/profile/prefs`,
        `PUT`,
        {
          settings: t.settings,
          lastSpecies: t.lastSpecies,
          lastBiome: t.lastBiome,
          avatar: t.avatar,
          frame: t.frame,
          title: t.title,
          skins: t.skins,
          team: t.team,
          collection: t.collection,
          firstJourneyPlayed: t.firstJourneyPlayed,
        },
        e.token,
      ).catch(error => {if(reportError)throw error;});
    }
    async startRun(e, t) {
      this.q = null;
      let n = cL().toString(36) + Date.now().toString(36);
      for (let r = 0; ; r++)
        try {
          return await this.req(`/runs`, `POST`, { ...t, key: n }, e.token);
        } catch (e) {
          if (!e.offline) throw e;
          if (r >= 2) return { id: ``, seed: cL(), ranked: !1, offline: !0 };
          await new Promise((e) => setTimeout(e, (500 + Math.random() * 1500) * (r + 1)));
        }
    }
    checkpoint(e, t, n) {
      t.id &&
        (this.q?.id !== t.id && (this.q = { id: t.id, cps: [], sending: !1 }),
        this.q.cps.push(n),
        this.flushCps(e, this.q));
    }
    flushCps(e, t) {
      if (t.sending || !t.cps.length) return;
      t.sending = !0;
      let n = t.cps.slice(0, vL);
      this.req(`/runs/${t.id}/checkpoint`, `POST`, { cps: n }, e.token)
        .then(() => {
          (t.cps.splice(0, n.length), (t.sending = !1), this.flushCps(e, t));
        })
        .catch(() => {
          t.sending = !1;
        });
    }
    live = null;
    keepLive(e, t, n) {
      if (!t.id) return;
      this.live = t;
      let r = this.q?.id === t.id ? this.q : null,
        i = sL.get(`pb.live`);
      if (i && i.ticket.id !== t.id && i.acc === e.id) {
        const pending = sL.get('pb.pending') ?? [];
        if (!pending.some(entry => entry.ticket.id === i.ticket.id)) {
          pending.push({...i, rescued:true});
          sL.set('pb.pending', pending.slice(-5));
        }
        this.retryLater(e);
      }
        sL.set(`pb.live`, {
          ticket: t,
          result: { ...n, end: { ...(n.end ?? { hp: 0, swarm: !1 }), how: `rescued` } },
          acc: e.id,
          cps: r ? r.cps.slice(-300) : [],
        });
    }
    async finishRun(e, t, n) {
      if ((sL.del(`pb.live`), (this.live = null), !t.id))
        throw Error(c(`Partida sin conexión: el progreso no se ha guardado.`));
      let r = this.q?.id === t.id ? this.q : null,
        i = sL.get(`pb.pending`) ?? [];
      (i.push({ ticket: t, result: n, acc: e.id, cps: r ? r.cps.slice(-300) : [] }),
        sL.set(`pb.pending`, i.slice(-5)));
      try {
        for (; r && r.cps.length > vL; ) {
          let n = r.cps.slice(0, vL);
          try {
            await this.req(`/runs/${t.id}/checkpoint`, `POST`, { cps: n }, e.token);
          } catch {
            break;
          }
          r.cps.splice(0, n.length);
        }
        let i = await this.req(
          `/runs/${t.id}/finish`,
          `POST`,
          { result: n, cps: r ? r.cps.slice(-300) : [] },
          e.token,
        );
        return (this.dropPending(t.id), (i.profile = wO(i.profile)), i);
      } catch (n) {
        throw (
          hL(n) ? ((this.retryN = 0), this.retryLater(e)) : this.dropPending(t.id),
          (n.status ?? 0) >= 500
            ? Object.assign(
                Error(
                  c(
                    `El servidor no ha podido guardarla. Se volverá a enviar sola la próxima vez que abras el juego.`,
                  ),
                ),
                { status: n.status },
              )
            : n
        );
      } finally {
        this.q = null;
      }
    }
    dropPending(e) {
      sL.set(
        `pb.pending`,
        (sL.get(`pb.pending`) ?? []).filter((t) => t.ticket.id !== e),
      );
    }
    onSaved;
    retryTimer = 0;
    retryN = 0;
    onlineHook = !1;
    retryLater(e) {
      (clearTimeout(this.retryTimer),
        this.onlineHook ||
          ((this.onlineHook = !0),
          addEventListener(`online`, () => {
            this.hasPending(e) && ((this.retryN = 0), this.retryLater(e));
          })),
        (this.retryTimer = window.setTimeout(
          () => {
            this.flushPending(e).then((t) => {
              t && this.retryLater(e);
            });
          },
          Math.min(12e4, 1e4 * 2 ** Math.min(this.retryN++, 4)) * (0.5 + Math.random()),
        )));
    }
    hasPending(e, ticketId) {
      const pending = sL.get(`pb.pending`) ?? [];
      if (ticketId) return pending.some((t) => t.acc === e.id && t.ticket.id === ticketId);
      return (
        pending.some((t) => t.acc === e.id) ||
        (sL.get(`pb.live`)?.acc === e.id && !this.live)
      );
    }
    async retryNow(e) {
      return { left: await this.flushPending(e), saved: this.lastFlush.saved, error: this.lastFlush.refused };
    }
    lastFlush = { saved: 0, refused: void 0 };
    flushing = null;
    flushPending(e) {
      return (this.flushing ??= this.flushNow(e).finally(() => {
        this.flushing = null;
      }));
    }
    async flushNow(e) {
      this.lastFlush = { saved: 0, refused: void 0 };
      let t = sL.get(`pb.live`);
      const returning=t?.ticket.party && t.ticket.party===savedSeat()?.party;
      let n = 0;
      if (t && !returning && t.acc === e.id && t.ticket.id !== this.live?.id) {
        const pending = sL.get('pb.pending') ?? [];
        const queued = pending.some(entry => entry.ticket.id === t.ticket.id) ||
          sL.set('pb.pending', [...pending, {...t, rescued: true}]);
        if (queued) {
          if (sL.get('pb.live')?.ticket.id === t.ticket.id) sL.del('pb.live');
        } else n++;
      }
      for (let t of sL.get(`pb.pending`) ?? [])
        if (t.acc === e.id)
          try {
            const receipt = await this.req(
              `/runs/${t.ticket.id}/finish`,
              `POST`,
              { result: t.result, cps: t.cps ?? [] },
              e.token,
            );
            this.dropPending(t.ticket.id);
            this.lastFlush.saved++;
            this.onSaved?.({ result: t.result, rescued: !!t.rescued, ticketId: t.ticket.id, receipt });
          } catch (e) {
            if (hL(e)) {
              n++;
              break;
            }
            (this.dropPending(t.ticket.id),
              e.status === 409
                ? (this.lastFlush.saved++,
                  this.onSaved?.({ result: t.result, rescued: !!t.rescued, ticketId: t.ticket.id }))
                : (this.lastFlush.refused = e.message));
          }
      return n;
    }
    async chooseStarter(e, t) {
      return wO((await this.req(`/profile/starter`, `POST`, { id: t }, e.token)).profile);
    }
    async buyLab(e, t, lv) {
      return wO((await this.req(`/lab/buy`, `POST`, { id: t, lv }, e.token)).profile);
    }
    async buyItem(e, t) {
      return wO((await this.req(`/items/buy`, `POST`, { key: t }, e.token)).profile);
    }
    async archiveItem(e, t, n) {
      return wO((await this.req(`/items/archive`, `POST`, { key: t, off: n }, e.token)).profile);
    }
    async claimQuest(e, t) {
      return wO((await this.req(`/quests/claim`, `POST`, { id: t }, e.token)).profile);
    }
    async claimTask(e, t, n) {
      return wO((await this.req(`/tasks/claim`, `POST`, { period: t, slot: n }, e.token)).profile);
    }
    async rerollTask(e, t, n) {
      return wO((await this.req(`/tasks/reroll`, `POST`, { period: t, slot: n }, e.token)).profile);
    }
    async actions(e, t) {
      return wO((await this.req(`/profile/actions`, `POST`, { actions: t }, e.token)).profile);
    }

  };
function bL() {
  return new yL('/api');
}

export {
  bL as createGameClient
};

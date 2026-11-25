import {constrainLiteProfile} from '../src/data/lite-rules.js';
import crypto from 'node:crypto';

export const now = () => Date.now();
export const token = () => crypto.randomBytes(24).toString('base64url');
export const uid = () => crypto.randomUUID();

export const DEFAULT_SETTINGS = {
  master: 1, music: 0.5, sfx: 1, cries: 0.6, quality: 'high', lock30Fps: false, aimMode: 'auto',
  sensitivity: 1, invertY: false, damageNumbers: true, floatText: true, shakeOn: true,
  screenShake: 1, fov: 70, showFps: false, reduceFlashes: false, pixel: 0,
  muteHidden: true, hudScale: 1, hudOpacity: 1, bossBarOpacity: 1, showBanners: true,
  showMinimap: true, showLadder: true, showToasts: true, showStreak: true,
  showItems: true, mapScale: 1, mapIcons: 1, mapNorthUp: false, fxOpacity: 1,
  ownFxOpacity: 1, camDist: 9, calmCandies: false, pickupFx: 'full',
  skipEmptyLevelUp: false, hideOwnFx: false, fixedStick: false, padRumble: true,
  padDead: 0.15, ultPose: true, tours: '', hintsSeen: '', tips: true,
};

export function newProfile(name) {
  return {
    v: 1, name, created: now(), stardust: 0, totalStardust: 0,
    unlocked: [], league: [], starter: 0, forms: [], research: {}, captured: {},
    seen: [], played: [], shinies: [], skins: [], lab: {}, biomes: { forest: 0 },
    quests: {}, counters: {}, runs: [], best: {}, times: {}, kills: {}, medals: {},
    endless: {}, settings: { ...DEFAULT_SETTINGS }, lastSpecies: 4,
    lastBiome: 'forest', banished: [], itemsOwned: [], itemsOff: [],
    daily: { idx: 0, ids: [], prog: [0, 0, 0], claimed: [0, 0, 0, 0], rerolls: 0 },
    weekly: { idx: 0, ids: [], prog: [0, 0, 0], claimed: [0, 0, 0, 0], rerolls: 0 },
    dailyStreak: { last: 0, n: 0 }, bag: {}, avatar: '', frame: '', title: '',
    cosmetics: [], events: {},
    // 0.8.27+: wardrobe looks, classic shinies and the 6-slot Team favourites
    classics: [], team: [],
  };
}

export function newAccount(name, guest) {
  return {
    id: uid(), name, guest: !!guest, token: token(),
    password: null, created: now(), lastSeen: now(),
    profile: constrainLiteProfile(newProfile(name)),
  };
}

// ------------------------------------------------------------ season cfg ---

export const SEASON = {
  n: 2, name: '', start: now() - 86400000, end: now() + 15 * 86400000,
  live: false, dust: 1, message: '', next: null,
};

export const EVENTS = [];

// ------------------------------------------------------------------ api ----

export const seasonPayload = () => ({ ...SEASON });

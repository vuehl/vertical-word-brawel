
var ts = {
    stampede: {cast: e => { j(e, 400, .14, .2); fs(e, .12, .3, .05); }},
    "flame-charge": {
      cast: (e) => {
        fs(e, 0.14, 0.25);
        for (let t = 0; t < 3; t++) A(e, 150, 0.08, t * 0.05, 0.06);
      },
    },
    bounce: {
      cast: (e) => {
        j(e, 500, 0.1, 0.25, 0, 3);
      },
      impact: (e) => {
        (A(e, 80, 0.3), fs(e, 0.12, 0.25, 0.02), bs(e, 2, 0.05, 0.04));
      },
    },
    inferno: {
      cast: (e) => {
        fs(e, 0.14, 0.3);
      },
      impact: (e) => {
        (M(e, 0.55), fs(e, 0.2, 0.45, 0.02), ds(e, 6, 0.4, 0.04, 0.05));
      },
    },
    "sacred-fire": {
      warn: (e, t) => {
        (Fs(e, t.dur ?? 0.7, 0.08), _s(e, 523, 0.03, 0, 0.6));
      },
      impact: (e) => {
        (M(e, 0.9), fs(e, 0.24, 0.6, 0.02), _s(e, 784, 0.03, 0.05, 0.6), _s(e, 1047, 0.025, 0.1, 0.6));
      },
    },
    yawn: {
      cast: (e) => {
        (e.kt(260, 0.45, { v: 0.05, to: 0.6, vib: [4, 0.05], a: 0.12 }), ps(e, 320, 0.04, 0.2));
      },
    },
    scald: {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (e.kn(n, { f: 1200, to: 0.6, q: 0.8, v: 0.08, a: 0.04 }),
          e.kn(n * 0.8, { f: 2400, to: 0.7, q: 1, v: 0.03, a: n * 0.3 }));
      },
    },
    "psychic-noise": {
      cast: (e) => {
        (vs(e, 330, 0.3, 0.05, 0, 0.8), e.kn(0.25, { f: 1400, to: 0.6, q: 3, v: 0.04 }));
      },
    },
    "expanding-force": {
      cast: (e) => {
        (vs(e, 180, 0.4, 0.07, 0, 1.8), A(e, 90, 0.22, 0.05));
      },
    },
    "thunder-wave": {
      cast: (e, t) => {
        (hs(e, 0.12, 0.05, 0, 120 + (t.k ?? 0) * 15), gs(e, 0.04));
      },
    },
    "gyro-ball": {
      gap: 0.3,
      cast: (e) => {
        (e.kt(140, 0.35, { w: `triangle`, lp: 900, v: 0.09, vib: [24, 0.1], a: 0.02 }),
          Ts(e, 300, 0.05, 0.1));
      },
    },
    "magnet-bomb": {
      cast: (e) => {
        (Ts(e, 380, 0.05), hs(e, 0.08, 0.03, 0.02, 140));
      },
    },
    "flash-cannon": {
      gap: 0.4,
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        (e.kt(220, n, { w: `triangle`, lp: 1300, v: 0.06, a: 0.03 }), Ts(e, 440, 0.05));
      },
    },
    cut: {
      cast: (e) => {
        (ls(e, 1500, 0.12, 0.13), Es(e, 420, 0.06, 0.08));
      },
    },
    "false-swipe": {
      cast: (e) => {
        j(e, 650, 0.08, 0.2, 0, 2);
      },
    },
    "brave-bird": {
      cast: (e) => {
        (Cs(e, 0.3, 0.14, 0, 500), A(e, 100, 0.3, 0.13));
      },
    },
    "meteor-assault": {
      warn: (e, t) => Fs(e, t.dur ?? 0.7, 0.1),
      impact: (e) => {
        (M(e, 0.9), Es(e, 300, 0.1, 0.02), us(e, 0.4, 0.12, 0.05));
      },
    },
    pluck: {
      cast: (e) => {
        (Es(e, 540, 0.09), Es(e, 500, 0.08, 0.05));
      },
    },
    "double-hit": { cast: (e, t) => Es(e, 460 + (t.k ?? 0) * 30, 0.08) },
    uproar: {
      gap: 0.25,
      cast: (e) => {
        (e.kt(330, 0.25, { w: `sawtooth`, lp: 1100, v: 0.05, vib: [14, 0.06], a: 0.01 }),
          e.kt(415, 0.22, { w: `sawtooth`, lp: 1100, v: 0.04, d: 0.03, vib: [12, 0.06] }));
      },
    },
    acrobatics: {
      cast: (e) => {
        for (let t = 0; t < 4; t++) cs(e, 900 + t * 80, 0.06, t * 0.03);
        j(e, 600, 0.08, 0.14);
      },
    },
    "icy-wind": {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (Cs(e, n, 0.08, 0, 600), Ss(e, n * 0.8, 0.05));
      },
    },
    dive: {
      cast: (e) => {
        (ms(e, 0.12, 0.2), ps(e, 200, 0.08, 0.06, 1.6), ms(e, 0.16, 0.3, 0.13));
      },
    },
    "aurora-beam": {
      gap: 0.4,
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        ([523, 659, 784].forEach((t, r) =>
          e.kt(t, n, { w: `triangle`, v: 0.025, d: r * 0.04, vib: [5, 0.01], a: 0.05 }),
        ),
          Ss(e, n, 0.03));
      },
    },
    "sheer-cold": {
      cast: (e) => {
        (Ss(e, 0.6, 0.12), xs(e, 900, 0.05, 0.05), xs(e, 1200, 0.04, 0.12), A(e, 70, 0.22, 0.02));
      },
    },
    "poison-gas": {
      gap: 0.9,
      cast: (e) => {
        (e.kn(0.4, { ft: `lowpass`, f: 700, v: 0.04, a: 0.1 }), Ns(e, 0.03, 0.1));
      },
    },
    sludge: {
      cast: (e) => {
        (Ns(e, 0.09), j(e, 400, 0.05, 0.12));
      },
      impact: (e) => {
        (Ps(e, 0.16), Ns(e, 0.07, 0.05));
      },
    },
    "shadow-sneak": {
      cast: (e) => {
        (j(e, 350, 0.07, 0.18, 0, 1.6), ks(e, 0.12, 90, 0.04, 0.05));
      },
    },
    belch: {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (e.kt(70, n * 0.6, { w: `sawtooth`, lp: 380, v: 0.12, vib: [9, 0.12], to: 0.7, a: 0.02 }),
          e.kn(n, { ft: `lowpass`, f: 600, to: 0.5, v: 0.1, a: 0.04 }));
      },
    },
    clamp: {
      cast: (e) => {
        (Ts(e, 260, 0.06), A(e, 140, 0.18, 0.1));
      },
    },
    "icicle-spear": { cast: (e, t) => xs(e, 900 + ((t.k ?? 0) % 4) * 110, 0.045) },
    "ice-spinner": {
      cast: (e) => {
        (j(e, 900, 0.08, 0.25, 0, 2), xs(e, 1e3, 0.04, 0.1));
      },
    },
    "icicle-crash": {
      impact: (e) => {
        (A(e, 100, 0.22), xs(e, 1100, 0.05, 0.02), xs(e, 800, 0.05, 0.06), bs(e, 3, 0.04, 0.03));
      },
    },
  },
  ns = {
    "rock-tomb": {
      cast: (e) => j(e, 350, 0.06, 0.2),
      impact: (e) => {
        (bs(e, 5, 0.09, 0, 0.18), A(e, 80, 0.24, 0.02));
      },
    },
    "stealth-rock": {
      cast: (e) => {
        (bs(e, 3, 0.05, 0, 0.2), Es(e, 300, 0.06, 0.05));
      },
      impact: (e) => {
        (bs(e, 4, 0.08), A(e, 110, 0.14, 0.01));
      },
    },
    "iron-tail": {
      cast: (e) => {
        (ls(e, 1100, 0.12, 0.16), Ts(e, 300, 0.07, 0.12));
      },
    },
    "head-smash": {
      cast: (e) => {
        (j(e, 400, 0.12, 0.15), A(e, 65, 0.36, 0.13), bs(e, 4, 0.08, 0.14), us(e, 0.3, 0.1, 0.15));
      },
    },
    psywave: {
      cast: (e) => {
        (vs(e, 180, 0.45, 0.07, 0, 1.6), e.kt(270, 0.4, { v: 0.03, vib: [9, 0.08], a: 0.08 }));
      },
    },
    nightmare: {
      cast: (e) => {
        (ys(e, 220, 0.4, 0.06), ks(e, 0.2, 90, 0.03, 0.05));
      },
    },
    "dream-eater": {
      cast: (e) => {
        (e.kn(0.25, { f: 400, to: 2.5, q: 2, v: 0.06, a: 0.08 }), vs(e, 260, 0.3, 0.04, 0.03, 0.7));
      },
    },
    "focus-blast": {
      cast: (e) => {
        (Ds(e, 0.25, 130, 0.08), j(e, 500, 0.07, 0.15, 0.2));
      },
      impact: (e) => {
        (M(e, 0.6), A(e, 90, 0.2, 0.02));
      },
    },
    "vice-grip": {
      cast: (e) => {
        (cs(e, 1300, 0.1), Es(e, 420, 0.12, 0.08), cs(e, 900, 0.08, 0.1));
      },
    },
    liquidation: {
      cast: (e) => {
        (ms(e, 0.14, 0.3), j(e, 450, 0.08, 0.15), A(e, 100, 0.2, 0.13));
      },
    },
    crabhammer: {
      cast: (e) => ps(e, 220, 0.06),
      impact: (e) => {
        (A(e, 75, 0.3), ms(e, 0.16, 0.3, 0.02), Es(e, 350, 0.08, 0.02));
      },
    },
    guillotine: {
      warn: (e, t) => {
        (Fs(e, t.dur ?? 0.7, 0.08), cs(e, 1200, 0.06, (t.dur ?? 0.7) * 0.4));
      },
      impact: (e) => {
        (e.kn(0.06, { f: 2e3, q: 1.2, v: 0.14, a: 0.001 }),
          A(e, 70, 0.34, 0.01),
          M(e, 0.6, 0.02),
          bs(e, 4, 0.06, 0.05));
      },
    },
    spark: {
      cast: (e) => {
        (hs(e, 0.2, 0.08), gs(e, 0.07), gs(e, 0.05, 0.1), A(e, 120, 0.14, 0.12));
      },
    },
    electroweb: {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (hs(e, n, 0.05, 0, 88), ds(e, 6, n, 0.04, 0, 1500, 2300));
      },
    },
    "rising-voltage": {
      cast: (e) => hs(e, 0.15, 0.05, 0, 120),
      impact: (e) => {
        (gs(e, 0.1), hs(e, 0.3, 0.1, 0.01, 70), A(e, 90, 0.2, 0.02));
      },
    },
    discharge: {
      cast: (e) => {
        (gs(e, 0.1), hs(e, 0.4, 0.1, 0, 82), ds(e, 8, 0.35, 0.05, 0.02, 1400, 2400), A(e, 80, 0.2, 0.02));
      },
    },
    barrage: { cast: (e, t) => Es(e, 360 + ((t.k ?? 0) % 4) * 30, 0.07) },
    "leech-seed": {
      cast: (e) => {
        (j(e, 650, 0.06, 0.1), ws(e, 0.2, 0.05, 0.05), _s(e, 440, 0.025, 0.08, 0.3));
      },
    },
    "seed-bomb": {
      cast: (e) => {
        (j(e, 400, 0.06, 0.15), Es(e, 280, 0.06));
      },
      impact: (e) => {
        (M(e, 0.45), ws(e, 0.3, 0.07, 0.03));
      },
    },
    "wood-hammer": {
      cast: (e) => {
        (ls(e, 800, 0.12, 0.12), Es(e, 180, 0.2, 0.11), A(e, 70, 0.3, 0.12), ws(e, 0.2, 0.05, 0.13));
      },
    },
    "rolling-kick": {
      gap: 0.3,
      cast: (e) => {
        (j(e, 380, 0.12, 0.25, 0, 2), A(e, 120, 0.18, 0.18));
      },
    },
    "blaze-kick": {
      cast: (e) => {
        (ls(e, 1200, 0.1, 0.12), fs(e, 0.12, 0.2, 0.05), A(e, 120, 0.18, 0.08));
      },
    },
    "jump-kick": {
      cast: (e) => {
        (j(e, 500, 0.1, 0.18), A(e, 100, 0.26, 0.13));
      },
    },
    "high-jump-kick": {
      cast: (e) => j(e, 300, 0.1, 0.3, 0, 3),
      impact: (e) => {
        (A(e, 70, 0.34), M(e, 0.4, 0.01), bs(e, 3, 0.06, 0.03));
      },
    },
    "comet-punch": { cast: (e, t) => Ms(e, 140 + ((t.k ?? 0) % 3) * 12, 0.12) },
    "ice-punch": {
      cast: (e) => {
        (Ms(e, 130, 0.22), xs(e, 1e3, 0.05, 0.05), Ss(e, 0.2, 0.05, 0.05));
      },
    },
    "drain-punch": {
      cast: (e) => {
        (Ms(e, 125, 0.22), _s(e, 523, 0.03, 0.08, 0.3));
      },
    },
    "focus-punch": {
      warn: (e, t) => {
        Ds(e, t.dur ?? 0.7, 100, 0.1);
      },
      impact: (e) => {
        (A(e, 60, 0.38), M(e, 0.8, 0.01), bs(e, 4, 0.07, 0.04));
      },
    },
    "wring-out": {
      cast: (e) => {
        (e.kt(200, 0.2, { to: 0.6, v: 0.08, a: 0.02 }),
          e.kn(0.18, { ft: `lowpass`, f: 700, v: 0.08, d: 0.05 }));
      },
    },
    snore: {
      gap: 0.5,
      cast: (e) => {
        (e.kt(70, 0.6, { w: `sawtooth`, lp: 380, v: 0.12, vib: [18, 0.1], a: 0.1 }),
          e.kn(0.5, { ft: `lowpass`, f: 500, v: 0.08, a: 0.1 }));
      },
    },
    strength: {
      cast: (e) => {
        (j(e, 350, 0.1, 0.15), A(e, 80, 0.3, 0.13), us(e, 0.25, 0.08, 0.14));
      },
    },
    "heavy-slam": {
      cast: (e) => j(e, 300, 0.08, 0.25),
      impact: (e) => {
        (A(e, 55, 0.38), us(e, 0.35, 0.14, 0.02), bs(e, 3, 0.06, 0.04));
      },
    },
  },
  rs = {
    smog: {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (e.kn(n, { ft: `lowpass`, f: 900, to: 0.6, v: 0.09, a: 0.08 }), Ns(e, 0.05, 0.05));
      },
    },
    "clear-smog": {
      cast: (e) => {
        e.kn(0.25, { f: 700, to: 1.6, q: 1, v: 0.06, a: 0.05 });
      },
      impact: (e) => {
        (e.kn(0.45, { f: 1600, to: 0.4, q: 0.7, v: 0.09, a: 0.02 }), A(e, 110, 0.12));
      },
    },
    "self-destruct": {
      cast: (e) => {
        (M(e, 0.7), fs(e, 0.14, 0.35, 0.02), ds(e, 6, 0.3, 0.04, 0.05));
      },
    },
    explosion: {
      warn: (e, t) => Fs(e, t.dur ?? 0.7, 0.1),
      impact: (e) => {
        (M(e, 1.2), fs(e, 0.16, 0.5, 0.03), us(e, 0.6, 0.14, 0.05), ds(e, 8, 0.5, 0.05, 0.08));
      },
    },
    "smack-down": {
      cast: (e) => {
        (j(e, 400, 0.08, 0.14), bs(e, 2, 0.06, 0.1), A(e, 100, 0.14, 0.12));
      },
    },
    "rock-blast": {
      cast: (e, t) => {
        (Es(e, 260 + ((t.k ?? 0) % 4) * 30, 0.08), bs(e, 1, 0.05, 0.02));
      },
    },
    "high-horsepower": {
      cast: (e) => {
        for (let t = 0; t < 4; t++) A(e, 80 + t * 6, 0.18, t * 0.04, 0.08);
        us(e, 0.35, 0.12, 0.05);
      },
    },
    "rock-wrecker": {
      warn: (e, t) => Fs(e, t.dur ?? 0.7, 0.1),
      impact: (e) => {
        (M(e, 1), us(e, 0.5, 0.16, 0.03), bs(e, 6, 0.08, 0.05, 0.35));
      },
    },
    "sweet-kiss": {
      cast: (e) => {
        (e.kt(392, 0.14, { to: 1.5, v: 0.06, a: 0.01 }), _s(e, 784, 0.03, 0.06, 0.3));
      },
    },
    "echoed-voice": {
      cast: (e, t) => {
        let n = Math.min(3, t.k ?? 0);
        (As(e, [Is[3 + n], Is[5 + (n % 3)]], 0.08, 0.05, 0, `triangle`), vs(e, 300, 0.25, 0.03, 0.05, 1.1));
      },
    },
    "egg-bomb": {
      cast: (e) => {
        j(e, 500, 0.06, 0.15);
      },
      impact: (e) => {
        (xs(e, 900, 0.05), M(e, 0.45, 0.02), _s(e, 659, 0.03, 0.05, 0.3));
      },
    },
    boomburst: {
      cast: (e) => {
        (M(e, 0.6),
          e.kt(220, 0.45, { w: `triangle`, lp: 1200, v: 0.09, vib: [6, 0.05], a: 0.02 }),
          As(e, [523, 659, 784], 0.05, 0.04, 0.05, `triangle`));
      },
    },
    bind: {
      cast: (e) => {
        (j(e, 450, 0.08, 0.2), ws(e, 0.2, 0.06, 0.05), A(e, 130, 0.1, 0.16));
      },
    },
    "giga-drain": {
      cast: (e) => {
        (e.kn(0.3, { f: 400, to: 3, q: 2, v: 0.08, a: 0.08 }),
          _s(e, 392, 0.03, 0.06, 0.35),
          _s(e, 523, 0.03, 0.12, 0.35));
      },
    },
    "grass-knot": {
      impact: (e) => {
        (ws(e, 0.2, 0.08), A(e, 90, 0.24, 0.05), Es(e, 300, 0.08, 0.05));
      },
    },
    "solar-blade": {
      charge: (e, t) => Ds(e, t.dur ?? 0.5, 160, 0.1),
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        (Os(e, n, 196, 0.06, 1100), ws(e, n, 0.04));
      },
    },
    "dizzy-punch": {
      cast: (e) => {
        (Ms(e, 125, 0.22), _s(e, 880, 0.02, 0.12, 0.25), _s(e, 988, 0.02, 0.18, 0.25));
      },
    },
    "mega-kick": {
      cast: (e) => {
        (j(e, 450, 0.12, 0.16), A(e, 85, 0.32, 0.13), cs(e, 1e3, 0.08, 0.13));
      },
    },
    "mega-punch": {
      warn: (e, t) => Fs(e, t.dur ?? 0.7, 0.09),
      impact: (e) => {
        (M(e, 0.9), A(e, 140, 0.16, 0.14), bs(e, 4, 0.06, 0.04, 0.2));
      },
    },
    "snipe-shot": {
      cast: (e) => {
        (e.kn(0.12, { f: 1400, to: 0.5, q: 1.5, v: 0.08, a: 0.005 }), ps(e, 360, 0.06, 0.02, 2.4));
      },
    },
    octazooka: {
      cast: (e) => {
        (ps(e, 180, 0.09, 0, 1.6), Ns(e, 0.05, 0.03));
      },
      impact: (e) => {
        (ms(e, 0.12, 0.25), Ns(e, 0.08, 0.02), A(e, 100, 0.1, 0.02));
      },
    },
    "scale-shot": {
      cast: (e, t) => {
        (xs(e, 700 + ((t.k ?? 0) % 5) * 60, 0.035), cs(e, 1500, 0.04));
      },
    },
    "hydro-cannon": {
      charge: (e, t) => Ds(e, t.dur ?? 0.5, 110, 0.12),
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        (e.kn(n, { f: 800, to: 0.7, q: 0.7, v: 0.14, a: 0.03 }),
          Os(e, n, 98, 0.06, 700),
          ms(e, 0.12, 0.3, n * 0.8));
      },
    },
    "aqua-cutter": {
      cast: (e) => {
        (ls(e, 1500, 0.1, 0.16), ms(e, 0.06, 0.15, 0.04));
      },
    },
    "smart-strike": {
      cast: (e) => {
        (j(e, 800, 0.07, 0.12), Ts(e, 380, 0.05, 0.1));
      },
    },
    "horn-leech": {
      cast: (e) => {
        (j(e, 500, 0.12, 0.15), A(e, 110, 0.22, 0.12), _s(e, 523, 0.03, 0.18, 0.3));
      },
    },
    "fishious-rend": {
      cast: (e) => {
        (cs(e, 900, 0.12), A(e, 140, 0.22, 0.03), ms(e, 0.1, 0.2, 0.05));
      },
    },
    "water-shuriken": {
      cast: (e, t) => {
        (ls(e, 1700 - (t.k ?? 0) * 50, 0.06, 0.08), ps(e, 420, 0.03, 0.03));
      },
    },
    "confuse-ray": {
      cast: (e) => {
        (vs(e, 260, 0.4, 0.05, 0, 1.6), e.kt(390, 0.35, { v: 0.025, vib: [9, 0.08], a: 0.1 }));
      },
    },
    "mirror-shot": {
      cast: (e) => {
        (xs(e, 1100, 0.04), j(e, 600, 0.05, 0.12));
      },
      impact: (e) => {
        (M(e, 0.35), xs(e, 1300, 0.04, 0.02), xs(e, 900, 0.03, 0.06));
      },
    },
    "photon-geyser": {
      gap: 0.4,
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        (Os(e, n, 131, 0.07, 1200), _s(e, 523, 0.03, 0.02, n), _s(e, 784, 0.025, 0.06, n));
      },
    },
  },
  is = {
    barrier: {
      gap: 1,
      cast: (e) => {
        (xs(e, 900, 0.04),
          xs(e, 1200, 0.03, 0.06),
          e.kt(330, 0.4, { w: `triangle`, lp: 1200, v: 0.04, a: 0.05 }));
      },
    },
    "light-screen": {
      cast: (e) => {
        (e.kt(392, 0.45, { w: `triangle`, lp: 1300, v: 0.05, to: 1.2, a: 0.08 }),
          xs(e, 1050, 0.035, 0.05),
          j(e, 600, 0.06, 0.25));
      },
    },
    "trick-room": {
      cast: (e) => {
        (vs(e, 180, 0.5, 0.06, 0, 0.7), cs(e, 900, 0.05, 0.1));
      },
      impact: (e) => {
        (xs(e, 1100, 0.05), xs(e, 800, 0.05, 0.04), bs(e, 4, 0.04, 0.03), M(e, 0.3));
      },
    },
    "misty-explosion": {
      cast: (e) => {
        (M(e, 0.5),
          [523, 659, 784].forEach((t, n) => _s(e, t, 0.025, 0.05 + n * 0.03, 0.5)),
          Cs(e, 0.4, 0.06, 0.02, 600));
      },
    },
    "lovely-kiss": {
      cast: (e) => {
        (e.kt(440, 0.12, { to: 1.4, v: 0.05, a: 0.01 }), _s(e, 659, 0.03, 0.08, 0.35));
      },
    },
    "frost-breath": {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        Ss(e, n, 0.08);
        for (let t = 0; t < 3; t++) xs(e, 1e3 + t * 120, 0.03, t * n * 0.3);
      },
    },
    "heart-stamp": {
      cast: (e) => {
        (ls(e, 1200, 0.1, 0.1), A(e, 150, 0.18, 0.08), _s(e, 784, 0.03, 0.1, 0.25));
      },
    },
    "perish-song": {
      warn: (e, t) => {
        As(e, [330, 311, 294, 277], (t.dur ?? 0.7) / 4, 0.045, 0, `triangle`);
      },
      impact: (e) => {
        (M(e, 0.7),
          ys(e, 220, 0.6, 0.06, 0.05),
          e.kt(110, 0.8, { w: `triangle`, lp: 600, v: 0.06, to: 0.6, a: 0.05 }));
      },
    },
    "thunder-punch": {
      cast: (e) => {
        (Ms(e, 140, 0.22), hs(e, 0.12, 0.05, 0.06), gs(e, 0.06, 0.07));
      },
    },
    "wild-charge": {
      cast: (e) => {
        (hs(e, 0.3, 0.08), j(e, 500, 0.1, 0.18), A(e, 100, 0.24, 0.13), gs(e, 0.08, 0.13));
      },
    },
    "thunder-cage": {
      cast: (e) => {
        hs(e, 0.5, 0.05, 0, 82);
      },
      impact: (e) => {
        M(e, 0.45);
        for (let t = 0; t < 4; t++) gs(e, 0.06, t * 0.04);
      },
    },
    "bolt-strike": {
      warn: (e, t) => {
        Ds(e, t.dur ?? 0.7, 120, 0.07);
      },
      impact: (e) => {
        (M(e, 1), hs(e, 0.25, 0.08));
        for (let t = 0; t < 3; t++) gs(e, 0.08, t * 0.05);
      },
    },
    "fire-punch": {
      cast: (e) => {
        (Ms(e, 140, 0.22), fs(e, 0.12, 0.2, 0.06));
      },
    },
    "mystical-fire": {
      cast: (e) => {
        (fs(e, 0.09, 0.25), _s(e, 523, 0.025, 0.04, 0.3));
      },
    },
    "lava-plume": {
      cast: (e) => {
        (fs(e, 0.2, 0.45), us(e, 0.35, 0.1), ds(e, 6, 0.4, 0.04));
      },
    },
    eruption: {
      warn: (e, t) => {
        us(e, t.dur ?? 0.7, 0.12);
      },
      impact: (e) => {
        (M(e, 1.1), fs(e, 0.22, 0.6, 0.02), bs(e, 5, 0.06, 0.1, 0.4), ds(e, 8, 0.6, 0.04, 0.1));
      },
    },
    transform: {
      cast: (e) => {
        (vs(e, 260, 0.4, 0.06, 0, 1.6), e.kt(130, 0.3, { w: `triangle`, lp: 700, v: 0.06, to: 0.6, d: 0.1 }));
      },
    },
    "storm-throw": {
      cast: (e) => {
        (cs(e, 700, 0.12), j(e, 400, 0.1, 0.12), A(e, 110, 0.26, 0.12));
      },
    },
    lunge: {
      cast: (e) => {
        (j(e, 450, 0.12, 0.14), A(e, 95, 0.28, 0.13), bs(e, 2, 0.05, 0.14));
      },
    },
    "vital-throw": {
      gap: 0.3,
      cast: (e) => {
        (j(e, 350, 0.12, 0.28, 0, 2), A(e, 90, 0.22, 0.24));
      },
    },
    superpower: {
      cast: (e) => {
        (ks(e, 0.25, 85, 0.06), A(e, 60, 0.36, 0.05), us(e, 0.4, 0.14, 0.06), bs(e, 4, 0.06, 0.08));
      },
    },
    payback: {
      cast: (e) => {
        (ks(e, 0.15, 100, 0.05), A(e, 120, 0.24, 0.04));
      },
    },
    "rock-climb": {
      gap: 0.3,
      cast: (e) => {
        (A(e, 90, 0.22), bs(e, 5, 0.06, 0.03, 0.25));
      },
    },
    "raging-bull": {
      cast: (e) => {
        (ks(e, 0.3, 70, 0.07), us(e, 0.3, 0.1), A(e, 85, 0.3, 0.13));
      },
    },
    "headlong-rush": {
      warn: (e, t) => {
        (Fs(e, t.dur ?? 0.7, 0.08), us(e, t.dur ?? 0.7, 0.08));
      },
      impact: (e) => {
        (M(e, 0.9), bs(e, 5, 0.07, 0.05, 0.3), ks(e, 0.3, 65, 0.06, 0.02));
      },
    },
    "lock-on": {
      cast: (e) => {
        (As(e, [880, 1175], 0.05, 0.025, 0, `square`), cs(e, 2e3, 0.03, 0.1));
      },
    },
    "fusion-bolt": {
      cast: (e, t) => {
        let n = Math.min(3, (t.k ?? 0) + 1);
        for (let t = 0; t < n; t++)
          (gs(e, 0.06, t * 0.05),
            e.kt(660 + t * 110, 0.06, { w: `square`, lp: 1600, v: 0.025, d: t * 0.05 }));
        hs(e, 0.15, 0.04);
      },
    },
    "techno-blast": {
      charge: (e, t) => {
        Ds(e, t.dur ?? 0.5, 150, 0.08);
      },
      cast: (e, t) => {
        let n = t.dur ?? 0.6;
        (Os(e, n, 165, 0.06, 1200),
          e.kt(330, n, { w: `square`, lp: 900, v: 0.02, vib: [12, 0.02], a: 0.03 }));
      },
    },
    "parabolic-charge": {
      gap: 0.9,
      cast: (e) => {
        (hs(e, 0.15, 0.04), gs(e, 0.04, 0.05));
      },
    },
  },
  as = {
    constrict: {
      cast: (e) => {
        (j(e, 400, 0.1, 0.22, 0, 2),
          e.kn(0.2, { f: 900, to: 0.6, q: 2, v: 0.05, d: 0.05 }),
          A(e, 130, 0.1, 0.18));
      },
    },
    "spike-cannon": {
      cast: (e, t) => {
        (cs(e, 1300 - (t.k ?? 0) * 60, 0.06), os(e));
      },
    },
    "water-spout": {
      cast: (e) => {
        (e.kn(0.6, { f: 700, to: 2.2, q: 0.9, v: 0.14, a: 0.05 }), ps(e, 200, 0.1), ms(e, 0.14, 0.4, 0.35));
      },
    },
    "meteor-beam": {
      charge: (e, t) => Ds(e, t.dur ?? 0.5, 90, 0.12),
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        (Os(e, n, 82, 0.08, 800), bs(e, 3, 0.04, 0, n));
      },
    },
    "aqua-jet": {
      cast: (e) => {
        (e.kn(0.25, { f: 900, to: 2, q: 1, v: 0.1, a: 0.02 }), ms(e, 0.1, 0.2, 0.12));
      },
    },
    "sacred-sword": {
      cast: (e) => {
        (ls(e, 1600, 0.1, 0.18), xs(e, 900, 0.03, 0.05));
      },
    },
    "stone-axe": {
      cast: (e) => {
        (bs(e, 2, 0.06), A(e, 120, 0.12, 0.04));
      },
      impact: (e) => {
        (bs(e, 5, 0.08, 0, 0.2), M(e, 0.35));
      },
    },
    "razor-shell": {
      cast: (e) => {
        (ls(e, 1500, 0.13, 0.13), ls(e, 1300, 0.11, 0.13, 0.08), ms(e, 0.05, 0.12, 0.1));
      },
    },
    "thunder-fang": {
      cast: (e) => {
        (js(e, 1), hs(e, 0.12, 0.06, 0.05), gs(e, 0.06, 0.06));
      },
    },
    "dual-wingbeat": {
      cast: (e, t) => {
        (Cs(e, 0.18, 0.12, (t.k ?? 0) * 0.02, 380), A(e, 110, 0.12, 0.08));
      },
    },
    "iron-head": {
      cast: (e) => {
        (j(e, 450, 0.1, 0.14), Ts(e, 260, 0.08, 0.12), A(e, 95, 0.24, 0.12));
      },
    },
    "dragon-ascent": {
      warn: (e, t) => {
        (Fs(e, t.dur ?? 0.7, 0.1), Cs(e, t.dur ?? 0.7, 0.08, 0, 300));
      },
      impact: (e) => {
        (M(e, 0.9), Cs(e, 0.4, 0.14, 0, 260));
      },
    },
    "freeze-dry": {
      cast: (e) => {
        (Ss(e, 0.2, 0.06), xs(e, 1100, 0.035));
      },
      impact: (e) => {
        (xs(e, 900, 0.05), xs(e, 1250, 0.04, 0.05), Ss(e, 0.35, 0.08, 0.02));
      },
    },
    mist: { gap: 0.9, cast: (e) => Ss(e, 0.4, 0.05) },
    "bleakwind-storm": {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (Cs(e, n, 0.14, 0, 300), Ss(e, n, 0.06, 0.05));
      },
    },
    glaciate: {
      cast: (e) => {
        (Ss(e, 0.6, 0.1), us(e, 0.4, 0.06, 0.05), xs(e, 800, 0.04, 0.1), xs(e, 1e3, 0.035, 0.2));
      },
    },
    "bolt-beak": {
      cast: (e) => {
        (j(e, 600, 0.1, 0.12), hs(e, 0.18, 0.08, 0.06), gs(e, 0.08, 0.1));
      },
    },
    "wildbolt-storm": {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (hs(e, n, 0.06, 0, 82), us(e, n, 0.06));
        for (let t = 0; t < 4; t++) gs(e, 0.05, t * n * 0.25);
      },
    },
    thunderclap: {
      impact: (e) => {
        (gs(e, 0.12), A(e, 70, 0.22, 0.02), hs(e, 0.2, 0.06, 0.02));
      },
    },
    "electro-shot": {
      charge: (e, t) => {
        (Ds(e, t.dur ?? 0.5, 110, 0.12), hs(e, t.dur ?? 0.5, 0.04));
      },
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        (Os(e, n, 98, 0.09, 1200), ds(e, 6, n, 0.04, 0, 1400, 2200));
      },
    },
    incinerate: {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (fs(e, 0.16, n), ds(e, 6, n, 0.04));
      },
    },
    fly: {
      cast: (e) => {
        (Cs(e, 0.3, 0.12, 0, 350), fs(e, 0.12, 0.25, 0.08));
      },
    },
    "searing-shot": {
      cast: (e) => fs(e, 0.1, 0.2),
      impact: (e) => {
        (M(e, 0.5), fs(e, 0.16, 0.35, 0.02), ds(e, 5, 0.3, 0.04, 0.05));
      },
    },
    overheat: {
      warn: (e, t) => {
        (Fs(e, t.dur ?? 0.7, 0.1), fs(e, 0.06, t.dur ?? 0.7));
      },
      impact: (e) => {
        (M(e, 1.1), fs(e, 0.22, 0.6, 0.03), ds(e, 8, 0.5, 0.05, 0.05));
      },
    },
    "psycho-cut": {
      cast: (e) => {
        (ls(e, 1400, 0.1, 0.15), vs(e, 330, 0.18, 0.03, 0.02, 1.6));
      },
    },
    psystrike: {
      cast: (e) => vs(e, 180, 0.3, 0.06, 0, 1.8),
      impact: (e) => {
        (M(e, 0.5), vs(e, 140, 0.4, 0.06, 0.02, 0.6), _s(e, 330, 0.03, 0.05, 0.5));
      },
    },
    "prismatic-laser": {
      charge: (e, t) => {
        (Ds(e, t.dur ?? 0.5, 130, 0.12), vs(e, 260, t.dur ?? 0.5, 0.04, 0, 2));
      },
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        (Os(e, n, 131, 0.09, 1400), e.kt(392, n, { v: 0.03, vib: [9, 0.05], a: 0.05 }));
      },
    },
    "psycho-boost": {
      warn: (e, t) => {
        (Ds(e, t.dur ?? 0.7, 120, 0.1), vs(e, 220, t.dur ?? 0.7, 0.04, 0, 2.2));
      },
      impact: (e) => {
        (M(e, 1), vs(e, 120, 0.6, 0.07, 0.03, 0.5), us(e, 0.4, 0.1, 0.05));
      },
    },
  };
function os(e) {
  e.kt(380, 0.06, { w: `triangle`, to: 0.7, v: 0.06, a: 0.001 });
}
var ss = (e, t) => e + Math.random() * (t - e);
function A(e, t = 120, n = 0.3, r = 0, i = 0.16) {
  (e.kt(t, i, { to: 0.4, v: n, d: r, a: 0.002 }),
    e.kt(t * 2.3, i * 0.5, { w: `triangle`, to: 0.5, v: n * 0.4, d: r, a: 0.002 }),
    e.kn(0.06, { ft: `lowpass`, f: 1300, v: n * 0.7, d: r }));
}
function cs(e, t = 1400, n = 0.08, r = 0) {
  e.kn(0.03, { f: t, q: 2.2, v: n, d: r, a: 0.001 });
}
function j(e, t = 600, n = 0.16, r = 0.16, i = 0, a = 2.4) {
  e.kn(r, { f: t, to: a, q: 1.4, v: n, d: i, a: r * 0.4 });
}
function ls(e, t = 1800, n = 0.14, r = 0.2, i = 0) {
  e.kn(r, { f: t, to: 0.35, q: 1.2, v: n, d: i, a: r * 0.25 });
}
function M(e, t = 1, n = 0) {
  (e.kt(72, 0.35 + t * 0.35, { to: 0.4, v: 0.26 * t + 0.08, d: n, a: 0.003 }),
    e.kn(0.4 + t * 0.45, { ft: `lowpass`, f: 1500, to: 0.12, v: 0.24 * t + 0.08, d: n }),
    cs(e, 900, 0.1 * t, n));
}
function us(e, t, n = 0.2, r = 0) {
  (e.kn(t, { ft: `lowpass`, f: 320, to: 0.5, v: n, d: r, a: 0.02 }),
    e.kn(t * 0.7, { f: 550, to: 0.6, q: 0.8, v: n * 0.45, d: r, a: 0.02 }),
    e.kt(46, t, { to: 0.8, v: n * 0.9, d: r, a: 0.03 }));
}
function ds(e, t, n, r = 0.05, i = 0, a = 900, o = 2200) {
  for (let s = 0; s < t; s++) cs(e, ss(a, o), r * ss(0.5, 1), i + ss(0, n));
}
function fs(e, t = 0.2, n = 0.3, r = 0) {
  (e.kn(n, { ft: `lowpass`, f: 2400, to: 0.18, v: t, d: r, a: 0.03 }),
    e.kn(n * 0.8, { f: 500, to: 1.8, q: 1, v: t * 0.5, d: r }),
    e.kt(85, n * 0.7, { to: 0.6, v: t * 0.6, d: r }));
}
function ps(e, t = 280, n = 0.14, r = 0, i = 2.1) {
  e.kt(t, 0.11, { to: i, v: n, d: r, sl: 0.08 });
}
function ms(e, t = 0.16, n = 0.28, r = 0) {
  (e.kn(n, { f: 1400, to: 0.35, q: 0.8, v: t, d: r, a: 0.004 }),
    e.kn(n * 0.6, { ft: `lowpass`, f: 600, v: t * 0.6, d: r }));
}
function hs(e, t, n = 0.1, r = 0, i = 98) {
  (e.kt(i, t, { w: `sawtooth`, lp: 1500, v: n, d: r, vib: [33, 0.3], a: 0.004 }),
    e.kt(i * 1.5, t * 0.8, { w: `square`, lp: 900, v: n * 0.5, d: r, vib: [47, 0.2] }));
}
function gs(e, t = 0.08, n = 0) {
  e.kn(0.05, { f: 2400, q: 1.5, v: t, d: n, a: 0.001 });
}
function _s(e, t, n = 0.07, r = 0, i = 0.45) {
  (e.kt(t, i, { v: n, d: r, a: 0.004 }), e.kt(t * 2, i * 0.5, { v: n * 0.22, d: r }));
}
function vs(e, t, n, r = 0.1, i = 0, a = 1.35) {
  (e.kt(t, n, { v: r, d: i, to: a, vib: [7, 0.035], a: n * 0.25 }),
    e.kt(t * 1.5, n, { v: r * 0.35, d: i, to: a, vib: [5, 0.03], a: n * 0.3 }));
}
function ys(e, t, n, r = 0.1, i = 0) {
  e.kt(t, n, { w: `triangle`, lp: 800, v: r, d: i, to: 0.65, vib: [5.5, 0.06], a: n * 0.3 });
}
function bs(e, t = 4, n = 0.1, r = 0, i = 0.12) {
  for (let a = 0; a < t; a++) {
    let o = r + (a * i) / t + ss(0, 0.02);
    (e.kn(0.05, { f: ss(450, 1100), q: 3, v: n, d: o }),
      e.kt(ss(140, 220), 0.06, { w: `triangle`, to: 0.7, v: n * 0.8, d: o }));
  }
}
function xs(e, t = 1050, n = 0.045, r = 0) {
  (e.kt(t, 0.22, { w: `triangle`, v: n, d: r }), e.kt(t * 1.5, 0.12, { v: n * 0.4, d: r }));
}
function Ss(e, t, n = 0.1, r = 0) {
  e.kn(t, { f: 2200, to: 0.6, q: 1.1, v: n, d: r, a: t * 0.2 });
}
function Cs(e, t, n = 0.14, r = 0, i = 450) {
  e.kn(t, { f: i, to: 2.6, q: 2.2, v: n, d: r, a: t * 0.45 });
}
function ws(e, t, n = 0.1, r = 0) {
  (e.kn(t, { f: 1700, to: 0.7, q: 0.9, v: n, d: r, a: 0.01 }), ds(e, 3, t, n * 0.4, r, 1200, 2e3));
}
function Ts(e, t = 330, n = 0.1, r = 0) {
  (e.kt(t, 0.4, { w: `triangle`, v: n, d: r, a: 0.002 }),
    e.kt(t * 2.76, 0.22, { v: n * 0.3, d: r }),
    e.kt(t * 4.07, 0.12, { v: n * 0.12, d: r }),
    cs(e, 1800, n * 0.6, r));
}
function Es(e, t = 380, n = 0.12, r = 0) {
  (e.kt(t, 0.07, { w: `triangle`, to: 0.75, v: n, d: r, a: 0.001 }),
    e.kn(0.035, { f: t * 2.4, q: 4, v: n * 0.6, d: r }));
}
function Ds(e, t, n = 110, r = 0.12) {
  (e.kt(n, t, { w: `triangle`, lp: 1200, to: 3, v: r * 0.6, a: t * 0.85 }),
    e.kn(t, { f: 300, to: 5, q: 3, v: r * 0.8, a: t * 0.9 }));
}
function Os(e, t, n, r = 0.1, i = 1e3) {
  (e.kt(n, t, { w: `sawtooth`, lp: i, v: r, a: 0.04, vib: [6, 0.015] }),
    e.kt(n * 2, t, { v: r * 0.5, a: 0.05 }));
}
function ks(e, t, n = 75, r = 0.12, i = 0) {
  e.kt(n, t, { w: `sawtooth`, lp: 520, v: r, d: i, vib: [13, 0.08], to: 0.75, a: 0.03 });
}
function As(e, t, n, r = 0.06, i = 0, a = `sine`) {
  t.forEach((t, o) => e.kt(t, n * 2.4, { w: a, v: r, d: i + o * n, a: 0.01 }));
}
function js(e, t = 1) {
  (cs(e, 900, 0.14 * t), A(e, 160, 0.2 * t, 0.01), cs(e, 650, 0.12 * t, 0.05));
}
function Ms(e, t = 130, n = 0.28) {
  (j(e, 500, 0.08, 0.07), A(e, t, n, 0.04), cs(e, 1100, n * 0.3, 0.04));
}
function Ns(e, t = 0.12, n = 0) {
  (e.kt(160, 0.14, { to: 1.6, v: t, d: n }), e.kn(0.14, { ft: `lowpass`, f: 700, v: t * 0.8, d: n }));
}
function Ps(e, t = 0.16, n = 0) {
  (e.kn(0.14, { ft: `lowpass`, f: 900, to: 0.4, v: t, d: n, a: 0.002 }),
    e.kt(150, 0.12, { to: 0.6, v: t * 0.8, d: n }));
}
function Fs(e, t, n = 0.1) {
  e.kn(t, { f: 300, to: 3.2, q: 1.6, v: n, a: t * 0.85 });
}
var Is = [262, 294, 330, 392, 440, 523, 587, 659],
  Ls = {
    "vine-whip": {
      cast: (e) => {
        (j(e, 400, 0.12, 0.1, 0, 4), cs(e, 1700, 0.1, 0.09), A(e, 180, 0.14, 0.09, 0.1));
      },
    },
    "razor-leaf": {
      cast: (e) => {
        (ls(e, 1400, 0.16, 0.1), cs(e, 1200, 0.07, 0.02));
      },
    },
    "sleep-powder": {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (e.kn(n, { f: 1800, to: 0.5, q: 0.8, v: 0.06, a: n * 0.3 }), As(e, [392, 330, 294], 0.16, 0.035));
      },
    },
    "solar-beam": {
      charge: (e) => {
        (Ds(e, 0.5, 140, 0.08), _s(e, 392, 0.025, 0.1), _s(e, 523, 0.025, 0.3));
      },
      cast: (e, t) => {
        let n = t.dur ?? 0.6;
        (A(e, 90, 0.3),
          Os(e, n, 110, 0.09, 1400),
          e.kn(n, { f: 1200, q: 0.8, v: 0.06, a: 0.04 }),
          _s(e, 523, 0.05));
      },
    },
    ember: {
      cast: (e) => {
        (fs(e, 0.12, 0.18), ds(e, 3, 0.2, 0.04));
      },
    },
    "fire-spin": {
      cast: (e) => {
        (fs(e, 0.14, 0.5), Cs(e, 0.5, 0.08, 0, 300));
      },
      impact: (e) => {
        (M(e, 0.6), ds(e, 6, 0.35, 0.05));
      },
    },
    flamethrower: {
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (e.kn(n, { ft: `lowpass`, f: 1800, to: 0.6, v: 0.12, a: 0.06 }),
          e.kt(70, n, { w: `sawtooth`, lp: 400, v: 0.07, a: 0.08 }),
          ds(e, 8, n, 0.04, 0, 800, 1800));
      },
    },
    "fire-blast": {
      cast: (e) => {
        (fs(e, 0.2, 0.3), A(e, 90, 0.16));
      },
      impact: (e) => {
        (M(e, 1), ds(e, 10, 0.5, 0.05), fs(e, 0.12, 0.5));
      },
    },
    "water-gun": {
      cast: (e) => {
        (ps(e, 300, 0.1), e.kn(0.12, { f: 1800, to: 0.5, q: 0.9, v: 0.08 }));
      },
    },
    bubble: { cast: (e) => ps(e, ss(340, 520), 0.07, 0, 1.8) },
    "rapid-spin": {
      cast: (e) => {
        (Cs(e, 0.3, 0.16, 0, 350), j(e, 700, 0.08, 0.2, 0.05), A(e, 140, 0.14, 0.02));
      },
    },
    "hydro-pump": {
      charge: (e) => {
        (Ds(e, 0.5, 90, 0.1), ps(e, 200, 0.07, 0.1), ps(e, 240, 0.07, 0.25), ps(e, 290, 0.07, 0.38));
      },
      cast: (e, t) => {
        let n = t.dur ?? 0.6;
        (A(e, 90, 0.28), e.kn(n, { f: 900, to: 0.7, q: 0.7, v: 0.2, a: 0.03 }), us(e, n, 0.1));
      },
    },
    "thunder-shock": {
      cast: (e) => {
        (hs(e, 0.14, 0.13, 0, 130), gs(e, 0.09));
      },
    },
    "electro-ball": {
      cast: (e) => {
        (hs(e, 0.2, 0.08), vs(e, 220, 0.2, 0.05));
      },
      impact: (e) => {
        (M(e, 0.5), hs(e, 0.25, 0.09), gs(e, 0.08));
      },
    },
    thunderbolt: {
      cast: (e, t) => {
        hs(e, 0.25, 0.11);
        for (let n = 0; n < Math.min(5, (t.k ?? 3) + 1); n++) gs(e, 0.07, n * 0.035);
        A(e, 110, 0.12);
      },
    },
    thunder: {
      impact: (e) => {
        (gs(e, 0.12), M(e, 0.7), hs(e, 0.2, 0.08, 0, 70), us(e, 0.6, 0.08, 0.05));
      },
    },
    swift: {
      cast: (e) => {
        (_s(e, 659, 0.03), _s(e, 880, 0.02, 0.05, 0.3), j(e, 900, 0.06, 0.15));
      },
    },
    "quick-attack": {
      cast: (e) => {
        (j(e, 700, 0.14, 0.14, 0, 3), A(e, 150, 0.16, 0.1));
      },
    },
    "last-resort": {
      warn: (e, t) => Fs(e, t.dur ?? 0.7, 0.09),
      impact: (e) => {
        (M(e, 1), A(e, 60, 0.25, 0.02), _s(e, 392, 0.04, 0.05));
      },
    },
    lick: {
      cast: (e) => {
        (ps(e, 200, 0.1, 0, 1.6), e.kn(0.12, { ft: `lowpass`, f: 800, v: 0.1 }), ys(e, 260, 0.2, 0.05, 0.03));
      },
    },
    "night-shade": { cast: (e) => ys(e, 260, 0.4, 0.06) },
    "shadow-ball": {
      cast: (e) => {
        (ys(e, 180, 0.35, 0.09), e.kn(0.3, { ft: `lowpass`, f: 600, to: 2, v: 0.08, a: 0.1 }));
      },
      impact: (e) => {
        (M(e, 0.7), ys(e, 140, 0.4, 0.07, 0.03));
      },
    },
    hex: {
      cast: (e, t) => {
        vs(e, 200, 0.35, 0.07, 0, 0.7);
        for (let n = 0; n < Math.min(5, (t.k ?? 3) + 1); n++) cs(e, 700, 0.06, n * 0.05);
      },
    },
    "karate-chop": {
      cast: (e) => {
        (j(e, 600, 0.1, 0.08, 0, 3), A(e, 130, 0.28, 0.05), cs(e, 1200, 0.07, 0.05));
      },
    },
    "low-kick": {
      cast: (e) => {
        (j(e, 400, 0.12, 0.2), A(e, 100, 0.24, 0.1));
      },
    },
    "cross-chop": {
      cast: (e) => {
        (j(e, 600, 0.09, 0.08), j(e, 700, 0.09, 0.08, 0.06), A(e, 120, 0.3, 0.1), cs(e, 1100, 0.08, 0.1));
      },
    },
    "dynamic-punch": {
      cast: (e) => {
        (Ms(e, 80, 0.32), M(e, 0.6, 0.05));
      },
    },
    confusion: { cast: (e) => vs(e, 330, 0.2, 0.05, 0, 1.25) },
    psybeam: {
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        (vs(e, 220, n, 0.035, 0, 1.2), vs(e, 330, n, 0.02, 0.03, 0.85));
      },
    },
    psychic: {
      cast: (e) => {
        (vs(e, 160, 0.5, 0.06, 0, 2), e.kn(0.4, { f: 600, to: 3, q: 1.5, v: 0.08 }), A(e, 70, 0.2));
      },
    },
    "future-sight": {
      warn: (e, t) => {
        (vs(e, 220, t.dur ?? 0.7, 0.05, 0, 1.5), _s(e, 440, 0.03));
      },
      impact: (e) => {
        (M(e, 0.7), _s(e, 330, 0.05, 0.03), _s(e, 495, 0.04, 0.08));
      },
    },
    "rock-throw": {
      cast: (e) => {
        (j(e, 400, 0.13, 0.15), Es(e, 260, 0.13));
      },
      impact: (e) => {
        (bs(e, 5, 0.1), A(e, 110, 0.2));
      },
    },
    rollout: {
      cast: (e) => {
        (us(e, 0.5, 0.16), bs(e, 3, 0.1, 0.05, 0.4));
      },
    },
    magnitude: {
      cast: (e) => {
        (us(e, 0.7, 0.28), bs(e, 6, 0.12, 0.05, 0.4), A(e, 70, 0.3));
      },
    },
    "rock-slide": {
      impact: (e) => {
        (bs(e, 4, 0.1), A(e, 120, 0.2));
      },
    },
    tackle: {
      cast: (e) => {
        (j(e, 500, 0.12, 0.14), A(e, 120, 0.24, 0.1));
      },
    },
    flail: {
      cast: (e) => {
        (ms(e, 0.08, 0.15), ps(e, 220, 0.08, 0.02), A(e, 150, 0.2, 0.03));
      },
    },
    waterfall: {
      cast: (e) => {
        (e.kn(0.35, { f: 1100, to: 0.5, q: 0.8, v: 0.16, a: 0.04 }),
          ms(e, 0.12, 0.3, 0.15),
          A(e, 110, 0.24, 0.15));
      },
    },
    "hyper-beam": {
      charge: (e) => Ds(e, 0.5, 90, 0.12),
      cast: (e, t) => {
        let n = t.dur ?? 0.6;
        (M(e, 0.5), Os(e, n, 80, 0.13, 900), e.kn(n, { ft: `lowpass`, f: 1200, v: 0.08, a: 0.05 }));
      },
    },
    "dragon-rage": {
      cast: (e) => {
        (ks(e, 0.3, 80, 0.1), fs(e, 0.08, 0.2));
      },
    },
    "dragon-pulse": {
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        (ks(e, n, 70, 0.1), Os(e, n, 140, 0.06, 900), A(e, 90, 0.18));
      },
    },
    "draco-meteor": {
      warn: (e, t) => Fs(e, t.dur ?? 0.7, 0.11),
      impact: (e) => {
        (M(e, 1.1), ks(e, 0.5, 60, 0.1, 0.02), bs(e, 4, 0.06, 0.05));
      },
    },
    "fury-cutter": {
      cast: (e) => {
        (ls(e, 1700, 0.2, 0.12), cs(e, 1300, 0.08, 0.08), A(e, 170, 0.1, 0.08, 0.08));
      },
    },
    "aerial-ace": { cast: (e) => j(e, 800, 0.12, 0.18, 0, 3) },
    "air-slash": {
      cast: (e) => {
        (ls(e, 1600, 0.1, 0.22), Cs(e, 0.25, 0.06));
      },
    },
    "x-scissor": {
      cast: (e) => {
        (ls(e, 1900, 0.11, 0.14), ls(e, 1500, 0.11, 0.14, 0.05), cs(e, 1300, 0.08, 0.08));
      },
    },
    "leech-life": {
      cast: (e) => {
        (ps(e, 200, 0.11, 0, 1.4), e.kn(0.15, { f: 500, to: 2.5, q: 2, v: 0.13 }));
      },
    },
    "wing-attack": {
      cast: (e) => {
        (Cs(e, 0.09, 0.18, 0, 500), Cs(e, 0.09, 0.18, 0.09, 500));
      },
    },
    "poison-fang": {
      cast: (e) => {
        (js(e, 0.9), Ns(e, 0.08, 0.06));
      },
    },
    "air-cutter": {
      cast: (e) => {
        (ls(e, 1300, 0.15, 0.1), Cs(e, 0.1, 0.05, 0, 600));
      },
    },
    "will-o-wisp": {
      cast: (e) => {
        (fs(e, 0.07, 0.25), vs(e, 250, 0.3, 0.05));
      },
    },
    "flame-burst": {
      cast: (e) => fs(e, 0.14, 0.25),
      impact: (e) => {
        (M(e, 0.6), ds(e, 8, 0.4, 0.05));
      },
    },
    extrasensory: {
      cast: (e) => {
        (vs(e, 300, 0.25, 0.045, 0, 0.8), _s(e, 440, 0.02, 0.03));
      },
    },
    "heat-wave": {
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (e.kn(n, { ft: `lowpass`, f: 900, v: 0.14, a: n * 0.3 }), Cs(e, n, 0.07, 0, 300), ds(e, 6, n, 0.035));
      },
    },
    pound: {
      cast: (e) => {
        (A(e, 170, 0.18), e.kt(220, 0.12, { to: 1.5, v: 0.06, d: 0.02 }));
      },
    },
    sing: {
      cast: (e, t) => {
        t.k || As(e, [392, 330, 392, 494, 392], 0.11, 0.04);
      },
    },
    round: { cast: (e) => As(e, [330, 392, 494], 0.07, 0.035) },
    "hyper-voice": {
      cast: (e) => {
        (e.kt(220, 0.45, { w: `sawtooth`, lp: 900, v: 0.07, vib: [6, 0.02], a: 0.03 }),
          e.kt(277, 0.45, { w: `sawtooth`, lp: 900, v: 0.05, vib: [6.5, 0.02], a: 0.03 }),
          A(e, 90, 0.2));
      },
    },
    "body-slam": {
      cast: (e) => {
        (A(e, 70, 0.36), us(e, 0.4, 0.14), M(e, 0.4));
      },
    },
    stomp: {
      cast: (e) => {
        (A(e, 60, 0.32), us(e, 0.3, 0.12), bs(e, 2, 0.05, 0.03));
      },
    },
    "giga-impact": {
      warn: (e, t) => Fs(e, t.dur ?? 0.7, 0.1),
      impact: (e) => {
        (M(e, 1.2), A(e, 50, 0.3), us(e, 0.8, 0.14));
      },
    },
    "water-pulse": {
      cast: (e) => {
        (ps(e, 240, 0.1), vs(e, 260, 0.2, 0.04));
      },
      impact: (e) => {
        (ms(e, 0.16, 0.35), ps(e, 300, 0.08, 0.02, 0.5), A(e, 100, 0.14));
      },
    },
    "ice-beam": {
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        (Ss(e, n, 0.08), Os(e, n, 180, 0.04, 800));
        for (let t = 0; t < 4; t++) xs(e, ss(900, 1250), 0.035, (t * n) / 4);
      },
    },
    surf: {
      cast: (e) => {
        (ms(e, 0.16, 0.7), us(e, 0.5, 0.1), e.kn(0.6, { f: 600, to: 2, q: 0.8, v: 0.08, a: 0.2 }));
      },
    },
    blizzard: {
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (Cs(e, n, 0.14, 0, 400), Ss(e, n, 0.07));
        for (let t = 0; t < 3; t++) xs(e, ss(900, 1200), 0.03, ss(0, n));
      },
    },
    "mach-punch": {
      cast: (e) => {
        (A(e, 160, 0.17), cs(e, 1100, 0.07));
      },
    },
    "force-palm": {
      cast: (e) => {
        (j(e, 400, 0.08, 0.08),
          A(e, 110, 0.26, 0.05),
          e.kn(0.18, { ft: `lowpass`, f: 700, v: 0.1, d: 0.05 }));
      },
    },
    "aura-sphere": {
      cast: (e) => {
        (e.kt(150, 0.3, { w: `triangle`, to: 1.4, v: 0.09, a: 0.05 }),
          Cs(e, 0.25, 0.07),
          _s(e, 330, 0.03, 0.05));
      },
    },
    "close-combat": {
      cast: (e) => {
        for (let t = 0; t < 4; t++)
          (j(e, 500, 0.06, 0.06, t * 0.06), A(e, 120 + t * 15, 0.16, t * 0.06 + 0.03, 0.1));
      },
    },
    "sand-tomb": {
      cast: (e) => {
        (e.kn(0.6, { f: 1500, q: 0.6, v: 0.09, a: 0.2 }), us(e, 0.5, 0.08));
      },
      impact: (e) => {
        (A(e, 100, 0.22), e.kn(0.3, { f: 1300, to: 0.5, q: 0.6, v: 0.13 }));
      },
    },
    "dragon-claw": {
      cast: (e) => {
        (ls(e, 1600, 0.12, 0.14), ks(e, 0.15, 90, 0.06), A(e, 130, 0.18, 0.06));
      },
    },
    dig: {
      cast: (e) => {
        (us(e, 0.3, 0.14), bs(e, 3, 0.06, 0.15), A(e, 100, 0.22, 0.2));
      },
    },
    earthquake: {
      cast: (e) => {
        (us(e, 1, 0.3), M(e, 0.8), bs(e, 6, 0.07, 0.1, 0.5));
      },
    },
    "stone-edge": {
      cast: (e) => {
        (bs(e, 6, 0.08, 0, 0.3), Es(e, 300, 0.1), A(e, 110, 0.18));
      },
    },
    "disarming-voice": {
      cast: (e) => {
        for (let [t, n] of [
          [330, 0],
          [415, 0.02],
          [494, 0.04],
        ])
          e.kt(t, 0.4, { v: 0.022, d: n, vib: [5, 0.015], a: 0.04 });
        _s(e, 659, 0.018, 0.06);
      },
    },
    "magical-leaf": {
      cast: (e) => {
        (ws(e, 0.15, 0.06), _s(e, 659, 0.03, 0.02, 0.3));
      },
    },
    moonblast: {
      cast: (e) => {
        (_s(e, 523, 0.03), _s(e, 784, 0.02, 0.04), vs(e, 260, 0.3, 0.03));
      },
      impact: (e) => {
        (M(e, 0.5), [392, 494, 587].forEach((t, n) => _s(e, t, 0.022, 0.03 + n * 0.03, 0.6)));
      },
    },
    "powder-snow": {
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (Ss(e, n, 0.07), xs(e, 1e3, 0.03, 0.1), xs(e, 1150, 0.025, n * 0.6));
      },
    },
    "ice-shard": {
      cast: (e) => {
        (xs(e, 1100, 0.05), e.kn(0.06, { f: 2200, q: 1.5, v: 0.06, a: 0.001 }));
      },
    },
    "ice-ball": {
      cast: (e) => {
        (us(e, 0.4, 0.08), xs(e, 950, 0.035, 0.05), xs(e, 1150, 0.03, 0.2));
      },
    },
    avalanche: {
      warn: (e, t) => Fs(e, t.dur ?? 0.7, 0.09),
      impact: (e) => {
        (M(e, 0.9),
          bs(e, 5, 0.07, 0.03),
          Ss(e, 0.5, 0.08, 0.05),
          xs(e, 1e3, 0.04, 0.1),
          xs(e, 1250, 0.03, 0.18));
      },
    },
    absorb: {
      cast: (e) => {
        (e.kn(0.18, { f: 500, to: 2.5, q: 2, v: 0.07 }), _s(e, 523, 0.03, 0.05, 0.3));
      },
    },
    "bullet-seed": { cast: (e) => Es(e, ss(480, 560), 0.11) },
    "leaf-blade": {
      cast: (e) => {
        (ls(e, 1700, 0.12, 0.18), ws(e, 0.15, 0.05, 0.03));
      },
    },
    "leaf-storm": {
      cast: (e) => {
        (Cs(e, 0.6, 0.18, 0, 350), ws(e, 0.6, 0.12), A(e, 90, 0.18));
      },
    },
    "fire-fang": {
      cast: (e) => {
        (js(e), fs(e, 0.08, 0.2, 0.03));
      },
    },
    "flare-blitz": {
      cast: (e) => {
        (fs(e, 0.2, 0.4), A(e, 90, 0.3, 0.15), ds(e, 6, 0.4, 0.045, 0.1));
      },
    },
    "shock-wave": {
      cast: (e) => {
        (hs(e, 0.18, 0.11, 0, 130), gs(e, 0.08, 0.03));
      },
    },
    "cotton-spore": {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        e.kn(n, { ft: `lowpass`, f: 900, v: 0.07, a: n * 0.4 });
        for (let t = 0; t < 3; t++) ps(e, ss(260, 340), 0.04, t * 0.12, 1.3);
      },
    },
    "charge-beam": {
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        (hs(e, n, 0.08), Os(e, n, 110, 0.05, 1e3), gs(e, 0.07));
      },
    },
    "zap-cannon": {
      cast: (e) => {
        (hs(e, 0.3, 0.09), A(e, 100, 0.18));
      },
      impact: (e) => {
        (M(e, 0.8), hs(e, 0.35, 0.1, 0.02), gs(e, 0.08), gs(e, 0.06, 0.06));
      },
    },
    "mud-slap": {
      cast: (e) => {
        (Ps(e, 0.2), ps(e, 170, 0.06, 0.02, 1.5));
      },
    },
    "mud-bomb": {
      cast: (e) => j(e, 350, 0.08, 0.15),
      impact: (e) => {
        (Ps(e, 0.2), A(e, 90, 0.2), Ns(e, 0.08, 0.05));
      },
    },
    "muddy-water": {
      cast: (e) => {
        (e.kn(0.7, { ft: `lowpass`, f: 1100, to: 0.6, v: 0.16, a: 0.05 }),
          us(e, 0.5, 0.1),
          ps(e, 180, 0.06, 0.1, 1.5));
      },
    },
    "hammer-arm": {
      cast: (e) => {
        (j(e, 350, 0.1, 0.12), A(e, 65, 0.36, 0.08), us(e, 0.35, 0.12, 0.08), bs(e, 3, 0.05, 0.1));
      },
    },
    "bone-club": {
      cast: (e) => {
        (j(e, 500, 0.08, 0.1), Es(e, 360, 0.14, 0.06), A(e, 130, 0.16, 0.06));
      },
    },
    bonemerang: {
      cast: (e) => {
        (Es(e, 380, 0.14), e.kn(0.5, { f: 600, to: 1.5, q: 3, v: 0.11, a: 0.1 }));
      },
    },
    "bone-rush": {
      gap: 0.3,
      cast: (e) => {
        (Es(e, 340, 0.1), Es(e, 400, 0.09, 0.08), Es(e, 360, 0.08, 0.16), Cs(e, 0.4, 0.07));
      },
    },
    "shadow-bone": {
      cast: (e) => {
        (Es(e, 320, 0.11), ys(e, 220, 0.35, 0.07, 0.03));
      },
    },
    metronome: {
      gap: 0.5,
      cast: (e) => {
        (As(e, [440, 494, 587], 0.07, 0.035), Es(e, 700, 0.04));
      },
    },
    "fairy-wind": {
      cast: (e, t) => {
        let n = t.dur ?? 1;
        Cs(e, n, 0.09, 0, 500);
        for (let t = 0; t < 3; t++) _s(e, Is[3 + ((t * 2) % 5)], 0.025, ss(0, n * 0.7), 0.3);
      },
    },
    "dazzling-gleam": {
      cast: (e) => {
        ([523, 659, 784].forEach((t, n) => _s(e, t, 0.022, n * 0.025, 0.6)),
          Cs(e, 0.3, 0.06),
          A(e, 90, 0.14));
      },
    },
    "sky-attack": {
      warn: (e, t) => Fs(e, t.dur ?? 0.7, 0.11),
      impact: (e) => {
        (M(e, 1), Cs(e, 0.4, 0.1, 0, 600));
      },
    },
    astonish: {
      cast: (e) => {
        (ys(e, 300, 0.18, 0.07), cs(e, 900, 0.06));
      },
    },
    "shadow-claw": {
      cast: (e) => {
        (ls(e, 1500, 0.12, 0.16), ys(e, 180, 0.25, 0.06, 0.03));
      },
    },
    "power-gem": {
      cast: (e) => {
        (_s(e, Is[3 + Math.floor(Math.random() * 5)], 0.04, 0, 0.3), cs(e, 1300, 0.03));
      },
    },
    "foul-play": {
      impact: (e) => {
        (A(e, 100, 0.22), ks(e, 0.25, 65, 0.08), ys(e, 200, 0.25, 0.05, 0.05));
      },
    },
    "horn-attack": {
      cast: (e) => {
        (A(e, 140, 0.24), Es(e, 300, 0.1));
      },
    },
    "pin-missile": {
      cast: (e) => {
        (cs(e, 1200, 0.12), j(e, 800, 0.12, 0.07), A(e, 200, 0.05, 0.02, 0.06));
      },
    },
    "brick-break": {
      cast: (e) => {
        (j(e, 450, 0.1, 0.1), A(e, 110, 0.32, 0.07), bs(e, 3, 0.07, 0.08));
      },
    },
    megahorn: {
      cast: (e) => {
        (j(e, 500, 0.14, 0.2, 0, 3), A(e, 80, 0.2, 0.1));
      },
      impact: (e) => {
        (M(e, 0.5), bs(e, 3, 0.06, 0.02));
      },
    },
    "night-slash": {
      cast: (e) => {
        (ls(e, 1700, 0.2, 0.14), ks(e, 0.12, 90, 0.07), cs(e, 1300, 0.08, 0.06));
      },
    },
    "razor-wind": {
      cast: (e) => {
        (Cs(e, 0.5, 0.12, 0, 400), ls(e, 1500, 0.08, 0.25, 0.05));
      },
    },
    "sucker-punch": {
      cast: (e) => {
        (j(e, 800, 0.1, 0.08, 0, 4), A(e, 130, 0.26, 0.06));
      },
    },
    "dark-pulse": {
      cast: (e) => {
        (ks(e, 0.5, 60, 0.1),
          e.kn(0.4, { ft: `lowpass`, f: 900, to: 0.4, v: 0.14, a: 0.02 }),
          vs(e, 130, 0.4, 0.06, 0, 0.6));
      },
    },
    "dragon-breath": {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (ks(e, n * 0.8, 70, 0.08), fs(e, 0.12, n));
      },
    },
    headbutt: {
      cast: (e) => {
        (A(e, 110, 0.32), Es(e, 220, 0.1));
      },
    },
    "dragon-rush": {
      cast: (e) => {
        (ks(e, 0.3, 80, 0.09), j(e, 500, 0.12, 0.2), A(e, 90, 0.3, 0.15));
      },
    },
    outrage: {
      cast: (e, t) => {
        let n = t.k ?? 0;
        (A(e, 70 + n * 10, 0.3), ks(e, 0.25, 70 + n * 8, 0.08), us(e, 0.25, 0.1));
      },
    },
    "metal-claw": {
      cast: (e) => {
        (ls(e, 1500, 0.1, 0.14), Ts(e, 440, 0.06, 0.05));
      },
    },
    "bullet-punch": {
      cast: (e) => {
        (A(e, 160, 0.1), Ts(e, 520, 0.035));
      },
    },
    "meteor-mash": {
      warn: (e, t) => Fs(e, t.dur ?? 0.7, 0.1),
      impact: (e) => {
        (M(e, 1), Ts(e, 260, 0.08, 0.02));
      },
    },
    "ancient-power": {
      gap: 0.3,
      cast: (e) => {
        (bs(e, 4, 0.07, 0, 0.3), vs(e, 200, 0.5, 0.035), _s(e, 294, 0.025, 0.1, 0.6));
      },
    },
    "string-shot": {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (e.kn(n, { f: 1100, to: 0.8, q: 2.5, v: 0.05, a: n * 0.2 }), j(e, 700, 0.06, 0.15));
      },
    },
    "bug-bite": {
      cast: (e) => {
        (cs(e, 1e3, 0.12), cs(e, 800, 0.12, 0.06), Ns(e, 0.08, 0.08));
      },
    },
    gust: {
      cast: (e) => Cs(e, 0.4, 0.12, 0, 380),
      impact: (e) => {
        (Cs(e, 0.35, 0.1, 0, 300), ws(e, 0.25, 0.06));
      },
    },
    "bug-buzz": {
      cast: (e) => {
        (e.kt(150, 0.45, { w: `triangle`, lp: 900, v: 0.1, vib: [38, 0.08], a: 0.02 }),
          e.kt(225, 0.4, { lp: 800, v: 0.05, vib: [41, 0.06], a: 0.03 }),
          A(e, 120, 0.12));
      },
    },
    "poison-sting": {
      cast: (e) => {
        (j(e, 900, 0.07, 0.07, 0, 3), cs(e, 1200, 0.06, 0.05));
      },
    },
    twineedle: {
      cast: (e) => {
        (cs(e, 1100, 0.06), cs(e, 1e3, 0.05, 0.03));
      },
    },
    "toxic-spikes": {
      cast: (e) => {
        (bs(e, 3, 0.05, 0, 0.15), Ns(e, 0.05, 0.1));
      },
      impact: (e) => {
        (Ps(e, 0.14), Ns(e, 0.08, 0.05));
      },
    },
    "poison-jab": {
      cast: (e) => {
        (j(e, 700, 0.09, 0.08), A(e, 150, 0.18, 0.07), Ns(e, 0.07, 0.09));
      },
    },
    "feather-dance": {
      cast: (e) => {
        (ls(e, 1100, 0.08, 0.3), As(e, [330, 392, 494], 0.07, 0.03));
      },
    },
    hurricane: {
      cast: (e) => {
        (Cs(e, 0.8, 0.16, 0, 260), us(e, 0.6, 0.06));
      },
      impact: (e) => {
        (Cs(e, 0.6, 0.16, 0, 220), M(e, 0.4), ws(e, 0.4, 0.06, 0.05));
      },
    },
    "hyper-fang": { cast: (e) => js(e, 1.1) },
    pursuit: {
      cast: (e) => {
        (j(e, 500, 0.07, 0.18, 0, 2), ks(e, 0.14, 95, 0.05));
      },
    },
    "double-edge": {
      cast: (e) => {
        (j(e, 450, 0.13, 0.18), A(e, 85, 0.34, 0.13), bs(e, 3, 0.06, 0.14));
      },
    },
    "super-fang": {
      cast: (e, t) => {
        let n = Math.min(4, (t.k ?? 0) + 1);
        for (let t = 0; t < n; t++) (cs(e, 950, 0.1, t * 0.05), A(e, 170, 0.12, t * 0.05 + 0.01, 0.08));
      },
    },
    peck: {
      cast: (e) => {
        (Es(e, 520, 0.1), cs(e, 1100, 0.05, 0.02));
      },
    },
    "fury-attack": { cast: (e, t) => Es(e, 480 + (t.k ?? 0) * 25, 0.07) },
    "drill-run": {
      cast: (e) => {
        (e.kt(110, 0.35, { w: `triangle`, lp: 700, v: 0.1, vib: [30, 0.12], a: 0.02 }),
          us(e, 0.35, 0.12),
          bs(e, 3, 0.05, 0.2));
      },
    },
    "drill-peck": {
      impact: (e) => {
        (e.kt(140, 0.18, { w: `triangle`, lp: 800, v: 0.08, vib: [34, 0.1] }),
          A(e, 120, 0.24, 0.05),
          Es(e, 400, 0.08, 0.05));
      },
    },
    wrap: {
      gap: 0.3,
      cast: (e) => {
        (j(e, 350, 0.12, 0.3, 0, 2),
          e.kn(0.25, { f: 900, to: 0.6, q: 2, v: 0.05, d: 0.05 }),
          A(e, 130, 0.1, 0.22));
      },
    },
    acid: {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        e.kn(n, { f: 1300, to: 0.6, q: 1.2, v: 0.06, a: 0.04 });
        for (let t = 0; t < 4; t++) Ns(e, 0.04, t * n * 0.22);
      },
    },
    "sludge-bomb": {
      cast: (e) => {
        (Ns(e, 0.1), j(e, 400, 0.06, 0.15));
      },
      impact: (e) => {
        (Ps(e, 0.2), M(e, 0.45), Ns(e, 0.08, 0.06));
      },
    },
    "gunk-shot": {
      warn: (e, t) => Fs(e, t.dur ?? 0.7, 0.09),
      impact: (e) => {
        (M(e, 0.9), Ps(e, 0.22, 0.02), Ns(e, 0.1, 0.1), Ns(e, 0.08, 0.2));
      },
    },
    "fury-swipes": { cast: (e, t) => ls(e, 1300 - (t.k ?? 0) * 60, 0.08, 0.08) },
    "crush-claw": {
      cast: (e) => {
        (ls(e, 1400, 0.14, 0.14), A(e, 120, 0.24, 0.08), bs(e, 2, 0.05, 0.1));
      },
    },
    bulldoze: {
      cast: (e) => {
        (A(e, 70, 0.32), us(e, 0.4, 0.15, 0.02), e.kn(0.4, { f: 1500, to: 0.4, q: 0.8, v: 0.04, d: 0.05 }));
      },
    },
    toxic: {
      cast: (e) => {
        (Ns(e, 0.09), vs(e, 180, 0.25, 0.04, 0.03, 0.8));
      },
    },
    "double-kick": {
      cast: (e) => {
        (Ms(e, 140, 0.18), Ms(e, 120, 0.18));
      },
    },
    "body-press": {
      cast: (e) => {
        (A(e, 60, 0.36), us(e, 0.4, 0.14, 0.02), bs(e, 3, 0.06, 0.05));
      },
    },
    "sludge-wave": {
      cast: (e) => {
        (e.kn(0.6, { ft: `lowpass`, f: 700, to: 0.5, v: 0.16, a: 0.08 }), Ns(e, 0.08, 0.1), Ns(e, 0.07, 0.3));
      },
    },
    thrash: {
      gap: 0.25,
      cast: (e) => {
        for (let t = 0; t < 3; t++) A(e, 110 + t * 15, 0.16, t * 0.06, 0.1);
        ks(e, 0.3, 70, 0.07);
      },
    },
    "horn-drill": {
      cast: (e) => {
        (e.kt(95, 0.3, { w: `triangle`, lp: 700, to: 2, v: 0.12, vib: [36, 0.1], a: 0.02 }),
          A(e, 100, 0.26, 0.15),
          Es(e, 300, 0.1, 0.16));
      },
    },
    "earth-power": {
      impact: (e) => {
        (us(e, 0.35, 0.16), A(e, 80, 0.26, 0.04), bs(e, 4, 0.07, 0.06, 0.2));
      },
    },
    "draining-kiss": {
      cast: (e) => {
        (e.kt(330, 0.12, { to: 1.6, v: 0.06, a: 0.01 }), _s(e, 523, 0.03, 0.05, 0.3));
      },
    },
    "stored-power": {
      cast: (e, t) => {
        let n = Math.min(3, t.k ?? 1);
        for (let t = 0; t < n; t++) _s(e, Is[(t * 2 + 3) % Is.length], 0.035, t * 0.05, 0.3);
        vs(e, 260, 0.2, 0.03);
      },
    },
    gravity: {
      cast: (e) => {
        (vs(e, 160, 0.5, 0.06, 0, 0.6), e.kt(55, 0.5, { to: 0.7, v: 0.12, a: 0.1 }));
      },
      impact: (e) => {
        (A(e, 60, 0.34), us(e, 0.3, 0.12), _s(e, 262, 0.03, 0.05, 0.5));
      },
    },
    "mega-drain": {
      cast: (e) => {
        (e.kn(0.22, { f: 450, to: 2.8, q: 2, v: 0.07, a: 0.05 }),
          _s(e, 440, 0.03, 0.06, 0.3),
          _s(e, 587, 0.025, 0.12, 0.3));
      },
    },
    "poison-powder": {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (e.kn(n, { f: 1500, to: 0.7, q: 1, v: 0.045, a: n * 0.3 }), Ns(e, 0.04, 0.05));
      },
    },
    "petal-blizzard": {
      cast: (e) => {
        (Cs(e, 0.4, 0.12, 0, 420), ws(e, 0.35, 0.08, 0.05), As(e, [392, 494, 587], 0.05, 0.03, 0.08));
      },
    },
    "petal-dance": {
      gap: 1,
      cast: (e) => {
        (ws(e, 0.5, 0.06), As(e, [523, 659, 784, 659], 0.08, 0.035, 0, `triangle`));
      },
    },
    slash: {
      cast: (e) => {
        (ls(e, 1500, 0.13, 0.14), cs(e, 900, 0.08, 0.08));
      },
    },
    "stun-spore": {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        e.kn(n, { f: 1700, to: 0.8, q: 1, v: 0.04, a: n * 0.3 });
        for (let t = 0; t < 3; t++) gs(e, 0.04, t * n * 0.3);
      },
    },
    spore: {
      cast: (e) => {
        (Es(e, 300, 0.07), e.kn(0.2, { f: 900, to: 0.6, q: 1.5, v: 0.04, d: 0.03 }));
      },
      impact: (e) => {
        (e.kn(0.45, { f: 1200, to: 0.5, q: 0.9, v: 0.09, a: 0.02 }), vs(e, 220, 0.4, 0.04, 0.05, 0.7));
      },
    },
    "energy-ball": {
      cast: (e) => {
        (vs(e, 200, 0.25, 0.05, 0, 1.8), j(e, 500, 0.06, 0.15));
      },
      impact: (e) => {
        (M(e, 0.4), _s(e, 392, 0.035, 0.03, 0.4), ws(e, 0.25, 0.06, 0.03));
      },
    },
    supersonic: {
      cast: (e) => {
        (e.kt(520, 0.22, { w: `triangle`, lp: 1400, v: 0.05, vib: [18, 0.05], to: 1.2, a: 0.02 }),
          e.kt(390, 0.2, { lp: 1200, v: 0.03, d: 0.04, vib: [15, 0.04] }));
      },
    },
    "u-turn": {
      cast: (e) => {
        (j(e, 600, 0.1, 0.18),
          e.kt(160, 0.25, { w: `triangle`, lp: 800, v: 0.06, vib: [36, 0.08], d: 0.05 }));
      },
    },
    "silver-wind": {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (Cs(e, n, 0.1, 0, 520), ds(e, 5, n, 0.03, 0, 1300, 2e3));
      },
    },
    "signal-beam": {
      gap: 0.4,
      cast: (e, t) => {
        let n = t.dur ?? 0.5;
        (Os(e, n, 147, 0.05, 900), e.kt(294, n, { v: 0.03, vib: [11, 0.08], a: 0.03 }));
      },
    },
    scratch: {
      cast: (e) => {
        (bs(e, 2, 0.05), ls(e, 1300, 0.09, 0.1, 0.03));
      },
    },
    "mud-shot": {
      cast: (e) => {
        (Ns(e, 0.08), j(e, 400, 0.05, 0.1));
      },
    },
    "tri-attack": {
      cast: (e, t) => {
        let n = (t.k ?? 0) % 3;
        n === 0 ? fs(e, 0.1, 0.18) : n === 1 ? xs(e, 1e3, 0.05) : (hs(e, 0.12, 0.06), gs(e, 0.05));
      },
    },
    fissure: {
      gap: 0.6,
      cast: (e) => {
        (us(e, 0.8, 0.18), A(e, 55, 0.3), bs(e, 5, 0.06, 0.1, 0.5));
      },
    },
    "pay-day": {
      cast: (e, t) => {
        (_s(e, [1047, 1175, 1319, 1175, 988][(t.k ?? 0) % 5], 0.03, 0, 0.18), cs(e, 2e3, 0.03));
      },
    },
    "fake-out": {
      cast: (e) => {
        (e.kn(0.05, { f: 1600, q: 1.2, v: 0.16, a: 0.001 }), A(e, 150, 0.14, 0.01));
      },
    },
    assurance: {
      cast: (e) => {
        (j(e, 500, 0.1, 0.15), ks(e, 0.15, 110, 0.05, 0.02), A(e, 120, 0.2, 0.13));
      },
    },
    soak: {
      gap: 0.5,
      cast: (e, t) => {
        let n = t.dur ?? 1;
        (e.kn(n, { f: 1e3, to: 0.7, q: 0.8, v: 0.08, a: 0.04 }), ps(e, 260, 0.08), ps(e, 300, 0.06, n * 0.5));
      },
    },
    "zen-headbutt": {
      cast: (e) => {
        (vs(e, 240, 0.25, 0.06, 0, 1.6), A(e, 110, 0.24, 0.12));
      },
    },
    "aqua-tail": {
      cast: (e) => {
        (ls(e, 1200, 0.12, 0.16), ms(e, 0.12, 0.2, 0.06));
      },
    },
    psyshock: {
      cast: (e) => {
        vs(e, 300, 0.2, 0.05, 0, 1.4);
      },
      impact: (e) => {
        (M(e, 0.35), xs(e, 900, 0.05, 0.02), xs(e, 1200, 0.04, 0.06), vs(e, 180, 0.3, 0.05, 0.03, 0.7));
      },
    },
    "seismic-toss": {
      cast: (e) => {
        j(e, 400, 0.08, 0.2);
      },
      impact: (e) => {
        (A(e, 70, 0.34), us(e, 0.3, 0.12, 0.02), bs(e, 3, 0.05, 0.04));
      },
    },
    "rage-fist": {
      cast: (e) => {
        (ks(e, 0.18, 90, 0.05), j(e, 600, 0.07, 0.12));
      },
    },
    "stomping-tantrum": {
      cast: (e) => {
        for (let t = 0; t < 3; t++) A(e, 75 + t * 8, 0.24, t * 0.09);
        (us(e, 0.35, 0.1, 0.05), ks(e, 0.25, 80, 0.05));
      },
    },
    "final-gambit": {
      warn: (e, t) => {
        (Fs(e, t.dur ?? 0.7, 0.1), Ds(e, t.dur ?? 0.7, 90, 0.08));
      },
      impact: (e) => {
        (M(e, 1.1), us(e, 0.6, 0.16, 0.05), bs(e, 5, 0.07, 0.06, 0.3));
      },
    },
    "bubble-beam": { cast: (e, t) => ps(e, 300 + ((t.k ?? 0) % 4) * 40, 0.07, 0, 2.3) },
    hypnosis: {
      cast: (e) => {
        (e.kt(330, 0.5, { v: 0.05, to: 0.75, vib: [4, 0.06], a: 0.1 }),
          e.kt(440, 0.45, { v: 0.03, to: 0.75, vib: [4.5, 0.05], d: 0.05, a: 0.1 }));
      },
    },
    "circle-throw": {
      cast: (e) => {
        (j(e, 350, 0.12, 0.3, 0, 2), A(e, 100, 0.2, 0.25));
      },
    },
    submission: {
      cast: (e) => {
        (j(e, 450, 0.1, 0.14), ms(e, 0.08, 0.18, 0.05), A(e, 90, 0.3, 0.13));
      },
    },
    slam: {
      cast: (e) => {
        (ls(e, 900, 0.12, 0.12), e.kn(0.04, { f: 2200, q: 1.5, v: 0.08, d: 0.08 }), A(e, 120, 0.18, 0.09));
      },
    },
    "gastro-acid": {
      cast: (e) => {
        (Ns(e, 0.08), j(e, 350, 0.05, 0.15));
      },
      impact: (e) => {
        (Ps(e, 0.16), e.kn(0.6, { f: 2400, to: 0.5, q: 0.8, v: 0.04, d: 0.05, a: 0.05 }));
      },
    },
    "knock-off": {
      cast: (e) => {
        (j(e, 700, 0.1, 0.16), ws(e, 0.15, 0.05, 0.04));
      },
    },
    "power-whip": {
      gap: 0.3,
      cast: (e) => {
        for (let t = 0; t < 2; t++)
          (ls(e, 1e3, 0.12, 0.14, t * 0.1), e.kn(0.04, { f: 2200, q: 1.5, v: 0.07, d: t * 0.1 + 0.1 }));
        A(e, 110, 0.18, 0.12);
      },
    },
    brine: {
      cast: (e) => {
        (ps(e, 240, 0.08), j(e, 450, 0.05, 0.12));
      },
      impact: (e) => {
        (ms(e, 0.16), ds(e, 4, 0.2, 0.03, 0.02, 1500, 2200));
      },
    },
    "acid-spray": {
      cast: (e) => {
        Ns(e, 0.07);
      },
      impact: (e) => {
        (Ps(e, 0.14), Ns(e, 0.06, 0.06));
      },
    },
    venoshock: {
      cast: (e, t) => {
        let n = Math.min(3, (t.k ?? 0) + 1);
        for (let t = 0; t < n; t++) Ns(e, 0.06, t * 0.05);
        j(e, 600, 0.05, 0.1);
      },
    },
    whirlpool: {
      cast: (e) => {
        (e.kn(0.6, { f: 500, to: 1.8, q: 1.5, v: 0.08, a: 0.2 }), ps(e, 200, 0.06, 0.1));
      },
      impact: (e) => {
        (ms(e, 0.2, 0.35), M(e, 0.35));
      },
    },
  };
(Object.assign(Ls, ts, ns, rs, is, as), (Ls[`giga-drain`] ??= Ls.absorb));

export {
  Ls as moveSounds,
  j,
  M,
  ds,
  fs,
  Cs,
  ls,
  ks
};

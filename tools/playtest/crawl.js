/* Hexmancers playtest: whole careers in the real dungeon (PT.crawlRun). Injected after bot.js.
   The bot plays the game the way a person does: it walks the map with the same path-to-tap the
   game uses, bumps into things to use them, reads the dialogs and taps their buttons, solves the
   puzzles with the information the game shows (and makes human mistakes), fights every battle with
   the human battle bot (bot.js, joystick and flicks), opens packs card by card, and goes back to
   camp to shop, build its deck and spend its points.
   Time is virtual: setTimeout, setInterval and performance.now run on the bot's own clock and the
   map is never drawn, so an hour of play takes about a minute.
   Fun and frustration: every moment that would please or annoy a person is logged with a weight
   (see FUN and FRUS below); the report adds them up by kind, by depth and over time, and marks the
   points where a player of that type would likely have quit. */
(function () {
  const C = (PT.crawl = {});
  const U = window.PTSupport;
  if (!U) throw Error('Load support.js before crawl.js');
  const DT = 1 / 20; // map ticks; fights run at bot.js's own 1/30
  let VT = 0,
    Q = [],
    qid = 1,
    installed = false,
    realNow = null,
    DBASE = 1.7e12;
  function installClock() {
    if (installed) return;
    installed = true;
    realNow = performance.now.bind(performance);
    window.setTimeout = (f, ms, ...a) => {
      const id = qid++;
      if (typeof f === 'function') Q.push({ id, t: VT + (+ms || 0) / 1000, f, a });
      return id;
    };
    window.clearTimeout = id => {
      const i = Q.findIndex(x => x.id === id);
      if (i >= 0) Q.splice(i, 1);
    };
    window.setInterval = (f, ms) => {
      const id = qid++,
        e = Math.max(16, +ms || 16) / 1000;
      Q.push({ id, t: VT + e, f, every: e });
      return id;
    };
    window.clearInterval = window.clearTimeout;
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => {};
    performance.now = () => VT * 1000;
    Date.now = () => Math.floor(DBASE + VT * 1000);
  }
  function fire() {
    for (let k = 0; k < 200; k++) {
      let bi = -1;
      for (let i = 0; i < Q.length; i++) if (Q[i].t <= VT && (bi < 0 || Q[i].t < Q[bi].t)) bi = i;
      if (bi < 0) return;
      const x = Q[bi];
      if (x.every) x.t += x.every;
      else Q.splice(bi, 1);
      try {
        x.f(...(x.a || []));
      } catch (e) {
        err('timer', e);
      }
    }
  }
  const on = id => {
    const e = document.getElementById(id);
    return !!(e && e.classList.contains('on'));
  };
  let R = null,
    P = null,
    rng = Math.random;
  const rand = () => rng(),
    chance = p => rand() < p,
    pick = a => a[Math.floor(rand() * a.length)],
    between = (a, b) => a + (b - a) * rand();
  function recover(kind, detail, fn) {
    const event = { t: +R.T.toFixed(2), kind, detail, applied: R.mode === 'exploratory' };
    R.recoveries.push(event);
    if (!event.applied) {
      err('strict', kind + ': ' + detail);
      return false;
    }
    try {
      fn();
      return true;
    } catch (e) {
      err('recovery ' + kind, e);
      return false;
    }
  }
  function err(where, e) {
    if (!R) return;
    R.errors.push(
      where +
        ': ' +
        ((e && e.message) || e) +
        ' ' +
        ((e && e.stack) || '').split('\n').slice(1, 3).join(' | ')
    );
  }

  /* ---------------- fun and frustration ----------------
   ev(kind, {fun, frus, note}): the weights are the bot's guess at how much a moment matters to a
   person; each style has its own patience (P.patience) and dislikes (P.hate: kinds that count double). */
  function ev(kind, o) {
    o = o || {};
    if (!R) return;
    const d = EX ? EX.depth : R.depth;
    let fun = o.fun || 0,
      frus = o.frus || 0;
    if (P.hate && P.hate[kind]) frus *= P.hate[kind];
    if (P.love && P.love[kind]) fun *= P.love[kind];
    const e = { t: +R.T.toFixed(1), d, k: kind };
    if (fun) e.fun = +fun.toFixed(2);
    if (frus) e.frus = +frus.toFixed(2);
    if (o.note) e.note = String(o.note).slice(0, 90);
    R.events.push(e);
    R.fun += fun;
    R.frus += frus;
    R.mood += fun - frus;
    if (R.traceOn && (kind === 'stuck' || kind === 'lost') && R.trace.length < 8 && EX)
      try {
        if (R.trace.length < 2) R.trace.push({ map: C.map(18) });
        if (kind === 'stuck' && !R.ringDump) R.ringDump = (R.ring || []).slice();
        const dm = distMap();
        R.trace.push({
          k: kind,
          t: e.t,
          task: TASKNAME,
          pc: [xcx(EX.pc), xcy(EX.pc)],
          goal: EX.goal && [xcx(EX.goal.cell), xcy(EX.goal.cell)],
          path: EX.path.length,
          down: [xcx(EX.down), xcy(EX.down)],
          downSeen: !!EX.seen[EX.down],
          dDown: dm[EX.down],
          pathDown: !!pathTo(EX.down),
          busy: EX.busy,
          paused: xPaused,
          dlg: !!EX.dlg,
          stuckT: EX.stuckT,
          action: !!EX.action,
          cursed: !!(EX.cursed && !EX.cursed.done),
          boss: EX.groups.some(g => g.boss),
          doors: [...EX.doors]
            .filter(([i, d]) => EX.seen[i] && d.state !== 'open')
            .map(([i, d]) => [xcx(i), xcy(i), d.state, d.lock])
            .slice(0, 8),
          rooms: roomsSeenFrac().toFixed(2),
          pos: [+(EX.px / XCS).toFixed(2), +(EX.pz / XCS).toFixed(2)],
          block: R.blockInfo,
          keys: XRUN && JSON.stringify(XRUN.keys),
          near: [
            ...EX.props
              .filter(
                p =>
                  !p.gone &&
                  Math.abs(xcx(p.cell) - xcx(EX.pc)) <= 2 &&
                  Math.abs(xcy(p.cell) - xcy(EX.pc)) <= 2
              )
              .map(p => p.kind + (p.solid ? '*' : '') + '@' + xcx(p.cell) + ',' + xcy(p.cell)),
            ...EX.chests
              .filter(c => Math.abs(xcx(c.cell) - xcx(EX.pc)) <= 2 && Math.abs(xcy(c.cell) - xcy(EX.pc)) <= 2)
              .map(c => 'chest' + (c.open ? 'o' : '') + '@' + xcx(c.cell) + ',' + xcy(c.cell)),
            ...EX.groups
              .filter(g => Math.abs(xcx(g.cell) - xcx(EX.pc)) <= 3 && Math.abs(xcy(g.cell) - xcy(EX.pc)) <= 3)
              .map(g => 'foe:' + g.state + (g.dormant ? 'D' : '') + '@' + xcx(g.cell) + ',' + xcy(g.cell))
          ],
          last: R.lastWalk,
          escort: EX.props.filter(p => p.state === 'follow').map(p => p.role),
          note: o.note,
          pads: EX.props
            .filter(p => p.kind === 'tpad')
            .map(
              p =>
                xcx(p.cell) +
                ',' +
                xcy(p.cell) +
                '>' +
                (p.to != null ? xcx(p.to) + ',' + xcy(p.to) : '-') +
                (EX.seen[p.cell] ? '' : '?') +
                (p.gone ? 'G' : '') +
                ':' +
                (EX.propAt.get(p.cell) || {}).kind
            )
            .join(' '),
          repaths: R.repaths && R.repaths.slice(-12),
          walkPos: R.walkPos && R.walkPos.slice(-40).join(' '),
          xpath: EX.path
            .slice(0, 8)
            .map(c => xcx(c) + ',' + xcy(c))
            .join(' '),
          sealUp: R.sealUp,
          seals: XRUN && XRUN.seals,
          upSeen: seenCell(EX.up),
          upPath: !!pathTo(EX.up),
          fails: [...DONE.fails].join(' '),
          keystand: EX.props
            .filter(p => p.kind === 'keystand' && p.key === 'boss')
            .map(p => ({
              at: [xcx(p.cell), xcy(p.cell)],
              taken: !!p.taken,
              seen: seenCell(p.cell),
              d: dm[p.cell],
              done: DONE.props.has(p)
            })),
          bossKeyItem: EX.items
            .filter(i => i.kind === 'key' && i.key === 'boss')
            .map(i => ({ at: [xcx(i.cell), xcy(i.cell)], seen: seenCell(i.cell), d: dm[i.cell] })),
          truth: [...EX.doors]
            .filter(([i, dd]) => dd.state !== 'open' && adj4(i).some(n => dm[n] >= 0))
            .map(
              ([i, dd]) =>
                dd.state +
                (dd.lock ? ':' + dd.lock : '') +
                '@' +
                xcx(i) +
                ',' +
                xcy(i) +
                (roomOf(adj4(i).find(n => dm[n] < 0 && EX.t[n] !== T_ROCK) ?? -1)
                  ? '→' + (roomOf(adj4(i).find(n => dm[n] < 0 && EX.t[n] !== T_ROCK)) || {}).id
                  : '')
            ),
          onRoute: (() => {
            const full = xbfs(EX.t, EX.doors, EX.down, null, null);
            if (full[EX.pc] < 0) return 'none';
            const out = [];
            let cur = EX.pc;
            for (let k = 0; k < 300 && cur !== EX.down; k++) {
              let best = -1;
              for (const n of adj4(cur))
                if (full[n] >= 0 && full[n] < full[cur] && (best < 0 || full[n] < full[best])) best = n;
              if (best < 0) break;
              cur = best;
              const why = [];
              if (!EX.seen[cur]) why.push('unseen');
              if (xKnownTrap(cur)) why.push('trap');
              if (xSolid(cur))
                why.push(
                  'solid:' +
                    EX.propAt.get(cur).kind +
                    (EX.propAt.get(cur).role ? '/' + EX.propAt.get(cur).role : '')
                );
              if (xChestAt(cur))
                why.push(
                  'chest' +
                    (xChestAt(cur).trap ? '(trapped' + (xChestAt(cur).trapKnown ? ',known' : '') + ')' : '')
                );
              if (cur === EX.up) why.push('UP');
              if (dm[cur] < 0 && !why.length) why.push('dm<0');
              if (why.length) out.push(xcx(cur) + ',' + xcy(cur) + ':' + why.join('/'));
              if (out.length > 4) break;
            }
            return out.join(' ');
          })(),
          upReach: (() => {
            const full = xbfs(EX.t, EX.doors, EX.pc, null, null);
            return {
              down: full[EX.down] >= 0,
              downAll: xbfs(EX.t, new Map(), EX.pc, null, null)[EX.down] >= 0
            };
          })()
        });
      } catch (x) {
        R.trace.push({ err: x.message });
      }
    if (fun || frus) {
      R.win10.push([R.T, frus - fun]);
    }
    if (fun || frus) R.lastNovel = R.T;
  }
  function moodTick(dt) {
    R.mood *= Math.exp(-dt / 180);
    while (R.win10.length && R.T - R.win10[0][0] > 600) R.win10.shift();
    const recent = Math.max(
      0,
      R.win10.reduce((a, x) => a + x[1], 0)
    );
    if (recent > P.patience && R.T - (R.lastQuit || -1e9) > 600) {
      R.lastQuit = R.T;
      const top = {};
      for (const e of R.events.filter(e => e.frus && R.T - e.t <= 600)) top[e.k] = (top[e.k] || 0) + e.frus;
      R.quits.push({
        t: Math.round(R.T),
        d: EX ? EX.depth : R.depth,
        recent: Math.round(recent),
        why: Object.entries(top)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k, v]) => k + ' ' + Math.round(v))
          .join(', ')
      });
    }
    R.moodMin = Math.min(R.moodMin, R.mood);
  }

  /* ---------------- watching the game ---------------- */
  let wrapped = false;
  function wrapGame() {
    if (wrapped) return;
    wrapped = true;
    const w = (name, before, after) => {
      const f = window[name];
      if (typeof f !== 'function') return;
      window[name] = function () {
        let s;
        try {
          if (before) s = before.apply(this, arguments);
        } catch (e) {
          err('wrap ' + name, e);
        }
        const r = f.apply(this, arguments);
        try {
          if (after) after.call(this, r, arguments, s);
        } catch (e) {
          err('wrap ' + name, e);
        }
        return r;
      };
    };
    // a number that is not a number reaching your HP: caught where it enters, with the call that sent it
    const nanAt = (where, v) => {
      if (R && !isFinite(v) && (R.nanTrace = R.nanTrace || []).length < 6)
        R.nanTrace.push({
          where,
          v: String(v),
          t: Math.round(R.T),
          d: EX ? EX.depth : 0,
          stack: new Error().stack
            .split('\n')
            .slice(3, 7)
            .map(x =>
              x
                .trim()
                .replace(/\(?file:.*\/game\//, '')
                .replace(/\)$/, '')
            )
            .join(' < ')
        });
    };
    w('hitPlayer', (d, src) =>
      nanAt(
        'hitPlayer dmg from ' +
          (src
            ? src.id +
              ' dmg=' +
              src.dmg +
              ' elite=' +
              src.elite +
              ' minion=' +
              !!(src.def && src.def.minion) +
              ' spd=' +
              src.spd +
              ' seq=' +
              JSON.stringify(src.seq) +
              ' move=' +
              src.nextMove
            : '?'),
        d
      )
    );
    w('healPlayer', n => nanAt('healPlayer', n));
    w('resumeExplore', hp => nanAt('resumeExplore hp', hp));
    w('xHurt', n => nanAt('xHurt', n));
    // every line in the dungeon log: the bot hears what a player reads
    w('xLog', null, (r, [t, cls]) => {
      if (!R) return;
      t = String(t || '');
      logLine(t, cls);
    });
    w(
      'xHurt',
      (n, why) => ({ hp: EX && EX.hp }),
      (r, [n, why], s) => {
        if (!R || !EX) return;
        const lost = (s.hp || 0) - EX.hp;
        if (lost <= 0) return;
        const k = hurtKind(String(why || ''));
        R.hurt[k] = (R.hurt[k] || 0) + lost;
        if (k === 'puzzle' && PZ && TASKNAME.startsWith('puzzle')) PZ.dmg += lost;
        if (k === 'puzzle' && !TASKNAME.startsWith('puzzle')) {
          R.fieldBitten = (R.fieldBitten || 0) + 1;
          ev('puzzle:crossed', {
            frus: 2.5,
            note: 'bitten crossing a puzzle room on the way somewhere else'
          });
          return;
        }
        ev('hurt:' + k, { frus: (k === 'trap' ? 1.5 : k === 'puzzle' ? 1 : 1) + lost / 12, note: why });
      }
    );
    w(
      'xSpring',
      tr => ({ known: tr && tr.known }),
      (r, [tr], s) => {
        if (!R) return;
        if (!s.known) ev('trap:unseen', { frus: 2.5, note: TRAPS[tr.kind] && TRAPS[tr.kind].name });
        else ev('trap:known', { frus: 1 });
      }
    );
    w(
      'xDlg',
      o => ({ was: EX && EX.dlg }),
      (r, [o], s) => {
        if (!R || !o) return;
        if (s.was === o) return;
        const t = String(o.title || '?');
        R.dlgN++;
        R.dlgs[t] = (R.dlgs[t] || 0) + 1;
        R.recentDlg.push(R.T);
        while (R.recentDlg.length && R.T - R.recentDlg[0] > 25) R.recentDlg.shift();
        if (R.recentDlg.length >= 4) {
          ev('popups', { frus: 1.2, note: '4 dialogs in 25 s, last: ' + t });
          R.recentDlg = [];
        }
      }
    );
    w(
      'xPuzzleSolved',
      () => ({ was: EX && EX.puzzle && EX.puzzle.solved }),
      (r, a, s) => {
        if (!R || s.was) return;
        puzzleDone(true);
      }
    );
    w('addCards', null, res => {
      if (!R || !Array.isArray(res)) return;
      for (const x of res) {
        if (!x || !x.card) continue;
        const r = x.card.rarity;
        R.cards[r] = (R.cards[r] || 0) + 1;
        (R.newIds = R.newIds || []).push(x.card.id);
        ev(x.isNew ? 'card:new' : 'card:dupe', {
          fun: x.isNew ? { common: 2, uncommon: 3, rare: 6, legendary: 10, hero: 12 }[r] || 2 : 0.4,
          note: x.card.name + ' (' + r + ')'
        });
      }
    });
    w('addLoot', null, (res, [s, id]) => {
      if (!R) return;
      const G = GEAR[id];
      if (G) ev('gear', { fun: 1 + 0.5 * (G.tier || 0) + (G.legendary ? 6 : 0), note: G.name });
      if (res && res.cursed) ev('gear:cursed', { frus: 3, note: G && G.name });
    });
    w(
      'gainXp',
      () => ({ lv: save && save.level }),
      (r, a, s) => {
        if (!R) return;
        if (save.level > s.lv) ev('levelup', { fun: 3, note: 'level ' + save.level });
      }
    );
    w(
      'xEngage',
      (g, forced) => ({
        op:
          forced !== undefined
            ? forced
            : g.state === 'sleep'
              ? 'ambush'
              : g.surprise || !g.seen
                ? 'surprised'
                : null
      }),
      (r, [g], s) => {
        if (!R) return;
        R.fightStart = {
          op: s.op,
          boss: !!g.boss,
          mini: !!g.mini,
          hp: EX.hp,
          name: ENEMY_DEFS[g.ids[0]].name
        };
        if (s.op === 'surprised') ev('fight:surprised', { frus: 1.5, note: ENEMY_DEFS[g.ids[0]].name });
        if (s.op === 'ambush' || s.op === 'strike') ev('fight:' + s.op, { fun: 1.5 });
      }
    );
    w(
      'xOpenChest',
      ch => ({ open: ch && ch.open, rich: ch && ch.rich }),
      (r, [ch], s) => {
        if (!R) return;
        if (!s.open && ch.open) ev('chest', { fun: s.rich ? 3 : 1.5 });
      }
    );
    w('xSearchRoll', null, (found, [k, quiet]) => {
      if (!R) return;
      if (!quiet) {
        R.searches++;
        if (found) R.searchHits++;
      }
    });
    w(
      'xStairsDown',
      () => ({ d: EX && EX.depth, deep: save && save.deepest }),
      (r, a, s) => {}
    );
    w(
      'xDie',
      () => ({ d: EX && EX.depth, g: save && save.gold }),
      (r, [why], s) => {
        if (!R) return;
        if (EX && EX.hp > 0) return;
        death('map', why, s.d, s.g);
      }
    );
    w(
      'xUseBag',
      k => ({ n: bagN(k) }),
      (r, [k], s) => {
        if (!R) return;
        if (bagN(k) < s.n) R.bag[k] = (R.bag[k] || 0) + 1;
      }
    );
    w('xToCamp', null, () => {
      if (!R) return;
      R.campTrips++;
    });
    w('xGoFloor', null, () => {
      if (!R) return;
      R.floorMoves = (R.floorMoves || 0) + 1;
    });
    w('xInteract', null, () => {
      if (R) R.useN = (R.useN || 0) + 1;
    });
    w('xPushBlock', null, () => {
      if (R) R.useN = (R.useN || 0) + 1;
    });
    w('xOpenChest', null, () => {
      if (R) R.useN = (R.useN || 0) + 1;
    });
    w(
      'xStairsUp',
      () => ({ pc: EX && EX.pc, up: EX && EX.up, busy: EX && EX.busy, lock: EX && EX.stairLock }),
      (r, a, s) => {
        if (!R || s.busy || s.pc !== s.up || R.climbing) return;
        (R.upLog = R.upLog || []).length < 10 &&
          R.upLog.push({
            t: Math.round(R.T),
            d: EX && EX.depth,
            task: TASKNAME,
            lock: s.lock,
            ring: (R.ring || []).slice(-4)
          });
        ev('stairs:up', { frus: 1.5, note: 'walked onto the stairs up during ' + TASKNAME });
      }
    );
    w(
      'defeat',
      () => ({ d: B && B.depth, g: save && save.gold, explore: B && B.explore }),
      (r, a, s) => {
        if (!R) return;
        R.fightLoss = true;
        death('fight', R.fightStart && R.fightStart.name, s.d, s.g);
      }
    );
    w('settleChargeUses', null, burned => {
      if (!R || !Array.isArray(burned)) return;
      for (const x of burned) {
        R.burned += x.n || 1;
        ev('card:burned', { frus: 2 * (x.n || 1), note: x.card && x.card.name });
      }
    });
  }
  function hurtKind(why) {
    if (/rune’s backlash|biting stone|dead stone|guardian’s anger/.test(why)) return 'puzzle'; // not 'fire rune' or 'explosive rune': those are traps
    if (/blade|flame jet/.test(why)) return 'hazard';
    if (/trapped chest|trapped lock|needle/.test(why)) return 'chest';
    if (TRAPS && Object.values(TRAPS).some(T => T.name && why.indexOf(T.name) >= 0)) return 'trap';
    if (/ceiling|treasury|rubble/.test(why)) return 'room';
    return 'other:' + why.slice(0, 24);
  }
  // the lines a player reads, sorted into the moments that matter
  const LINES = [
    [
      /was waiting for you|Spikes shoot|dart flies|Stones crash|rune flares|needle in the lock|You catch the|First strike on/,
      'dup',
      {}
    ],
    [/cold draft brushes|sounds hollow when you breathe|sconces here flickers/, 'cue', { cue: true }],
    [/A faint click, close by/, 'trap:click', { click: true }],
    [/hidden door|wall slides open|stone grinds aside|loose stone/i, 'secret', { fun: 4 }],
    [/You find a (?!hidden)/, 'trap:spotted', { fun: 1 }],
    [/You disarm/, 'disarm', { fun: 1 }],
    [/You slip!|needle jabs/, 'disarm:fail', { frus: 2 }],
    [/is locked\. You need/, 'locked', { frus: 1, once: true }],
    [/stairs are sealed while the guardian/, 'stairs:boss', { frus: 0.5, once: true }],
    [/curse holds you: the stairs/, 'curse:stairs', { frus: 2, every: 30 }],
    [/You are cursed|cursed \(max HP/, 'cursed', { frus: 2.5 }],
    [/poisoned/, 'poison', { frus: 1 }],
    [
      /Wrong switch|levers snap back|runes flare and go dark|sour clang|stone bites|cold and dead|“Wrong\.”|gutters out/,
      'puzzle:mistake',
      { frus: 2 }
    ],
    [/stepped off the stones/, 'puzzle:stepoff', { frus: 1.5 }],
    [/block will not move/, 'puzzle:block', { frus: 0.6, every: 5 }],
    [/Fallen Seal holds these stairs shut/, 'seal', { frus: 3, once: true, seal: true }],
    [/Wayshard melts into the Fallen Seal/, 'seal:open', { fun: 3 }],
    [/wakes up!|spots you!|rises to face you/, 'spotted', {}],
    [/Executioner has come|distant bell tolls/, 'executioner', { frus: 2 }],
    [/You descend/, 'descend', {}],
    [/blessing|sinks into your hands/, 'blessing', { fun: 4 }],
    [/You rest\./, 'rest', { fun: 2 }],
    [/Quest:|falls in behind you/, 'quest:take', { fun: 0.5 }],
    [/token glows warm|Quest reward|thanks|A prisoner/i, 'quest:done', { fun: 4 }],
    [/You pick up a .*Key|You take the .*Key|Inside lies a/, 'key', { fun: 1.5 }],
    [/You scoop up/, 'gold', { fun: 0.5 }],
    [/legendary find/i, 'legendary', { fun: 8 }],
    [/arrives too late/, 'rival:won', { fun: 3 }],
    [/Too slow|sprints off/, 'rival:race', { frus: 0.5 }]
  ];
  function logLine(t, cls) {
    R.logN++;
    for (const [re, k, o] of LINES) {
      if (!re.test(t)) continue;
      if (o.seal && EX) {
        const m = /lies on depth (\d+)/.exec(t);
        if (m && +m[1] < EX.depth) R.sealUp = { from: EX.depth, to: +m[1], t: R.T };
      }
      if (o.click && EX) {
        const tr = EX.traps
          .filter(t => t.heard && t.armed && !t.known)
          .sort(
            (a, b) =>
              Math.hypot(xcx(a.cell) - xcx(EX.pc), xcy(a.cell) - xcy(EX.pc)) -
              Math.hypot(xcx(b.cell) - xcx(EX.pc), xcy(b.cell) - xcy(EX.pc))
          )[0];
        R.clicks++;
        if (chance(P.listen)) {
          R.click = { t: R.T, cell: EX.pc, side: tr ? Math.sign(xcx(tr.cell) - xcx(EX.pc)) : 0 };
          TASK = null;
          releaseKeys();
          EX.path = [];
          EX.goal = null;
        }
        return;
      }
      if (o.cue && EX) {
        const s = xNearestSecret(4);
        R.cue = { t: R.T, cell: EX.pc, side: s ? Math.sign(xcx(s.cell) - xcx(EX.pc)) : 0, d: EX.depth };
        R.cues++;
        return;
      }
      if (o.once) {
        const key = k + ':' + (EX ? EX.depth : 0) + ':' + t;
        if (R.onceSeen[key]) return;
        R.onceSeen[key] = 1;
      }
      if (o.every) {
        if (R.T - (R.lastK[k] || -1e9) < o.every) return;
        R.lastK[k] = R.T;
      }
      if (k === 'cursed' && /idol/.test(t)) R.cursedOnce = true;
      if (k === 'puzzle:mistake' && PZ) PZ.mistakes++;
      if (k === 'puzzle:stepoff' && PZ) PZ.mistakes++;
      if (o.fun || o.frus)
        ev(k, {
          fun: o.fun,
          frus:
            o.frus && (k === 'puzzle:mistake' && PZ ? o.frus * Math.sqrt(Math.max(1, PZ.mistakes)) : o.frus),
          note: t
        });
      return;
    }
    if (cls === 'bad') {
      ev('bad:other', { frus: 0.8, note: t });
    }
  }
  function death(where, why, d, goldBefore) {
    const lost = Math.max(0, (goldBefore || 0) - save.gold);
    R.deaths.push({ t: Math.round(R.T), d, where, why: String(why || '').slice(0, 40), lost });
    ev('death', { frus: 12 + lost / 150, note: where + ': ' + why });
  }

  /* ---------------- health checks: rules that must always hold, and the save ----------------
   Each broken rule is logged once per kind and floor (inv), with where it happened, so the report can name it and
   the seed replays it. The save is written and read back now and then and must come back the same; and what a
   refresh at this moment would lose (the save in storage against the game in memory) is sampled. */
  function inv(kind, detail) {
    const key = kind + '@' + (EX ? EX.depth : 0);
    R.invSeen = R.invSeen || {};
    R.invN = R.invN || {};
    R.invN[kind] = (R.invN[kind] || 0) + 1;
    if (R.invSeen[key]) return;
    R.invSeen[key] = 1;
    (R.inv = R.inv || []).push({
      t: Math.round(R.T),
      d: EX ? EX.depth : 0,
      kind,
      detail: String(detail).slice(0, 200),
      task: TASKNAME
    });
  }
  const okNum = (x, lo, hi) => typeof x === 'number' && isFinite(x) && x >= lo && x <= hi;
  function canon(o) {
    return JSON.stringify(o, (k, v) =>
      v && typeof v === 'object' && !Array.isArray(v)
        ? Object.keys(v)
            .sort()
            .reduce((a, k2) => ((a[k2] = v[k2]), a), {})
        : v
    );
  }
  function checkSave() {
    if (!save) return;
    if (!okNum(save.gold, 0, 1e9) || save.gold !== Math.round(save.gold))
      inv('gold not a whole number ≥ 0', save.gold);
    if (!okNum(save.level, 1, 999) || !okNum(save.xp || 0, 0, 1e12))
      inv('level or xp out of range', save.level + ' / ' + save.xp);
    for (const id in save.owned) {
      const n = save.owned[id];
      if (!CARDS[id]) inv('owned card that does not exist', id);
      else if (!(n > 0) || n !== Math.round(n)) inv('owned count not a whole number > 0', id + '=' + n);
    }
    for (const d of save.decks || []) {
      const c = {};
      for (const id of d.list || []) {
        c[id] = (c[id] || 0) + 1;
        if (!CARDS[id]) inv('deck card that does not exist', id);
      }
      for (const id in c)
        if (c[id] > (save.owned[id] || 0) && !(CARDS[id] && CARDS[id].rarity === 'hero'))
          inv('deck holds more copies than owned', id + ' ' + c[id] + '>' + (save.owned[id] || 0));
    }
    for (const id in save.charge || {}) {
      const a = save.charge[id];
      if (!Array.isArray(a) || a.some(v => !okNum(v, 0, 999)))
        inv('charge uses broken', id + ' ' + JSON.stringify(a));
    }
  }
  function checkMap() {
    if (!EX || !EX.active) return;
    if (!isFinite(EX.hp) && !R.nanSeen) {
      R.nanSeen = 1;
      inv(
        'HP became NaN',
        'log: ' +
          EX.log.map(l => l.t).join(' | ') +
          ' · last events: ' +
          R.events
            .slice(-4)
            .map(e => e.k + (e.note ? ' ' + e.note : ''))
            .join(', ') +
          ' · last fight: ' +
          JSON.stringify(R.fights[R.fights.length - 1] || null).slice(0, 200)
      );
    }
    // above max for a moment is fine (a curse lands after the tick's own clamp); for over a second it is a bug
    if (!isFinite(EX.hp) || EX.hp < 0) inv('HP out of range', EX.hp + ' / ' + xmaxHp());
    else if (EX.hp > xmaxHp() + 1) {
      R.hpHiT = (R.hpHiT || 0) + DT;
      if (R.hpHiT > 1)
        inv(
          'HP above max for over a second',
          EX.hp +
            ' / ' +
            xmaxHp() +
            ' (curse ' +
            (EX.ail && EX.ail.curse) +
            ', gear hp ' +
            gearMods(save).hp +
            ')'
        );
    } else R.hpHiT = 0;
    if (!okNum(EX.px, -1, XN * XCS + 1) || !okNum(EX.pz, -1, XN * XCS + 1))
      inv('position not a number', EX.px + ',' + EX.pz);
    else if (EX.t[EX.pc] === T_ROCK) inv('standing inside rock', xcx(EX.pc) + ',' + xcy(EX.pc));
    else if (xcell(EX.px, EX.pz) !== EX.pc && Math.hypot(EX.px - xw(EX.pc), EX.pz - xz(EX.pc)) > XCS * 1.2)
      inv(
        'position and cell disagree',
        xcx(EX.pc) + ',' + xcy(EX.pc) + ' vs ' + (EX.px / XCS).toFixed(1) + ',' + (EX.pz / XCS).toFixed(1)
      );
    for (const g of EX.groups)
      if (!okNum(g.x, -1, XN * XCS + 1) || !okNum(g.z, -1, XN * XCS + 1))
        inv('enemy position not a number', (g.ids || []).join('+'));
    if (save && EX.gold != null && !okNum(EX.gold, 0, 1e9)) inv('run gold out of range', EX.gold);
  }
  // once a floor: can the stairs be reached at all (through every door, locked or secret)?
  function checkFloor() {
    if (!EX || EX.botFloorChecked) return;
    EX.botFloorChecked = 1;
    const all = new Map();
    for (const [c, d] of EX.doors) all.set(c, { state: 'open' });
    const d = xbfs(EX.t, all, EX.pc, null, null);
    if (EX.down != null && EX.down >= 0 && d[EX.down] < 0)
      inv(
        'stairs down cannot be reached',
        xcx(EX.down) + ',' + xcy(EX.down) + ' from ' + xcx(EX.pc) + ',' + xcy(EX.pc)
      );
    if (EX.up != null && EX.up >= 0 && d[EX.up] < 0)
      inv('stairs up cannot be reached', xcx(EX.up) + ',' + xcy(EX.up));
  }
  // the save in storage: read back the same as what was written; and how much a refresh now would lose
  function checkStore() {
    if (!save || typeof loadSave !== 'function') return;
    const st = loadSave(SAVE_SLOT);
    R.saveChecks = (R.saveChecks || 0) + 1;
    if (st) {
      const lost = {
        gold: Math.max(0, save.gold - (st.gold || 0)),
        xp: Math.max(0, (save.xp || 0) - (st.xp || 0)) + (save.level > (st.level || 1) ? 1e6 : 0),
        cards: 0
      };
      for (const id in save.owned) lost.cards += Math.max(0, save.owned[id] - ((st.owned || {})[id] || 0));
      const U =
        R.unsaved || (R.unsaved = { n: 0, any: 0, gold: 0, cards: 0, levels: 0, maxGold: 0, maxCards: 0 });
      U.n++;
      if (lost.gold || lost.cards || lost.xp) U.any++;
      U.gold += lost.gold;
      U.cards += lost.cards;
      if (lost.xp >= 1e6) U.levels++;
      U.maxGold = Math.max(U.maxGold, lost.gold);
      U.maxCards = Math.max(U.maxCards, lost.cards);
    }
    // the round trip goes through a scratch key, so the game's own saving (and what is unsaved) is left alone
    const mem = canon(save);
    let back = null;
    try {
      localStorage.setItem('hexmancers-bot-rt', JSON.stringify(save));
      const s2 = JSON.parse(localStorage.getItem('hexmancers-bot-rt'));
      back = s2 && s2.v === 1 ? migrate(s2) : null;
    } catch (e) {
      inv('save does not serialize', e.message);
      return;
    }
    if (!back) inv('save does not load back', 'null');
    else if (canon(back) !== mem) {
      const a = JSON.parse(mem),
        b = JSON.parse(canon(back)),
        diff = Object.keys(Object.assign({}, a, b)).filter(
          k => JSON.stringify(a[k]) !== JSON.stringify(b[k])
        );
      inv(
        'save loads back different',
        diff
          .map(k => {
            const x = a[k],
              y = b[k];
            if (x && y && typeof x === 'object' && typeof y === 'object') {
              const ks = Object.keys(Object.assign({}, x, y))
                .filter(q => JSON.stringify(x[q]) !== JSON.stringify(y[q]))
                .slice(0, 4);
              return (
                k +
                '{' +
                ks.map(q => q + ':' + JSON.stringify(x[q]) + '→' + JSON.stringify(y[q])).join(' ') +
                '}'
              );
            }
            return k;
          })
          .join(', ')
      );
    }
  }
  function healthTick() {
    try {
      checkMap();
      checkFloor();
      if (R.T - (R.lastSaveCk || 0) >= 60) {
        R.lastSaveCk = R.T;
        checkSave();
        checkStore();
      }
    } catch (e) {
      err('health', e);
    }
  }

  /* ---------------- moving and touching ---------------- */
  const keyOf = dir => {
    const k = keysFor(dir);
    return k && k[0];
  };
  function releaseKeys() {
    for (const k in XKEY) XKEY[k] = false;
  }
  function hold(dir) {
    releaseKeys();
    const k = keyOf(dir);
    if (k) XKEY[k] = true;
    if (EX) EX.needInput = false;
  } // a real key-down clears needInput (explore.js)
  const DIRN = [
    ['up', 0, -1],
    ['right', 1, 0],
    ['down', 0, 1],
    ['left', -1, 0]
  ];
  const adj4 = c =>
    [c - XN, c + 1, c + XN, c - 1].filter(
      n => n >= 0 && n < XN * XN && Math.abs(xcx(n) - xcx(c)) + Math.abs(xcy(n) - xcy(c)) === 1
    );
  function dirTo(a, b) {
    const dx = xcx(b) - xcx(a),
      dy = xcy(b) - xcy(a);
    return DIRN.find(([, x, y]) => x === dx && y === dy);
  }
  // cells a person would not step on without meaning to: puzzle stones, pipes and ice of an unsolved puzzle
  function avoidSet() {
    const s = new Set(),
      pz = EX.puzzle;
    if (
      pz &&
      !pz.solved &&
      (TASKNAME.startsWith('puzzle') ||
        (((R.fieldBitten && P.learns) || (pz.kind === 'ice' && R.iceSlid)) && !(DONE && DONE.noAvoid)))
    ) {
      if (pz.tiles) for (const t of pz.tiles) s.add(t.cell);
      if (pz.ice) for (const c of pz.ice) s.add(c);
    }
    if (pz && pz.kind === 'ice' && pz.solved && R.iceSlid && !(DONE && DONE.noAvoid))
      for (const c of pz.ice) s.add(c); // solved ice is still ice: it slides you
    for (const p of EX.props) if (!p.gone && (p.kind === 'pithole' || p.kind === 'chute')) s.add(p.cell);
    for (const it of EX.items) if (it.kind === 'idol' && P.learns && R.cursedOnce) s.add(it.cell);
    return s;
  }
  // a path over cells you have seen, like the game's own path-to-tap, but stepping around puzzle fields
  function pathTo(goal, allow) {
    const av = avoidSet();
    if (allow) for (const c of allow) av.delete(c);
    const field =
      TASKNAME.startsWith('puzzle') || typeof xPuzzField !== 'function' ? new Set() : xPuzzField();
    if (field.has(goal) || field.has(EX.pc) || (allow && allow.length)) field.clear();
    const blocked = f => n =>
      n !== EX.pc &&
      n !== goal &&
      (xKnownTrap(n) ||
        xStairCell(n, goal) ||
        xChestAt(n) ||
        xSolid(n) ||
        av.has(n) ||
        (f && field.has(n)) ||
        (typeof xPadCell === 'function' && xPadCell(n)) ||
        EX.groups.some(g => g.cell === n && g.dormant));
    let d = xbfs(EX.t, EX.doors, goal, EX.seen, blocked(true));
    EX.fieldAvoid = field.size ? field : null;
    if (d[EX.pc] < 0 && field.size) {
      d = xbfs(EX.t, EX.doors, goal, EX.seen, blocked(false));
      EX.fieldAvoid = null;
    }
    if (d[EX.pc] < 0) return padRoute(goal, blocked(false)); // fieldAvoid: the game's corner-cutting keeps off it too
    const path = [];
    let cur = EX.pc;
    for (let k = 0; k < 400 && cur !== goal; k++) {
      let best = -1;
      for (const n of adj4(cur)) if (d[n] >= 0 && d[n] < d[cur] && (best < 0 || d[n] < d[best])) best = n;
      if (best < 0) return null;
      path.push(best);
      cur = best;
    }
    return path;
  }
  // only a teleport pad leads there: walk to the first pad on the way (it carries you; walk() re-plans from where you land)
  function padRoute(goal, block) {
    const pads = new Map();
    for (const p of EX.props)
      if (p.kind === 'tpad' && !p.gone && p.to != null && EX.seen[p.cell]) pads.set(p.cell, p.to);
    if (!pads.size) return null;
    const from = new Map([[EX.pc, -1]]),
      q = [EX.pc];
    for (let h = 0; h < q.length; h++) {
      const c = q[h];
      if (c === goal) break;
      for (const n of adj4(c)) {
        if (from.has(n) || EX.t[n] === T_ROCK || !EX.seen[n]) continue;
        const dr = EX.doors.get(n);
        if (dr && (dr.state === 'secret' || dr.state === 'locked')) continue;
        if (n !== goal && block(n) && !pads.has(n)) continue;
        from.set(n, c);
        if (pads.has(n) && n !== goal) {
          const to = pads.get(n);
          if (!from.has(to)) {
            from.set(to, n);
            q.push(to);
          }
        } else q.push(n);
      }
    }
    if (!from.has(goal)) return null;
    const chain = [];
    for (let c = goal; c !== EX.pc && c != null && c >= 0; c = from.get(c)) chain.unshift(c);
    const k = chain.findIndex(c => pads.has(c));
    return k < 0 ? chain : chain.slice(0, k + 1);
  }
  function distMap() {
    const av = avoidSet();
    return xbfs(
      EX.t,
      EX.doors,
      EX.pc,
      EX.seen,
      n =>
        n !== EX.pc &&
        (xKnownTrap(n) || xSolid(n) || xChestAt(n) || av.has(n) || n === EX.up || n === EX.down)
    );
  }
  // walk to a cell (generator: one yield a tick). careful: feed the path one cell at a time (no corner cutting)
  function* walk(cell, o) {
    o = o || {};
    let last = EX.pc,
      still = 0,
      tries = 0,
      el = 0;
    R.lastWalk = [xcx(cell), xcy(cell)];
    let limit = o.max || 90;
    while (EX.pc !== cell) {
      el += DT;
      if (xKnownTrap(cell) || (xSolid(cell) && !o.allowSolid)) {
        EX.path = [];
        EX.goal = null;
        R.walkWhy = 'target became a trap or solid';
        return false;
      }
      if (el > limit) {
        R.walkWhy = 'timeout';
        R.stuck++;
        ev('stuck', { frus: 2, note: 'walk timeout' });
        return false;
      }
      if ((!EX.path.length && !(EX.goal && EX.goal.cell === EX.pc)) || (o.careful && EX.path.length > 1)) {
        const p = pathTo(cell, o.allow);
        if (!p) {
          R.walkWhy = 'no path';
          return false;
        }
        if (!p.length) return true;
        if (tries === 0) limit = Math.max(limit, (p.length / (XSPEED / XCS)) * 1.6 + 10); // long walks get the time they need
        if (R.traceOn) {
          (R.repaths = R.repaths || []).push([
            +R.T.toFixed(1),
            xcx(EX.pc) + ',' + xcy(EX.pc),
            p.length,
            p
              .filter((c, i) => i % 10 == 0)
              .map(c => xcx(c) + ',' + xcy(c))
              .join(' '),
            p
              .filter(c => xPadCell(c))
              .map(c => xcx(c) + ',' + xcy(c))
              .join(' '),
            p
              .slice(-12)
              .map(c => xcx(c) + ',' + xcy(c))
              .join(' ')
          ]);
          if (R.repaths.length > 30) R.repaths.shift();
        }
        EX.needInput = false;
        EX.path = o.careful ? p.slice(0, 1) : p;
        const end = EX.path[EX.path.length - 1];
        EX.goal = { cell: end, x: xw(end), z: xz(end) };
        tries++;
      }
      if (EX.pc !== last) {
        last = EX.pc;
        still = 0;
        if (R.traceOn) {
          (R.walkPos = R.walkPos || []).push(xcx(EX.pc) + ',' + xcy(EX.pc));
          if (R.walkPos.length > 80) R.walkPos.shift();
        }
      } else if ((still += DT) > 3) {
        if (tries > 6) {
          R.walkWhy = 'blocked';
          R.stuck++;
          R.blockInfo = whatBlocks();
          ev('stuck', { frus: 2, note: 'blocked walking' });
          EX.path = [];
          EX.goal = null;
          return false;
        }
        EX.path = [];
        EX.goal = null;
        still = 0;
      }
      yield;
    }
    EX.path = [];
    EX.goal = null;
    return true;
  }
  // a single step onto a neighbouring cell, with the stick (keys), for puzzle fields
  function* step(cell) {
    const D = dirTo(EX.pc, cell);
    if (!D) return false;
    const t0 = R.T;
    hold(D[0]);
    while (EX.pc !== cell && R.T - t0 < 1.2) {
      yield;
      if (EX.busy || xPaused) {
        releaseKeys();
        return false;
      }
    }
    releaseKeys(); // settle near the middle of the cell so the next step starts clean
    const t1 = R.T;
    EX.goal = { cell: EX.pc, x: xw(EX.pc), z: xz(EX.pc) };
    EX.path = [];
    while (EX.goal && R.T - t1 < 0.6) yield;
    EX.goal = null;
    return EX.pc === cell;
  }
  // walk up to a thing and bump into it (props, wall fixtures, chests, doors, people)
  function standFor(target) {
    const d = distMap();
    let best = -1;
    for (const n of adj4(target)) {
      if (n === EX.pc) return n;
      if (d[n] >= 0 && !xSolid(n) && EX.t[n] !== T_ROCK && (best < 0 || d[n] < d[best])) best = n;
    }
    return best;
  }
  function* bump(target, o) {
    o = o || {};
    const s = standFor(target);
    if (s < 0) {
      const dm = distMap();
      R.bumpWhy =
        'nowhere to stand at ' +
        xcx(target) +
        ',' +
        xcy(target) +
        ' [' +
        adj4(target)
          .map(n =>
            EX.t[n] === T_ROCK
              ? 'rock'
              : xSolid(n)
                ? 'solid:' + EX.propAt.get(n).kind
                : 'd' + dm[n] + (EX.doors.has(n) ? 'door' : '') + (avoidSet().has(n) ? 'avoid' : '')
          )
          .join(' ') +
        '] pc ' +
        xcx(EX.pc) +
        ',' +
        xcy(EX.pc);
      return false;
    }
    if (EX.pc !== s) {
      const ok = yield* walk(s, o);
      if (!ok) {
        R.bumpWhy = 'could not walk there';
        return false;
      }
    }
    const D = dirTo(EX.pc, target);
    if (!D) return false;
    yield* think(between(0.15, 0.4));
    const t0 = R.T,
      d0 = !!EX.dlg,
      u0 = R.useN || 0;
    hold(D[0]);
    while (R.T - t0 < 0.6) {
      yield;
      if ((EX.dlg && !d0) || EX.busy || EX.action || (R.useN || 0) > u0 || EX.pc === target) break;
    }
    releaseKeys();
    return true;
  }
  function* think(s) {
    const t0 = R.T;
    while (R.T - t0 < s) yield;
  }
  const seenCell = c => c >= 0 && !!EX.seen[c];
  function whatBlocks() {
    const n = EX.path[0] != null ? EX.path[0] : EX.goal && EX.goal.cell;
    if (n == null) return 'no path';
    const out = [];
    for (const c of [n, ...adj4(n)]) {
      const bits = [];
      if (c === n) bits.push('t=' + EX.t[c] + ' pass=' + xPassable(c) + ' bump=' + xBump(c, false));
      else if (EX.t[c] === T_ROCK) continue;
      const d = EX.doors.get(c);
      if (d) bits.push('door:' + d.state);
      if (xSolid(c)) bits.push('solid:' + EX.propAt.get(c).kind);
      if (EX.wallAt.get(c)) bits.push('wall:' + EX.wallAt.get(c).kind);
      if (xChestAt(c)) bits.push('chest');
      if (xKnownTrap(c)) bits.push('trap');
      const np = EX.props.find(p => p.cell === c && !p.gone && p.kind === 'npc');
      if (np) bits.push('npc:' + np.role + ':' + np.state + (np.solid ? '*' : ''));
      if (bits.length) out.push((c === n ? 'NEXT ' : '') + xcx(c) + ',' + xcy(c) + ' ' + bits.join('/'));
    }
    {
      const L = Math.hypot(EX.vx || 0, EX.vz || 0) || 1,
        ux = (EX.vx || 0) / L,
        uz = (EX.vz || 0) / L,
        sp = XSPEED * DT,
        r = 0.42,
        front = xcell(EX.px + ux * XCS * 0.6, EX.pz + uz * XCS * 0.6),
        tst = (nx, nz) =>
          [
            [-r, -r],
            [r, -r],
            [-r, r],
            [r, r]
          ]
            .map(([ox, oz]) => {
              const c = xcell(nx + ox, nz + oz);
              return c === EX.pc
                ? 'me'
                : xcx(c) +
                    ',' +
                    xcy(c) +
                    '=' +
                    xBump(c, false) +
                    (EX.doors.get(c) ? '(door ' + EX.doors.get(c).state + ')' : '') +
                    (EX.t[c] === T_ROCK ? '(rock)' : '');
            })
            .join(' ');
      out.push(
        'AXIS-X [' +
          tst(EX.px + ux * sp, EX.pz) +
          '] AXIS-Z [' +
          tst(EX.px, EX.pz + uz * sp) +
          '] front ' +
          xcx(front) +
          ',' +
          xcy(front)
      );
    }
    const ix = Math.sign(xcx(n) - xcx(EX.pc)),
      iz = Math.sign(xcy(n) - xcy(EX.pc));
    const corners = [
      [-0.42, -0.42],
      [0.42, -0.42],
      [-0.42, 0.42],
      [0.42, 0.42]
    ]
      .map(([a, b]) => {
        const c = xcell(EX.px + ix * 0.35 + a, EX.pz + iz * 0.35 + b);
        return xcx(c) + ',' + xcy(c) + ':' + (c === EX.pc ? 'me' : xBump(c, false));
      })
      .join(' ');
    out.push(
      'corners ' +
        corners +
        ' stuckT ' +
        (EX.stuckT || 0).toFixed(1) +
        ' drag ' +
        (EX.dragT || 0) +
        ' speed ' +
        (typeof xRareSpeed === 'function' ? xRareSpeed() : 1) +
        ' slide ' +
        !!EX.slide +
        ' action ' +
        !!EX.action +
        ' paused ' +
        xPaused +
        ' aim ' +
        !!EX.aim +
        ' busy ' +
        EX.busy +
        ' hold ' +
        XHOLD.on +
        ' keys ' +
        Object.keys(XKEY)
          .filter(k => XKEY[k])
          .join('+') +
        ' v ' +
        (EX.vx || 0).toFixed(2) +
        ',' +
        (EX.vz || 0).toFixed(2) +
        ' goal ' +
        (EX.goal ? [xcx(EX.goal.cell), xcy(EX.goal.cell)] : '-') +
        ' path ' +
        EX.path.length +
        ' dlg ' +
        !!EX.dlg +
        ' pauseOv ' +
        on('pause')
    );
    return (
      'at ' +
      xcx(EX.pc) +
      ',' +
      xcy(EX.pc) +
      ' pos ' +
      (EX.px / XCS).toFixed(2) +
      ',' +
      (EX.pz / XCS).toFixed(2) +
      ' next ' +
      xcx(n) +
      ',' +
      xcy(n) +
      ' :: ' +
      out.join(' | ')
    );
  }

  /* ---------------- deciding what to do on the map ---------------- */
  let TASK = null,
    TASKNAME = '',
    DONE = null,
    PZ = null;
  function newFloor() {
    if (EX && !EX.botCounted) {
      EX.botCounted = 1;
      R.trapsPlaced = (R.trapsPlaced || 0) + EX.traps.length;
      R.floorsCounted = (R.floorsCounted || 0) + 1;
      (R.trapHist = R.trapHist || {})[EX.traps.length] = (R.trapHist[EX.traps.length] || 0) + 1;
      (R.trapByDepth = R.trapByDepth || {})[EX.depth] = EX.traps.length;
    }
    DONE = {
      props: new Set(),
      chests: new Set(),
      doors: new Set(),
      items: new Set(),
      searched: new Set(),
      fails: new Map()
    };
    PZ = null;
    TASK = null;
    R.floorT0 = R.T;
    R.stairsSeenT = null;
    R.seen0 = 0;
    R.floors++;
  }
  function failed(key) {
    const n = (DONE.fails.get(key) || 0) + 1;
    DONE.fails.set(key, n);
    return n;
  }
  const wantMore = key => (DONE.fails.get(key) || 0) < 2;
  function roomsSeenFrac() {
    const rs = EX.rooms.filter(r => !r.side && !r.nook);
    return rs.filter(r => seenCell(xi(r.cx, r.cy))).length / Math.max(1, rs.length);
  }
  function frontier(d) {
    let best = -1,
      bd = 1e9;
    for (let c = 0; c < XN * XN; c++) {
      if (d[c] < 0 || !EX.seen[c] || !xPassable(c)) continue;
      let un = 0;
      for (const n of adj4(c)) if (!EX.seen[n]) un++;
      if (!un) continue;
      const s = d[c] + (P.wander ? rand() * P.wander : 0) - un * 0.5;
      if (s < bd && d[c] > 0) {
        bd = s;
        best = c;
      }
    }
    return best;
  }
  // props worth a bump, once: people, tablets, pedestals, sanctuaries, shrines of the special rooms...
  const BUMP_ONCE = new Set([
    'npc',
    'merchant',
    'magicmirror',
    'altar',
    'tablet',
    'inscription',
    'pedestal',
    'keystand',
    'lever',
    'switch',
    'cache',
    'ghosttable',
    'cleanse',
    'trialaltar',
    'guardian',
    'nestcore',
    'eggsac',
    'gambler',
    'forge',
    'tradeshrine',
    'bones',
    'totem',
    'mirrorpool',
    'camper',
    'ghost',
    'bookcase',
    'shelf',
    'orb',
    'crystalnode',
    'table',
    'chapel',
    'gong'
  ]);
  const SKIP = new Set([
    'block',
    'plate',
    'reset',
    'statue',
    'mirror',
    'crystal',
    'core',
    'runestone',
    'plever',
    'ptile',
    'pplate',
    'pipe',
    'pipeend',
    'icefloor',
    'iceboulder',
    'icegoal',
    'weight',
    'scale',
    'bell',
    'pbrazier',
    'cswitch',
    'emitter',
    'blade',
    'jet',
    'puddle',
    'loose',
    'pot',
    'corpse',
    'hstair',
    'chute',
    'pithole'
  ]);
  function interesting() {
    const d = distMap(),
      out = [];
    const add = (kind, cell, gen, score) => {
      if (cell < 0) return;
      let near = d[cell];
      if (near < 0) for (const n of adj4(cell)) if (d[n] >= 0) near = near < 0 ? d[n] : Math.min(near, d[n]);
      if (near < 0) return;
      out.push({ kind, cell, gen, score: (score || 0) - near });
    };
    for (const it of EX.items)
      if (seenCell(it.cell) && !DONE.items.has(it) && wantMore('it' + it.cell)) {
        if (it.kind === 'idol' && P.learns && R.cursedOnce) continue;
        if (it.kind === 'crate' && EX.carrying) continue;
        if (d[it.cell] >= 0)
          add(
            'item:' + it.kind,
            it.cell,
            () =>
              (function* () {
                const ok = yield* walk(it.cell);
                if (!ok) failed('it' + it.cell);
                DONE.items.add(it);
              })(),
            it.kind === 'gold' || it.kind === 'key' ? 6 : 4
          );
      }
    for (const ch of EX.chests)
      if (!ch.open && seenCell(ch.cell) && !DONE.chests.has(ch) && wantMore('ch' + ch.cell))
        add(
          'chest',
          ch.cell,
          () =>
            (function* () {
              if (ch.trap && ch.trapKnown) {
                const s = standFor(ch.cell);
                if (s < 0) return;
                const ok = yield* walk(s);
                if (!ok) {
                  failed('ch' + ch.cell);
                  return;
                }
                yield* think(0.3);
                xDisarm();
                while (EX.action) yield;
              }
              const ok = yield* bump(ch.cell);
              if (!ok || !ch.open) failed('ch' + ch.cell);
              if (ch.open) DONE.chests.add(ch);
            })(),
          5
        );
    for (const p of EX.props) {
      if (p.gone || DONE.props.has(p) || SKIP.has(p.kind)) continue;
      const cell = p.wall ? p.cell : p.cell,
        vis = p.wall ? seenCell(p.front) : seenCell(p.cell);
      if (!vis || !wantMore('p' + p.cell)) continue;
      if (p.wall && p.found === false && p.kind !== 'switch') continue;
      if (p.kind === 'switch' && !p.found) continue;
      if (p.kind === 'cache' && !p.found) continue;
      if (p.kind === 'npc' && p.role === 'rival' && p.state !== 'idle' && p.state !== 'lost') continue;
      if (p.kind === 'cleanse' && !(EX.cursed && !EX.cursed.done) && !P.curious) continue;
      if (p.kind === 'trialaltar' && p.spent) continue;
      if (p.kind === 'pedestal' && p.taken) continue;
      if (p.kind === 'gong' || p.kind === 'guardian') continue; // the puzzle part handles these
      if (!BUMP_ONCE.has(p.kind) && !p.solid && !p.wall) continue;
      add(
        'prop:' + p.kind,
        cell,
        () =>
          (function* () {
            const n0 = R.dlgN;
            const ok = !p.solid && !p.wall ? yield* walk(cell, { max: 60 }) : yield* bump(cell);
            if (!ok) {
              failed('p' + cell);
              return;
            } // things on the floor (a key stand) are stepped on, not bumped
            if (p.kind === 'totem') {
              for (let k = 0; k < 4 && !p.gone; k++) {
                yield* think(0.35);
                yield* bump(cell);
              }
            }
            DONE.props.add(p);
          })(),
        p.kind === 'cleanse' && EX.cursed && !EX.cursed.done
          ? 50
          : p.kind === 'npc' || p.kind === 'merchant'
            ? 3
            : 2
      );
    }
    // locked doors you hold the key for
    for (const [i, dd] of EX.doors)
      if (dd.state === 'locked' && seenCell(i) && !DONE.doors.has(i) && dd.lock && LOCKS[dd.lock]) {
        const L = LOCKS[dd.lock],
          have = keyN(L.key) > 0 || (dd.lock !== 'boss' && keyN('skeleton') > 0);
        if (!have) continue;
        add(
          'door',
          i,
          () =>
            (function* () {
              for (let k = 0; k < 3 && dd.state === 'locked'; k++) {
                const kb = JSON.stringify(XRUN.keys),
                  st = standFor(i);
                const okb = yield* bump(i);
                (R.doorLog = R.doorLog || []).length < 12 &&
                  R.doorLog.push({
                    d: EX.depth,
                    door: [xcx(i), xcy(i)],
                    lock: dd.lock,
                    state: dd.state,
                    keys: kb,
                    stand: st >= 0 ? [xcx(st), xcy(st)] : null,
                    pc: [xcx(EX.pc), xcy(EX.pc)],
                    pos: [+(EX.px / XCS).toFixed(2), +(EX.pz / XCS).toFixed(2)],
                    ok: okb,
                    dlg: !!EX.dlg
                  });
                yield* think(0.4);
              }
              if (dd.state === 'locked') {
                if (failed('d' + i) >= 2) DONE.doors.add(i);
              } else DONE.doors.add(i);
            })(),
          4
        );
      }
    return out.sort((a, b) => b.score - a.score);
  }
  function* searchHere() {
    yield* think(between(0.2, 0.6));
    xSearchAt(EX.pc);
    R.searchT = R.T;
    while (EX.action) yield;
  }
  // search along the walls: cells beside rock in a room (or near a whispered cue, on the side it came from)
  function wallCells(near, rad, side) {
    const d = distMap(),
      out = [];
    for (let c = 0; c < XN * XN; c++) {
      if (d[c] < 0 || !EX.seen[c] || !xPassable(c) || EX.doors.has(c)) continue;
      if (!adj4(c).some(n => EX.t[n] === T_ROCK)) continue;
      if (near != null) {
        if (Math.hypot(xcx(c) - xcx(near), xcy(c) - xcy(near)) > rad) continue;
        if (side && Math.sign(xcx(c) - xcx(near)) === -side) continue;
      } else if (EX.room[c] !== rad) continue;
      out.push(c);
    }
    return out.sort(() => rand() - 0.5);
  }
  function* hunt(cells, n) {
    for (const c of cells.slice(0, n)) {
      const ok = yield* walk(c, { max: 20 });
      if (!ok) continue;
      yield* searchHere();
    }
  }
  function chooseTask() {
    const m = xmaxHp();
    // hurt: a draught first
    if (EX.hp < m * P.drinkAt && bagN('draught') > 0) {
      xUseBag('draught');
      return null;
    }
    if (EX.ail && (EX.ail.poison > 3 || EX.ail.curse) && bagN('antidote') > 0 && chance(0.5)) {
      xUseBag('antidote');
      return null;
    }
    // a trap's tell spotted, or its click heard: stop and search there before stepping on
    if (R.spot != null) {
      const c = R.spot;
      R.spot = null;
      return [
        'trap-look',
        (function* () {
          yield* think(between(0.3, 0.8));
          EX.needInput = false;
          xSearchAt(c, true);
          R.searchT = R.T;
          while (EX.action) yield;
        })()
      ];
    }
    if (R.click && R.T - R.click.t < 6) {
      const cl = R.click;
      R.click = null;
      const cand = [];
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          if (cl.side && Math.sign(dx) === -cl.side) continue;
          const c = xi(xcx(cl.cell) + dx, xcy(cl.cell) + dy);
          if (EX.seen[c] && xPassable(c) && (dx || dy)) cand.push(c);
        }
      const picks = cand.sort(() => rand() - 0.5).slice(0, 2);
      return [
        'trap-listen',
        (function* () {
          for (const c of picks) {
            yield* think(between(0.3, 0.7));
            EX.needInput = false;
            xSearchAt(c, true);
            R.searchT = R.T;
            while (EX.action) yield;
            if (EX.traps.some(t => t.heard && t.known)) break;
          }
        })()
      ];
    }
    // stuck out on the ice of an unsolved ice room: get back to the rim first
    {
      const pz = EX.puzzle;
      if (pz && pz.kind === 'ice' && pz.ice.includes(EX.pc)) return ['off-ice', offIce(pz)];
    }
    // the puzzle on this floor, if it is in sight and this player wants it
    const pz = EX.puzzle;
    if (pz && !pz.solved && (!PZ || !PZ.gaveUp) && seenCell(xi(EX.rooms[pz.room].cx, EX.rooms[pz.room].cy))) {
      if (!PZ) {
        PZ = {
          kind: pz.kind,
          t0: null,
          mistakes: 0,
          dmg: 0,
          steps: 0,
          gaveUp: false,
          tries: 0,
          will: chance(P.puzzleWill)
        };
        R.puzzles.push(PZ);
        PZ.d = EX.depth;
        if (!PZ.will) {
          PZ.skipped = true;
          PZ.gaveUp = true;
        }
      }
      if (PZ.will && PZ.tries < 4 && !PZ.wait) {
        const g = PUZ[pz.kind];
        if (g) {
          PZ.tries++;
          if (PZ.t0 == null) PZ.t0 = R.T;
          return ['puzzle:' + pz.kind, g(pz)];
        }
      }
    }
    if (PZ && PZ.wait && PZ.wait()) PZ.wait = null;
    // a Fallen Seal below: climb to the floor that holds its Wayshard (the stairs up, floor by floor)
    if (R.sealUp && (R.climbFails || 0) >= 6) {
      ev('seal:gaveup', { frus: 5, note: 'could not get back up to depth ' + R.sealUp.to });
      R.sealUp = null;
    }
    if (
      R.sealUp &&
      XRUN &&
      (XRUN.seals || []).some(x => x.depth === R.sealUp.from && !x.got) &&
      EX.depth > R.sealUp.to &&
      seenCell(EX.up) &&
      wantMore('up') &&
      pathTo(EX.up)
    ) {
      return [
        'climb',
        (function* () {
          R.climbing = true;
          if (EX.pc === EX.up) {
            const off = adj4(EX.pc).find(
              n => xPassable(n) && !xSolid(n) && EX.t[n] !== T_ROCK && !xKnownTrap(n)
            );
            if (off) {
              yield* step(off);
              yield* think(0.4);
            }
          }
          const ok = yield* walk(EX.up, { max: 150 });
          R.climbing = false;
          if (!ok) {
            failed('up');
            R.climbFails = (R.climbFails || 0) + 1;
            (R.climbWhy = R.climbWhy || []).length < 20 &&
              R.climbWhy.push(
                R.walkWhy +
                  ' pc ' +
                  xcx(EX.pc) +
                  ',' +
                  xcy(EX.pc) +
                  ' up ' +
                  xcx(EX.up) +
                  ',' +
                  xcy(EX.up) +
                  ' lock ' +
                  EX.stairLock +
                  ' busy ' +
                  EX.busy +
                  ' d' +
                  EX.depth
              );
            (R.climbLog = R.climbLog || []).push({
              pc: [xcx(EX.pc), xcy(EX.pc)],
              up: [xcx(EX.up), xcy(EX.up)],
              path: (pathTo(EX.up) || { length: null }).length,
              lock: EX.stairLock,
              map: R.climbLog.length ? undefined : C.map(8, EX.up)
            });
          }
        })()
      ];
    }
    if (R.sealUp && XRUN && (XRUN.seals || []).some(x => x.depth === R.sealUp.from && x.got)) R.sealUp = null;
    const list = interesting();
    if (list.length) {
      const t = list[0];
      return [t.kind, t.gen()];
    }
    // a hidden closet is on every floor: some players look for it
    // a whisper: a secret is close. Most players look for it
    if (R.cue && R.T - R.cue.t < 20 && R.cue.d === EX.depth && !R.cue.used) {
      R.cue.used = true;
      if (chance(Math.min(0.9, P.searchP * 2)))
        return ['secret-hunt', hunt(wallCells(R.cue.cell, 4, R.cue.side), P.huntN || 3)];
    }
    const r = roomOf(EX.pc);
    if (r && !DONE.searched.has(r.id) && chance(P.searchP)) {
      DONE.searched.add(r.id);
      return ['search', hunt(wallCells(null, r.id), 1)];
    }
    if (r) DONE.searched.add(r.id);
    // explore until this player has seen enough of the floor, then the stairs down
    // on the floor that holds a Fallen Seal's Wayshard: not down again until it is found (or given up)
    const seal = R.sealUp && XRUN && (XRUN.seals || []).find(x => x.depth === R.sealUp.from && !x.got),
      shardHere = seal && EX.depth === R.sealUp.to;
    if (shardHere && R.T - R.sealUp.t > 420) {
      ev('seal:gaveup', { frus: 5, note: 'no Wayshard found on depth ' + EX.depth });
      R.sealUp = null;
    }
    const floorT = R.T - R.floorT0,
      enough = !(shardHere && R.sealUp) && (roomsSeenFrac() >= P.cover || floorT > P.floorMax),
      cursed = EX.cursed && !EX.cursed.done;
    const boss = EX.groups.find(g => g.boss),
      d = distMap();
    if (boss && seenCell(boss.cell) && enough && !cursed && wantMore('boss'))
      return [
        'boss',
        (function* () {
          const p = pathTo(boss.cell);
          (R.bossLog = R.bossLog || []).length < 6 &&
            R.bossLog.push({
              d: EX.depth,
              boss: [xcx(boss.cell), xcy(boss.cell)],
              state: boss.state,
              path: p ? p.length : null,
              pc: [xcx(EX.pc), xcy(EX.pc)],
              doors: [...EX.doors]
                .filter(([i, dd]) => dd.lock === 'boss')
                .map(([i, dd]) => [xcx(i), xcy(i), dd.state]),
              keys: JSON.stringify(XRUN.keys),
              map: R.bossLog.length ? undefined : C.map(12, boss.cell)
            });
          const ok = yield* walk(boss.cell, { max: 60, allowSolid: true });
          if (!ok) {
            failed('boss');
            yield* think(1);
          }
        })()
      ];
    const toStairs = () =>
      (function* () {
        if (EX.pc === EX.down) {
          const off = adj4(EX.pc).find(
            n => xPassable(n) && !xSolid(n) && EX.t[n] !== T_ROCK && !xKnownTrap(n)
          );
          if (off) {
            yield* step(off);
            yield* think(0.3);
          }
          R.stairRetry = (R.stairRetry || 0) + 1;
        }
        const ok = yield* walk(EX.down, { max: 120 });
        if (!ok) {
          failed('down');
          if (!R.stairMap) {
            const dm = distMap();
            R.stairMap =
              C.map(10, EX.down) +
              '\nreach ' +
              dm[EX.down] +
              ' path ' +
              JSON.stringify(pathTo(EX.down)) +
              ' around ' +
              adj4(EX.down)
                .map(
                  n =>
                    xcx(n) +
                    ',' +
                    xcy(n) +
                    ':d' +
                    dm[n] +
                    (xSolid(n) ? ':solid ' + EX.propAt.get(n).kind : '') +
                    (xKnownTrap(n) ? ':trap' : '') +
                    (EX.doors.get(n) ? ':door ' + EX.doors.get(n).state : '') +
                    (EX.t[n] === T_ROCK ? ':rock' : '')
                )
                .join(' ') +
              ' downSolid ' +
              xSolid(EX.down) +
              ' ' +
              (EX.propAt.get(EX.down) || {}).kind +
              ' item ' +
              (EX.itemAt.get(EX.down) || {}).kind;
          }
        }
        yield* think(0.5);
      })();
    const sealed = XRUN && (XRUN.seals || []).some(x => x.depth === EX.depth && !x.open && !x.got);
    const downOK =
      seenCell(EX.down) && !!pathTo(EX.down) && !(sealed && (DONE.fails.get('down-sealed') || 0) >= 2);
    if (sealed && EX.pc === EX.down) failed('down-sealed');
    if (enough && downOK && !cursed && !boss) return ['stairs', toStairs()];
    const f = frontier(d);
    if (f >= 0)
      return [
        'explore',
        (function* () {
          yield* walk(f, { max: 40 });
        })()
      ];
    if (shardHere && R.sealUp) {
      const rr = pick(EX.rooms.filter(x => !x.side && seenCell(xi(x.cx, x.cy)) && d[xi(x.cx, x.cy)] >= 0));
      if (rr)
        return [
          'shard-hunt',
          (function* () {
            yield* walk(xi(rr.cx, rr.cy), { max: 40 });
            yield* searchHere();
          })()
        ];
    }
    // nothing left to see
    if (downOK && !cursed && !boss) return ['stairs', toStairs()];
    if (PZ && PZ.wait) {
      PZ.wait = null;
    }
    // stuck on a floor: no stairs in sight and nothing to explore. Search the walls
    // the only way on crosses a puzzle field this player has been stepping around: cross it
    if (!DONE.noAvoid && avoidSet().size) {
      DONE.noAvoid = true;
      return ['retry', think(0.2)];
    }
    // a known trap in the way: disarm it (the game will not let you walk onto one)
    const trap = EX.traps.find(
      t => t.armed && t.known && adj4(t.cell).some(n => d[n] >= 0) && !DONE.fails.has('tr' + t.cell)
    );
    if (trap)
      return [
        'disarm',
        (function* () {
          const s = adj4(trap.cell)
            .filter(n => d[n] >= 0)
            .sort((a, b) => d[a] - d[b])[0];
          const ok = yield* walk(s, { max: 40 });
          if (!ok) {
            failed('tr' + trap.cell);
            return;
          }
          yield* think(0.4);
          xDisarm();
          while (EX.action) yield;
          if (trap.armed) failed('tr' + trap.cell);
        })()
      ];
    // a locked door with no key: some locks can be picked (Disarm beside it)
    const ld = [...EX.doors].find(
      ([i, dd]) =>
        dd.state === 'locked' &&
        LOCKS[dd.lock] &&
        LOCKS[dd.lock].pick > 0 &&
        adj4(i).some(n => d[n] >= 0) &&
        (DONE.fails.get('pk' + i) || 0) < 5
    );
    if (ld)
      return [
        'pick',
        (function* () {
          const [i, dd] = ld;
          const st = adj4(i)
            .filter(n => d[n] >= 0)
            .sort((a, b) => d[a] - d[b])[0];
          const ok = yield* walk(st, { max: 40 });
          if (!ok) {
            failed('pk' + i);
            return;
          }
          yield* think(0.4);
          EX.needInput = false;
          xDisarm();
          while (EX.action) yield;
          if (dd.state === 'locked') {
            failed('pk' + i);
            ev('pick:fail', { frus: 1, note: LOCKS[dd.lock].name });
          }
        })()
      ];
    // part of the floor in sight but out of reach: search the walls nearest it
    if (!R.lostSince || R.lostFloor !== R.floors) {
      R.lostSince = R.T;
      R.lostFloor = R.floors;
    }
    const far = [];
    for (let c = 0; c < XN * XN; c++)
      if (
        EX.seen[c] &&
        EX.t[c] !== T_ROCK &&
        d[c] < 0 &&
        !EX.doors.has(c) &&
        !xSolid(c) &&
        !xKnownTrap(c) &&
        c !== EX.up &&
        c !== EX.down
      )
        far.push(c);
    if (far.length && (DONE.fails.get('near-far') || 0) < 4) {
      failed('near-far');
      const walls = wallCells(EX.pc, 99, 0)
        .map(c => ({ c, k: Math.min(...far.map(f => Math.hypot(xcx(f) - xcx(c), xcy(f) - xcy(c)))) }))
        .sort((a, b) => a.k - b.k)
        .slice(0, 10)
        .map(x => x.c)
        .sort(() => rand() - 0.5);
      return ['search-near', hunt(walls, 4)];
    }
    // still nothing after a long while: flee to camp from the pause menu (10% of your gold)
    if (R.T - R.lostSince > 240) {
      R.lostSince = R.T + 1e6;
      ev('flee:lost', { frus: 8, note: 'fled depth ' + EX.depth + ': no way on found' });
      R.fled = (R.fled || 0) + 1;
      openPause();
      const L = $('#mLeave');
      if (L) {
        L.click();
        L.click();
      }
      return null;
    }
    if (R.T - (R.lostAt || -1e9) > 60) {
      R.lostAt = R.T;
      ev('lost', {
        frus: 3,
        note: cursed ? 'cursed, no altar found' : boss ? 'boss unreachable' : 'no way on found'
      });
    }
    const rooms = EX.rooms.filter(x => !x.side && seenCell(xi(x.cx, x.cy)) && d[xi(x.cx, x.cy)] >= 0);
    const rr = pick(rooms);
    if (rr)
      return [
        'search-wide',
        (function* () {
          yield* walk(xi(rr.cx, rr.cy), { max: 40 });
          yield* searchHere();
        })()
      ];
    return ['wait', think(2)];
  }

  /* ---------------- puzzles, the way a person solves them ----------------
   Each solver uses only what the game shows the player (the tablet, the glowing path, the bells it
   plays, which way a statue faces) and P's skills: wheel (knows the colour wheel), memory (recalls a
   shown path or tune), logic (works out sums and pipe turns), care (does not slip on a step). */
  const PUZ = {};
  const rcells = r => xRoomCells(r);
  function puzzleDone(ok) {
    if (!PZ || PZ.done) return;
    PZ.done = true;
    PZ.ok = ok;
    PZ.time = Math.round(R.T - (PZ.t0 || R.T));
    if (ok) {
      const clean = PZ.mistakes <= 1;
      ev('puzzle:solved', {
        fun: 6 + (clean ? 3 : 0) + (PZ.time < 60 ? 2 : 0),
        note: PZ.kind + ' in ' + PZ.time + 's, ' + PZ.mistakes + ' mistakes'
      });
    }
    if (ok && PZ.time > 120)
      ev('puzzle:slow', {
        frus: Math.min(6, (PZ.time - 120) / 30),
        note: PZ.kind + ' took ' + PZ.time + 's'
      });
  }
  function giveUp(why) {
    if (!PZ || PZ.done) return;
    PZ.gaveUp = true;
    PZ.time = Math.round(R.T - (PZ.t0 || R.T));
    PZ.why = why;
    ev('puzzle:gaveup', { frus: 6, note: PZ.kind + ': ' + why });
  }
  const propsOf = k => EX.props.filter(p => p.kind === k && !p.gone);
  function* readTablet() {
    const t = EX.props.find(p => p.kind === 'tablet' && EX.room[p.cell] === EX.puzzle.room);
    if (t && !DONE.props.has(t)) {
      yield* bump(t.cell);
      DONE.props.add(t);
      yield* think(0.4);
    }
    return t;
  }
  PUZ.statues = pz =>
    (function* () {
      for (const s of pz.statues) {
        let n = 0;
        while (s.face !== s.want && n < 12) {
          yield* bump(s.cell);
          n++;
          if (PZ) PZ.steps++;
          yield* think(between(0.2, 0.5) * P.slow);
        }
        if (!chance(P.care) && !pz.solved) {
          yield* bump(s.cell);
          if (PZ) PZ.steps++;
          ev('puzzle:fumble', { frus: 0.6, note: 'turned a statue one too far' });
        }
      }
    })();
  PUZ.mirrors = pz =>
    (function* () {
      for (let k = 0; k < 8 && !pz.solved; k++) {
        const m = chance(P.logic)
          ? pz.mirrors.find(x => x.o !== x.want) || pick(pz.mirrors)
          : pick(pz.mirrors);
        yield* bump(m.cell);
        if (PZ) PZ.steps++;
        yield* think(between(0.4, 1.2) * P.slow);
      }
      if (!pz.solved) giveUp('the light never reached the crystal');
    })();
  PUZ.runes = pz =>
    (function* () {
      yield* readTablet();
      const know = P.wheel;
      for (let att = 0; att < 6 && !pz.solved; att++) {
        // which stone next: the right one if the player knows the wheel, else a guess
        const want = pz.seq[pz.step],
          lit = pz.stones.filter(s => !s.lit);
        const s = chance(know) ? lit.find(x => x.color === want) : pick(lit);
        if (!s) break;
        yield* bump(s.cell);
        if (PZ) PZ.steps++;
        yield* think(between(0.3, 0.8) * P.slow);
      }
      if (!pz.solved) giveUp('could not work out the rune order');
    })();
  PUZ.levers = pz =>
    (function* () {
      const ins = EX.props.find(p => p.kind === 'inscription');
      if (ins && !DONE.props.has(ins) && seenCell(ins.front)) {
        const ok = yield* bump(ins.cell, { max: 60 });
        if (ok) DONE.props.add(ins);
        while (EX.dlg) yield;
      }
      const known = ins && DONE.props.has(ins);
      if (!known && ins && !seenCell(ins.front) && PZ.tries < 3) {
        PZ.wait = () => DONE.props.has(ins);
        return;
      } // come back once the scratched order turns up
      for (let att = 0; att < 9 && !pz.solved; att++) {
        const want = pz.order[pz.step],
          left = pz.levers.filter(l => !l.on);
        const l =
          (known || (ins && DONE.props.has(ins))) && chance(0.97)
            ? left.find(x => x.sym === want)
            : pick(left);
        if (!l) break;
        yield* bump(l.cell);
        if (PZ) PZ.steps++;
        yield* think(between(0.3, 0.8) * P.slow);
      }
      if (!pz.solved) giveUp(known ? 'pulled them wrong' : 'never found the order');
    })();
  PUZ.plates = pz =>
    (function* () {
      for (const pl of pz.plates) {
        if (pz.blocks.some(b => b.cell === pl.cell)) continue;
        const b = pz.blocks
          .filter(b => xcx(b.cell) === xcx(pl.cell) && !pz.plates.some(q => q.cell === b.cell))
          .sort((a, c) => xcy(a.cell) - xcy(c.cell))[0];
        if (!b) continue;
        for (let k = 0; k < 6 && b.cell !== pl.cell && !pz.solved; k++) {
          const behind = b.cell + XN;
          if (behind !== EX.pc) {
            const ok = yield* walk(behind, { careful: true, max: 30 });
            if (!ok) break;
          }
          // push up: hold until the block moves one cell, then let go (sometimes a beat late)
          const c0 = b.cell;
          hold('up');
          const t0 = R.T;
          while (b.cell === c0 && R.T - t0 < 1.5) yield;
          if (!chance(P.care) && b.cell !== c0) {
            const t1 = R.T;
            while (R.T - t1 < 0.35) yield;
          }
          releaseKeys();
          if (PZ) PZ.steps++;
          yield* think(0.2);
        }
        if (b.cell !== pl.cell && !pz.solved) {
          // overshot or stuck: the reset rune puts the blocks back
          const rs = EX.props.find(p => p.kind === 'reset');
          ev('puzzle:mistake', { frus: 2, note: 'pushed a block past its plate' });
          if (PZ) PZ.mistakes++;
          if (rs) {
            yield* walk(rs.cell, { careful: true });
            yield* think(0.4);
          }
        }
      }
      if (!pz.solved && PZ.tries >= 3) giveUp('blocks would not sit on the plates');
    })();
  PUZ.trial = pz =>
    (function* () {
      const a = EX.props.find(p => p.kind === 'trialaltar');
      if (!a || a.spent) {
        if (!pz.solved) PZ.gaveUp = true;
        return;
      }
      yield* bump(a.cell);
      yield* think(0.5);
      if (a.spent || pz.solved) return;
    })();
  // stand on the start plate with a fresh run (the run starts when you step onto it)
  function* toStart(pz) {
    if (EX.pc === pz.start.cell && !pz.run) {
      const off = adj4(EX.pc).find(
        n =>
          xPassable(n) &&
          !xSolid(n) &&
          EX.t[n] !== T_ROCK &&
          !pz.tiles.some(t => t.cell === n) &&
          !EX.doors.has(n)
      );
      if (off) {
        yield* step(off);
        yield* think(0.3);
      }
    }
    const allow = pz.mem ? pz.tiles.map(t => t.cell) : [...((PZ && PZ.good) || [])];
    const ok = yield* walk(pz.start.cell, { max: 60, allow });
    return ok && EX.pc === pz.start.cell;
  }
  PUZ.path = pz =>
    (function* () {
      yield* readTablet();
      const order = pz.order,
        tiles = new Map(pz.tiles.map(t => [t.cell, t]));
      for (let att = 0; att < 6 && !pz.solved; att++) {
        const ok = yield* toStart(pz);
        if (!ok) {
          if (PZ) PZ.why2 = 'could not reach the start plate';
          break;
        }
        yield* think(0.5 * P.slow);
        let idx = 0,
          prev = pz.start.cell;
        const seen = new Set([pz.start.cell]);
        while (pz.run && !pz.solved) {
          const want = order[idx % order.length];
          const ns = adj4(EX.pc).filter(n => !seen.has(n) && (tiles.has(n) || n === pz.end.cell));
          if (ns.includes(pz.end.cell)) {
            yield* step(pz.end.cell);
            break;
          }
          const bad = PZ.bad || (PZ.bad = new Set()),
            good = PZ.good || (PZ.good = new Set());
          let cand = ns.filter(n => tiles.get(n) && tiles.get(n).sym === want && !bad.has(n));
          if (!chance(P.care)) cand = ns.filter(n => !bad.has(n)); // a slip of the eye
          if (!cand.length) break;
          cand.sort((a, b) => good.has(b) - good.has(a) || xcx(b) - xcx(a));
          const go = cand.length > 1 && !good.has(cand[0]) && chance(0.5) ? pick(cand) : cand[0];
          yield* think(between(0.3, 0.9) * P.slow);
          const ok2 = yield* step(go);
          if (PZ) PZ.steps++;
          if (!ok2) break;
          seen.add(go);
          idx++;
          if (!pz.run && !pz.solved) {
            if (chance(P.memory)) bad.add(go);
            break;
          } else good.add(go);
        }
        if (!pz.solved) {
          yield* think(1);
        }
      }
      if (!pz.solved) giveUp('kept stepping on biting stones');
    })();
  PUZ.memory = pz =>
    (function* () {
      for (let att = 0; att < 6 && !pz.solved; att++) {
        const ok = yield* toStart(pz);
        if (!ok) {
          if (PZ) PZ.why2 = 'could not reach the start plate';
          break;
        }
        if (!pz.run) {
          yield* think(0.3);
          continue;
        }
        // the path shows for 3.2 s: what this player keeps of it (the further along, the hazier)
        const safe = pz.tiles.filter(t => t.safe).map(t => t.cell),
          mem = PZ.mem || (PZ.mem = new Set()),
          bad = PZ.bad || (PZ.bad = new Set());
        safe.forEach((c, i) => {
          if (chance(Math.max(0.4, P.memory - 0.025 * i))) mem.add(c);
        });
        yield* think(1.2);
        const seen = new Set([pz.start.cell]);
        while (pz.run && !pz.solved) {
          const ns = adj4(EX.pc).filter(
            n => !seen.has(n) && (pz.tiles.some(t => t.cell === n) || n === pz.end.cell)
          );
          if (ns.includes(pz.end.cell)) {
            yield* step(pz.end.cell);
            break;
          }
          let cand = ns.filter(n => mem.has(n) && !bad.has(n));
          if (!cand.length) cand = ns.filter(n => !bad.has(n));
          if (!cand.length) break;
          cand.sort((a, b) => xcx(b) - xcx(a));
          const go = cand.length > 1 && chance(0.4) ? pick(cand) : cand[0];
          yield* think(between(0.3, 0.8) * P.slow);
          const ok2 = yield* step(go);
          if (PZ) PZ.steps++;
          if (!ok2) break;
          seen.add(go);
          if (!pz.run && !pz.solved) {
            bad.add(go);
            break;
          }
        }
      }
      if (!pz.solved) giveUp('could not remember the path');
    })();
  PUZ.bells = pz =>
    (function* () {
      const g = EX.props.find(p => p.kind === 'gong' && !p.gone);
      if (!g) {
        PZ.gaveUp = true;
        return;
      }
      for (let att = 0; att < 5 && !pz.solved; att++) {
        yield* bump(g.cell);
        const t0 = R.T;
        while ((pz.playing || !pz.heard) && R.T - t0 < 10) yield;
        const heard = pz.seq.map((k, i) =>
          chance(Math.max(0.5, P.memory - 0.03 * i)) ? k : Math.floor(rand() * 4)
        );
        for (let i = 0; i < heard.length && pz.heard && !pz.solved; i++) {
          const b = pz.bells[heard[i]];
          yield* bump(b.cell);
          if (PZ) PZ.steps++;
          yield* think(between(0.2, 0.6) * P.slow);
        }
        const t1 = R.T;
        while (!pz.solved && R.T - t1 < 1) yield;
      }
      if (!pz.solved) giveUp('could not repeat the tune');
    })();
  // sliding ice: a breadth-first search over where each slide stops, with some wasted slides for a weaker solver
  function iceStops(pz, from) {
    const ice = new Set(pz.ice),
      r = EX.rooms[pz.room],
      out = [];
    for (const [, dx, dy] of DIRN) {
      let cur = from;
      const n = xi(xcx(cur) + dx, xcy(cur) + dy);
      if (!ice.has(n) && n !== pz.goal.cell) continue;
      if (n === pz.goal.cell) {
        if (ice.has(from)) out.push({ dir: [dx, dy], to: n, goal: true });
        continue;
      }
      if (EX.t[n] === T_ROCK || xSolid(n)) continue;
      cur = n;
      for (let k = 0; k < 40; k++) {
        const nx = xi(xcx(cur) + dx, xcy(cur) + dy);
        if (nx === pz.goal.cell) {
          out.push({ dir: [dx, dy], to: nx, goal: true });
          cur = -1;
          break;
        }
        if (EX.t[nx] === T_ROCK || xSolid(nx) || EX.room[nx] !== r.id) break;
        const d = EX.doors.get(nx);
        if (d && d.state !== 'open') break;
        cur = nx;
        if (!ice.has(cur)) break;
      }
      if (cur >= 0) out.push({ dir: [dx, dy], to: cur });
    }
    return out;
  }
  function iceRim(pz) {
    const ice = new Set(pz.ice),
      r = EX.rooms[pz.room];
    return rcells(r).filter(c => !ice.has(c) && !xSolid(c) && c !== pz.goal.cell);
  }
  function iceSolve(pz, start) {
    const rim = new Set(iceRim(pz)),
      prev = new Map([[start, null]]),
      q = [start];
    for (let h = 0; h < q.length; h++) {
      const c = q[h];
      const froms = rim.has(c) ? [...rim] : [c];
      for (const f of froms) {
        for (const m of iceStops(pz, f)) {
          if (m.goal) {
            const plan = [{ from: f, dir: m.dir }];
            let x = c;
            while (prev.get(x)) {
              plan.unshift(prev.get(x).mv);
              x = prev.get(x).c;
            }
            return plan;
          }
          if (!prev.has(m.to)) {
            prev.set(m.to, { c, mv: { from: f, dir: m.dir } });
            q.push(m.to);
          }
        }
      }
    }
    return null;
  }
  // standing on the ice of a puzzle you are not solving: slide your way to the dry rim, the way you would plan it
  function iceEscape(pz) {
    const ice = new Set(pz.ice),
      prev = new Map([[EX.pc, null]]),
      q = [EX.pc];
    for (let h = 0; h < q.length; h++) {
      const c = q[h];
      for (const m of iceStops(pz, c)) {
        if (m.goal) continue;
        if (prev.has(m.to)) continue;
        prev.set(m.to, { c, dir: m.dir });
        if (!ice.has(m.to)) {
          const plan = [];
          let x = m.to;
          while (prev.get(x)) {
            plan.unshift({ from: prev.get(x).c, dir: prev.get(x).dir });
            x = prev.get(x).c;
          }
          return plan;
        }
        q.push(m.to);
      }
    }
    return null;
  }
  function* offIce(pz) {
    for (let k = 0; k < 8; k++) {
      while (EX.slide) yield;
      const ice = new Set(pz.ice);
      if (!ice.has(EX.pc)) return true;
      const dry = adj4(EX.pc).find(
        n => !ice.has(n) && xPassable(n) && !xSolid(n) && EX.t[n] !== T_ROCK && !xKnownTrap(n)
      );
      if (dry) {
        yield* step(dry);
        continue;
      } // the rim is right there: just step off
      const plan = iceEscape(pz);
      if (!plan || !plan.length) {
        if (!R.iceDump) {
          R.iceDump = {
            map: C.map(8, EX.pc),
            pc: [xcx(EX.pc), xcy(EX.pc)],
            stops: iceStops(pz, EX.pc).map(m => [m.dir.join(','), xcx(m.to), xcy(m.to), !!m.goal]),
            solved: pz.solved,
            goal: [xcx(pz.goal.cell), xcy(pz.goal.cell)],
            ice: pz.ice.length
          };
        }
        return false;
      }
      const mv = plan[0],
        to = xi(xcx(EX.pc) + mv.dir[0], xcy(EX.pc) + mv.dir[1]),
        D = dirTo(EX.pc, to);
      if (!D) return false;
      yield* think(between(0.3, 0.8));
      hold(D[0]);
      const t0 = R.T;
      while (EX.pc === mv.from && R.T - t0 < 0.8) yield;
      releaseKeys();
      const t1 = R.T;
      while (EX.slide && R.T - t1 < 6) yield;
    }
    return !new Set(pz.ice).has(EX.pc);
  }
  PUZ.ice = pz =>
    (function* () {
      const ice = new Set(pz.ice);
      for (let att = 0; att < 14 && !pz.solved; att++) {
        while (EX.slide) yield;
        let plan = iceSolve(pz, EX.room[EX.pc] === pz.room ? EX.pc : iceRim(pz)[0]);
        if (!plan) {
          giveUp('no way across the ice');
          return;
        }
        let mv = plan[0];
        if (!chance(P.logic)) {
          const rim = iceRim(pz).filter(c => adj4(c).some(n => ice.has(n)));
          const f = ice.has(EX.pc) ? EX.pc : pick(rim);
          const ms = iceStops(pz, f);
          if (ms.length) {
            const m = pick(ms);
            mv = { from: f, dir: m.dir };
          }
        } // a slide that looked good
        if (EX.pc !== mv.from) {
          const ok = ice.has(EX.pc) ? false : yield* walk(mv.from, { careful: true, max: 30 });
          if (!ok && !ice.has(EX.pc)) {
            yield* think(0.5);
            continue;
          }
          if (ice.has(EX.pc) && EX.pc !== mv.from) continue;
        }
        const to = xi(xcx(EX.pc) + mv.dir[0], xcy(EX.pc) + mv.dir[1]);
        yield* think(between(0.4, 1.1) * P.slow);
        const D = dirTo(EX.pc, to);
        if (!D) continue;
        hold(D[0]);
        const t0 = R.T;
        while (EX.pc === mv.from && R.T - t0 < 0.8) yield;
        releaseKeys();
        if (PZ) PZ.steps++;
        const t1 = R.T;
        while (EX.slide && R.T - t1 < 6) yield;
      }
      if (!pz.solved) giveUp('slid around the ice without reaching the pedestal');
    })();
  PUZ.scales = pz =>
    (function* () {
      yield* readTablet();
      const vals = pz.stones;
      let want = null;
      const combos = [];
      for (let a = 0; a < 5; a++)
        for (let b = a + 1; b < 5; b++)
          for (let c = b + 1; c < 5; c++)
            if (vals[a].v + vals[b].v + vals[c].v === pz.target) combos.push([vals[a], vals[b], vals[c]]);
      for (let att = 0; att < 4 && !pz.solved; att++) {
        want = chance(P.logic) && combos.length ? combos[0] : [...vals].sort(() => rand() - 0.5).slice(0, 3);
        if (att) yield* think(between(2, 5) * P.slow);
        else yield* think(between(1, 4) * P.slow);
        for (const s of vals) {
          if (s.on !== want.includes(s)) {
            yield* bump(s.cell);
            if (PZ) PZ.steps++;
            yield* think(between(0.2, 0.5));
            if (pz.solved) break;
          }
        }
      }
      if (!pz.solved) giveUp('could not make the weight');
    })();
  PUZ.shift = pz =>
    (function* () {
      const fits = t => pzFits(t),
        cells = new Set(pz.tiles.map(t => t.cell));
      for (let k = 0; k < 40 && !pz.solved; k++) {
        const bad = pz.tiles.filter(t => t.need && !fits(t));
        if (!bad.length) {
          yield* think(0.5);
          if (!pz.solved) {
            giveUp('pipes looked joined but nothing happened');
          }
          return;
        }
        // reach a wrong stone from outside the grid if you can (stepping on any stone turns it)
        let t = bad.find(x => adj4(x.cell).some(n => !cells.has(n) && EX.room[n] === pz.room)) || bad[0];
        if (!chance(P.logic)) t = pick(pz.tiles);
        const out = adj4(t.cell).filter(n => !cells.has(n) && EX.room[n] === pz.room && !xSolid(n));
        if (out.length) {
          if (!out.includes(EX.pc)) {
            const ok = yield* walk(out[0], { careful: true, max: 30 });
            if (!ok) break;
          }
          yield* think(between(0.3, 0.9) * P.slow);
          yield* step(t.cell);
          if (PZ) PZ.steps++;
          if (pz.solved) break;
          const back = adj4(EX.pc).filter(n => !cells.has(n) && EX.room[n] === pz.room && !xSolid(n));
          if (back.length) yield* step(back[0]);
        } else {
          // the middle stone: through a neighbour and back
          const via = adj4(t.cell).find(
            n => cells.has(n) && adj4(n).some(m => !cells.has(m) && EX.room[m] === pz.room)
          );
          if (!via) break;
          const o2 = adj4(via).find(m => !cells.has(m) && EX.room[m] === pz.room && !xSolid(m));
          if (EX.pc !== o2) {
            const ok = yield* walk(o2, { careful: true, max: 30 });
            if (!ok) break;
          }
          yield* step(via);
          yield* step(t.cell);
          yield* step(via);
          yield* step(o2);
          if (PZ) PZ.steps += 4;
        }
      }
      if (!pz.solved) giveUp('could not join the channel');
    })();
  PUZ.riddle = pz =>
    (function* () {
      const g = EX.props.find(p => p.kind === 'guardian');
      if (!g || pz.wrong >= 2) {
        if (!pz.solved) giveUp('the guardian fell silent');
        return;
      }
      yield* bump(g.cell);
      const t0 = R.T;
      while (R.T - t0 < 1 && !EX.dlg) yield;
      while (EX.dlg || xPaused) yield;
      if (pz.wrong >= 2 && !pz.solved) giveUp('the guardian fell silent');
    })();
  PUZ.braziers = pz =>
    (function* () {
      // carry the flame from the lit brazier to the cold ones before it dies
      const cold = () => pz.cold.filter(b => !b.lit);
      if (cold().some(b => !seenCell(b.cell)) && PZ.tries < 3) {
        PZ.wait = () => pz.cold.every(b => seenCell(b.cell));
        return;
      }
      for (let att = 0; att < 6 && !pz.solved; att++) {
        const lit = [pz.src, ...pz.cold.filter(b => b.lit)],
          d = distMap();
        const src = lit.sort((a, b) => (d[standFor(a.cell)] || 999) - (d[standFor(b.cell)] || 999))[0];
        yield* bump(src.cell);
        if (!(EX.flameT > 0)) {
          yield* think(0.5);
          continue;
        }
        while (EX.flameT > 0 && cold().length) {
          const d2 = distMap();
          const nx = cold()
            .filter(b => seenCell(b.cell))
            .sort((a, b) => (d2[standFor(a.cell)] + 1 || 999) - (d2[standFor(b.cell)] + 1 || 999))[0];
          if (!nx) break;
          const ok = yield* bump(nx.cell, { max: 40 });
          if (PZ) PZ.steps++;
          if (!ok) break;
        }
      }
      if (!pz.solved) giveUp('the flame kept dying on the way');
    })();

  /* ---------------- dialogs, screens and camp ---------------- */
  function readTime() {
    const t = ($('#xdText').textContent || '') + ($('#xdSub').textContent || '');
    return Math.min(7, (0.7 + t.length / 45) * P.read);
  }
  let DLG = null;
  function dialogTick() {
    const o = EX && EX.dlg;
    if (!o) {
      DLG = null;
      return;
    }
    if (!DLG || DLG.o !== o) {
      DLG = { o, t: R.T + readTime() + between(0.2, 0.6), n: 0 };
    }
    if (R.T < DLG.t) return;
    DLG.n++;
    if (DLG.n > 4) {
      recover('dialog timeout', String(o.title || '?'), () => xDlgClose());
      return;
    }
    const title = String(o.title || ''),
      btns = [...document.querySelectorAll('#xdBtns .btn')],
      rows = [...document.querySelectorAll('#xdBody .xrow')];
    const click = b => {
        DLG.t = R.T + between(0.5, 1.2);
        b.click();
      },
      closeIt = () => {
        const gh = btns.find(b => b.classList.contains('ghost'));
        if (gh) gh.click();
        else {
          const close = btns.find(b => /^(Close|Leave|Cancel)$/.test(b.textContent.trim()));
          if (close) close.click();
          else recover('missing close control', String(o.title || '?'), () => xDlgClose());
        }
      };
    if (title.startsWith('Choose your way down')) {
      // the path map: each style likes its own kind of floor
      const ways = rows
        .map(r => ({
          r,
          name: (r.querySelector('.nm b') || {}).textContent || '',
          b: r.querySelector('button')
        }))
        .filter(x => x.b);
      const score = x => {
        const n = x.name.toLowerCase();
        return (P.route[Object.keys(P.route).find(k => n.indexOf(k) >= 0)] || 0) + rand();
      };
      const w = ways.sort((a, b) => score(b) - score(a))[0];
      if (w) {
        ev('route', { fun: 0.5, note: w.name });
        return click(w.b);
      }
      R.routeFail = (R.routeFail || 0) + 1;
      R.routeWhy = rows.length + ' rows, ' + document.querySelectorAll('#xdBody button').length + ' buttons';
      return closeIt();
    }
    if (title === 'The guardian') {
      const pz = EX.puzzle,
        Q = pz && pz.q;
      const right = btns.find(b => Q && b.textContent === Q.a);
      const lore = /tale/.test($('#xdText').textContent || '');
      const p = lore ? P.lore : P.wheel;
      const b = right && chance(p) ? right : pick(btns);
      return click(b);
    }
    if (/^Trial of/.test(title)) {
      const go = btns.find(b => /Begin/.test(b.textContent));
      if (go && chance(P.trialP)) return click(go);
      if (EX.puzzle && PZ) giveUp('declined the trial');
      return closeIt();
    }
    if (o.tabs && o.tabs.some(t => t[0] === 'buy')) return merchantTick(o, rows, closeIt);
    if (o.sub === 'Sanctuary') {
      const rest = btns.find(b => b.textContent === 'Rest'),
        bind = btns.find(b => /Bind/.test(b.textContent));
      if (bind) return click(bind);
      if (rest && EX.hp < xmaxHp() * 0.8) return click(rest);
      return closeIt();
    }
    // people: take a quest now and then
    const yes = btns.find(b =>
      /I’ll find it|Follow me|Agreed|Show me|Trade a shard|Go, quickly|Face it|Get up|Keep exploring|Got it/.test(
        b.textContent
      )
    );
    if (yes && (!/I’ll find it|Follow me|Agreed/.test(yes.textContent) || chance(P.questP)))
      return click(yes);
    // anything that costs gold: only if this player would spend it
    const main = btns.find(b => !b.classList.contains('ghost'));
    if (main && /\d/.test(main.textContent)) {
      const price = parseInt(main.textContent.replace(/[^\d]/g, ''), 10) || 0;
      if (save.gold - price >= P.reserve() && chance(P.spendP)) return click(main);
      return closeIt();
    }
    if (main && !/Build deck/.test(main.textContent)) return click(main);
    return closeIt();
  }
  /* ---------------- merchants and the camp shop ----------------
   What a player buys: gear better than what they wear, an upgrade for the weapon or armour they wear,
   a card worth having, a blessing, healing; what they sell: gear they do not wear. Careful players keep a
   reserve (P.reserve); the shopaholic spends nearly everything. Every gold piece spent is logged by kind. */
  const spendLog = (k, n) => {
    if (n > 0) R.spend[k] = (R.spend[k] || 0) + n;
  };
  function wornTier(slot) {
    const g = gearState(save).gear;
    const ids = slot === 'ring' ? [g.ring1, g.ring2] : [g[slot]];
    let lo = 99;
    for (const id of ids) {
      const G = id && GEAR[id];
      lo = Math.min(lo, G ? (G.legendary ? 9 : G.tier || 0) : -1);
    }
    return lo;
  }
  const gearBetter = id => {
    const G = GEAR[id];
    return G && (G.legendary ? 9 : G.tier || 0) > wornTier(G.slot);
  };
  const budget = price => save.gold - price >= (P.shopaholic ? 60 : P.reserve());
  function cardWanted(c) {
    if (!c) return false;
    const good = ['rare', 'legendary'].includes(c.rarity) || (c.rarity === 'uncommon' && c.color === P.lean);
    return (
      good &&
      (c.color === P.lean || NEUTRAL.includes(c.color) || P.shopaholic) &&
      (save.owned[c.id] || 0) < copyLimit(c)
    );
  }
  function merchantTick(o, rows, closeIt) {
    const p = EX.props.find(q => q.name === o.title && q.stock);
    if (!p) return closeIt();
    DLG.n = 0;
    const rowFor = name =>
      rows.find(r => {
        const b = r.querySelector('.nm b');
        return b && b.textContent.replace(' ✹', '').indexOf(name) === 0;
      });
    const go = (r, kind, price) => {
      const b = r && r.querySelector('button:not([disabled])');
      if (!b) return false;
      const g0 = save.gold;
      b.click();
      spendLog(kind, g0 - save.gold);
      if (save.gold < g0) R.shopBuys++;
      DLG.t = R.T + between(0.8, 1.6);
      return true;
    };
    if (o.tab === 'buy') {
      for (const it of p.stock) {
        if (it.sold || save.gold < it.price || !budget(it.price)) continue;
        let want = false,
          name = '';
        if (it.kind === 'gear') {
          want = gearBetter(it.id) && (!it.shady || P.shopaholic || chance(0.5));
          name = GEAR[it.id].name;
        } else if (it.kind === 'card') {
          want = cardWanted(it.card) && chance(P.spendP + 0.3);
          name = it.card.name;
        } else if (it.kind === 'bag') {
          want =
            (it.k === 'draught' && bagN('draught') < P.draughts) ||
            (it.k === 'antidote' && bagN('antidote') < 1 && chance(0.5));
          name = BAG[it.k].name;
        } else if (it.kind === 'perm') {
          want = chance(P.shopaholic ? 0.9 : 0.6);
          name = 'Vial of ' + PERM[it.k].name;
        } else if (it.kind === 'mat') {
          want = it.k === 'ore' && matN('ore') < 3 && chance(0.6);
          name = MATS[it.k].name;
        }
        if (!want || DLG['x' + name]) continue;
        DLG['x' + name] = 1;
        const r = rowFor(name);
        if (
          r &&
          go(
            r,
            it.kind === 'bag'
              ? 'potions'
              : it.kind === 'perm'
                ? 'blessings'
                : it.kind === 'mat'
                  ? 'materials'
                  : it.kind,
            it.price
          )
        ) {
          if (it.kind === 'gear') PT.run.wearBetter(save, [it.id]);
          return;
        }
      }
      const sell = document.querySelector('#xdTabs .chip:nth-child(2)');
      if (sell && !DLG.sold) {
        DLG.sold = 1;
        sell.click();
        DLG.t = R.T + between(0.5, 1);
        return;
      }
    }
    if (o.tab === 'sell') {
      if (chance(P.sellP || 0.8)) {
        const r = rows.find(r => /Not worn/.test(r.textContent) && r.querySelector('button:not([disabled])'));
        if (r) {
          const g0 = save.gold;
          r.querySelector('button').click();
          R.sold = (R.sold || 0) + (save.gold - g0);
          DLG.t = R.T + between(0.5, 1);
          return;
        }
      }
      const sv = document.querySelector('#xdTabs .chip:nth-child(3)');
      if (sv && !DLG.serv) {
        DLG.serv = 1;
        sv.click();
        DLG.t = R.T + between(0.5, 1);
        return;
      }
    }
    if (o.tab === 'services') {
      for (const r of rows) {
        const b = r.querySelector('button:not([disabled])');
        if (!b || DLG['s' + r.textContent.slice(0, 30)]) continue;
        const t = r.textContent,
          m = /(\d+) gold/.exec(t),
          price = m ? +m[1] : 0;
        const want =
          (/^Upgrade/.test(t) && matN('ore') >= 1 && budget(price)) ||
          (/Lift the curse/.test(t) && budget(price)) ||
          (/Shards for a blessing/.test(t) && matN('shard') >= 3);
        DLG['s' + t.slice(0, 30)] = 1;
        if (want && go(r, /Upgrade/.test(t) ? 'upgrades' : /curse/.test(t) ? 'curses' : 'blessings', price))
          return;
      }
    }
    return closeIt();
  }
  // the camp shop: recharge the deck's spent Charge cards, then better gear and a good card from today's stock (packs come after)
  function campShop() {
    const st = shopStock(),
      buyO = (o, kind) => {
        if (save.gold < o.price || !budget(o.price)) return false;
        const g0 = save.gold;
        shopBuy(o);
        spendLog(kind, g0 - save.gold);
        R.T += between(2, 5) * P.read;
        return save.gold < g0;
      };
    const deck = new Set(save.decks[0].list);
    for (const o of shopRecharges()) {
      if (!deck.has(o.id) && !P.shopaholic) continue;
      const c = CARDS[o.id];
      if (o.low / c.uses > (P.rechargeAt || 0.5)) continue;
      buyO(o, 'recharges');
    }
    for (const id of st.gear) {
      if (st.sold.includes('g:' + id) || !gearBetter(id)) continue;
      if (buyO({ kind: 'gear', id, price: SHOP_GEAR_PRICE(GEAR[id]) }, 'gear')) PT.run.wearBetter(save, [id]);
    }
    for (const id of st.cards) {
      if (st.sold.includes('c:' + id) || !cardWanted(CARDS[id]) || !chance(P.spendP + 0.3)) continue;
      buyO({ kind: 'card', id, price: SHOP_CARD_PRICE[CARDS[id].rarity] || 80 }, 'card');
    }
    try {
      $('#scrShop').classList.remove('on');
    } catch (e) {}
  }
  let RV = null;
  function revealTick() {
    if (!on('reveal')) {
      RV = null;
      return;
    }
    if (!RV) RV = { t: R.T + between(1, 2.5) * P.read };
    if (R.T < RV.t) return;
    const bs = [...document.querySelectorAll('#rvBtns .btn')];
    const b = bs.find(x => !x.classList.contains('ghost')) || bs[0];
    RV = null;
    if (b) b.click();
  }
  let PK = null;
  function packTick() {
    const ov = $('#packOpen');
    if (!ov.classList.contains('on')) {
      PK = null;
      return;
    }
    if (!PK) PK = { t: R.T + 0.9 };
    if (R.T < PK.t) return;
    const down = [...document.querySelectorAll('#poFan .poslot:not(.up)')],
      done = $('#poDone');
    if (down.length && ov.classList.contains('burst')) {
      if (P.revealAll && !$('#poAll').hidden) {
        $('#poAll').click();
        PK.t = R.T + 0.8;
        return;
      }
      down[0].click();
      PK.t = R.T + between(0.4, 0.9);
      return;
    }
    if (!done.hidden) {
      R.packsOpened++;
      done.click();
      PK = null;
      return;
    }
    PK.t = R.T + 0.2;
  }
  function lvlTick() {
    if (!on('lvlUp')) return false;
    const ch = save.char;
    PT.run.spendAll(ch, P.statStyle);
    closeLevelUp(true);
    R.T += between(4, 10) * P.read;
    return true;
  }

  // camp: build the deck, put on gear, shop, and go back down
  function campVisit(why) {
    const t0 = R.T;
    if (R.shopTrip && why !== 'death') {
      why = 'shop';
      R.shopTrip = false;
    }
    R.sinceCamp = 0;
    R.camps.push({ t: Math.round(R.T), why, d: save.deepest });
    const style = P.deckStyle,
      lean = P.lean;
    try {
      PT.run.wearBetter(save, Object.keys(gearState(save).items));
    } catch (e) {
      err('gear', e);
    }
    if (pointsLeft(save.char) > 0) {
      PT.run.spendAll(save.char, P.statStyle);
      lockChar(save.char);
    }
    // the shop: packs at the price for the depth you have reached
    try {
      campShop();
    } catch (e) {
      err('camp shop', e);
    }
    const fam = packPrice(true, save.deepest),
      boo = packPrice(false, save.deepest);
    let bought = 0;
    const buy = f => {
      const pr = f ? fam : boo;
      if (save.gold < pr) return false;
      save.gold -= pr;
      R.spent += pr;
      spendLog('packs', pr);
      R.packs++;
      bought++;
      const res = addCards(save, openPack(save.deepest, f ? lean : null));
      R.T += between(4, 9) * P.read;
      return true;
    };
    if (P.shopaholic) {
      while (save.gold >= boo) {
        if (!buy(chance(0.7) && save.gold >= fam)) break;
      }
    } else {
      const reserve = P.reserve();
      for (let k = 0; k < P.packsPerVisit; k++) {
        if (save.gold - fam >= reserve) buy(true);
        else if (P.boosters && save.gold - boo >= reserve) buy(false);
        else break;
      }
    }
    if (!bought && save.gold < boo)
      ev('shop:broke', { frus: 0.6, note: 'pack ' + boo + ' gold, have ' + save.gold });
    // the deck
    try {
      if (style === 'average' && save.decks[0].list.length)
        save.decks[0].list = PT.run.tweakDeck(save, lean, R.newIds || [], rand);
      else save.decks[0].list = PT.run.buildDeck(style, save, lean).list;
      if (!validateDeck(save.decks[0].list, CARDS, save.owned).ok)
        save.decks[0].list = PT.run.buildDeck('good', save, lean).list;
    } catch (e) {
      err('deck', e);
    }
    R.newIds = [];
    R.T += between(30, 90) * P.read;
    R.time.camp += R.T - t0;
    // back down: where this player starts again
    const deep = save.deepest;
    let d = XPARK ? XPARK.depth : Math.max(1, deep - (why === 'death' ? P.backoff : 0));
    d = Math.min(Math.max(1, d), deep);
    pickDepth = d;
    openCamp();
    enterExplore(d);
    if (!EX) {
      err('camp', 'could not enter depth ' + d + ' deck ' + save.decks[0].list.length);
      return false;
    }
    newFloor();
    R.entered++;
    return true;
  }

  /* ---------------- one career ---------------- */
  function runCareer(cfg) {
    installClock();
    wrapGame();
    rng = U.rng(cfg.policySeed ?? U.seedFor('crawl-policy', cfg.seed ?? 1));
    Math.random = U.rng(cfg.worldSeed ?? cfg.seed ?? 1);
    if (typeof XR !== 'undefined') XR = Math.random; // dungeon.js keeps its own handle on the dice
    VT = 0;
    Q.length = 0;
    DBASE = 1.7e12 + (cfg.seed ?? 1) * 86400000;
    P = Object.assign({ lean: cfg.lean }, cfg.p);
    const resv = P.reserveBase || 200;
    P.reserve = () => resv + 10 * (save ? save.deepest : 1);
    R = {
      mode: cfg.mode || 'strict',
      recoveries: [],
      label: cfg.label,
      lean: cfg.lean,
      seed: cfg.seed,
      T: 0,
      fun: 0,
      frus: 0,
      mood: 0,
      moodMin: 0,
      win10: [],
      quits: [],
      events: [],
      errors: [],
      deaths: [],
      camps: [],
      puzzles: [],
      fights: [],
      hurt: {},
      cards: {},
      dlgs: {},
      cues: 0,
      clicks: 0,
      tells: 0,
      tellsSeen: 0,
      spend: {},
      trace: [],
      traceOn: !!cfg.trace,
      dlgN: 0,
      recentDlg: [],
      onceSeen: {},
      lastK: {},
      bag: {},
      time: { walk: 0, fight: 0, puzzle: 0, dialog: 0, camp: 0, other: 0 },
      logN: 0,
      floors: 0,
      stuck: 0,
      searches: 0,
      searchHits: 0,
      campTrips: 0,
      burned: 0,
      spent: 0,
      packs: 0,
      packsOpened: 0,
      shopBuys: 0,
      idolsSeen: 0,
      entered: 0,
      lastNovel: 0,
      depthT: {},
      maxDepth: 1
    };
    // a new character: the one-colour deal, the bot's stats, a deck in its style
    const ch = newChar('human', 0);
    PT.run.spendAll(ch, P.statStyle);
    const ids = PT.run.dealRun(cfg.lean, rand),
      owned = {};
    ids.forEach(id => (owned[id] = (owned[id] || 0) + 1));
    save = newSave(STARTERS[0]);
    Object.assign(save, {
      gold: 100,
      depth: 1,
      deepest: 1,
      owned,
      seen: Object.assign({}, owned),
      decks: [{ name: 'run', list: [] }],
      active: 0,
      wins: 0,
      lean: cfg.lean,
      char: lockChar(ch),
      level: 1,
      xp: 0
    });
    try {
      localStorage.clear();
    } catch (e) {}
    save.decks[0].list = PT.run.buildDeck(P.deckStyle, save, cfg.lean).list;
    R.startDeck = PT.run.deckInfo(save.decks[0].list);
    pickDepth = 1;
    openCamp();
    enterExplore(1);
    if (!EX) return Object.assign(R, { error: 'could not enter the dungeon' });
    newFloor();
    R.entered = 1;
    const T_END = cfg.hours * 3600;
    let fightGuard = 0,
      lastD = 1,
      seen0 = 0,
      lastSeenN = 0;
    const real0 = realNow();
    while (
      R.T < T_END &&
      R.errors.length < (R.mode === 'strict' ? 1 : 20) &&
      !(R.mode === 'strict' && R.inv?.length)
    ) {
      if (realNow() - real0 > (cfg.realLimit || 900) * 1000) {
        R.errors.push(
          'real-time limit at ' + Math.round(R.T) + 's, depth ' + (EX ? EX.depth : '-') + ', task ' + TASKNAME
        );
        break;
      }
      // a fight the map started
      if (B && (B.phase === 'fight' || B.phase === 'custom') && on('scrBattle')) {
        const fs = R.fightStart || {};
        let r;
        try {
          r = PT.runFight({
            adopt: true,
            depth: B.depth,
            bot: cfg.bot,
            botName: cfg.label,
            maxT: 900,
            seed: U.seedFor('fight', cfg.seed ?? 1, R.fights.length),
            policySeed: U.seedFor('fight-policy', cfg.policySeed ?? cfg.seed ?? 1, R.fights.length)
          });
        } catch (e) {
          err('fight', e);
          r = { res: 'error', errors: [e.message] };
        }
        const secs = r.realSecs ?? r.time ?? 0;
        R.T += secs;
        VT += secs;
        R.time.fight += secs;
        const f = {
          d: B ? B.depth : EX ? EX.depth : 0,
          res: r.res,
          secs: Math.round(secs),
          hpLost: r.dmgTaken,
          hp0: fs.hp,
          maxHp: r.maxHp,
          elites: PT.lastB ? PT.lastB.enemies.filter(e => e.elite).length : 0,
          n: PT.lastB ? PT.lastB.enemies.length : 0,
          op: fs.op,
          boss: fs.boss,
          mini: fs.mini,
          combos: Object.values(r.combos || {}).reduce((a, b) => a + b, 0),
          name: fs.name,
          warn: r.warn
        };
        R.fights.push(f);
        if (r.errors && r.errors.length) R.errors.push(...r.errors.slice(0, 2).map(x => 'fight ' + x));
        if (r.res === 'win') {
          const left = r.hpEnd / Math.max(1, r.maxHp);
          ev('fight:win', {
            fun:
              2 +
              (fs.boss ? 8 : fs.mini ? 5 : 0) +
              (left < 0.25 ? 4 : left < 0.45 ? 2 : 0) +
              Math.min(2, f.combos * 0.3),
            note: f.name + (left < 0.25 ? ' (close call)' : '')
          });
          if (secs > 100)
            ev('fight:long', {
              frus: Math.min(5, (secs - 100) / 30),
              note: f.name + ' ' + Math.round(secs) + 's'
            });
          else if (r.dmgTaken <= 3 && secs > 30 && !fs.boss)
            ev('fight:dull', { frus: 0.6, note: f.name + ' ' + Math.round(secs) + 's, no danger' });
        } else if (r.res !== 'lose') {
          ev('fight:' + r.res, { frus: 2 });
          recover('forced fight defeat', r.res, () => {
            B.phase = 'lose';
            B.player.hp = 0;
            B.hooks.onEnd && B.hooks.onEnd(false);
          });
        }
        try {
          checkSave();
        } catch (e) {
          err('health', e);
        }
        R.fightStart = null;
        if (++fightGuard > 3000) break;
        continue;
      }
      VT += DT;
      R.T += DT;
      fire();
      moodTick(DT);
      if (packTick !== null && $('#packOpen').classList.contains('on')) {
        packTick();
        R.time.dialog += DT;
        continue;
      }
      if (on('reveal')) {
        revealTick();
        R.time.dialog += DT;
        continue;
      }
      if (lvlTick()) continue;
      if (on('scrCamp') || on('scrMenu') || !EX) {
        if (!campVisit(R.deaths.length && R.lastDeathSeen !== R.deaths.length ? 'death' : 'rest')) break;
        R.lastDeathSeen = R.deaths.length;
        continue;
      }
      if (!on('scrExplore')) {
        // some other screen: close it
        if (on('scrBattle') && B && B.phase !== 'fight') {
          continue;
        }
        R.time.other += DT;
        R.otherT = (R.otherT || 0) + DT;
        if (R.otherT > 30) {
          err('screen', [...document.querySelectorAll('.scr.on')].map(e => e.id).join(','));
          recover('unexpected screen', 'no exploration screen for 30 seconds', () => openCamp());
          R.otherT = 0;
        }
        continue;
      }
      R.otherT = 0;
      if (EX.dlg || on('xDialog')) {
        dialogTick();
        R.time.dialog += DT;
        if (!EX || !EX.dlg) {
          if (on('xDialog')) xDlgClose();
        }
        stepMap();
        continue;
      }
      stepMap();
      if (EX && EX.active && !EX.busy) healthTick();
      if (!EX || !EX.active || EX.busy) continue;
      if (EX.depth !== lastD) {
        if (EX.depth > R.maxDepth) {
          R.maxDepth = EX.depth;
          ev('depth:new', { fun: 2 + (isBossDepth(EX.depth - 1) ? 4 : 0), note: 'depth ' + EX.depth });
        }
        lastD = EX.depth;
        TASK = null;
        releaseKeys();
        newFloor();
        // just arrived and badly hurt: a careful player goes up to camp to rest (the floor waits)
        if (EX.hp < xmaxHp() * P.campAt && EX.pc === EX.up) {
          ev('retreat', { frus: 1.5, note: 'back to camp at ' + Math.round(EX.hp) + ' HP' });
          xToCamp();
          continue;
        }
        // every few floors, a trip to camp from the stairs up (free there) to shop and rebuild the deck
        R.sinceCamp = (R.sinceCamp || 0) + 1;
        if (R.sinceCamp >= (P.campEvery || 4) && EX.pc === EX.up && !EX.busy) {
          R.shopTrip = true;
          xToCamp();
          continue;
        }
      }
      // new things seen: the player is getting somewhere
      {
        let n = 0;
        for (let c = 0; c < XN * XN; c += 3) if (EX.seen[c]) n++;
        if (n > lastSeenN) {
          lastSeenN = n;
          R.lastNovel = R.T;
        }
        if (EX.depth !== R.nDepth) {
          R.nDepth = EX.depth;
          lastSeenN = n;
        }
      }
      if (R.T - R.lastNovel > 30) {
        ev('dead time', { frus: 1.2, note: TASKNAME || '?' });
        R.lastNovel = R.T;
      }
      if (R.stairsSeenT == null && seenCell(EX.down)) R.stairsSeenT = R.T - R.floorT0;
      if (R.T - R.floorT0 > P.floorMax * 2 && !R.floorLong) {
        R.floorLong = 1;
        ev('floor:long', {
          frus: 3,
          note: 'depth ' + EX.depth + ' over ' + Math.round(P.floorMax * 2) + 's'
        });
      }
      // a first strike on a monster in reach
      if (
        P.strikeP &&
        !EX.action &&
        EX.groups.some(
          g => !g.dormant && EX.vis[g.cell] && Math.hypot(g.x - EX.px, g.z - EX.pz) < XCS * 1.7
        ) &&
        chance(P.strikeP * DT * 4)
      )
        xStrike();
      R.depthT[EX.depth] = (R.depthT[EX.depth] || 0) + DT;
      for (const tr of EX.traps) {
        if (tr.eyed || !tr.armed || tr.known || !EX.vis[tr.cell]) continue;
        if (Math.hypot(xw(tr.cell) - EX.px, xz(tr.cell) - EX.pz) / XCS > 3) continue;
        tr.eyed = true;
        R.tells++;
        if (chance(P.eye)) {
          R.tellsSeen++;
          R.spot = tr.cell;
          TASK = null;
          releaseKeys();
          EX.path = [];
          EX.goal = null;
        }
      }
      if (EX.slide && !R.sliding && !TASKNAME.startsWith('puzzle') && TASKNAME !== 'off-ice') {
        R.iceSlid = (R.iceSlid || 0) + 1;
        ev('puzzle:crossed', {
          frus: 2,
          note: 'slid across the ice crossing the room on the way somewhere else'
        });
      }
      R.sliding = !!EX.slide;
      if (!TASK) {
        const t = chooseTask();
        if (t) {
          TASKNAME = t[0];
          TASK = t[1];
          R.tasks = R.tasks || {};
          R.tasks[TASKNAME.split(':')[0]] = (R.tasks[TASKNAME.split(':')[0]] || 0) + 1;
        }
      }
      if (TASK) {
        let r;
        try {
          r = TASK.next();
        } catch (e) {
          err('task ' + TASKNAME, e);
          r = { done: true };
        }
        if (r.done) {
          TASK = null;
          releaseKeys();
        }
      }
      const bucket = TASKNAME.startsWith('puzzle') ? 'puzzle' : 'walk';
      R.time[bucket] += DT;
      if (R.maxDepth >= cfg.maxDepth) break;
    }
    releaseKeys();
    // floor-by-floor: deepest reached, deaths, the report's numbers
    const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
    return {
      schemaVersion: U.VERSION,
      mode: R.mode,
      recoveries: R.recoveries,
      status: R.errors.length || R.inv?.length ? 'failed' : R.recoveries.length ? 'recovered' : 'completed',
      label: R.label,
      lean: R.lean,
      seed: R.seed,
      policySeed: cfg.policySeed,
      hours: +(R.T / 3600).toFixed(2),
      maxDepth: R.maxDepth,
      level: save.level,
      gold: save.gold,
      spent: R.spent,
      packs: R.packs,
      fun: +R.fun.toFixed(1),
      frus: +R.frus.toFixed(1),
      moodMin: +R.moodMin.toFixed(1),
      quits: R.quits,
      deaths: R.deaths,
      camps: R.camps,
      puzzles: R.puzzles.map(p => ({
        kind: p.kind,
        d: p.d,
        ok: !!p.ok,
        gaveUp: !!p.gaveUp && !p.skipped,
        skipped: !!p.skipped,
        time: p.time,
        mistakes: p.mistakes,
        dmg: p.dmg,
        steps: p.steps,
        why: p.why
      })),
      fights: R.fights,
      hurt: R.hurt,
      cards: R.cards,
      dlgN: R.dlgN,
      dlgs: R.dlgs,
      time: Object.fromEntries(Object.entries(R.time).map(([k, v]) => [k, Math.round(v)])),
      floors: R.floors,
      stuck: R.stuck,
      searches: R.searches,
      searchHits: R.searchHits,
      cues: R.cues,
      clicks: R.clicks,
      tells: R.tells,
      tellsSeen: R.tellsSeen,
      spend: R.spend,
      trapsPlaced: R.trapsPlaced || 0,
      floorsCounted: R.floorsCounted || 0,
      trapHist: R.trapHist,
      sold: R.sold || 0,
      fieldBitten: R.fieldBitten || 0,
      iceSlid: R.iceSlid || 0,
      burned: R.burned,
      fled: R.fled || 0,
      stairRetry: R.stairRetry || 0,
      floorMoves: R.floorMoves || 0,
      routeFail: R.routeFail || 0,
      routeWhy: R.routeWhy,
      stairMap: R.stairMap,
      climbLog: R.climbLog,
      climbWhy: R.climbWhy,
      iceDump: R.iceDump,
      bag: R.bag,
      campTrips: R.campTrips,
      tasks: R.tasks,
      depthT: Object.fromEntries(Object.entries(R.depthT).map(([k, v]) => [k, Math.round(v)])),
      startDeck: R.startDeck,
      endDeck: PT.run.deckInfo(save.decks[0].list),
      events: R.events,
      trace: R.trace,
      ring: R.ringDump,
      jumps: R.jumps,
      doorLog: R.doorLog,
      upLog: R.upLog,
      bossLog: R.bossLog,
      inv: R.inv || [],
      invN: R.invN || {},
      nanTrace: R.nanTrace || null,
      saveChecks: R.saveChecks || 0,
      unsaved: R.unsaved || null,
      errors: R.errors.slice(0, 20)
    };
  }
  C.run = function (cfg) {
    if (!['strict', 'exploratory'].includes(cfg.mode || 'strict'))
      throw Error('mode must be strict or exploratory');
    const prev = Math.random,
      xr = typeof XR !== 'undefined' ? XR : null;
    try {
      return runCareer(cfg);
    } finally {
      releaseKeys();
      Math.random = prev;
      if (typeof XR !== 'undefined') XR = xr;
    }
  };
  // an ASCII picture of the floor around you, for debugging: # rock, . seen floor, ? unseen, + door, D stairs down, @ you, F frontier
  C.map = function (rad, ctr) {
    rad = rad || 14;
    const CC = ctr == null ? EX.pc : ctr;
    const d = distMap(),
      out = [];
    const fr = new Set();
    for (let c = 0; c < XN * XN; c++) {
      if (d[c] > 0 && EX.seen[c] && xPassable(c) && adj4(c).some(n => !EX.seen[n])) fr.add(c);
    }
    for (let y = Math.max(0, xcy(CC) - rad); y < Math.min(XN, xcy(CC) + rad); y++) {
      let row = '';
      for (let x = Math.max(0, xcx(CC) - rad); x < Math.min(XN, xcx(CC) + rad); x++) {
        const c = xi(x, y),
          dr = EX.doors.get(c);
        row += EX.groups.some(g => g.cell === c && g.boss)
          ? 'B'
          : c === EX.pc
            ? '@'
            : c === EX.down
              ? 'D'
              : c === EX.up
                ? 'U'
                : dr
                  ? dr.state === 'open'
                    ? '/'
                    : dr.state === 'closed'
                      ? '+'
                      : dr.state === 'locked'
                        ? 'L'
                        : EX.seen[c]
                          ? 'S'
                          : 's'
                  : !EX.seen[c]
                    ? EX.t[c] === T_ROCK
                      ? ' '
                      : '?'
                    : EX.t[c] === T_ROCK
                      ? '#'
                      : fr.has(c)
                        ? 'F'
                        : d[c] < 0
                          ? 'x'
                          : xSolid(c)
                            ? 'o'
                            : '.';
      }
      out.push(row);
    }
    return out.join('\n');
  };
  // the puzzle lab: floors that always hold the puzzle you ask for; the bot walks there and solves it
  C.puzzleLab = function (cfg) {
    installClock();
    wrapGame();
    Math.random = U.rng(cfg.worldSeed ?? cfg.seed ?? 1);
    XR = Math.random;
    rng = Math.random;
    VT = 0;
    Q.length = 0;
    DBASE = 1.7e12 + (cfg.seed ?? 1) * 86400000;
    P = Object.assign({ lean: 'fire' }, cfg.p);
    P.reserve = () => 99999;
    const want = cfg.kind,
      fp = window.xFloorPlan,
      pp = window.xPlacePuzzle;
    const out = [];
    window.xFloorPlan = function (d, o) {
      const pl = fp.apply(this, arguments);
      if (!o || !o.branch) {
        pl.feats.puzzle = 1;
        delete pl.feats.merchant;
        delete pl.feats.sanct;
      }
      return pl;
    };
    const keys0 = Object.keys(PUZZLE_BUILD);
    for (let n = 0; n < cfg.n; n++) {
      R = {
        mode: 'strict',
        recoveries: [],
        label: 'lab',
        T: 0,
        fun: 0,
        frus: 0,
        mood: 0,
        moodMin: 0,
        win10: [],
        quits: [],
        events: [],
        errors: [],
        deaths: [],
        camps: [],
        puzzles: [],
        fights: [],
        hurt: {},
        cards: {},
        dlgs: {},
        dlgN: 0,
        recentDlg: [],
        onceSeen: {},
        lastK: {},
        bag: {},
        time: { walk: 0, fight: 0, puzzle: 0, dialog: 0, camp: 0, other: 0 },
        cues: 0,
        trace: [],
        floors: 0,
        lastNovel: 0,
        depthT: {}
      };
      save = newSave(STARTERS[0]);
      save.char = lockChar(newChar('human', 0));
      save.deepest = cfg.depth || 6;
      XRUN = null;
      pickDepth = save.deepest;
      // the wanted kind first
      const ord = Object.keys(PUZZLE_BUILD);
      const fn = PUZZLE_BUILD[want];
      if (!fn) return { error: 'no kind ' + want };
      window.xPlacePuzzle = function (r) {
        const all = Object.assign({}, PUZZLE_BUILD);
        for (const k of Object.keys(PUZZLE_BUILD)) if (k !== want) delete PUZZLE_BUILD[k];
        try {
          pp.apply(this, arguments);
        } finally {
          Object.assign(PUZZLE_BUILD, all);
        }
      };
      openCamp();
      enterExplore(save.deepest);
      if (!EX) {
        out.push({ err: 'no floor' });
        continue;
      }
      newFloor();
      EX.groups = [];
      for (const t of EX.traps) t.armed = false;
      for (let c = 0; c < XN * XN; c++) EX.seen[c] = 1;
      const pz = EX.puzzle;
      if (!pz || pz.kind !== want) {
        out.push({ err: 'not placed', got: pz && pz.kind });
        continue;
      }
      PZ = { kind: pz.kind, t0: R.T, mistakes: 0, dmg: 0, steps: 0, gaveUp: false, tries: 0, will: true };
      R.puzzles.push(PZ);
      let T = 0,
        gen = null;
      TASKNAME = 'puzzle:' + pz.kind;
      EX.hp = 9999;
      while (T < (cfg.maxT || 400) && !pz.solved && !PZ.gaveUp && !R.errors.length) {
        VT += DT;
        R.T += DT;
        T += DT;
        fire();
        if (B && (B.phase === 'fight' || B.phase === 'custom') && on('scrBattle')) {
          const r = PT.runFight({ adopt: true, depth: B.depth, bot: cfg.bot, maxT: 600, seed: n + 1 });
          R.T += r.realSecs || 0;
          T += r.realSecs || 0;
          (R.labF = R.labF || []).push(
            r.res +
              ':' +
              Math.round(r.realSecs || 0) +
              's' +
              (B && B.rule
                ? ':rule ' +
                  B.rule.kind +
                  (B.rule.ok ? ' kept' : ' broken') +
                  (B.rule.lit ? ' lit ' + B.rule.lit.size : '')
                : '')
          );
          continue;
        }
        if ($('#packOpen').classList.contains('on')) {
          packTick();
          continue;
        }
        if (on('reveal')) {
          revealTick();
          continue;
        }
        if (lvlTick()) continue;
        if (EX && (EX.dlg || on('xDialog'))) {
          dialogTick();
          stepMap();
          continue;
        }
        stepMap();
        if (!EX || !EX.active || EX.busy) continue;
        EX.hp = 9999;
        if (!gen) {
          if (PZ.wait) {
            PZ.wait = null;
          }
          PZ.tries++;
          if (PZ.tries > 4) {
            PZ.gaveUp = true;
            PZ.why = PZ.why || 'tries';
            break;
          }
          gen = PUZ[pz.kind](pz);
        }
        let r;
        try {
          r = gen.next();
        } catch (e) {
          out.push({ err: e.message + ' ' + (e.stack || '').split('\n')[1] });
          break;
        }
        if (r.done) {
          gen = null;
          releaseKeys();
        }
      }
      releaseKeys();
      out.push({
        ok: !!pz.solved && !R.errors.length,
        errors: R.errors,
        recoveries: R.recoveries,
        t: Math.round(T),
        mistakes: PZ.mistakes,
        steps: PZ.steps,
        why:
          (PZ.why || (pz.solved ? '' : 'timeout')) +
          (PZ.why2 ? ' / ' + PZ.why2 : '') +
          (R.bumpWhy && !pz.solved ? ' / bump: ' + R.bumpWhy : ''),
        dmg: R.hurt.puzzle || 0,
        fights: R.labF,
        scr: [...document.querySelectorAll('.scr.on,.overlay.on')].map(e => e.id).join(','),
        task: TASKNAME,
        dlg: EX && EX.dlg && EX.dlg.title
      });
      stopExplore();
      EX = null;
    }
    window.xFloorPlan = fp;
    window.xPlacePuzzle = pp;
    return out;
  };
  // the map's own frame, without the drawing (explore.js xLoop)
  function stepMap() {
    if (!EX || !EX.active) return;
    const dt = DT;
    if (R && R.traceOn) {
      if (
        R.lastPc != null &&
        Math.abs(xcx(R.lastPc) - xcx(EX.pc)) + Math.abs(xcy(R.lastPc) - xcy(EX.pc)) > 2
      ) {
        (R.jumps = R.jumps || []).push({
          t: +R.T.toFixed(1),
          from: xcx(R.lastPc) + ',' + xcy(R.lastPc),
          to: xcx(EX.pc) + ',' + xcy(EX.pc),
          depth: EX.depth,
          task: TASKNAME,
          log: EX.log.map(l => l.t).join(' | ')
        });
        if (R.jumps.length > 40) R.jumps.shift();
      }
      R.lastPc = EX.pc;
    }
    if (R && R.traceOn) {
      (R.ring = R.ring || []).push([
        +R.T.toFixed(2),
        xcx(EX.pc),
        xcy(EX.pc),
        +(EX.px / XCS).toFixed(2),
        +(EX.pz / XCS).toFixed(2),
        EX.path
          .slice(0, 2)
          .map(c => xcx(c) + ',' + xcy(c))
          .join(' '),
        EX.goal ? xcx(EX.goal.cell) + ',' + xcy(EX.goal.cell) : '-',
        +(EX.vx || 0).toFixed(2),
        +(EX.vz || 0).toFixed(2),
        EX.blockT ? +EX.blockT.toFixed(2) : 0,
        TASKNAME
      ]);
      if (R.ring.length > 400) R.ring.shift();
    }
    if (EX.action) {
      EX.action.age = (EX.action.age || 0) + dt;
      if (EX.action.age > 5) {
        const a = EX.action;
        recover('action watchdog', 'action exceeded five seconds', () => {
          EX.action = null;
          a.done();
        });
      }
    }
    if (!EX.busy && !xPaused && !EX.aim) {
      try {
        xMove(dt);
      } catch (e) {
        err('xMove', e);
      }
      if (!EX || !EX.active) return;
      try {
        xEnemies(dt);
      } catch (e) {
        err('xEnemies', e);
      }
      if (EX.active && !EX.busy)
        try {
          xDungeonTick(dt);
        } catch (e) {
          err('xDungeonTick', e);
        }
      EX.regenT += dt;
      if (EX.regenT > 3) {
        EX.regenT = 0;
        if (EX.hp < xmaxHp()) {
          EX.hp++;
        }
      }
    }
    if (EX && EX.active)
      try {
        xDoorTick(dt);
        for (const g of EX.groups)
          if (g.sprite)
            g.sprite.visible =
              !!EX.vis[g.cell] &&
              !g.dormant &&
              !(g.stealth && Math.hypot(g.x - EX.px, g.z - EX.pz) / XCS > 3.2);
      } catch (e) {
        err('xDoorTick', e);
      }
  }
})();

// Shared, dependency-free helpers for injected bots and Node runners.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PTSupport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 2;
  function rng(seed) {
    let s = Number(seed) >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seedFor(...parts) {
    let h = 2166136261;
    for (const c of JSON.stringify(parts)) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function scenario(style, lean, replicate) {
    return {
      jobId: JSON.stringify([style, lean, replicate]),
      seed: seedFor('world', lean, replicate),
      policySeed: seedFor('policy', style, lean, replicate)
    };
  }
  function assertJobs(jobs) {
    if (!Array.isArray(jobs) || !jobs.length) throw Error('Expected a nonempty jobs array');
    const ids = new Set(),
      seeds = new Map();
    for (const j of jobs) {
      if (j.jobId) {
        if (ids.has(j.jobId)) throw Error('Duplicate jobId: ' + j.jobId);
        ids.add(j.jobId);
      }
      if (!Number.isInteger(j.seed) || j.seed < 0 || j.seed > 0xffffffff)
        throw Error('Job requires a uint32 seed');
      if (j.replicate != null) {
        const key = JSON.stringify([j.lean, j.replicate]),
          prev = seeds.get(j.seed);
        if (prev && prev !== key) throw Error('Scenario seed collision: ' + prev + ' / ' + key);
        seeds.set(j.seed, key);
      }
    }
    return jobs;
  }
  // Call every simulation tick, including idle ticks, not just while evaluating a target.
  function perception() {
    const actors = new WeakMap();
    return {
      sync(actor, slot, active, remaining, token) {
        let slots = actors.get(actor);
        if (!slots) actors.set(actor, (slots = new Map()));
        let s = slots.get(slot);
        if (!s) {
          s = { active: false, key: {} };
          slots.set(slot, s);
        }
        if (active && (!s.active || remaining > s.remaining + 1e-6 || token !== s.token)) s.key = {};
        Object.assign(s, { active, remaining, token });
        return s.key;
      },
      key(actor, slot) {
        return actors.get(actor)?.get(slot)?.key;
      }
    };
  }
  function realSeconds(duration, pace) {
    if (!Number.isFinite(duration) || duration < 0 || !Number.isFinite(pace) || pace <= 0) return null;
    return duration / pace;
  }
  function netFrustration(events, now, windowSeconds = 600) {
    return Math.max(
      0,
      events
        .filter(e => e.t > now - windowSeconds && e.t <= now)
        .reduce((s, e) => s + (e.frus || 0) - (e.fun || 0), 0)
    );
  }
  function issues(r) {
    if (!r || typeof r !== 'object') return ['invalid result'];
    const out = [];
    for (const k of ['errors', 'pageErrors', 'inv', 'fights', 'recoveries'])
      if (r[k] != null && !Array.isArray(r[k])) return ['invalid ' + k + ' field'];
    if (r.error) out.push(String(r.error));
    if (['failed', 'timeout', 'skipped', 'incomplete'].includes(r.status)) out.push('job ' + r.status);
    if (['error', 'evalerror', 'timeout', 'stuck'].includes(r.res)) out.push('fight ' + r.res);
    for (const e of r.errors || []) out.push(String(e));
    for (const e of r.pageErrors || []) out.push(String(e));
    for (const i of r.inv || []) out.push('invariant: ' + i.kind);
    if (r.nanTrace?.length) out.push('NaN trace');
    for (const f of r.fights || [])
      if (
        ['error', 'evalerror', 'timeout', 'stuck'].includes(f.res) ||
        f.errors?.length ||
        (typeof f.errors === 'number' && f.errors > 0)
      )
        out.push('fight at ' + (f.depth ?? f.d) + ': ' + f.res);
    return out;
  }
  function usable(r) {
    return !issues(r).length && !r.recoveries?.length && r.status !== 'recovered';
  }
  function coverage(records) {
    const c = { requested: records.length, clean: 0, recovered: 0, failed: 0, skipped: 0, errors: 0 };
    for (const r of records) {
      const e = issues(r);
      c.errors += e.length;
      if (r.status === 'skipped') c.skipped++;
      else if (e.length) c.failed++;
      else if (r.recoveries?.length || r.status === 'recovered') c.recovered++;
      else c.clean++;
    }
    return c;
  }
  function readRecords(files, fs) {
    const rows = [];
    for (const file of files) {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (!line.trim()) return;
        try {
          const r = JSON.parse(line);
          if (!r || typeof r !== 'object' || Array.isArray(r)) throw Error('Expected result object');
          rows.push(r);
        } catch (e) {
          rows.push({ status: 'failed', error: file + ':' + (i + 1) + ': ' + e.message });
        }
      });
    }
    return rows;
  }
  const perMinute = (count, durationMs) => (durationMs > 0 ? (count * 60000) / durationMs : null);
  return {
    VERSION,
    rng,
    seedFor,
    scenario,
    assertJobs,
    perception,
    realSeconds,
    netFrustration,
    issues,
    usable,
    coverage,
    readRecords,
    perMinute
  };
});

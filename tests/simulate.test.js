// Tests for the simulation loop (js/popgen/simulate.js) and random numbers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { simulate, simulateReplicates } from "../js/popgen/simulate.js";
import { summarizeFinal } from "../js/popgen/stats.js";
import { makeRng, randBinomial } from "../js/popgen/random.js";

test("infinite population without forces stays at p0 (Hardy–Weinberg)", () => {
  const rows = simulate({ p0: 0.27, generations: 50 });
  assert.equal(rows.length, 51);
  for (const r of rows) assert.ok(Math.abs(r.p - 0.27) < 1e-12);
});

test("same seed → same result; different seed → different result", () => {
  const a = simulate({ N: 50, generations: 30, seed: 42 });
  const b = simulate({ N: 50, generations: 30, seed: 42 });
  const c = simulate({ N: 50, generations: 30, seed: 43 });
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

test("small populations drift more than large ones", () => {
  const small = summarizeFinal(simulateReplicates({ N: 10, generations: 50, seed: 3 }, 100));
  const large = summarizeFinal(simulateReplicates({ N: 10000, generations: 50, seed: 3 }, 100));
  assert.ok(small.sd > large.sd * 3, `sd small ${small.sd}, large ${large.sd}`);
  assert.ok(small.fixed + small.lost > 50);
});

test("migration pulls the island towards the continent", () => {
  const rows = simulate({ p0: 0, m: 0.2, pC: 0.8, generations: 50 });
  assert.ok(Math.abs(rows.at(-1).p - 0.8) < 1e-3);
});

test("HHMI case study 1 (lactase): A1 rises from 0.05 to ~0.95 in 200 generations", () => {
  // A1 dominant advantageous; 10 % fitness reduction for A2A2
  const rows = simulate({ p0: 0.05, generations: 200, w11: 1, w12: 1, w22: 0.9 });
  assert.ok(rows.at(-1).p > 0.9 && rows.at(-1).p < 0.99, String(rows.at(-1).p));
});

test("bottleneck reduces N only during the bottleneck", () => {
  const rows = simulate({ N: 1000, generations: 30, bottleneck: { start: 10, duration: 3, size: 5 } });
  assert.equal(rows[9].N, 1000);
  assert.equal(rows[10].N, 5);
  assert.equal(rows[12].N, 5);
  assert.equal(rows[13].N, 1000);
});

test("binomial draws have the right mean (both branches)", () => {
  const rng = makeRng(1);
  for (const [n, p] of [[20, 0.3], [5000, 0.5]]) {
    let s = 0;
    for (let i = 0; i < 4000; i++) s += randBinomial(n, p, rng);
    const m = s / 4000;
    assert.ok(Math.abs(m - n * p) < 0.05 * n * p + 1, `n=${n} mean ${m}`);
  }
});

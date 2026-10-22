// =============================================================================
// simulate.js — runs a population through many generations
// -----------------------------------------------------------------------------
// Life cycle used for every generation (same order on every page):
//
//   adults ──► gametes (p) ──► mutation ──► migration ──► zygotes (with F)
//      ▲                                                      │
//      │                                         drift: draw N individuals
//      │                                                      │
//      └──────────── selection (viability) ◄──── census (recorded here)
//
// The census (what you see in the plots) is taken on the zygotes, i.e. after
// drift and before selection. With N = Infinity there is no drift and the
// result is fully deterministic.
//
// To add a new force, write a pure function in models.js and call it at the
// right place in `step()` below. Add a default value to DEFAULT_PARAMS.
// =============================================================================

import { makeRng, randMultinomial3 } from "./random.js";
import {
  genotypeFreqs,
  alleleFreqFromGenotypes,
  applySelection,
  applyMutation,
  applyMigration,
  fitnessFromSH,
} from "./models.js";

/**
 * All parameters a simulation understands. Pages only need to pass the ones
 * they change; everything else falls back to these values (= Hardy–Weinberg:
 * no evolution).
 */
export const DEFAULT_PARAMS = Object.freeze({
  p0: 0.5, // starting frequency of A1
  N: Infinity, // population size (individuals); Infinity = no drift
  generations: 100,
  // selection: either give fitnesses directly …
  w11: 1,
  w12: 1,
  w22: 1,
  // … or set useSH = true and give s and h (lecture parametrisation)
  useSH: false,
  s: 0,
  h: 0.5,
  u: 0, // mutation rate A1 → A2
  v: 0, // mutation rate A2 → A1
  m: 0, // migration rate
  pC: 0.5, // A1 frequency in the source (continent) population
  F: 0, // inbreeding coefficient
  // bottleneck: population size is reduced to `size` for `duration` generations
  // starting at generation `start`. null = no bottleneck.
  bottleneck: null, // e.g. { start: 20, duration: 5, size: 10 }
  seed: 1,
});

/** Merge user parameters with the defaults and resolve derived values. */
export function resolveParams(params = {}) {
  const P = { ...DEFAULT_PARAMS, ...params };
  const w = P.useSH ? fitnessFromSH(P.s, P.h) : { w11: P.w11, w12: P.w12, w22: P.w22 };
  return { ...P, w };
}

/** Population size in generation t (handles bottlenecks). */
export function popSizeAt(t, P) {
  const b = P.bottleneck;
  if (b && t >= b.start && t < b.start + b.duration) return b.size;
  return P.N;
}

const isFinitePop = (N) => Number.isFinite(N) && N > 0;

/**
 * Advance the population by one generation.
 * @param {{f11:number,f12:number,f22:number}} adults genotype freqs after selection
 * @param {number} t  generation number being produced
 * @param {object} P  resolved parameters (from resolveParams)
 * @param {() => number} rng
 * @returns {{zygotes: object, adults: object, N: number}}
 */
export function step(adults, t, P, rng) {
  // 1. gametes
  let p = alleleFreqFromGenotypes(adults);
  // 2. mutation
  p = applyMutation(p, P.u, P.v);
  // 3. migration
  p = applyMigration(p, P.m, P.pC);
  // 4. zygote formation (random union, or inbreeding F)
  let zygotes = genotypeFreqs(p, P.F);
  // 5. drift: sample N individuals
  const N = popSizeAt(t, P);
  if (isFinitePop(N)) {
    const n = Math.round(N);
    const [n11, n12, n22] = randMultinomial3(n, [zygotes.f11, zygotes.f12, zygotes.f22], rng);
    zygotes = { f11: n11 / n, f12: n12 / n, f22: n22 / n };
  }
  // 6. selection → adults of this generation
  const nextAdults = applySelection(zygotes, P.w);
  return { zygotes, adults: nextAdults, N };
}

/** Turn genotype freqs into one tidy output row. */
function record(gen, g, N, rep) {
  const p = alleleFreqFromGenotypes(g);
  return { rep, gen, p, q: 1 - p, f11: g.f11, f12: g.f12, f22: g.f22, N };
}

/**
 * Simulate one population.
 * @param {object} params  see DEFAULT_PARAMS
 * @param {number} [rep=1]  replicate number (only used as a label)
 * @returns {Array<{rep,gen,p,q,f11,f12,f22,N}>} one row per generation (0 … generations)
 */
export function simulate(params = {}, rep = 1) {
  const P = resolveParams(params);
  const rng = makeRng(P.seed + 7919 * rep);
  // generation 0: Hardy–Weinberg (or inbred) proportions at p0
  let zygotes = genotypeFreqs(P.p0, P.F);
  const rows = [record(0, zygotes, popSizeAt(0, P), rep)];
  let adults = applySelection(zygotes, P.w);
  for (let t = 1; t <= P.generations; t++) {
    const res = step(adults, t, P, rng);
    rows.push(record(t, res.zygotes, res.N, rep));
    adults = res.adults;
  }
  return rows;
}

/**
 * Simulate several independent replicate populations with the same settings.
 * @returns {Array} all rows of all replicates (column `rep` tells them apart)
 */
export function simulateReplicates(params = {}, replicates = 10) {
  const out = [];
  for (let r = 1; r <= replicates; r++) out.push(...simulate(params, r));
  return out;
}

/**
 * Run several *different* scenarios side by side (e.g. N = 10, 100, 1000).
 * @param {Array<{label:string, params:object}>} scenarios
 * @returns rows with an extra `scenario` column
 */
export function simulateScenarios(scenarios, replicates = 1) {
  return scenarios.flatMap(({ label, params }) =>
    simulateReplicates(params, replicates).map((row) => ({ ...row, scenario: label })),
  );
}

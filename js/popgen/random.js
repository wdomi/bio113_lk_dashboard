// =============================================================================
// random.js — reproducible random numbers for the simulations
// -----------------------------------------------------------------------------
// Everything that involves chance (genetic drift) draws from a *seeded* random
// number generator, so the same seed always produces the same simulation.
// That lets students (and you) reproduce a result exactly.
//
// No dependencies: this file runs in the browser (via Quarto/OJS) and in
// Node.js (for the tests in tests/).
// =============================================================================

/**
 * Create a seeded uniform random number generator (mulberry32).
 * @param {number} seed  any integer; the same seed gives the same sequence
 * @returns {() => number} function returning a uniform number in [0, 1)
 */
export function makeRng(seed = 1) {
  let a = (seed >>> 0) || 1;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal draw (Box–Muller). */
export function randNormal(rng) {
  let u = 0;
  while (u === 0) u = rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Binomial draw: number of successes in n trials with probability p.
 *
 * - Exact (inversion) when the expected number of the rarer outcome is small.
 * - Normal approximation (rounded, clamped to [0, n]) otherwise. For the
 *   population sizes used in teaching (N up to ~100 000) this is visually
 *   indistinguishable from the exact distribution and keeps the page fast.
 *
 * @param {number} n  number of trials (integer >= 0)
 * @param {number} p  success probability in [0, 1]
 * @param {() => number} rng  uniform generator from makeRng()
 */
export function randBinomial(n, p, rng) {
  if (n <= 0 || p <= 0) return 0;
  if (p >= 1) return n;
  // Work with the rarer outcome so the exact branch stays cheap.
  const flip = p > 0.5;
  const pp = flip ? 1 - p : p;
  let k;
  if (n * pp < 30) {
    // Inversion: walk up the cumulative distribution.
    const q = 1 - pp;
    const r = pp / q;
    let prob = Math.pow(q, n);
    let cdf = prob;
    const u = rng();
    k = 0;
    while (u > cdf && k < n) {
      prob *= (r * (n - k)) / (k + 1);
      cdf += prob;
      k++;
    }
  } else {
    const mean = n * pp;
    const sd = Math.sqrt(n * pp * (1 - pp));
    k = Math.round(mean + sd * randNormal(rng));
    k = Math.min(n, Math.max(0, k));
  }
  return flip ? n - k : k;
}

/**
 * Multinomial draw for three categories (used for the three genotypes).
 * @param {number} n  number of individuals
 * @param {[number, number, number]} probs  probabilities (sum to 1)
 * @returns {[number, number, number]} counts
 */
export function randMultinomial3(n, probs, rng) {
  const [a, b] = probs;
  const n1 = randBinomial(n, a, rng);
  const rest = 1 - a;
  const n2 = rest > 0 ? randBinomial(n - n1, Math.min(1, b / rest), rng) : 0;
  return [n1, n2, n - n1 - n2];
}

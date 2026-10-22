// =============================================================================
// models.js — the population-genetic equations (deterministic part)
// -----------------------------------------------------------------------------
// One locus, two alleles: A1 (frequency p) and A2 (frequency q = 1 - p).
// Notation follows the Bio 113 lectures (Keller, Vorlesungen 7–9):
//
//   Hardy–Weinberg     p² + 2pq + q² = 1
//   Inbreeding (F)     f11 = p² + Fpq,  f12 = 2pq(1 − F),  f22 = q² + Fpq
//   Selection          w11, w12, w22  (or w11 = 1, w12 = 1 − hs, w22 = 1 − s)
//   Mutation           u: A1 → A2,  v: A2 → A1,   Δp = v − p(u + v)
//   Migration          p_I' = (1 − m) p_I + m p_C   (one-island model)
//
// Each function does ONE thing and returns new numbers (nothing is modified in
// place), so every force can be understood, tested and changed on its own.
// =============================================================================

/** Clamp a frequency to the interval [0, 1] (guards against rounding errors). */
export const clamp01 = (x) => Math.min(1, Math.max(0, x));

/**
 * Genotype frequencies from an allele frequency.
 * With F = 0 these are the Hardy–Weinberg proportions.
 * @param {number} p  frequency of A1
 * @param {number} F  inbreeding coefficient (0 = random mating, 1 = complete selfing)
 * @returns {{f11:number, f12:number, f22:number}}
 */
export function genotypeFreqs(p, F = 0) {
  const q = 1 - p;
  return {
    f11: p * p + F * p * q,
    f12: 2 * p * q * (1 - F),
    f22: q * q + F * p * q,
  };
}

/** Allele frequency of A1 from genotype frequencies: p = f11 + f12 / 2. */
export function alleleFreqFromGenotypes({ f11, f12 }) {
  return clamp01(f11 + f12 / 2);
}

/**
 * Convert the (s, h) parametrisation of the lecture to genotype fitnesses.
 * Here A1 is the favoured allele: w11 = 1, w12 = 1 − h·s, w22 = 1 − s.
 * h = 0: A1 dominant; h = 0.5: additive (codominant); h = 1: A1 recessive.
 */
export function fitnessFromSH(s = 0, h = 0.5) {
  return { w11: 1, w12: 1 - h * s, w22: 1 - s };
}

/** Mean fitness  w̄ = f11·w11 + f12·w12 + f22·w22. */
export function meanFitness(g, w) {
  return g.f11 * w.w11 + g.f12 * w.w12 + g.f22 * w.w22;
}

/**
 * Viability selection on genotypes: each genotype is weighted by its fitness
 * and the result is renormalised by the mean fitness.
 * @returns {{f11:number, f12:number, f22:number}} genotype frequencies after selection
 */
export function applySelection(g, w) {
  const wbar = meanFitness(g, w);
  if (wbar <= 0) return { ...g }; // everyone dies: keep frequencies (edge case)
  return {
    f11: (g.f11 * w.w11) / wbar,
    f12: (g.f12 * w.w12) / wbar,
    f22: (g.f22 * w.w22) / wbar,
  };
}

/**
 * Recurrent mutation.
 * @param {number} p  frequency of A1
 * @param {number} u  mutation rate A1 → A2
 * @param {number} v  mutation rate A2 → A1
 * @returns {number} p' = p(1 − u) + (1 − p)v   (so Δp = v − p(u + v))
 */
export function applyMutation(p, u = 0, v = 0) {
  return clamp01(p * (1 - u) + (1 - p) * v);
}

/**
 * One-island (continent–island) migration.
 * @param {number} p   frequency of A1 on the island (p_I)
 * @param {number} m   migration rate: fraction of the island gene pool from the continent
 * @param {number} pC  frequency of A1 on the continent (p_C)
 */
export function applyMigration(p, m = 0, pC = 0.5) {
  return clamp01((1 - m) * p + m * pC);
}

/** Equilibrium frequency of A1 under mutation alone: p̂ = v / (u + v). */
export function mutationEquilibrium(u, v) {
  return u + v > 0 ? v / (u + v) : NaN;
}

/**
 * Approximate mutation–selection balance for a deleterious allele A2.
 * Recessive (h = 0): q̂ ≈ √(u/s).  Otherwise: q̂ ≈ u / (h·s).
 */
export function mutationSelectionBalance(u, s, h = 0) {
  if (s <= 0) return NaN;
  return h === 0 ? Math.sqrt(u / s) : Math.min(1, u / (h * s));
}

/** Expected heterozygosity after t generations of drift: H_t = H_0 (1 − 1/(2N))^t. */
export function expectedHeterozygosity(H0, N, t) {
  return H0 * Math.pow(1 - 1 / (2 * N), t);
}

/** Expected heterozygosity of a population with allele frequency p: H = 2pq. */
export const heterozygosity = (p) => 2 * p * (1 - p);

/** Chi-square test statistic for deviation from Hardy–Weinberg (counts n11, n12, n22). */
export function hweChiSquare(n11, n12, n22) {
  const n = n11 + n12 + n22;
  if (n === 0) return { chi2: NaN, p: NaN, expected: [0, 0, 0] };
  const p = (2 * n11 + n12) / (2 * n);
  const g = genotypeFreqs(p);
  const expected = [g.f11 * n, g.f12 * n, g.f22 * n];
  const observed = [n11, n12, n22];
  const chi2 = observed.reduce(
    (acc, o, i) => acc + (expected[i] > 0 ? (o - expected[i]) ** 2 / expected[i] : 0),
    0,
  );
  return { chi2, p, expected };
}

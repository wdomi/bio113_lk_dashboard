// =============================================================================
// stats.js — small summary statistics for simulation output
// =============================================================================

export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

/** Sample standard deviation (n − 1). */
export function sd(xs) {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

/** Rows of the last generation of each replicate. */
export function finalRows(rows) {
  const last = new Map();
  for (const r of rows) {
    const key = `${r.scenario ?? ""}|${r.rep}`;
    if (!last.has(key) || last.get(key).gen < r.gen) last.set(key, r);
  }
  return [...last.values()];
}

/**
 * Summary of the final allele frequencies across replicates.
 * @returns {{n, mean, sd, fixed, lost, polymorphic}}
 *   fixed = replicates where A1 reached 1, lost = where A1 reached 0
 */
export function summarizeFinal(rows, tol = 1e-9) {
  const ps = finalRows(rows).map((r) => r.p);
  return {
    n: ps.length,
    mean: mean(ps),
    sd: sd(ps),
    fixed: ps.filter((p) => p >= 1 - tol).length,
    lost: ps.filter((p) => p <= tol).length,
    polymorphic: ps.filter((p) => p > tol && p < 1 - tol).length,
  };
}

/** Mean of a column per generation (e.g. average heterozygosity over replicates). */
export function meanByGeneration(rows, key = "f12") {
  const byGen = new Map();
  for (const r of rows) {
    if (!byGen.has(r.gen)) byGen.set(r.gen, []);
    byGen.get(r.gen).push(r[key]);
  }
  return [...byGen.entries()].map(([gen, xs]) => ({ gen, value: mean(xs) }));
}

/** Convert wide genotype rows into long format for plotting (one row per genotype). */
export function genotypesLong(rows) {
  return rows.flatMap((r) => [
    { ...r, genotype: "A1A1", freq: r.f11 },
    { ...r, genotype: "A1A2", freq: r.f12 },
    { ...r, genotype: "A2A2", freq: r.f22 },
  ]);
}

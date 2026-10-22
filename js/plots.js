// =============================================================================
// plots.js — reusable charts (Observable Plot)
// -----------------------------------------------------------------------------
// Every function receives `Plot` as its first argument. Quarto's OJS runtime
// already ships Observable Plot, so we pass it in instead of importing a second
// copy.
//
// The data come from the R package (popgen/R/), e.g. the rows returned by
// simulate(): {rep, gen, p, q, f11, f12, f22, N}. These functions only draw;
// they never compute population genetics.
//
// Colours live in theme.js. Change them there, not here.
// =============================================================================

import { COLORS, GENOTYPE_COLORS, SCENARIO_COLORS } from "./theme.js";

const fmt = (x) => (Number.isFinite(x) ? x.toFixed(3) : "–");
const fmtN = (N) => (N === null || N === Infinity ? "∞" : N);

/** Last generation of every replicate (and scenario). */
const finalRows = (rows) => {
  const last = new Map();
  for (const r of rows) {
    const key = `${r.scenario ?? ""}|${r.rep}`;
    if (!last.has(key) || last.get(key).gen < r.gen) last.set(key, r);
  }
  return [...last.values()];
};

const baseOptions = (width) => ({
  width,
  height: 320,
  marginLeft: 50,
  marginBottom: 40,
  style: { fontSize: "13px", background: "transparent" },
  x: { label: "Generation →", grid: false },
});

/**
 * Allele frequency of A1 over time.
 * One line per replicate; if rows contain a `scenario` column, colour by scenario.
 */
export function alleleTrajectoryPlot(Plot, rows, { width = 700, y = "p", yLabel = "↑ Allelfrequenz p (A1)", highlight = null } = {}) {
  const hasScenario = rows.length && rows[0].scenario !== undefined;
  const nReps = new Set(rows.map((r) => r.rep)).size;
  const opacity = nReps > 20 ? 0.35 : nReps > 5 ? 0.6 : 1;
  const z = hasScenario ? (d) => `${d.scenario} #${d.rep}` : "rep";
  return Plot.plot({
    ...baseOptions(width),
    y: { domain: [0, 1], label: yLabel, grid: true },
    color: hasScenario
      ? { domain: [...new Set(rows.map((r) => r.scenario))], range: SCENARIO_COLORS, legend: true }
      : undefined,
    marks: [
      Plot.ruleY([0, 1], { stroke: COLORS.axis }),
      highlight !== null ? Plot.ruleY([highlight], { stroke: COLORS.reference, strokeDasharray: "4,4" }) : null,
      Plot.line(rows, {
        x: "gen",
        y,
        z,
        stroke: hasScenario ? "scenario" : COLORS.series,
        strokeWidth: 2,
        strokeOpacity: opacity,
      }),
      Plot.tip(
        rows,
        Plot.pointer({
          x: "gen",
          y,
          title: (d) =>
            `${hasScenario ? d.scenario + "\n" : ""}Replikat ${d.rep}\nGeneration ${d.gen}\np = ${fmt(d.p)}\nN = ${fmtN(d.N)}`,
        }),
      ),
    ],
  });
}

/**
 * Genotype frequencies (A1A1, A1A2, A2A2) over time for ONE population.
 * @param long rows from R `genotypes_long()`: {gen, genotype, freq, hw}
 *   (hw = Hardy-Weinberg expectation at the same p, drawn dashed)
 */
export function genotypePlot(Plot, long, { width = 700, showHW = true } = {}) {
  return Plot.plot({
    ...baseOptions(width),
    y: { domain: [0, 1], label: "↑ Genotypfrequenz", grid: true },
    color: { domain: ["A1A1", "A1A2", "A2A2"], range: GENOTYPE_COLORS, legend: true },
    marks: [
      Plot.ruleY([0], { stroke: COLORS.axis }),
      showHW ? Plot.line(long, { x: "gen", y: "hw", stroke: "genotype", strokeDasharray: "3,3", strokeWidth: 1.5 }) : null,
      Plot.line(long, { x: "gen", y: "freq", stroke: "genotype", strokeWidth: 2 }),
      Plot.tip(long, Plot.pointer({ x: "gen", y: "freq", title: (d) => `Generation ${d.gen}\n${d.genotype}: ${fmt(d.freq)}\nHWG-Erwartung: ${fmt(d.hw)}` })),
    ],
  });
}

/**
 * Hardy–Weinberg curves p², 2pq, q² against p, with markers at the current p.
 * @param curves rows from R `hw_curves()`: {p, genotype, freq}
 * @param here   rows from R `hw_curves(p)` for the current p
 */
export function hardyWeinbergCurves(Plot, curves, here, { width = 700 } = {}) {
  const p = here[0]?.p;
  return Plot.plot({
    ...baseOptions(width),
    x: { domain: [0, 1], label: "Allelfrequenz p (A1) →" },
    y: { domain: [0, 1], label: "↑ Genotypfrequenz", grid: true },
    color: { domain: ["A1A1", "A1A2", "A2A2"], range: GENOTYPE_COLORS, legend: true },
    marks: [
      Plot.ruleX([p], { stroke: COLORS.reference, strokeDasharray: "4,4" }),
      Plot.line(curves, { x: "p", y: "freq", stroke: "genotype", strokeWidth: 2 }),
      Plot.dot(here, { x: "p", y: "freq", fill: "genotype", r: 6, stroke: "white", strokeWidth: 2 }),
      Plot.tip(curves, Plot.pointer({ x: "p", y: "freq", title: (d) => `p = ${fmt(d.p)}\n${d.genotype}: ${fmt(d.freq)}` })),
    ],
  });
}

/** Histogram of final allele frequencies across replicates (optionally per scenario). */
export function finalFrequencyHistogram(Plot, rows, { width = 700, bins = 20 } = {}) {
  const finals = finalRows(rows);
  const hasScenario = finals.length && finals[0].scenario !== undefined;
  const scenarios = hasScenario ? [...new Set(finals.map((d) => d.scenario))] : [];
  return Plot.plot({
    ...baseOptions(width),
    marginRight: hasScenario ? 110 : 20,
    height: hasScenario ? 120 * scenarios.length + 40 : 240,
    x: { domain: [0, 1], label: "Allelfrequenz p in der letzten Generation →" },
    y: { label: "↑ Anzahl Replikate", grid: true },
    fy: hasScenario ? { label: null, domain: scenarios } : undefined,
    color: hasScenario ? { domain: scenarios, range: SCENARIO_COLORS } : undefined,
    marks: [
      Plot.rectY(
        finals,
        Plot.binX(
          { y: "count" },
          {
            x: "p",
            fy: hasScenario ? "scenario" : undefined,
            fill: hasScenario ? "scenario" : COLORS.series,
            thresholds: Array.from({ length: bins + 1 }, (_, i) => i / bins),
            inset: 1,
            tip: true,
          },
        ),
      ),
      Plot.ruleY([0], { stroke: COLORS.axis }),
    ],
  });
}

/**
 * Heterozygosity over time.
 * @param het rows from R, either wide {gen, observed, expected}
 *   (heterozygosity_decay) or long {gen, value, kind} (bottleneck_experiment)
 */
export function heterozygosityPlot(Plot, het, { width = 700, labels = ["simuliert (Mittelwert)", "erwartet: H₀(1 − 1/2N)ᵗ"], band = null } = {}) {
  const data = het.length && het[0].kind !== undefined
    ? het
    : het.flatMap((d) => [
        { gen: d.gen, value: d.observed, kind: labels[0] },
        { gen: d.gen, value: d.expected, kind: labels[1] },
      ]);
  const kinds = [...new Set(data.map((d) => d.kind))];
  return Plot.plot({
    ...baseOptions(width),
    y: { domain: [0, 0.55], label: "↑ Heterozygotie H", grid: true },
    color: { domain: kinds, range: [COLORS.series, COLORS.reference], legend: true },
    marks: [
      band ? Plot.rectX([band], { x1: "x1", x2: "x2", y1: 0, y2: 0.55, fill: COLORS.reference, fillOpacity: 0.12 }) : null,
      Plot.ruleY([0], { stroke: COLORS.axis }),
      Plot.line(data, { x: "gen", y: "value", stroke: "kind", strokeWidth: 2 }),
      Plot.tip(data, Plot.pointer({ x: "gen", y: "value", title: (d) => `${d.kind}\nGeneration ${d.gen}\nH = ${fmt(d.value)}` })),
    ],
  });
}

/** Bar chart of genotype frequencies per group, e.g. R `inbreeding_genotypes()`. */
export function genotypeBars(Plot, rows, { width = 700, facet = "mating" } = {}) {
  return Plot.plot({
    width,
    height: 260,
    marginLeft: 60,
    style: { fontSize: "13px", background: "transparent" },
    x: { label: null, domain: ["A1A1", "A1A2", "A2A2"] },
    y: { domain: [0, 1], label: "↑ Genotypfrequenz", grid: true },
    fx: { label: null, domain: [...new Set(rows.map((d) => d[facet]))] },
    color: { domain: ["A1A1", "A1A2", "A2A2"], range: GENOTYPE_COLORS },
    marks: [
      Plot.barY(rows, { x: "genotype", y: "freq", fx: facet, fill: "genotype", inset: 4, tip: true }),
      Plot.ruleY([0]),
    ],
  });
}

/** Simple x/y line with a highlighted point, e.g. mean fitness against F. */
export function curvePlot(Plot, rows, { x, y, xLabel, yLabel, highlightX = null, width = 700 } = {}) {
  const near = highlightX === null ? [] : [rows.reduce((a, b) => (Math.abs(b[x] - highlightX) < Math.abs(a[x] - highlightX) ? b : a))];
  return Plot.plot({
    width, height: 260, marginLeft: 60, marginBottom: 40,
    style: { fontSize: "13px", background: "transparent" },
    x: { label: xLabel },
    y: { label: yLabel, grid: true },
    marks: [
      Plot.line(rows, { x, y, stroke: COLORS.series, strokeWidth: 2 }),
      Plot.dot(near, { x, y, fill: COLORS.series, r: 6, stroke: "white" }),
      Plot.tip(rows, Plot.pointer({ x, y, title: (d) => `${xLabel?.replace(" →", "")} = ${fmt(d[x])}\n${yLabel?.replace("↑ ", "")} = ${fmt(d[y])}` })),
    ],
  });
}

/** Allele trajectories with a shaded band (e.g. a bottleneck from x1 to x2). */
export function trajectoryWithBand(Plot, rows, band, { width = 700 } = {}) {
  return Plot.plot({
    ...baseOptions(width),
    y: { domain: [0, 1], label: "↑ Allelfrequenz p (A1)", grid: true },
    marks: [
      Plot.rectX([band], { x1: "x1", x2: "x2", y1: 0, y2: 1, fill: COLORS.reference, fillOpacity: 0.12 }),
      Plot.line(rows, { x: "gen", y: "p", z: "rep", stroke: COLORS.series, strokeOpacity: 0.6, strokeWidth: 2 }),
      Plot.tip(rows, Plot.pointer({ x: "gen", y: "p", title: (d) => `Replikat ${d.rep}\nGeneration ${d.gen}\np = ${fmt(d.p)}\nN = ${fmtN(d.N)}` })),
    ],
  });
}

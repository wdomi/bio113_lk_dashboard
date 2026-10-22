// =============================================================================
// plots.js — reusable charts (Observable Plot)
// -----------------------------------------------------------------------------
// Every function receives `Plot` as its first argument. Quarto's OJS runtime
// already ships Observable Plot, so we pass it in instead of importing a second
// copy. This also keeps the simulation modules free of browser dependencies.
//
// Colours live in theme.js. Change them there, not here.
// =============================================================================

import { COLORS, GENOTYPE_COLORS, SCENARIO_COLORS } from "./theme.js";
import { genotypesLong, finalRows } from "./stats.js";

const fmt = (x) => (Number.isFinite(x) ? x.toFixed(3) : "–");

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
            `${hasScenario ? d.scenario + "\n" : ""}Replikat ${d.rep}\nGeneration ${d.gen}\np = ${fmt(d.p)}\nN = ${d.N === Infinity ? "∞" : d.N}`,
        }),
      ),
    ],
  });
}

/** Genotype frequencies (A1A1, A1A2, A2A2) over time for ONE population. */
export function genotypePlot(Plot, rows, { width = 700, showHW = true } = {}) {
  const long = genotypesLong(rows);
  const hw = showHW
    ? rows.flatMap((r) => [
        { gen: r.gen, genotype: "A1A1", freq: r.p * r.p },
        { gen: r.gen, genotype: "A1A2", freq: 2 * r.p * (1 - r.p) },
        { gen: r.gen, genotype: "A2A2", freq: (1 - r.p) ** 2 },
      ])
    : [];
  return Plot.plot({
    ...baseOptions(width),
    y: { domain: [0, 1], label: "↑ Genotypfrequenz", grid: true },
    color: { domain: ["A1A1", "A1A2", "A2A2"], range: GENOTYPE_COLORS, legend: true },
    marks: [
      Plot.ruleY([0], { stroke: COLORS.axis }),
      showHW ? Plot.line(hw, { x: "gen", y: "freq", stroke: "genotype", strokeDasharray: "3,3", strokeWidth: 1.5 }) : null,
      Plot.line(long, { x: "gen", y: "freq", stroke: "genotype", strokeWidth: 2 }),
      Plot.tip(long, Plot.pointer({ x: "gen", y: "freq", title: (d) => `Generation ${d.gen}\n${d.genotype}: ${fmt(d.freq)}` })),
    ],
  });
}

/**
 * Hardy–Weinberg curves: p², 2pq and q² as functions of p, with markers at the
 * current p (and optional observed genotype frequencies).
 */
export function hardyWeinbergCurves(Plot, p, { width = 700, observed = null } = {}) {
  const grid = Array.from({ length: 101 }, (_, i) => i / 100);
  const curves = grid.flatMap((x) => [
    { p: x, genotype: "A1A1", freq: x * x },
    { p: x, genotype: "A1A2", freq: 2 * x * (1 - x) },
    { p: x, genotype: "A2A2", freq: (1 - x) ** 2 },
  ]);
  const here = [
    { p, genotype: "A1A1", freq: p * p },
    { p, genotype: "A1A2", freq: 2 * p * (1 - p) },
    { p, genotype: "A2A2", freq: (1 - p) ** 2 },
  ];
  return Plot.plot({
    ...baseOptions(width),
    x: { domain: [0, 1], label: "Allelfrequenz p (A1) →" },
    y: { domain: [0, 1], label: "↑ Genotypfrequenz", grid: true },
    color: { domain: ["A1A1", "A1A2", "A2A2"], range: GENOTYPE_COLORS, legend: true },
    marks: [
      Plot.ruleX([p], { stroke: COLORS.reference, strokeDasharray: "4,4" }),
      Plot.line(curves, { x: "p", y: "freq", stroke: "genotype", strokeWidth: 2 }),
      Plot.dot(here, { x: "p", y: "freq", fill: "genotype", r: 6, stroke: "white", strokeWidth: 2 }),
      observed
        ? Plot.dot(observed, { x: "p", y: "freq", stroke: "genotype", r: 7, strokeWidth: 2, symbol: "square" })
        : null,
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

/** Observed heterozygosity (mean over replicates) vs. the theoretical expectation. */
export function heterozygosityPlot(Plot, observed, expected, { width = 700 } = {}) {
  const data = [
    ...observed.map((d) => ({ ...d, kind: "simuliert (Mittelwert)" })),
    ...expected.map((d) => ({ ...d, kind: "erwartet: H₀(1 − 1/2N)ᵗ" })),
  ];
  return Plot.plot({
    ...baseOptions(width),
    y: { domain: [0, 0.55], label: "↑ Heterozygotie H", grid: true },
    color: { domain: ["simuliert (Mittelwert)", "erwartet: H₀(1 − 1/2N)ᵗ"], range: [COLORS.series, COLORS.reference], legend: true },
    marks: [
      Plot.ruleY([0], { stroke: COLORS.axis }),
      Plot.line(data, { x: "gen", y: "value", stroke: "kind", strokeWidth: 2 }),
      Plot.tip(data, Plot.pointer({ x: "gen", y: "value", title: (d) => `${d.kind}\nGeneration ${d.gen}\nH = ${fmt(d.value)}` })),
    ],
  });
}

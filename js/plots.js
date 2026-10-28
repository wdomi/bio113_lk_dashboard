// =============================================================================
// plots.js: charts (Observable Plot). Drawing only: the numbers come from R.
// -----------------------------------------------------------------------------
// Every function takes `Plot` as its first argument (Quarto's OJS runtime
// provides it). Data are the data frames returned by the R package popgen/.
// Colours live in theme.js. Change the look here, not on the pages.
// =============================================================================

import { COLORS, GENOTYPE_COLORS, GENOTYPE_EDGE, SCENARIO_COLORS } from "./theme.js";

/** Rows of the light aa genotype, which gets a brown edge drawn underneath. */
const aaOnly = (rows) => rows.filter((d) => d.genotype === "aa");

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

/** Shared, quiet look: no frame, light grid, labels on the axes. */
const base = (width, height = 300) => ({
  width,
  height,
  marginLeft: 48,
  marginBottom: 40,
  marginTop: 32, // room for the y-axis label above the top tick
  style: { fontSize: "13px", background: "transparent", overflow: "visible" },
  x: { label: "Generation", labelAnchor: "right", grid: false, tickSize: 0 },
  y: { grid: true, tickSize: 0, labelAnchor: "top" },
});

/** Allele frequency over time: one line per replicate (or per scenario). */
export function alleleTrajectoryPlot(Plot, rows, { width = 700, y = "p", yLabel = "Allelfrequenz", highlight = null } = {}) {
  const hasScenario = rows.length > 0 && rows[0].scenario !== undefined;
  const nReps = new Set(rows.map((r) => r.rep)).size;
  const opacity = nReps > 20 ? 0.3 : nReps > 5 ? 0.5 : 1;
  const z = hasScenario ? (d) => `${d.scenario} #${d.rep}` : "rep";
  return Plot.plot({
    ...base(width),
    y: { domain: [0, 1], label: yLabel, grid: true, tickSize: 0, labelAnchor: "top" },
    color: hasScenario
      ? { domain: [...new Set(rows.map((r) => r.scenario))], range: SCENARIO_COLORS, legend: true, position: "top" }
      : undefined,
    marks: [
      highlight !== null ? Plot.ruleY([highlight], { stroke: COLORS.reference, strokeDasharray: "4,4" }) : null,
      Plot.line(rows, {
        x: "gen",
        y,
        z,
        stroke: hasScenario ? "scenario" : COLORS.series,
        strokeWidth: 2.25,
        strokeOpacity: opacity,
      }),
      Plot.tip(
        rows,
        Plot.pointer({
          x: "gen",
          y,
          title: (d) =>
            `${hasScenario ? d.scenario + "\n" : ""}Replikat ${d.rep} · Generation ${d.gen}\np = ${fmt(d.p)}\nN = ${fmtN(d.N)}`,
        }),
      ),
    ],
  });
}

/**
 * Genotype frequencies over time for one population.
 * @param long rows from R `genotypes_long()`: {gen, genotype, freq, hw}
 *   (hw = Hardy-Weinberg expectation at the same p, drawn dashed)
 */
export function genotypePlot(Plot, long, { width = 700, showHW = true } = {}) {
  return Plot.plot({
    ...base(width),
    y: { domain: [0, 1], label: "Genotypfrequenz", grid: true, tickSize: 0, labelAnchor: "top" },
    color: { domain: ["AA", "Aa", "aa"], range: GENOTYPE_COLORS, legend: true, position: "top" },
    marks: [
      showHW
        ? Plot.line(long, { x: "gen", y: "hw", stroke: "genotype", strokeDasharray: "2,4", strokeWidth: 1.5, strokeOpacity: 0.7 })
        : null,
      Plot.line(long, { x: "gen", y: "freq", stroke: "genotype", strokeWidth: 2.5 }),
      Plot.tip(long, Plot.pointer({
        x: "gen",
        y: "freq",
        title: (d) => `Generation ${d.gen} · ${d.genotype}\n${fmt(d.freq)} (HWG: ${fmt(d.hw)})`,
      })),
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
    ...base(width),
    x: { domain: [0, 1], label: "Allelfrequenz p (A)", labelAnchor: "right", tickSize: 0 },
    y: { domain: [0, 1], label: "Genotypfrequenz", grid: true, tickSize: 0, labelAnchor: "top" },
    color: { domain: ["AA", "Aa", "aa"], range: GENOTYPE_COLORS, legend: true, position: "top" },
    marks: [
      Plot.ruleX([p], { stroke: COLORS.axis, strokeDasharray: "3,3" }),
      Plot.line(curves, { x: "p", y: "freq", stroke: "genotype", strokeWidth: 2.5 }),
      Plot.dot(here, { x: "p", y: "freq", fill: "genotype", r: 6, stroke: "white", strokeWidth: 2 }),
      Plot.dot(aaOnly(here), { x: "p", y: "freq", r: 7, stroke: GENOTYPE_EDGE, strokeWidth: 1.2 }),
      Plot.tip(curves, Plot.pointer({
        x: "p",
        y: "freq",
        title: (d) => `p = ${fmt(d.p)} · ${d.genotype}: ${fmt(d.freq)}`,
      })),
    ],
  });
}

/** Histogram of final allele frequencies across replicates (one panel per scenario). */
export function finalFrequencyHistogram(Plot, rows, { width = 700, bins = 20 } = {}) {
  const finals = finalRows(rows);
  const hasScenario = finals.length > 0 && finals[0].scenario !== undefined;
  const scenarios = hasScenario ? [...new Set(finals.map((d) => d.scenario))] : [];
  return Plot.plot({
    ...base(width),
    marginLeft: 48,
    marginRight: hasScenario ? 100 : 12,
    height: hasScenario ? 96 * scenarios.length + 56 : 260,
    x: { domain: [0, 1], label: "Allelfrequenz in der letzten Generation", labelAnchor: "right", tickSize: 0 },
    y: { label: "Replikate", grid: true, tickSize: 0, labelAnchor: "top" },
    fy: hasScenario ? { label: null, domain: scenarios, padding: 0.2 } : undefined,
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
            inset: 1.5,
            tip: true,
          },
        ),
      ),
    ],
  });
}

/**
 * Heterozygosity over time.
 * @param het either wide rows {gen, observed, expected} (drift page)
 *   or long rows {gen, value, kind} (bottleneck page)
 * @param band optional {x1, x2} range to shade
 */
export function heterozygosityPlot(Plot, het, { width = 700, labels = ["simuliert", "Erwartung"], band = null } = {}) {
  const data = het.length > 0 && het[0].kind !== undefined
    ? het
    : het.flatMap((d) => [
        { gen: d.gen, value: d.observed, kind: labels[0] },
        { gen: d.gen, value: d.expected, kind: labels[1] },
      ]);
  const kinds = [...new Set(data.map((d) => d.kind))];
  return Plot.plot({
    ...base(width),
    y: { domain: [0, 0.55], label: "Heterozygotie H", grid: true, tickSize: 0, labelAnchor: "top" },
    color: { domain: kinds, range: [COLORS.series, COLORS.reference], legend: true, position: "top" },
    marks: [
      band ? Plot.rectX([band], { x1: "x1", x2: "x2", y1: 0, y2: 0.55, fill: COLORS.band }) : null,
      Plot.line(data, { x: "gen", y: "value", stroke: "kind", strokeWidth: 2.25 }),
      Plot.tip(data, Plot.pointer({
        x: "gen",
        y: "value",
        title: (d) => `${d.kind} · Generation ${d.gen}\nH = ${fmt(d.value)}`,
      })),
    ],
  });
}

/** Genotype frequencies as bars, one panel per group (e.g. with and without inbreeding). */
export function genotypeBars(Plot, rows, { width = 700, facet = "mating" } = {}) {
  return Plot.plot({
    width,
    height: 280,
    marginLeft: 48,
    marginBottom: 36,
    marginTop: 52, // y-axis label sits above the panel titles
    style: { fontSize: "13px", background: "transparent", overflow: "visible" },
    x: { label: null, domain: ["AA", "Aa", "aa"], tickSize: 0 },
    y: { domain: [0, 1], label: "Genotypfrequenz", grid: true, tickSize: 0, labelAnchor: "top" },
    fx: { label: null, domain: [...new Set(rows.map((d) => d[facet]))] },
    color: { domain: ["AA", "Aa", "aa"], range: GENOTYPE_COLORS },
    marks: [
      Plot.barY(rows, { x: "genotype", y: "freq", fx: facet, fill: "genotype", stroke: GENOTYPE_EDGE, strokeWidth: 1, inset: 12, rx: 4, tip: true }),
      Plot.ruleY([0], { stroke: COLORS.axis }),
    ],
  });
}

/** A single curve with the current point marked, e.g. mean fitness against F. */
export function curvePlot(Plot, rows, { x, y, xLabel, yLabel, highlightX = null, width = 700 } = {}) {
  const near = highlightX === null
    ? []
    : [rows.reduce((a, b) => (Math.abs(b[x] - highlightX) < Math.abs(a[x] - highlightX) ? b : a))];
  return Plot.plot({
    ...base(width, 260),
    x: { label: xLabel, labelAnchor: "right", tickSize: 0 },
    y: { label: yLabel, grid: true, tickSize: 0, labelAnchor: "top" },
    marks: [
      Plot.line(rows, { x, y, stroke: COLORS.series, strokeWidth: 2.25 }),
      Plot.dot(near, { x, y, fill: COLORS.series, r: 6, stroke: "white", strokeWidth: 2 }),
      Plot.tip(rows, Plot.pointer({
        x,
        y,
        title: (d) => `${xLabel.replace(" →", "")} ${fmt(d[x])}\n${yLabel.replace("↑ ", "")} ${fmt(d[y])}`,
      })),
    ],
  });
}

/** Allele trajectories with a shaded band (e.g. a bottleneck from x1 to x2). */
export function trajectoryWithBand(Plot, rows, band, { width = 700 } = {}) {
  return Plot.plot({
    ...base(width),
    y: { domain: [0, 1], label: "Allelfrequenz p (A)", grid: true, tickSize: 0, labelAnchor: "top" },
    marks: [
      Plot.rectX([band], { x1: "x1", x2: "x2", y1: 0, y2: 1, fill: COLORS.band }),
      Plot.line(rows, { x: "gen", y: "p", z: "rep", stroke: COLORS.series, strokeOpacity: 0.4, strokeWidth: 2 }),
      Plot.tip(rows, Plot.pointer({
        x: "gen",
        y: "p",
        title: (d) => `Replikat ${d.rep} · Generation ${d.gen}\np = ${fmt(d.p)}\nN = ${fmtN(d.N)}`,
      })),
    ],
  });
}

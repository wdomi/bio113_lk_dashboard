// =============================================================================
// lifecycle.js: the Hardy-Weinberg life cycle drawn with mice (inline SVG)
// -----------------------------------------------------------------------------
// After the lecture figure (Vorlesung 7): adults -> sperm and eggs -> zygotes
// -> juveniles -> adults. Drawing only: every count comes from the R function
// hw_life_cycle() in popgen/R/models.R. Colours live in theme.js.
//
// The SVG has a fixed viewBox and scales to the width of its container, so it
// works on a phone and next to the Hardy-Weinberg chart on a wide screen.
// =============================================================================

import { MOUSE_COLORS, ALLELE_COLORS } from "./theme.js";

const NS = "http://www.w3.org/2000/svg";
const W = 500;
const H = 510;
const CX = 250; // centre of the cycle
const CY = 260;
const INK = "#1f1f1d";
const MUTED = "#5a5a56";
const OUTLINE = "#5b4632";

/** Create an SVG element with attributes. */
function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) node.append(c);
  return node;
}

function text(x, y, str, { size = 13, weight = 400, anchor = "start", fill = INK } = {}) {
  const t = el("text", { x, y, "font-size": size, "font-weight": weight, "text-anchor": anchor, fill });
  t.textContent = str;
  return t;
}

/** Light colours (beige) need dark text and an outline, dark ones white text. */
const isLight = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

/** One mouse facing right, about 44 x 28 units, top-left at (0, 0). */
function mouse(fill) {
  return el("g", {}, [
    el("path", { d: "M7 19 C0 19 -2 12 -6 9", fill: "none", stroke: OUTLINE, "stroke-width": 1.4, "stroke-linecap": "round" }),
    el("ellipse", { cx: 19, cy: 17, rx: 13, ry: 9, fill, stroke: OUTLINE, "stroke-width": 1 }),
    el("ellipse", { cx: 32, cy: 13, rx: 8.5, ry: 6.5, fill, stroke: OUTLINE, "stroke-width": 1 }),
    el("circle", { cx: 29, cy: 6, r: 4.5, fill, stroke: OUTLINE, "stroke-width": 1 }),
    el("circle", { cx: 29, cy: 6, r: 2.2, fill: "#e9a9a2" }),
    el("circle", { cx: 34.5, cy: 11.5, r: 1.3, fill: "#1f1f1d" }),
    el("circle", { cx: 40.3, cy: 14, r: 1.4, fill: "#c97a72" }),
    el("path", { d: "M14 25 l-1 3 M24 25 l1 3", stroke: OUTLINE, "stroke-width": 1.2, "stroke-linecap": "round" }),
  ]);
}

/** A sperm cell (head + wavy tail), head on the right, ~26 x 8 units. */
function sperm(fill) {
  return el("g", {}, [
    el("path", { d: "M0 4 q3 -4 6 0 t6 0 t6 0", fill: "none", stroke: OUTLINE, "stroke-width": 1.1 }),
    el("ellipse", { cx: 22, cy: 4, rx: 5, ry: 3.6, fill, stroke: OUTLINE, "stroke-width": 0.9 }),
  ]);
}

/** A round cell (egg or zygote) with its allele / genotype written inside. */
function cell(fill, label, r) {
  return el("g", {}, [
    el("circle", { cx: 0, cy: 0, r, fill, stroke: OUTLINE, "stroke-width": 0.9 }),
    text(0, r * 0.33, label, { size: r * 0.85, weight: 600, anchor: "middle", fill: isLight(fill) ? INK : "#ffffff" }),
  ]);
}

/** Expand count rows to one entry per individual, in the order of `rows`. */
const individuals = (rows) => rows.flatMap((d) => Array.from({ length: d.count }, () => d.class));

/** Place items on a grid inside a box; draw(item) returns an SVG node. */
function grid(items, { x, y, w, h, cols }, draw, { dx = 0, dy = 0, scale = 1 } = {}) {
  const rows = Math.max(1, Math.ceil(items.length / cols));
  const cw = w / cols;
  const ch = h / rows;
  return el("g", {}, items.map((item, i) => {
    const gx = x + (i % cols) * cw + cw / 2 + dx;
    const gy = y + Math.floor(i / cols) * ch + ch / 2 + dy;
    const node = draw(item);
    node.setAttribute("transform", `translate(${gx} ${gy}) scale(${scale})`);
    return el("g", {}, [node]);
  }));
}

/** A short clockwise arrow on the cycle at screen angle `deg` (0 = right, 90 = down). */
function arrow(deg, r = 120, span = 11) {
  const rad = (a) => (a * Math.PI) / 180;
  const a0 = rad(deg - span);
  const a1 = rad(deg + span);
  const p0 = [CX + r * Math.cos(a0), CY + r * Math.sin(a0)];
  const p1 = [CX + r * Math.cos(a1), CY + r * Math.sin(a1)];
  return el("path", {
    d: `M${p0[0]} ${p0[1]} A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}`,
    fill: "none", stroke: "#8a8983", "stroke-width": 2.2, "marker-end": "url(#mlc-head)",
  });
}

const countLine = (rows) => rows.map((d) => `${d.count} ${d.class}`).join(" · ");

/**
 * The life-cycle figure.
 * @param rows output of R hw_life_cycle(p, N): data frame (stage, class, count, p)
 * @returns SVG element
 */
export function mouseLifeCycle(rows) {
  const stage = (s) => rows.filter((d) => d.stage === s);
  const adults = stage("adults");
  const zygotes = stage("zygotes");
  const juveniles = stage("juveniles");
  const spermRows = stage("sperm");
  const eggRows = stage("eggs");
  const N = adults.reduce((s, d) => s + d.count, 0);
  const colsMice = N <= 20 ? 4 : Math.ceil(Math.sqrt(N));

  const svg = el("svg", {
    viewBox: `0 0 ${W} ${H}`,
    width: "100%",
    role: "img",
    class: "mouse-cycle",
    "font-family": "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  });
  const title = el("title");
  title.textContent =
    `Lebenszyklus von ${N} Mäusen. Adulte: ${countLine(adults)}. ` +
    `Spermien: ${countLine(spermRows)}. Eizellen: ${countLine(eggRows)}. ` +
    `Zygoten: ${countLine(zygotes)}. Juvenile: ${countLine(juveniles)}.`;
  svg.append(title);

  svg.append(el("defs", {}, [
    el("marker", { id: "mlc-head", viewBox: "0 0 10 10", refX: 6, refY: 5, markerWidth: 5, markerHeight: 5, orient: "auto-start-reverse" }, [
      el("path", { d: "M0 0 L10 5 L0 10 z", fill: "#8a8983" }),
    ]),
  ]));

  // faint disc behind the cycle, as in the lecture figure
  svg.append(el("circle", { cx: CX, cy: CY, r: 235, fill: "#f4efe9" }));

  // arrows: adults (bottom left) -> gametes (top left) -> zygotes -> juveniles -> adults
  svg.append(arrow(180), arrow(270), arrow(0), arrow(90));

  // --- top left: gametes ----------------------------------------------------
  svg.append(text(20, 24, "Gameten", { size: 16, weight: 600 }));
  svg.append(text(72, 46, "Spermien", { size: 12, anchor: "middle", fill: MUTED }));
  svg.append(text(180, 46, "Eizellen", { size: 12, anchor: "middle", fill: MUTED }));
  svg.append(grid(individuals(spermRows), { x: 20, y: 54, w: 108, h: 160, cols: 4 },
    (a) => sperm(ALLELE_COLORS[a]), { dx: -10, dy: -3, scale: 0.8 }));
  svg.append(grid(individuals(eggRows), { x: 134, y: 54, w: 96, h: 160, cols: 4 },
    (a) => cell(ALLELE_COLORS[a], a, 9)));
  svg.append(text(72, 232, countLine(spermRows), { size: 12.5, anchor: "middle" }));
  svg.append(text(180, 232, countLine(eggRows), { size: 12.5, anchor: "middle" }));

  // --- top right: zygotes ---------------------------------------------------
  svg.append(text(480, 24, "Zygoten", { size: 16, weight: 600, anchor: "end" }));
  svg.append(grid(individuals(zygotes), { x: 270, y: 54, w: 210, h: 160, cols: 5 },
    (g) => cell(MOUSE_COLORS[g], g, 12)));
  svg.append(text(375, 232, countLine(zygotes), { size: 12.5, anchor: "middle" }));

  // --- bottom right: juveniles ------------------------------------------------
  svg.append(grid(individuals(juveniles), { x: 270, y: 292, w: 210, h: 160, cols: colsMice },
    (g) => mouse(MOUSE_COLORS[g]), { dx: -14, dy: -9, scale: 0.68 }));
  svg.append(text(375, 476, countLine(juveniles), { size: 12.5, anchor: "middle" }));
  svg.append(text(480, 502, "Juvenile", { size: 16, weight: 600, anchor: "end" }));

  // --- bottom left: adults ----------------------------------------------------
  svg.append(grid(individuals(adults), { x: 20, y: 292, w: 210, h: 160, cols: colsMice },
    (g) => mouse(MOUSE_COLORS[g]), { dx: -20, dy: -14 }));
  svg.append(text(125, 476, countLine(adults), { size: 12.5, anchor: "middle" }));
  svg.append(text(20, 502, "Adulte", { size: 16, weight: 600 }));

  return svg;
}

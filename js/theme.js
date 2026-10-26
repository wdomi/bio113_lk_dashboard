// =============================================================================
// theme.js: all chart colours in one place
// -----------------------------------------------------------------------------
// Keep each genotype's colour the same on every page (colour means identity).
// The genotype colours differ in lightness, so they also work in greyscale and
// for colour-blind readers.
// The page look (fonts, spacing, cards) is in styles/custom.scss.
// =============================================================================

// Genotypes look like the mice in the lecture figure: AA dark brown, Aa mid
// brown, aa beige. MOUSE_COLORS fill the mice (Hardy-Weinberg life cycle);
// lines and bars use the same browns, but a deeper beige for aa so a thin
// line still shows on the white page.
export const MOUSE_COLORS = { AA: "#5c3a21", Aa: "#a0703f", aa: "#ecdcb8" }; // dark brown, mid brown, beige
export const ALLELE_COLORS = { A: MOUSE_COLORS.AA, a: MOUSE_COLORS.aa }; // sperm and eggs
export const GENOTYPE_COLORS = [MOUSE_COLORS.AA, MOUSE_COLORS.Aa, "#d4b27a"]; // AA, Aa, aa

export const SCENARIO_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#6250d6"]; // up to 4 scenarios

export const COLORS = {
  series: "#2a78d6", // single-population lines and bars
  reference: "#6b6a66", // dashed expectation / equilibrium lines
  axis: "#b9b8b2", // baselines at 0 and 1
  band: "rgba(42, 120, 214, 0.08)", // shaded time spans (e.g. bottleneck)
};

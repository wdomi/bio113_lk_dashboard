// =============================================================================
// theme.js: all chart colours in one place
// -----------------------------------------------------------------------------
// Keep each genotype's colour the same on every page (colour means identity).
// The genotype colours differ in lightness, so they also work in greyscale and
// for colour-blind readers.
// The page look (fonts, spacing, cards) is in styles/custom.scss.
// =============================================================================

// Genotypes look like the mice in the lecture figure: AA dark brown, Aa mid
// brown, aa light brown (Dorea's palette, 2026-10-28). The three are far apart in
// lightness so the mice are easy to tell apart. Mice, lines, bars and dots all
// use the same three colours. The light brown gets a brown edge (GENOTYPE_EDGE)
// on dots, bars and the legend swatch; Dorea wants its lines without one.
export const MOUSE_COLORS = { AA: "#392b0f", Aa: "#a67f2b", aa: "#ebd9b2" }; // dark brown, mid brown, light brown
export const ALLELE_COLORS = { A: MOUSE_COLORS.AA, a: MOUSE_COLORS.aa }; // sperm and eggs
export const GENOTYPE_COLORS = [MOUSE_COLORS.AA, MOUSE_COLORS.Aa, MOUSE_COLORS.aa]; // AA, Aa, aa
export const GENOTYPE_EDGE = "#8c7b55"; // outline for the light aa dots, bars and legend swatch (not lines)

export const SCENARIO_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#6250d6"]; // up to 4 scenarios

export const COLORS = {
  series: "#2a78d6", // single-population lines and bars
  reference: "#6b6a66", // dashed expectation / equilibrium lines
  axis: "#b9b8b2", // baselines at 0 and 1
  band: "rgba(42, 120, 214, 0.08)", // shaded time spans (e.g. bottleneck)
};

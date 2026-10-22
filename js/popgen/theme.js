// =============================================================================
// theme.js — all chart colours in one place
// -----------------------------------------------------------------------------
// The categorical colours were checked for colour-blind safety. If you change
// them, keep each genotype's colour the same on every page (colour = identity).
// The site colours (fonts, background, navbar) are in styles/custom.scss.
// =============================================================================

export const GENOTYPE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"]; // A1A1, A1A2, A2A2

export const SCENARIO_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#6250d6"]; // up to 4 scenarios

export const COLORS = {
  series: "#2a78d6", // single-population lines and bars
  reference: "#52514e", // dashed expectation / equilibrium lines
  axis: "#9b9a95", // baselines at 0 and 1
};

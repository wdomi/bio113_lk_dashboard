// =============================================================================
// theme.js: all chart colours in one place
// -----------------------------------------------------------------------------
// The categorical colours were checked for colour-blind safety. Keep each
// genotype's colour the same on every page (colour means identity).
// The page look (fonts, spacing, cards) is in styles/custom.scss.
// =============================================================================

export const GENOTYPE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"]; // A1A1, A1A2, A2A2

export const SCENARIO_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#6250d6"]; // up to 4 scenarios

export const COLORS = {
  series: "#2a78d6", // single-population lines and bars
  reference: "#6b6a66", // dashed expectation / equilibrium lines
  axis: "#b9b8b2", // baselines at 0 and 1
  band: "rgba(42, 120, 214, 0.08)", // shaded time spans (e.g. bottleneck)
};

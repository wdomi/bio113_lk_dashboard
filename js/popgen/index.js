// =============================================================================
// index.js — single entry point for all pages
// -----------------------------------------------------------------------------
// Pages import everything from here:
//
//   ```{ojs}
//   import { simulate, alleleTrajectoryPlot } from "/js/popgen/index.js"
//   ```
//
// If you add a new module, re-export it here so pages keep one import line.
// =============================================================================

export * from "./random.js";
export * from "./models.js";
export * from "./simulate.js";
export * from "./stats.js";
export * from "./plots.js";
export * from "./theme.js";

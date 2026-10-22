# Developer guide

This guide is for whoever maintains the site next, with or without an AI assistant.
It assumes you know some R/RStudio and Markdown, but not JavaScript.

- [1. Mental model](#1-mental-model)
- [2. Everyday recipes](#2-everyday-recipes)
- [3. The simulation engine](#3-the-simulation-engine)
- [4. How an interactive page is built (OJS crash course)](#4-how-an-interactive-page-is-built-ojs-crash-course)
- [5. Testing and checking](#5-testing-and-checking)
- [6. Deployment](#6-deployment)
- [7. Troubleshooting](#7-troubleshooting)

---

## 1. Mental model

```
 .qmd page  ──(include)──►  _partials/_setup.qmd  ──(import)──►  js/popgen/index.js
   │                                                               ├─ models.js    equations
   │  sliders (viewof …)                                           ├─ simulate.js  generation loop
   │  call simulate(...)  ───────────────────────────────────────► ├─ stats.js     summaries
   │  call alleleTrajectoryPlot(Plot, rows)  ────────────────────► ├─ plots.js     charts
   ▼                                                               └─ theme.js     colours
 quarto render  ──►  _site/ (static HTML + JS)  ──►  GitHub Pages
```

- **Quarto** turns every `.qmd` into an HTML page at build time.
- Code chunks marked `{ojs}` are **not** run at build time. They run in the reader's browser,
  and they re-run automatically whenever a value they depend on (e.g. a slider) changes.
  That is how the pages stay interactive without a server.
- All maths lives in `js/popgen/`. Pages only *call* it, so a page cannot accidentally
  break the model, and a model change shows up on every page at once.

## 2. Everyday recipes

### Change text, questions or answers on a page
Edit the Markdown in the `.qmd` file (`konzepte/*.qmd`, `index.qmd`, …). Formulas use LaTeX: `$p^2 + 2pq + q^2$`.
Preview with `quarto preview`.

### Add or change an Explorer preset (and get a link for a worksheet)
Edit `config/scenarios.json`. Add an entry:

```json
{
  "id": "drift-50",
  "label": "Drift: N = 50, 20 Replikate",
  "description": "Text shown below the menu.",
  "params": { "N": 50, "generations": 100, "p0": 0.5, "replicates": 20 }
}
```

- Any parameter you leave out uses the default from `DEFAULT_PARAMS` in `js/popgen/simulate.js`.
- `"N": null` means an infinite population (no drift).
- The link is `https://wdomi.github.io/bio113_lk_dashboard/explorer.html?preset=drift-50`.
- Run `npm test`, which checks for typos in parameter names and duplicate ids.

### Add a new concept page
1. Copy an existing page, e.g. `konzepte/migration.qmd` → `konzepte/meine-seite.qmd`.
2. Keep the line `{{< include /_partials/_setup.qmd >}}` near the top. It loads the engine.
3. Add the page to `_quarto.yml` under `navbar → Konzepte → menu` **and** under `sidebar → contents`.
4. Optionally add a card on `index.qmd` (inside the `::: {.concept-grid}` block).

### Add a slider to a page
Inside an `{ojs}` chunk with `//| panel: input`:

```js
viewof m = Inputs.range([0, 0.5], {value: 0.05, step: 0.005, label: "Migrationsrate m"})
```

`m` can now be used in any other chunk on the page, e.g. `simulate({m, pC: 0.8})`.
Useful inputs: `Inputs.range`, `Inputs.select`, `Inputs.toggle`, `Inputs.number`,
`Inputs.button` (see <https://observablehq.com/framework/inputs/>).
For a log-scale slider (population sizes), add `transform: Math.log`.

### Change colours
- Chart colours: `js/popgen/theme.js`. Keep the three genotype colours distinct for colour-blind readers.
- Site colours/fonts: `styles/custom.scss` (`$primary`, …). Light/dark base themes are set in `_quarto.yml`.

### Change the menu, title or footer
`_quarto.yml`, section `website:`.

## 3. The simulation engine

### Model
One locus, two alleles A1 (*p*) and A2 (*q* = 1 − *p*), diploid, discrete non-overlapping generations.
Each generation (`step()` in `simulate.js`):

| # | Stage | Equation | Function (`models.js`) |
|---|---|---|---|
| 1 | gametes of the adults | *p* = *f*₁₁ + *f*₁₂/2 | `alleleFreqFromGenotypes` |
| 2 | mutation | *p*′ = *p*(1−*u*) + (1−*p*)*v* | `applyMutation` |
| 3 | migration (one-island) | *p*′ = (1−*m*)*p* + *m p*<sub>C</sub> | `applyMigration` |
| 4 | zygotes, with inbreeding *F* | *p*² + *Fpq*, 2*pq*(1−*F*), *q*² + *Fpq* | `genotypeFreqs` |
| 5 | drift: draw *N* individuals | multinomial(*N*; *f*₁₁, *f*₁₂, *f*₂₂) | `randMultinomial3` (`random.js`) |
| 6 | viability selection | *f*′ᵢⱼ = *f*ᵢⱼ *w*ᵢⱼ / *w̄* | `applySelection` |

The **census** (what the plots show) is taken after step 5, i.e. on zygotes before selection.
With `N: Infinity` step 5 is skipped and the run is deterministic.

Bottlenecks change *N* in step 5 for `bottleneck.duration` generations from `bottleneck.start`.

### Parameters
All parameters and defaults are in `DEFAULT_PARAMS` (`simulate.js`). With the defaults nothing evolves (Hardy–Weinberg).
Selection can be given as `w11/w12/w22` or, with `useSH: true`, as `s` and `h` (`w11 = 1, w12 = 1 − hs, w22 = 1 − s`).

### Randomness
`makeRng(seed)` gives a reproducible random stream, and replicate *r* uses seed `seed + 7919·r`.
The "Neu simulieren" buttons simply increase the seed.
Binomial draws are exact when the expected count of the rarer outcome is < 30 and use a normal
approximation otherwise (fast; indistinguishable at the population sizes used here).

### Output format
`simulate()` returns one row per generation:
`{rep, gen, p, q, f11, f12, f22, N}`. `simulateReplicates()` stacks several replicates;
`simulateScenarios()` adds a `scenario` column. All plot functions take these rows directly.

### Adding a new evolutionary force (example: fecundity selection)
1. Write a pure function in `models.js` (input numbers → output numbers, no side effects).
2. Call it at the right place in `step()` in `simulate.js`.
3. Add its parameter(s) with a "no effect" default to `DEFAULT_PARAMS`.
4. Add a test in `tests/models.test.js` (e.g. "with parameter 0 nothing changes") and one in `tests/simulate.test.js`.
5. Export the new function from the page import list in `_partials/_setup.qmd` if pages need it directly.

Because defaults mean "no effect", existing pages keep working unchanged.

## 4. How an interactive page is built (OJS crash course)

```{ojs}
//| panel: input                      ← draws the grey control box
viewof N = Inputs.range([2, 10000], {value: 50, transform: Math.log, label: "Populationsgrösse N"})
viewof seed = Inputs.button("Neu simulieren", {value: 1, reduce: (v) => v + 1})
```

```{ojs}
rows = simulateReplicates({N, p0: 0.5, generations: 100, seed}, 20)   ← re-runs when N or seed change
alleleTrajectoryPlot(Plot, rows, {width})                             ← `width` = current page width
```

Things that surprise R users:

- **Order does not matter.** OJS works out dependencies itself, like a spreadsheet.
- **Each name can be defined only once per page.** Use `p0_hw`, `rows_ms`, … for a second simulation on the same page.
- `viewof x = Inputs...` shows the control **and** defines `x` as its current value.
- `//| include: false` hides a chunk's output (use for helper calculations).
- `md\`...${x}...\`` and `html\`...\`` write text that updates with the values.
- `Plot`, `Inputs`, `d3`, `width` are built in; do not import them.
- Errors appear in red on the page itself. Open the browser console (F12) for details.

## 5. Testing and checking

```bash
npm test          # engine + config checks, takes ~1 s
quarto render     # full build; must finish without ERROR
quarto preview    # look at it
```

Before merging a pull request, check by hand: every page loads, sliders move the plots,
"Neu simulieren" changes drift plots, and dark mode (toggle in the navbar) is readable.

The tests cover: HW proportions, inbreeding, the lecture example (p = 7/12), selection, mutation Δp,
migration Δp, χ², reproducibility of seeds, drift vs. N, the HHMI lactase case, bottlenecks,
binomial sampling, and validity of every preset in `config/scenarios.json`.

## 6. Deployment

- `main` is what students see. Every push to `main` triggers `.github/workflows/publish.yml`
  (tests → `quarto render` → upload `_site/` → deploy to Pages).
- One-time: *Settings → Pages → Source: GitHub Actions*.
- `_site/` is never committed (see `.gitignore`).
- To roll back: revert the bad commit on `main` (*GitHub → commit → Revert*), and the workflow redeploys.

## 7. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `OJS Runtime Error: x is defined more than once` | Same name used in two chunks on one page; rename one. |
| `x is not defined` on a page | Function not in the import list of `_partials/_setup.qmd`, or a typo. |
| `unable to load module` | Path in `_setup.qmd` wrong, or `js/` missing from `resources:` in `_quarto.yml`. |
| Page is blank/frozen after a change | Infinite or very long loop; check generations × replicates (keep ≲ 1 million rows). |
| Formula shows as raw `$...$` | KaTeX did not load (offline?) or a LaTeX typo. |
| Action fails at `npm test` | Read the red test name in the log; it says what is wrong. |
| Site not updating | Check the *Actions* tab; Pages source must be "GitHub Actions". Hard-refresh the browser (Ctrl+Shift+R). |
| Warning `OJS block count mismatch` while rendering | Harmless; caused by the shared include. |

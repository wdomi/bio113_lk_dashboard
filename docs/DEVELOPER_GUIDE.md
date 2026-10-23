# Developer guide

This guide is for whoever maintains the site next, with or without an AI assistant.
It assumes you know R/RStudio and Markdown, but not JavaScript.

- [1. Mental model](#1-mental-model)
- [2. Everyday recipes](#2-everyday-recipes)
- [3. The R package popgen](#3-the-r-package-popgen)
- [4. How an interactive page is built (OJS crash course)](#4-how-an-interactive-page-is-built-ojs-crash-course)
- [5. Testing and checking](#5-testing-and-checking)
- [6. Deployment](#6-deployment)
- [7. Troubleshooting](#7-troubleshooting)

---

## 1. Mental model

```
 konzepte/drift.qmd
   │  viewof N = Inputs.range(...)                   ← slider (OJS)
   │  res = R.call("drift_experiment", {N, ...})     ← asks R  ─────────┐
   │  alleleTrajectoryPlot(Plot, res.rows)           ← draws (js/plots.js)
   │                                                                    ▼
   │                                    webR = real R running in the browser
   │                                    with popgen/R/models.R, simulate.R, stats.R
   ▼
 quarto render  ──►  _site/ (static HTML + JS + the .R files)  ──►  GitHub Pages
```

- **All maths is R** (`popgen/R/`). The pages contain only text, sliders and calls like `R.call("simulate", {...})`.
- **webR** is R compiled to WebAssembly. `_partials/_setup.qmd` starts it once per page and loads the `.R` files.
  On the first visit this takes a few seconds (download), and later visits load it from the browser cache.
- **OJS** chunks (`{ojs}`) run in the reader's browser and re-run automatically when a slider they use changes,
  like a spreadsheet. `js/plots.js` turns the data frames R returns into Observable Plot charts.
- `quarto render` does **not** run R. It only copies the `.R` files to the site.

## 2. Everyday recipes

### Change an equation or the simulation (R only)
1. Open `popgen/popgen.Rproj` in RStudio and run `devtools::load_all()`.
2. Edit `R/models.R` (equations) or `R/simulate.R` (generation loop). Try it: `simulate(N = 50, replicates = 20)`.
3. Add or adjust a test in `tests/testthat/`, then run *Build → Test Package*.
4. Commit and push on a branch, then open a pull request (see CONTRIBUTING.md). The site updates after merging.

Keep the rules in [popgen/README.md](../popgen/README.md): base R only, return data frames, new arguments get a "no effect" default.

### Change text, questions or answers on a page
Edit the Markdown in the `.qmd` file. Formulas use LaTeX: `$p^2 + 2pq + q^2$`. Preview with `quarto preview`.

### Add or change an Explorer preset (and get a link for a worksheet)
Edit `config/scenarios.json`. `params` are **arguments of `simulate()`**:

```json
{
  "id": "drift-50",
  "label": "Drift: N = 50, 20 Replikate",
  "description": "Text shown below the menu.",
  "params": { "N": 50, "generations": 100, "p0": 0.5, "replicates": 20 }
}
```

- Left-out arguments use the defaults of `simulate()`. `"N": null` means an infinite population.
- Link: `https://wdomi.github.io/bio113_lk_dashboard/explorer.html?preset=drift-50`
- The R test `test-config.R` checks every preset (unknown argument names, duplicate ids).

### Use a new R function on a page
1. Write it in `popgen/R/…` so that it returns a **data frame** (or a named list of data frames/numbers).
2. On the page: `result = R.call("my_function", {arg1: value, arg2: slider})`.
   JavaScript values become R values: numbers → numeric, `Infinity` → `Inf`, `null` → `NULL`,
   `true` → `TRUE`, `[1, 2]` → `c(1, 2)`, `{a: 1}` → `list(a = 1)`.
3. A data frame comes back as an array of rows: `result[0].p`, `result.map(d => d.p)`.
   A named list comes back as an object: `result.rows`, `result.summary`.
4. Pass `{key: "something-unique"}` as a third argument for calls driven by a slider:
   while the slider is dragged, only the newest value is computed.
   Example: `R.call("simulate", {N}, {key: "drift-main"})`.

### Add a new R file
Create `popgen/R/myfile.R` and add a line to the list in `_partials/_setup.qmd`:
`await FileAttachment("/popgen/R/myfile.R").text(),`

### Add a new concept page
1. Copy an existing page, e.g. `konzepte/migration.qmd` → `konzepte/meine-seite.qmd`.
2. Keep the line `{{< include /_partials/_setup.qmd >}}` near the top. It starts R.
3. Add the page to `_quarto.yml` under `navbar → Konzepte → menu`. The site has no sidebar.
4. Optionally add a card to `index.qmd` (inside `::: {.concept-grid}`).

### Add a slider
Inside an `{ojs}` chunk with `//| panel: input`:

```js
viewof m = Inputs.range([0, 0.5], {value: 0.05, step: 0.005, label: "Migrationsrate m"})
```

`m` can now be used in any chunk on the page, e.g. `R.call("simulate", {m, pC: 0.8})`.
Useful inputs: `Inputs.range`, `Inputs.select`, `Inputs.toggle`, `Inputs.number`, `Inputs.button`.
For a log-scale slider (population sizes) add `transform: Math.log`.

### Change colours
Chart colours: `js/theme.js` (keep the three genotype colours distinct for colour-blind readers).
Site colours/fonts: `styles/custom.scss`.

### Upgrade webR
Change `WEBR_URL` in `js/r-bridge.js` and the `webr` version in `package.json` (used by the test). Run `npm install && npm test`.

## 3. The R package popgen

### Model
One locus, two alleles A1 (*p*) and A2 (*q* = 1 − *p*), diploid, discrete generations.
Each generation (loop in `simulate()`):

| # | Stage | Equation | Function (`models.R`) |
|---|---|---|---|
| 1 | gametes of the adults | *p* = *f*₁₁ + *f*₁₂/2 | `allele_freq` |
| 2 | mutation | *p*′ = *p*(1−*u*) + (1−*p*)*v* | `apply_mutation` |
| 3 | migration (one-island) | *p*′ = (1−*m*)*p* + *m p*<sub>C</sub> | `apply_migration` |
| 4 | zygotes, inbreeding *F* | *p*² + *Fpq*, 2*pq*(1−*F*), *q*² + *Fpq* | `genotype_freqs` |
| 5 | drift: draw *N* individuals | multinomial (two `rbinom` draws) | `drift_sample` (`simulate.R`) |
| 6 | viability selection | *f*′ᵢⱼ = *f*ᵢⱼ *w*ᵢⱼ / *w̄* | `apply_selection` |

The census (what the plots show) is taken after step 5, i.e. on zygotes before selection.
With `N = Inf` step 5 is skipped and the result is deterministic. All replicates run at once as vectors.

### Main functions the pages call

| R function | Page(s) | Returns |
|---|---|---|
| `simulate(...)` | Mutation (mutation–selection) | data frame `rep, gen, p, q, f11, f12, f22, N` |
| `experiment(...)` | Selektion, Migration, HWG, Explorer | list `rows`, `summary`, `genotypes` |
| `drift_experiment(...)`, `drift_by_size(...)` | Drift | lists with `rows`, `summary`, `heterozygosity` |
| `simulate_scenarios(scenarios, ...)` | Selektion, Migration | `simulate()` rows plus a `scenario` column |
| `bottleneck_experiment(...)` | Flaschenhals | list `rows`, `heterozygosity` |
| `mutation_trajectory(...)` | Mutation | closed-form *p*ₜ (fast for 100 000 generations) |
| `hw_curves()`, `hwe_test()` | HWG | data frames |
| `inbreeding_genotypes()`, `inbreeding_depression()` | Inzucht | data frames |
| `mutation_equilibrium()`, `mutation_selection_balance()` | Mutation | single numbers |

`grep -rn 'R.call("' konzepte explorer.qmd` lists every call.

### Randomness
`simulate()` calls `set.seed(seed)`, so the same seed gives the same result in RStudio and in the browser.
The "Neu simulieren" buttons increase the seed. Drift uses exact binomial draws (`rbinom`).

### Speed
webR is roughly 2–5× slower than desktop R. Guide values in the browser: 100 generations × 20 replicates ≈ 70 ms,
500 × 100 with N = 10 000 ≈ 0.5 s. Keep generations × replicates × scenarios ≲ 100 000 for slider-driven calls.
For very long time spans use a closed form (like `mutation_trajectory()`).

## 4. How an interactive page is built (OJS crash course)

```{ojs}
//| panel: input                      ← draws the grey control box
viewof N = Inputs.range([2, 10000], {value: 50, transform: Math.log, label: "Populationsgrösse N"})
viewof seed = Inputs.button("Neu simulieren", {value: 1, reduce: (v) => v + 1})
```

```{ojs}
res = R.call("drift_experiment", {N, p0: 0.5, replicates: 20, seed}, {key: "drift-main"})  ← asks R
alleleTrajectoryPlot(Plot, res.rows, {width})                                               ← draws
```

Things that surprise R users:

- **Order does not matter.** OJS works out dependencies itself, like a spreadsheet.
- **Each name can be defined only once per page.** Use `res_md`, `rows_ms`, … for a second result on one page.
- `viewof x = Inputs...` shows the control **and** defines `x` as its current value.
- `R.call(...)` returns a *promise*; OJS waits for it automatically, so you can use the result in the next line.
- `//| include: false` hides a chunk's output (use it for helper values).
- `md\`...${x}...\`` and `html\`...\`` write text that updates with the values.
- `Plot`, `Inputs`, `d3`, `width` are built in; do not import them.
- Errors appear in red on the page. R errors show the R message. Open the browser console (F12) for details.

## 5. Testing and checking

```bash
# in R (RStudio: Build → Test Package, inside popgen/popgen.Rproj)
Rscript -e 'testthat::test_local("popgen")'

# the bridge: runs popgen through a real webR in Node.js (optional locally, always in CI)
npm ci && npm test

# the site
quarto render      # must finish without ERROR
quarto preview     # look at it
```

Before merging, also check by hand that every page loads ("✓ R läuft im Browser"), the sliders move the plots,
"Neu simulieren" changes the drift plots, and the text stays readable on a phone-width screen (resize the browser).

## 6. Deployment

- `main` is what students see. Every push to `main` runs `.github/workflows/publish.yml`:
  R tests → bridge test → `quarto render` → deploy `_site/` to Pages.
- One-time: *Settings → Pages → Source: GitHub Actions*.
- `_site/` is never committed (see `.gitignore`).
- To roll back: revert the bad commit on `main` (*GitHub → commit → Revert*), and the workflow redeploys.
- The site loads webR from `https://webr.r-wasm.org/` (pinned version in `js/r-bridge.js`).

## 7. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| "R konnte nicht gestartet werden" | webR CDN unreachable (offline, firewall) or `WEBR_URL` wrong. Reload; check the browser console. |
| Red box `could not find function "xyz"` | R function not defined, or its file is missing from `_partials/_setup.qmd`. |
| Red box `unused argument (foo = …)` | Page passes an argument the R function does not have (renamed in R?). |
| `R returned an unnamed list` | Return a data frame or a *named* list from R. |
| `x is defined more than once` | Same name used in two OJS chunks on one page; rename one. |
| Page is slow while dragging | Too many generations/replicates for a slider; reduce, or add `{key: "..."}` to the call. |
| Formula shows as raw `$...$` | KaTeX did not load (offline?) or a LaTeX typo. |
| Action fails at "R tests" | Read the failing test name in the log. |
| Site not updating | Check the *Actions* tab; Pages source must be "GitHub Actions". Hard-refresh (Ctrl+Shift+R). |
| Warning `OJS block count mismatch` while rendering | Harmless; caused by the shared include. |

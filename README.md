# Bio 113 · Populationsgenetik interaktiv

Interactive website for the course **Bio 113 · Evolution & Biodiversität** (University of Zurich).
Students change parameters and watch how allele and genotype frequencies respond to
Hardy–Weinberg, genetic drift, selection, mutation, migration, inbreeding and bottlenecks.

**Live site:** <https://wdomi.github.io/bio113_lk_dashboard/>
(after the one-time GitHub Pages setup below)

The student-facing text is in German, matching the lectures and their notation
(A1/A2, *p*, *q*, *w*₁₁, *s*, *h*, *u*, *v*, *m*, *p*<sub>C</sub>, *F*).
Code, comments and developer documentation are in English. **All population genetics is written in R** (`popgen/`).

---

## What is in the box

| Page | What students do |
|---|---|
| Start (`index.qmd`) | Overview, how to work with the pages, table of forces |
| Hardy-Weinberg | p², 2pq, q² curves; constancy over time; χ² test with own counts |
| Genetische Drift | Many replicate populations; fixation/loss; heterozygosity decay vs. H₀(1−1/2N)ᵗ; N = 10…10 000 experiment |
| Selektion | w₁₁, w₁₂, w₂₂ with case studies (lactase, German shepherd, heterozygote advantage); dominance comparison |
| Mutation | u, v, equilibrium p̂ = v/(u+v); mutation–selection balance |
| Migration | One-island model, m = 0 / 0.05 / 0.2; migration vs. drift (Nm ≈ 1) |
| Inzucht | F and genotype frequencies; inbreeding depression |
| Flaschenhals | Bottleneck size/duration; heterozygosity with vs. without bottleneck |
| Explorer | All forces combined, replicates, CSV download, shareable preset links |
| Glossar, Über | Definitions; credits and sources |

Every concept page ends with *Fragen zum Nachdenken* and collapsible *Lösungshinweise*.

## How it works (and why)

```
 popgen/R/*.R  ── all population genetics, plain R (edit in RStudio, testthat tests)
      │
      │  the same files are loaded by every page …
      ▼
 webR (R compiled to WebAssembly) runs them in the student's browser
      │  R.call("simulate", {N: 50, replicates: 20})  →  data frame
      ▼
 Observable JS (OJS): sliders + Observable Plot charts  (js/plots.js only draws)
```

- **[Quarto](https://quarto.org)** builds a static website from `.qmd` files, which you can edit in RStudio.
- **All equations and simulations are R** (`popgen/`, structured as an R package). Someone who works in R can read,
  run (`simulate(N = 50)`), change and test them in RStudio without touching JavaScript.
- **[webR](https://docs.r-wasm.org/webr/latest/)** runs those exact R files in the browser, so there is no server and it works on free GitHub Pages hosting.
  Nothing is translated into another language, so there is nothing to keep in sync.
- **[Observable JS](https://quarto.org/docs/interactive/ojs/)** (built into Quarto) provides the sliders and the
  Observable Plot graphics. When a slider moves, OJS asks R for new numbers and redraws.
- **Trade-off:** on the first visit the browser downloads R (a few seconds; a status line says "R wird gestartet …").
  After that it is cached, and simulations take ~50–500 ms. When a slider is dragged, only the newest value is computed.
- **Why not Shiny?** Shiny needs a running R server. **Why not precompute everything in R at render time?**
  Every slider combination and every random replicate would have to be computed in advance, so the sliders would be limited.

## Repository layout

```
├── popgen/                ← R PACKAGE: all population genetics (start here)
│   ├── R/models.R         ←   equations: HW, F, selection, mutation, migration, χ², equilibria
│   ├── R/simulate.R       ←   simulate(): generation loop, replicates, scenarios
│   ├── R/stats.R          ←   summaries + "experiments" the pages call
│   ├── tests/testthat/    ←   R tests
│   ├── popgen.Rproj       ←   open this in RStudio to work on the model
│   └── README.md          ←   how to use it in RStudio + rules
├── _quarto.yml            ← site config: navigation, theme, language
├── index.qmd              ← start page
├── konzepte/*.qmd         ← one page per concept (text + which R function each slider calls)
├── explorer.qmd           ← all forces combined
├── glossar.qmd, ueber.qmd
├── _partials/
│   ├── _setup.qmd         ← starts webR, loads popgen/R/*.R (included on every interactive page)
│   └── _model-note.qmd    ← "Wie rechnet die Simulation?" box
├── js/
│   ├── r-bridge.js        ← JavaScript ↔ R glue (you should not need to touch it)
│   ├── plots.js           ← chart functions (draw only, no maths)
│   └── theme.js           ← chart colours
├── config/scenarios.json  ← Explorer presets (= shareable links); arguments of simulate()
├── styles/custom.scss     ← site look
├── tests/                 ← Node test of the bridge (runs popgen through webR)
├── docs/DEVELOPER_GUIDE.md← how to change things, step by step
├── CONTRIBUTING.md, CHANGELOG.md, DEVLOG.md
└── .github/workflows/     ← publish.yml (main → Pages), check.yml (PRs)
```

Rule of thumb: **science** goes in `popgen/R/`, **text** in `.qmd`, **presets** in `config/scenarios.json`,
**colours** in `js/theme.js` / `styles/custom.scss`.

## Working locally (RStudio)

**Changing the model (R only):** open `popgen/popgen.Rproj`, then run `devtools::load_all()` and play with
`simulate()`. Run the tests with *Build → Test Package*. See [popgen/README.md](popgen/README.md).

**Previewing the website:**

1. Install [Quarto](https://quarto.org/docs/get-started/) (included in RStudio ≥ 2022.07).
2. Open `bio113_lk_dashboard.Rproj`, and in the **Terminal** tab run `quarto preview`.
   A browser opens and reloads whenever you save a file. R itself is not needed for this, because the website brings its own R (webR).
3. Optional, for the JavaScript bridge test: [Node.js](https://nodejs.org) ≥ 22, then `npm ci && npm test`.

## Publishing

Publishing is automatic. Every push to `main` runs `.github/workflows/publish.yml`, which runs the R tests, renders the site and deploys it.

**One-time setup:** on GitHub, go to *Settings → Pages → Build and deployment → Source* and choose **GitHub Actions**.

Pull requests run `.github/workflows/check.yml` (R tests, bridge test, render; nothing is published), so problems show up before merging.

## Further reading

- [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md): recipes such as adding a page, a parameter or a preset, or changing colours
- [CONTRIBUTING.md](CONTRIBUTING.md): branch/PR workflow and conventions
- [DEVLOG.md](DEVLOG.md): why things are the way they are, plus the roadmap
- [CHANGELOG.md](CHANGELOG.md): version history

## Credits

Course: Lukas Keller, Dominique Waldvogel (UZH, IEU).
Inspired by HHMI BioInteractive's *Population Genetics Explorer* (its worksheet case studies are reused here),
Virtual Biology Lab, PopG and biologysimulations.com. See the site's *Über* page.

License: GPL-3.0 (see `LICENSE`).

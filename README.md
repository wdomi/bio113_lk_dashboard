# Bio 113 · Populationsgenetik interaktiv

Interactive website for the course **Bio 113 · Evolution & Biodiversität** (University of Zurich).
Students change parameters and watch how allele and genotype frequencies respond to
Hardy–Weinberg, genetic drift, selection, mutation, migration, inbreeding and bottlenecks.

**Live site:** <https://wdomi.github.io/bio113_lk_dashboard/>
(after the one-time GitHub Pages setup below)

The student-facing text is in German, matching the lectures and their notation
(A1/A2, *p*, *q*, *w*₁₁, *s*, *h*, *u*, *v*, *m*, *p*<sub>C</sub>, *F*).
Code, comments and developer documentation are in English.

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

- **[Quarto](https://quarto.org)** builds a static website from `.qmd` files (Markdown + code), which you can edit in RStudio.
- The interactive parts use **[Observable JS (OJS)](https://quarto.org/docs/interactive/ojs/)**, which Quarto supports out of the box.
  The simulations run **in the student's browser**, so there is **no server**. GitHub Pages can only host static files, so this is what makes free hosting possible.
- **Why not Shiny?** Shiny needs a running R server (shinyapps.io, a university server, …).
  *Shinylive/webR* runs R in the browser but downloads tens of MB and takes several seconds to start on each page.
  OJS sliders respond instantly, even on phones.
- The **simulation engine** is a small set of plain JavaScript modules in `js/popgen/` with no dependencies.
  It is tested with Node's built-in test runner, so nothing needs installing besides Node.

## Repository layout

```
├── _quarto.yml            ← site config: navigation, theme, language
├── index.qmd              ← start page
├── konzepte/              ← one page per concept (edit text here)
│   ├── hardy-weinberg.qmd
│   ├── drift.qmd
│   ├── selektion.qmd
│   ├── mutation.qmd
│   ├── migration.qmd
│   ├── inzucht.qmd
│   └── flaschenhals.qmd
├── explorer.qmd           ← all forces combined
├── glossar.qmd, ueber.qmd
├── _partials/             ← snippets shared by several pages
│   ├── _setup.qmd         ←   imports the engine (included on every interactive page)
│   └── _model-note.qmd    ←   "Wie rechnet die Simulation?" box
├── js/popgen/             ← the "package": simulation engine + charts
│   ├── index.js           ←   single entry point (re-exports everything)
│   ├── random.js          ←   seeded random numbers, binomial/multinomial
│   ├── models.js          ←   equations: HW, F, selection, mutation, migration, χ²
│   ├── simulate.js        ←   life cycle per generation, replicates, DEFAULT_PARAMS
│   ├── stats.js           ←   mean, sd, final-generation summaries
│   ├── plots.js           ←   reusable Observable Plot charts
│   └── theme.js           ←   chart colours
├── config/scenarios.json  ← Explorer presets (= shareable links)
├── styles/custom.scss     ← site look
├── tests/                 ← automated checks (npm test)
├── docs/DEVELOPER_GUIDE.md← how to change things, step by step
├── CONTRIBUTING.md        ← workflow rules (branches, PRs, checks)
├── CHANGELOG.md           ← what changed in each version
├── DEVLOG.md              ← design decisions, open ideas, known limits
└── .github/workflows/     ← build + deploy (publish.yml), PR checks (check.yml)
```

The rule of thumb: **text** in `.qmd`, **maths** in `js/popgen/models.js`,
**presets** in `config/scenarios.json`, **colours** in `js/popgen/theme.js` / `styles/custom.scss`.
Each piece can be changed without touching the others.

## Working locally (RStudio)

1. Install [Quarto](https://quarto.org/docs/get-started/) (RStudio ≥ 2022.07 already includes it) and, for the tests, [Node.js](https://nodejs.org) ≥ 22.
2. Open `bio113_lk_dashboard.Rproj` in RStudio.
3. Preview the site: in the RStudio **Terminal** tab run

   ```bash
   quarto preview
   ```

   A browser opens and reloads automatically when you save a file.
   (Or open any `.qmd` and click **Render**.)
4. Run the tests after changing anything in `js/` or `config/`:

   ```bash
   npm test
   ```

You do not need R packages: the site does not execute R code.

## Publishing

Publishing is automatic. Every push to `main` runs `.github/workflows/publish.yml`, which tests, renders and deploys the site.

**One-time setup:** on GitHub, go to *Settings → Pages → Build and deployment → Source* and choose **GitHub Actions**.

Pull requests run `.github/workflows/check.yml` (tests + render, nothing is published), so problems show up before merging.

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

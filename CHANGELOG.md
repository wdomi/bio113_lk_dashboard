# Changelog

All notable changes to this site. Format: [Keep a Changelog](https://keepachangelog.com/),
versions: [SemVer](https://semver.org).

## [Unreleased]

### Added
- Mutation page: second intro paragraph on forward (u, A → a) and back mutation (v, a → A), with Δp = v·q − u·p and the equilibrium p̂ = v/(u + v).
- Migration and Drift pages: orange "Im Aufbau" box at the top (`.construction-box`).
- Selektion, Migration and Drift pages: the same life-cycle wheel, each with only its own process in colour (`images/lebenszyklus-selektion.svg`, `-migration.svg`, `-drift.svg`).
- Mutation page: Dorea's life-cycle wheel to the right of the intro text (stacked on a phone), with everything greyed out except the mutation arrow (`images/lebenszyklus-mutation.svg`; the uncoloured original is `images/lebenszyklus.svg`, for the other force pages).
- Hardy-Weinberg page: the lecture's mouse life cycle (adults → sperm/eggs → zygotes → juveniles) next to the genotype-frequency chart. Counts of AA, Aa, aa mice (dark brown, mid brown, beige) and of A/a gametes follow the slider *p* (R: `hw_life_cycle()`, drawing: `js/lifecycle.js`).

### Changed
- Mutation page: alleles written A₁/A₂ (text, sliders, chart labels) to match the life-cycle wheel; the other pages keep A/a.
- Life-cycle wheels: caption is now only the source credit "Adaptiert nach © 2014 Pearson Education, Inc.".
- Konzepte menu: finished pages in dark grey; Migration/Genfluss and Genetische Drift lighter grey with "(folgt)".
- Force pages: Dorea's updated life-cycle wheel (process labels, A₁/A₂ arrows); same section in colour on each page.
- Migration page title is now "Migration/Genfluss" (also in the Konzepte menu).
- Mouse life cycle: background circle light green, gamete quarter light red.
- Mouse life cycle: mice now use Dorea's own mouse drawing (`js/mouse-shape.js`, second version with bolder ears, eyes and whiskers), filled with the genotype colour; eyes and whiskers turn light on the dark AA mouse.
- Genotype colours on all charts now match the mice: AA dark brown, Aa mid brown, aa beige.
- New genotype palette for mice and charts, further apart in lightness: AA dark brown `#392b0f`, Aa mid brown `#a67f2b`, aa light brown `#ebd9b2`. The light brown gets a brown edge on dots, bars and the legend swatch (not on lines).
- Simpler, lighter pages: one navbar, no sidebar, light theme only, short intro and questions per page.
- Advanced controls (other forces in the Explorer) are in a collapsed box, so the main sliders stay visible.
- Each concept page shows its main result in one sentence under the chart.
- Charts use a plainer style with legends on top.
- Order Mutation, Selektion, Migration, Drift everywhere (Konzepte menu, start page cards, overview table).
- Start page: "Nullmodell Hardy-Weinberg" heading now sits between the intro paragraph and the Hardy-Weinberg card; the overview table moved to the Hardy-Weinberg page (with the extra assumptions random mating and large population).
- Hardy-Weinberg page: χ² test section "Ist meine Population im Gleichgewicht?" hidden (commented out); the page ends with the overview table and the cards "Abweichungen vom Nullmodell".
- Charts: more space above the plot area, so the y-axis label (e.g. "↑ Genotypfrequenz") no longer overlaps the top tick numbers; histogram panels no longer touch each other.
- Alleles are now called **A** and **a** (genotypes AA, Aa, aa) instead of A1/A2 everywhere: page text, slider labels,
  chart legends, CSV export columns and the R package (`genotype` column returned by `hwe_test()`, `hw_curves()`, `inbreeding_genotypes()` and `genotypes_long()`).

### Fixed
- Chart legends no longer fail with "unknown legend type" in Observable Plot.

## [0.2.0] – 2026-10-22

All population genetics is now written in R.

### Changed
- Equations and simulations moved from JavaScript (`js/popgen/`) to the R package **`popgen/`**
  (`R/models.R`, `R/simulate.R`, `R/stats.R`). The same R files run in the browser via **webR**;
  OJS is used only for sliders and Observable Plot charts.
- Drift now uses exact binomial draws (`rbinom`) for all population sizes.
- Mutation page uses the closed-form solution for long time spans; mutation–selection runs 1000 generations.
- Explorer defaults are read from the arguments of `simulate()` in R.
- CI (`check.yml`, `publish.yml`) runs the R tests (testthat) and a Node test that runs the R package through webR.

### Added
- `popgen/README.md`, `popgen/popgen.Rproj` for working on the model in RStudio (Build → Test Package).
- `js/r-bridge.js`: starts webR, loads the R files, converts data frames; newest-slider-value-wins queue.
- Status line "R wird im Browser gestartet …" on every interactive page.

### Removed
- JavaScript simulation engine (`js/popgen/random.js`, `models.js`, `simulate.js`, `stats.js`) and its tests.

## [0.1.0] – 2026-10-22

First draft.

### Added
- Quarto website (German) with pages: Start, Hardy-Weinberg, Genetische Drift, Selektion, Mutation,
  Migration, Inzucht, Flaschenhals, Explorer, Glossar, Über.
- Simulation engine `js/popgen/` (seeded Wright–Fisher drift, selection via *w* or *s*/*h*, mutation *u*/*v*,
  one-island migration, inbreeding *F*, bottlenecks; replicates and scenario comparison).
- Reusable charts (allele trajectories, genotype frequencies with HW reference, HW curves,
  final-frequency histograms, heterozygosity decay).
- Explorer presets in `config/scenarios.json`, selectable via `explorer.html?preset=<id>`;
  CSV download of simulation data.
- Worksheet-style questions with collapsible answer hints on every concept page;
  case studies adapted from the HHMI *Population Genetics Explorer* worksheet.
- Tests (`npm test`) for the engine and the presets.
- GitHub Actions: `publish.yml` (test, render, deploy to GitHub Pages on push to `main`),
  `check.yml` (test + render on pull requests).
- Documentation: README, CONTRIBUTING, docs/DEVELOPER_GUIDE.md, DEVLOG.md, RStudio project file.

# Contributing

Thanks for helping improve the Bio 113 population genetics site. These rules keep the live site working
while several people (or an AI assistant) edit it.

## Workflow

1. **Never push straight to `main`.** `main` is the live site.
2. Create a branch: `git switch -c feature/short-description` (or use RStudio's *Git* pane → *New Branch*).
3. Make your change, then run locally:
   ```bash
   Rscript -e 'testthat::test_local("popgen")'   # or Build → Test Package in popgen.Rproj
   quarto render
   ```
   (`npm ci && npm test` additionally tests the webR bridge; CI always runs it.)
4. Commit with a clear message (see below) and push the branch.
5. Open a pull request. The **Check** workflow tests and renders the site. Merge only when it is green.
6. Add a line to `CHANGELOG.md` under *Unreleased*. For design decisions, add an entry to `DEVLOG.md`.

Small text fixes can also be made directly on GitHub (pencil icon or the site's *Seite editieren* link), which creates a branch and PR for you.

## Commit messages

Imperative, short, with a scope prefix:

```
drift: add effective population size slider
popgen: fix selection when mean fitness is 0
docs: explain presets in developer guide
config: add preset for worksheet part 3
```

## Where things go

| Change | File(s) |
|---|---|
| Student-facing text, questions | `konzepte/*.qmd`, `index.qmd`, `explorer.qmd`, `glossar.qmd` |
| Equations / model behaviour | `popgen/R/models.R`, `popgen/R/simulate.R`, `popgen/R/stats.R` + a test in `popgen/tests/testthat/` |
| New chart type | `js/plots.js` |
| Presets / worksheet links | `config/scenarios.json` |
| Colours | `js/theme.js`, `styles/custom.scss` |
| Navigation, site title | `_quarto.yml` |

## Conventions

- **Language:** student-facing text in German (Swiss spelling: "ss" not "ß"), notation as in the lectures
  (A/a, *p*, *q*, *w*₁₁, *s*, *h*, *u*, *v*, *m*, *p*<sub>C</sub>, *F*). Code, comments and docs in English.
- **All population genetics is R** (`popgen/R/`). JavaScript only draws (`js/plots.js`) and connects (`js/r-bridge.js`).
- **R functions are pure**: arguments in, data frame out, no global state. Base R + `stats`/`utils` only (the browser downloads every package).
- **Defaults mean "no effect"**, so adding an argument never changes existing pages.
- **Every change to `popgen/R/` comes with a test** in `popgen/tests/testthat/`.
- R style: snake_case function names, 2-space indent, lecture symbols as argument names (`p0`, `N`, `w11`, `s`, `h`, `u`, `v`, `m`, `pC`, `F`).
- Keep slider-driven calls fast: generations × replicates × scenarios ≲ 100 000.
- Version numbers follow [SemVer](https://semver.org): major = restructured site, minor = new page/feature, patch = fixes/text.

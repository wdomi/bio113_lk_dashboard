# Contributing

Thanks for helping improve the Bio 113 population genetics site. These rules keep the live site working
while several people (or an AI assistant) edit it.

## Workflow

1. **Never push straight to `main`.** `main` is the live site.
2. Create a branch: `git switch -c feature/short-description` (or use RStudio's *Git* pane → *New Branch*).
3. Make your change, then run locally:
   ```bash
   npm test
   quarto render
   ```
4. Commit with a clear message (see below) and push the branch.
5. Open a pull request. The **Check** workflow tests and renders the site. Merge only when it is green.
6. Add a line to `CHANGELOG.md` under *Unreleased*. For design decisions, add an entry to `DEVLOG.md`.

Small text fixes can also be made directly on GitHub (pencil icon or the site's *Seite editieren* link), which creates a branch and PR for you.

## Commit messages

Imperative, short, with a scope prefix:

```
drift: add effective population size slider
engine: fix binomial draw for p close to 1
docs: explain presets in developer guide
config: add preset for worksheet part 3
```

## Where things go

| Change | File(s) |
|---|---|
| Student-facing text, questions | `konzepte/*.qmd`, `index.qmd`, `explorer.qmd`, `glossar.qmd` |
| Equations / model behaviour | `js/popgen/models.js`, `js/popgen/simulate.js` + a test |
| New chart type | `js/popgen/plots.js` |
| Presets / worksheet links | `config/scenarios.json` |
| Colours | `js/popgen/theme.js`, `styles/custom.scss` |
| Navigation, site title | `_quarto.yml` |

## Conventions

- **Language:** student-facing text in German (Swiss spelling: "ss" not "ß"), notation as in the lectures
  (A1/A2, *p*, *q*, *w*₁₁, *s*, *h*, *u*, *v*, *m*, *p*<sub>C</sub>, *F*). Code, comments and docs in English.
- **Engine functions are pure:** they take numbers and return new numbers, without reading the page or changing their inputs.
  This keeps them testable.
- **Defaults mean "no effect"**, so adding a parameter never changes existing pages.
- **Every change to `js/popgen/` comes with a test** in `tests/`.
- Keep pages fast: generations × replicates × scenarios ≲ 1 million rows.
- Version numbers follow [SemVer](https://semver.org): major = restructured site, minor = new page/feature, patch = fixes/text.

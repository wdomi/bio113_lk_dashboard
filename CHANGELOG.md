# Changelog

All notable changes to this site. Format: [Keep a Changelog](https://keepachangelog.com/),
versions: [SemVer](https://semver.org).

## [Unreleased]

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

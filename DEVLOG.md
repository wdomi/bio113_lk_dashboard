# Development log

Why the site is built the way it is, what is still open, and known limitations.
Newest entries on top. Add an entry whenever you make a decision someone might later wonder about.

---

## 2026-10-22 · v0.1.0 · First draft

### Decisions

**Quarto + Observable JS instead of Shiny / Shinylive.**
GitHub Pages only serves static files. Shiny needs a server. Shinylive (R via webR in the browser) works on Pages but
loads tens of MB and takes several seconds to start, which is slow on student phones and on a lecture-hall network.
OJS is built into Quarto, responds instantly, and the simulations are simple enough that JavaScript is no burden.
*Revisit if* the course needs R-specific analysis on the page itself. The CSV download is the bridge to R for now.

**Engine as plain ES modules (`js/popgen/`), charts take `Plot` as an argument.**
This means no build step and no npm dependencies. The same files run in the browser and in Node for tests.
Passing `Plot` in means we use the Plot version bundled with Quarto, and the model files stay testable in Node.

**One shared import list (`_partials/_setup.qmd`).**
OJS does not support `import * as x from …`, so pages import named functions. Keeping the list in one partial means
a new engine function is added in one place.

**Life cycle order: gametes → mutation → migration → zygotes (F) → drift (N) → census → selection.**
Same order as the HHMI tool's description and standard textbook models (Herron & Freeman). Census before selection
means plotted genotype frequencies show the effect of drift and inbreeding directly. Under selection they are the
zygote frequencies, which are in HW proportions when *F* = 0 and *N* = ∞.

**Drift by sampling N diploid individuals (multinomial over genotypes)** rather than 2N gametes.
This lets genotype frequencies themselves drift (and depart from HW in small populations), and it combines naturally with *F*.
The variance of *p* per generation is ≈ *pq*/2N, as in the Wright–Fisher model.

**Normal approximation for large binomial draws** (when the expected count of the rarer outcome is ≥ 30), for speed.
Exact inversion otherwise, so fixation/loss in small populations is exact.

**German student text, lecture notation; English code and docs.**
Matches the lecture slides (Keller, Vorlesungen 7–9: A1/A2, *w*₁₁ = 1, *w*₁₂ = 1 − *hs*, *w*₂₂ = 1 − *s*,
Δ*p* = *v* − *p*(*u*+*v*), *p*<sub>I</sub>′ = (1−*m*)*p*<sub>I</sub> + *m p*<sub>C</sub>).

**Colours:** genotype colours (blue/orange/green) are the first three slots of a colour-blind-validated palette and
mean the same genotype on every page. Replicates share one colour with transparency, because they are not separate categories.

### Sources used
- Lecture slides Bio 113 2025 (Vorlesungen 1–3, 5–9), mainly 7–9 for population genetics.
- HHMI BioInteractive *Population Genetics Explorer*: educator guide and student worksheet (case studies:
  lactase persistence, German shepherd KIT allele, migration *p* = 0.4 / *p*<sub>C</sub> = 0.8, drift table N = 10…10 000,
  bottleneck 25 vs 1000, inbreeding F = 0 / 0.2 / 1).
- Example tools: virtualbiologylab.org, ug.sebc.me/labs/popg, biologysimulations.com.

### Known limitations
- One locus, two alleles only. No linkage, no recombination, no quantitative traits.
- Selection is viability selection only. No fecundity, sexual or frequency-dependent selection.
- No assortative mating (HHMI has it); inbreeding is modelled with a fixed *F*.
- Migration is one-way (continent → island) with a fixed continent frequency.
- Very long runs (e.g. 100 000 generations on the mutation page) are thinned for plotting.

### Ideas / roadmap
- [ ] Assortative mating page (HHMI extension 2).
- [ ] Two-island / stepping-stone migration with drift on both sides.
- [ ] Effective population size *N*<sub>e</sub> (unequal sex ratio, fluctuating N).
- [ ] "Marble" drift demo: draw 20 alleles one by one with animation (HHMI educator demo).
- [ ] Fixation probability of a new mutation (≈ 1/2N neutral, ≈ 2s beneficial).
- [ ] Printable worksheet (PDF) linking to presets; English version via Quarto profiles.
- [ ] Optional Klicker/quiz integration for in-lecture use.

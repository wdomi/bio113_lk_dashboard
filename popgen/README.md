# popgen: the population genetics behind the Bio 113 website

**All equations and simulations of the website live here, in plain R.**
The website runs exactly these files in the students' browser (via webR),
so a change here changes the website after the next push to `main`.

## Use it in RStudio

Open `popgen.Rproj` (this folder), then:

```r
devtools::load_all()          # or: for (f in list.files("R", full.names = TRUE)) source(f)

d <- simulate(N = 50, p0 = 0.5, generations = 100, replicates = 20)
head(d)
summarize_final(d)
matplot(matrix(d$p, ncol = 20), type = "l", lty = 1, ylim = c(0, 1),
        xlab = "Generation", ylab = "p (A)")

simulate(p0 = 0.05, generations = 200, w22 = 0.9)   # lactase case study
hwe_test(2, 3, 1)                                    # lecture example
```

Run the tests with **Build → Test Package** (Ctrl/Cmd + Shift + T) or `devtools::test()`.

## Files

| File | Contents |
|---|---|
| `R/models.R` | the equations: HW, inbreeding F, selection (w or s/h), mutation u/v, migration m, χ² test, equilibria |
| `R/simulate.R` | `simulate()`: the generation loop (mutation → migration → zygotes → drift → selection) and `simulate_scenarios()` |
| `R/stats.R` | summaries (`summarize_final()`, heterozygosity) and the bundled "experiments" the web pages call |
| `tests/testthat/` | checks; run them before pushing |

## Rules that keep the website working

1. **Only base R + `stats`/`utils`.** No other packages: the browser has to download every package.
2. **Return data frames** (or named lists of data frames / single numbers). That is what the website can draw.
3. **Keep argument names** of functions the pages call (`simulate(N =, p0 =, …)`), or update the `.qmd` page too.
   `grep -rn 'R.call("simulate"' ../konzepte ../explorer.qmd` shows where a function is used.
4. **New arguments get a "no effect" default** (e.g. `m = 0`), so existing pages keep working.
5. **Add a test** in `tests/testthat/` for every change.
6. A new `.R` file must also be listed in `../_partials/_setup.qmd`.

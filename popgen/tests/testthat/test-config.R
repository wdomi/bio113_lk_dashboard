# Checks config/scenarios.json so a typo there cannot silently break the Explorer.

test_that("every preset uses known arguments and runs", {
  skip_if_not_installed("jsonlite")
  path <- testthat::test_path("..", "..", "..", "config", "scenarios.json")
  skip_if_not(file.exists(path))
  presets <- jsonlite::fromJSON(path, simplifyVector = FALSE)$scenarios
  known <- names(formals(simulate))
  ids <- vapply(presets, function(s) s$id, character(1))
  expect_false(any(duplicated(ids)))
  for (s in presets) {
    expect_true(all(names(s$params) %in% known), info = s$id)
    d <- do.call(simulate, s$params)
    expect_true(all(d$p >= 0 & d$p <= 1), info = s$id)
  }
})

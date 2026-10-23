# Runs all tests: in RStudio use  testthat::test_dir("popgen/tests/testthat")
# or, from the popgen/ folder,  devtools::test()
library(testthat)
test_check("popgen")

// =============================================================================
// r-bridge.js: runs the R package popgen/ in the browser (webR) for OJS pages
// -----------------------------------------------------------------------------
// All population genetics lives in R (popgen/R/*.R). This file only:
//   1. starts webR (R compiled to WebAssembly) once per page,
//   2. loads the R files,
//   3. lets OJS call R functions with JavaScript values and get back
//      plain JavaScript data (data.frames become arrays of row objects).
//
// Usage on a page (see _partials/_setup.qmd):
//   R = createR([await FileAttachment("/popgen/R/models.R").text(), ...])
//   rows = R.call("simulate", {N: 50, replicates: 20})
//
// You should not need to change this file to change the science.
// =============================================================================

/** webR version served from the official CDN. Change in one place to upgrade. */
export const WEBR_URL = "https://webr.r-wasm.org/v0.6.0/";

// --- JavaScript value -> R source code ---------------------------------------

/** Turn a JavaScript value into R code, e.g. {a: 1, b: [1, 2]} -> list(`a` = 1, `b` = c(1, 2)). */
export function toR(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "NA_real_";
    if (value === Infinity) return "Inf";
    if (value === -Infinity) return "-Inf";
    return String(value);
  }
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    const scalar = value.every((v) => ["number", "string", "boolean"].includes(typeof v));
    return `${scalar ? "c" : "list"}(${value.map(toR).join(", ")})`;
  }
  if (typeof value === "object") return `list(${namedArgs(value)})`;
  throw new Error(`Cannot pass ${typeof value} to R`);
}

const namedArgs = (obj) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `\`${k}\` = ${toR(v)}`)
    .join(", ");

/** R code for calling `fn` with named arguments, e.g. simulate(`N` = 50). */
export const rCall = (fn, args = {}) => `${fn}(${namedArgs(args)})`;

// --- R result -> JavaScript value --------------------------------------------

/**
 * Convert an R object to plain JavaScript:
 * data.frame -> array of row objects; named list -> object; vector of
 * length 1 -> number/string/boolean; longer vector -> array; NULL -> null.
 */
async function toJS(obj) {
  const type = await obj.type();
  if (type === "null") return null;
  const cls = await (await obj.class()).toArray();
  if (cls.includes("data.frame")) return obj.toD3();
  if (type === "list") {
    const names = await obj.names();
    if (!names) throw new Error("R returned an unnamed list; return a named list or data.frame");
    const out = {};
    for (const name of names) out[name] = await toJS(await obj.get(name));
    return out;
  }
  const arr = await obj.toArray();
  return arr.length === 1 ? arr[0] : arr;
}

// --- Starting R ---------------------------------------------------------------

/**
 * Start webR and load R source code.
 * @param {string[]} sources contents of the R files to load (in order)
 * @param {{webrUrl?: string, baseUrl?: string}} [options] where to load webR from
 *   (baseUrl differs from webrUrl only in Node.js tests)
 * @returns {Promise<{call, eval, webR}>}
 */
export async function createR(sources, { webrUrl = WEBR_URL, baseUrl = webrUrl } = {}) {
  const { WebR } = await import(`${webrUrl}webr.mjs`);
  const webR = new WebR({ baseUrl });
  await webR.init();
  for (const src of sources) await webR.evalRVoid(src);

  // R runs one job at a time. When a slider is dragged, many calls with the
  // same `key` pile up; only the newest one is run and earlier callers get
  // its result, so the page never lags behind the slider.
  let queue = Promise.resolve();
  const pending = new Map(); // key -> {code, resolvers: [...]}

  async function run(code) {
    const shelter = await new webR.Shelter();
    try {
      const obj = await shelter.evalR(code);
      return await toJS(obj);
    } finally {
      shelter.purge();
    }
  }

  function evaluate(code, { key } = {}) {
    if (key === undefined) {
      const job = queue.then(() => run(code));
      queue = job.catch(() => {});
      return job;
    }
    return new Promise((resolve, reject) => {
      const entry = pending.get(key);
      if (entry) {
        entry.code = code;
        entry.resolvers.push({ resolve, reject });
        return;
      }
      const fresh = { code, resolvers: [{ resolve, reject }] };
      pending.set(key, fresh);
      const job = queue.then(async () => {
        pending.delete(key);
        try {
          const result = await run(fresh.code);
          fresh.resolvers.forEach((r) => r.resolve(result));
        } catch (e) {
          fresh.resolvers.forEach((r) => r.reject(e));
        }
      });
      queue = job.catch(() => {});
    });
  }

  return {
    webR,
    /** Call an R function with named arguments: R.call("simulate", {N: 50}). */
    call: (fn, args = {}, options) => evaluate(rCall(fn, args), options),
    /** Evaluate any R code and return the result: R.eval("hw_curves()"). */
    eval: (code, options) => evaluate(code, options),
  };
}

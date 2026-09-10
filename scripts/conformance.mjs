/*
 * Golden-HTML conformance harness.
 *
 * Generates one case per variant combination from the component
 * manifests, renders each with the reference renderer, and stores the
 * result in fixtures/ as the golden markup.
 *
 * Every emitter — React, the plain-HTML reference, and later the Razor,
 * Django, Blade and WordPress adapters — is then checked against those
 * goldens. Comparison is DOM equivalence, so attribute and class order
 * may differ; anything else is a real divergence and fails the build.
 *
 * Usage:
 *   node scripts/conformance.mjs            # verify against goldens
 *   node scripts/conformance.mjs --update   # regenerate goldens
 *
 * Regenerating is a deliberate act that shows up in review as a diff of
 * the markup contract, which is exactly where a breaking change to the
 * public HTML should be visible.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadManifests, createRenderer, isEquivalent, normalizeHtml } from "../packages/manifest/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const FIXTURES_DIR = join(here, "..", "fixtures");

/*
 * Cases come from the manifest's declared examples.
 *
 * Explicit rather than generated: every golden case has a meaningful
 * name, examples double as the documentation, and reviewers see exactly
 * what is covered. Coverage is not left to trust — a test asserts that
 * every declared variant value appears in at least one example.
 */
export function casesFor(manifest) {
  return Object.entries(manifest.examples || {}).map(([name, props]) => ({ name, props }));
}

/*
 * Every variant value a manifest declares must appear in some example,
 * otherwise it ships with no golden markup and no adapter is ever
 * checked against it.
 */
export function uncoveredVariants(manifest) {
  const missing = [];
  const examples = Object.values(manifest.examples || {});

  for (const [key, values] of Object.entries(manifest.variants || {})) {
    const seen = new Set();
    for (const props of examples) {
      const value = props[key] === undefined ? (manifest.defaults || {})[key] : props[key];
      if (value !== undefined) seen.add(value);
    }
    for (const value of values) {
      if (!seen.has(value)) missing.push(manifest.name + "." + key + " = " + value);
    }
  }
  return missing;
}

/** Render every case for every component with the reference renderer. */
export function referenceMarkup(manifests = loadManifests()) {
  const render = createRenderer(manifests);
  const output = {};
  for (const [name, manifest] of Object.entries(manifests)) {
    output[name] = casesFor(manifest).map((testCase) => ({
      name: testCase.name,
      props: testCase.props,
      html: render(name, testCase.props),
    }));
  }
  return output;
}

function fixturePath(component) {
  return join(FIXTURES_DIR, component + ".html");
}

function serialize(component, cases) {
  const lines = [
    "<!--",
    "  GOV UI golden markup: " + component,
    "",
    "  Generated from packages/manifest/components/" + component + ".json",
    "  by scripts/conformance.mjs. Do not edit by hand.",
    "",
    "  This is the markup contract. Every emitter must produce DOM",
    "  equivalent to what is below.",
    "-->",
    "",
  ];
  for (const testCase of cases) {
    lines.push("<!-- case: " + testCase.name + " -->");
    lines.push(testCase.html);
    lines.push("");
  }
  return lines.join("\n");
}

/** Parse a golden file back into cases, keyed by case name. */
export function readGolden(component) {
  const file = fixturePath(component);
  if (!existsSync(file)) return null;
  const text = readFileSync(file, "utf8");
  const cases = {};
  const pattern = /<!-- case: (.+?) -->\n(.+)/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    cases[match[1]] = match[2].trim();
  }
  return cases;
}

export function updateGoldens() {
  mkdirSync(FIXTURES_DIR, { recursive: true });
  const rendered = referenceMarkup();
  let count = 0;
  for (const [component, cases] of Object.entries(rendered)) {
    writeFileSync(fixturePath(component), serialize(component, cases));
    count += cases.length;
  }
  return { components: Object.keys(rendered).length, cases: count };
}

/*
 * Check one emitter against the goldens.
 *
 * `emit` receives (componentName, props) and returns a markup string.
 * Adapters that cannot run in Node — Razor, Blade — dump their rendered
 * output to a file in CI, and that file is fed through here instead.
 */
export function checkEmitter(emitterName, emit, manifests = loadManifests()) {
  const failures = [];
  for (const [component, manifest] of Object.entries(manifests)) {
    const golden = readGolden(component);
    if (!golden) {
      failures.push({ component, case: "*", reason: "no golden fixture; run with --update" });
      continue;
    }
    for (const testCase of casesFor(manifest)) {
      const expected = golden[testCase.name];
      if (expected === undefined) {
        failures.push({ component, case: testCase.name, reason: "case missing from golden" });
        continue;
      }
      let actual;
      try {
        actual = emit(component, testCase.props);
      } catch (error) {
        failures.push({ component, case: testCase.name, reason: "emitter threw: " + error.message });
        continue;
      }
      if (!isEquivalent(actual, expected)) {
        failures.push({
          component,
          case: testCase.name,
          reason: "markup diverged",
          expected: normalizeHtml(expected),
          actual: normalizeHtml(actual),
        });
      }
    }
  }
  return { emitter: emitterName, failures };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--update")) {
    const { components, cases } = updateGoldens();
    console.log("wrote " + cases + " golden case(s) across " + components + " component(s)");
    process.exit(0);
  }

  const manifests = loadManifests();
  // The reference renderer is itself an emitter, which verifies that the
  // goldens on disk still match the manifests that produced them.
  const render = createRenderer(manifests);
  const result = checkEmitter("reference", render, manifests);

  if (result.failures.length === 0) {
    const total = Object.values(referenceMarkup(manifests)).reduce((n, c) => n + c.length, 0);
    console.log("conformance: " + total + " case(s) match the golden markup");
    process.exit(0);
  }

  for (const failure of result.failures) {
    console.error("FAIL " + failure.component + " / " + failure.case + ": " + failure.reason);
    if (failure.expected) {
      console.error("  expected: " + failure.expected);
      console.error("  actual:   " + failure.actual);
    }
  }
  process.exit(1);
}

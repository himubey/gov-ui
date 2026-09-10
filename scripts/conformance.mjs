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
import { loadManifests, renderToHtml, isEquivalent, normalizeHtml } from "../packages/manifest/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const FIXTURES_DIR = join(here, "..", "fixtures");

/*
 * Build the case list for a component: every combination of its declared
 * variants, plus the defaults-only case.
 *
 * Exhaustive combinations are affordable because the manifests keep
 * variant lists deliberately short. If a component ever produces an
 * unreasonable number of cases, that is a signal its API is too large
 * (see CLAUDE.md section 3).
 */
export function casesFor(manifest) {
  const variants = manifest.variants || {};
  const keys = Object.keys(variants);

  let combinations = [{}];
  for (const key of keys) {
    const next = [];
    for (const combo of combinations) {
      for (const value of variants[key]) {
        next.push({ ...combo, [key]: value });
      }
    }
    combinations = next;
  }

  const label = (props) =>
    keys.length === 0 ? "default" : keys.map((k) => k + "-" + props[k]).join("_");

  const cases = combinations.map((props) => ({
    name: label(props),
    props: { ...props, children: sampleContent(manifest) },
  }));

  // Defaults-only: proves the manifest's declared defaults are applied.
  cases.unshift({
    name: "defaults",
    props: { children: sampleContent(manifest) },
  });

  return cases;
}

function sampleContent(manifest) {
  const summary = (manifest.docs && manifest.docs.summary) || "";
  return summary.includes("action") ? "Save" : "Example";
}

/** Render every case for every component with the reference renderer. */
export function referenceMarkup(manifests = loadManifests()) {
  const output = {};
  for (const [name, manifest] of Object.entries(manifests)) {
    output[name] = casesFor(manifest).map((testCase) => ({
      name: testCase.name,
      props: testCase.props,
      html: renderToHtml(manifest, testCase.props),
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
  const result = checkEmitter("reference", (name, props) => renderToHtml(manifests[name], props), manifests);

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

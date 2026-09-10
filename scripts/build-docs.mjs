/*
 * Generates component documentation from the manifests.
 *
 * Documentation is part of the product (spec section 16), and
 * hand-written component docs rot: the props change, the class names
 * change, the HTML example keeps showing markup that has not shipped for
 * six months.
 *
 * Everything here already exists in the manifest and the golden
 * fixtures, so generating the pages means they cannot drift. The parts a
 * generator cannot write — why a component exists, when not to use it —
 * live in the manifest's `docs` and `a11y` blocks, where they are
 * reviewed alongside the markup they describe.
 *
 *   node scripts/build-docs.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadManifests } from "../packages/manifest/index.mjs";
import { readGolden } from "./conformance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "docs", "components");

function titleCase(name) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function page(name, manifest, golden) {
  const docs = manifest.docs || {};
  const a11y = manifest.a11y || {};
  const lines = [];

  lines.push("# " + titleCase(name));
  lines.push("");
  if (docs.summary) {
    lines.push(docs.summary);
    lines.push("");
  }
  lines.push("> Generated from `packages/manifest/components/" + name + ".json`.");
  lines.push("> Edit the manifest, not this file.");
  lines.push("");

  if (docs.whenToUse && docs.whenToUse.length) {
    lines.push("## When to use");
    lines.push("");
    for (const item of docs.whenToUse) lines.push("- " + item);
    lines.push("");
  }

  if (docs.whenNotToUse && docs.whenNotToUse.length) {
    lines.push("## When not to use");
    lines.push("");
    for (const item of docs.whenNotToUse) lines.push("- " + item);
    lines.push("");
  }

  if (manifest.variants && Object.keys(manifest.variants).length) {
    lines.push("## Variants");
    lines.push("");
    lines.push("| Prop | Values | Default |");
    lines.push("|---|---|---|");
    for (const [key, values] of Object.entries(manifest.variants)) {
      const fallback = (manifest.defaults || {})[key];
      lines.push(
        "| `" + key + "` | " + values.map((v) => "`" + v + "`").join(", ") + " | " +
          (fallback ? "`" + fallback + "`" : "—") + " |",
      );
    }
    lines.push("");
  }

  lines.push("## Accessibility");
  lines.push("");
  if (a11y.accessibleName) {
    lines.push("**Accessible name.** " + a11y.accessibleName);
    lines.push("");
  }
  if (a11y.keyboard && Object.keys(a11y.keyboard).length) {
    lines.push("| Key | Behavior |");
    lines.push("|---|---|");
    for (const [key, behavior] of Object.entries(a11y.keyboard)) {
      lines.push("| <kbd>" + key + "</kbd> | " + behavior + " |");
    }
    lines.push("");
  }
  for (const note of a11y.notes || []) {
    lines.push("- " + note);
  }
  lines.push("");

  lines.push("## Class names");
  lines.push("");
  lines.push("| Role | Class |");
  lines.push("|---|---|");
  for (const [role, value] of Object.entries(manifest.classes)) {
    lines.push("| `" + role + "` | `." + value + "` |");
  }
  lines.push("");

  lines.push("## Examples");
  lines.push("");
  lines.push("Each example below is a conformance case: every emitter — React and, in");
  lines.push("time, each framework adapter — is checked against exactly this markup.");
  lines.push("");
  for (const [caseName, props] of Object.entries(manifest.examples)) {
    lines.push("### " + caseName);
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(props, null, 2));
    lines.push("```");
    lines.push("");
    if (golden && golden[caseName]) {
      lines.push("```html");
      lines.push(golden[caseName]);
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

function indexPage(manifests) {
  const lines = [
    "# Components",
    "",
    "The v0.1 component set. Every page is generated from the markup",
    "contract in `packages/manifest/components/`, so it describes what",
    "actually ships.",
    "",
    "| Component | Summary |",
    "|---|---|",
  ];
  for (const [name, manifest] of Object.entries(manifests)) {
    const summary = (manifest.docs || {}).summary || "";
    lines.push("| [" + titleCase(name) + "](" + name + ".md) | " + summary + " |");
  }
  lines.push("");
  return lines.join("\n");
}

const manifests = loadManifests();
mkdirSync(OUT, { recursive: true });

for (const [name, manifest] of Object.entries(manifests)) {
  writeFileSync(join(OUT, name + ".md"), page(name, manifest, readGolden(name)) + "\n");
}
writeFileSync(join(OUT, "README.md"), indexPage(manifests) + "\n");

console.log("docs: " + Object.keys(manifests).length + " component page(s) written to docs/components/");

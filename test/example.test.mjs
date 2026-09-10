/*
 * The plain-HTML example is a claim, so it is tested like one.
 *
 * Two things are being verified:
 *
 * 1. The page needs no application CSS. Any style block, inline style or
 *    non-GOV class would mean the design system has a gap that the page
 *    is quietly papering over — and a gap nobody would notice until a
 *    real consumer hit it.
 *
 * 2. Every class it uses actually exists in the built stylesheet. A
 *    typo like `gov-buton` is invisible in a browser (the element just
 *    renders unstyled) and this is the cheapest place to catch it.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadManifests } from "../packages/manifest/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const source = readFileSync(join(root, "examples/html/employees.html"), "utf8");

// Comments explain the page and legitimately mention things like style
// blocks. Scan the markup, not the prose about it.
const html = source.replace(/<!--[\s\S]*?-->/g, "");
const css = readFileSync(join(root, "packages/css/dist/gov-ui.css"), "utf8");

/** Every class token used in the page. */
function usedClasses(source) {
  const found = new Set();
  for (const match of source.matchAll(/class="([^"]*)"/g)) {
    for (const token of match[1].trim().split(/\s+/)) {
      if (token) found.add(token);
    }
  }
  return found;
}

/** Every class selector defined in the stylesheet. */
function definedClasses(stylesheet) {
  const found = new Set();
  for (const match of stylesheet.matchAll(/\.(gov-[\w-]+)/g)) {
    found.add(match[1]);
  }
  return found;
}

/*
 * Class names declared in the markup contract.
 *
 * A contract class with no styles is legitimate — it is a hook for
 * consumers, and structural elements do not always need rules. A class
 * in neither the stylesheet nor a manifest is a typo.
 */
function contractClasses() {
  const found = new Set();
  for (const manifest of Object.values(loadManifests())) {
    for (const value of Object.values(manifest.classes)) {
      // Variant patterns carry a {placeholder}; expand them.
      if (value.includes("{")) {
        const key = value.slice(value.indexOf("{") + 1, value.indexOf("}"));
        for (const variant of (manifest.variants || {})[key] || []) {
          found.add(value.replace("{" + key + "}", variant));
        }
      } else {
        found.add(value);
      }
    }
  }
  found.add("gov-visually-hidden");
  found.add("gov-tabular");
  return found;
}

describe("plain-HTML example", () => {
  test("uses no style block", () => {
    assert.ok(!/<style[\s>]/i.test(html), "the example must not need its own CSS");
  });

  test("uses no inline styles", () => {
    assert.ok(!/\sstyle="/i.test(html), "the example must not need inline styles");
  });

  test("uses only GOV UI classes", () => {
    const foreign = [...usedClasses(html)].filter((name) => !name.startsWith("gov-"));
    assert.deepEqual(
      foreign,
      [],
      "non-GOV classes in the example mean the design system has a gap: " + foreign.join(", "),
    );
  });

  test("every class it uses is real", () => {
    const known = new Set([...definedClasses(css), ...contractClasses()]);
    const unknown = [...usedClasses(html)].filter((name) => !known.has(name));
    assert.deepEqual(
      unknown,
      [],
      "classes in neither the stylesheet nor the markup contract (likely a typo): " + unknown.join(", "),
    );
  });

  test("links the stylesheet and the behavior bundle directly", () => {
    // The no-build-step claim. If these ever become a bundler entry
    // point, the claim has quietly stopped being true.
    assert.match(html, /<link rel="stylesheet" href="[^"]*gov-ui\.css">/);
    assert.match(html, /<script src="[^"]*gov-ui\.js" defer><\/script>/);
  });

  test("works without JavaScript", () => {
    // Every v0.1 component is plain semantic HTML. Nothing on the page
    // may depend on script to render or to function, and filtering has
    // to be a real form submission.
    assert.ok(!/onclick=|onchange=|onsubmit=/i.test(html), "no inline event handlers");
    assert.match(html, /<form class="gov-toolbar" method="get"/, "filters must submit without script");
    assert.match(html, /type="submit"/, "the filter form needs a real submit control");
  });

  test("declares a language", () => {
    // Screen readers pick pronunciation from this, and it is a WCAG
    // 2.2 Level A requirement (SC 3.1.1).
    assert.match(html, /<html lang="[a-z-]+"/);
  });

  test("every table header carries a scope", () => {
    const headers = html.match(/<th[\s>][^>]*>/g) || [];
    assert.ok(headers.length > 0);
    for (const header of headers) {
      assert.match(header, /scope="col"/, "header without scope: " + header);
    }
  });

  test("the table has a caption and a focusable scroll region", () => {
    assert.match(html, /<caption[^>]*>/, "a table needs a caption");
    assert.match(html, /class="gov-table-wrapper" tabindex="0"/, "the scroll region must be focusable");
  });

  test("every form control has a label", () => {
    const ids = [...html.matchAll(/<(?:input|select)[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(ids.length > 0);
    for (const id of ids) {
      assert.ok(
        html.includes('for="' + id + '"'),
        "control #" + id + " has no label. Placeholder text is not a label.",
      );
    }
  });

  test("status is never conveyed by color alone", () => {
    // Every badge must carry readable text.
    for (const match of html.matchAll(/<span class="gov-status[^"]*">([^<]*)<\/span>/g)) {
      assert.ok(match[1].trim().length > 0, "a status badge with no text label");
    }
  });
});

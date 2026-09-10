/*
 * Foundation tests.
 *
 * Runs on Node's built-in test runner, so the foundation verifies itself
 * with no devDependencies at all. That is not a stunt: a zero-dependency
 * library whose own test setup pulls in three hundred packages has moved
 * the supply-chain problem rather than solved it.
 *
 *   node --test test/
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { run as runContrast, contrast, readTokens } from "../scripts/check-contrast.mjs";
import {
  loadManifests,
  createRenderer,
  renderToHtml,
  resolveClasses,
  normalizeHtml,
  isEquivalent,
  escapeHtml,
  validateManifest,
} from "../packages/manifest/index.mjs";
import { checkEmitter, casesFor, readGolden, uncoveredVariants } from "../scripts/conformance.mjs";

describe("color tokens", () => {
  test("every declared pair meets its WCAG minimum", () => {
    const failures = runContrast().filter((r) => !r.pass);
    const detail = failures
      .map((f) => f.label + " " + f.ratio.toFixed(2) + ":1 (min " + f.min + ")")
      .join("; ");
    assert.equal(failures.length, 0, "contrast failures: " + detail);
  });

  test("contrast math matches known reference values", () => {
    // Black on white is the definitional maximum of 21:1.
    assert.equal(Math.round(contrast("#000000", "#ffffff")), 21);
    // A color against itself is 1:1.
    assert.equal(contrast("#0b2a55", "#0b2a55"), 1);
    // #767676 is the canonical smallest grey passing 4.5:1 on white.
    assert.ok(contrast("#767676", "#ffffff") >= 4.5);
  });

  test("the decorative border is deliberately NOT used for control edges", () => {
    // --gov-border is too light to satisfy SC 1.4.11. This test exists so
    // that anyone tempted to collapse the two border tokens into one
    // finds out why they are separate.
    const tokens = readTokens();
    assert.ok(
      contrast(tokens["--gov-border"], tokens["--gov-background"]) < 3,
      "--gov-border is decorative; if it now passes 3:1 the token split may be redundant",
    );
    assert.ok(
      contrast(tokens["--gov-border-strong"], tokens["--gov-background"]) >= 3,
      "--gov-border-strong must satisfy non-text contrast",
    );
  });

  test("line-height floor protects Indic scripts", () => {
    const tokens = new URL("../packages/css/src/tokens.css", import.meta.url);
    const text = readFileSync(tokens, "utf8");
    const match = text.match(/--gov-line-height-tight:\s*([\d.]+)/);
    assert.ok(match, "--gov-line-height-tight must be defined");
    assert.ok(
      Number(match[1]) >= 1.4,
      "tight line-height must stay at or above 1.4 so Devanagari matras are not clipped",
    );
  });
});

describe("manifest", () => {
  const manifests = loadManifests();

  test("loads at least one component", () => {
    assert.ok(Object.keys(manifests).length > 0);
  });

  test("rejects a manifest without a gov- prefixed base class", () => {
    assert.throws(
      () => validateManifest({ name: "x", element: "div", classes: { base: "btn" } }, "x"),
      /gov- prefix/,
    );
  });

  test("rejects a manifest missing required keys", () => {
    assert.throws(() => validateManifest({ name: "x" }, "x"), /missing required key/);
  });

  test("applies declared defaults", () => {
    const classes = resolveClasses(manifests.button, {});
    assert.deepEqual(classes, ["gov-button", "gov-button--primary", "gov-button--md"]);
  });

  test("rejects a variant value the manifest does not declare", () => {
    assert.throws(
      () => renderToHtml(manifests.button, { variant: "chartreuse" }),
      /is not a valid variant/,
    );
  });

  test("escapes text content", () => {
    const html = renderToHtml(manifests.button, { children: '<img src=x onerror="alert(1)">' });
    assert.ok(!html.includes("<img"), "markup must not carry through raw HTML");
    assert.ok(html.includes("&lt;img"));
  });

  test("escapes attribute values", () => {
    const html = renderToHtml(manifests.button, {
      attributes: { "aria-label": 'say "hello" & <goodbye>' },
      children: "x",
    });
    assert.ok(html.includes("&quot;hello&quot;"));
    assert.ok(html.includes("&amp;"));
    assert.ok(!html.includes("<goodbye>"));
  });

  test("escapeHtml covers every dangerous character", () => {
    assert.equal(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
  });

  test("caller attributes override manifest defaults", () => {
    const html = renderToHtml(manifests.button, {
      attributes: { type: "submit" },
      children: "Save",
    });
    assert.ok(html.includes('type="submit"'));
    assert.ok(!html.includes('type="button"'));
  });

  test("boolean attributes render bare, false attributes are dropped", () => {
    const on = renderToHtml(manifests.button, { attributes: { disabled: true }, children: "x" });
    assert.ok(/\sdisabled(\s|>)/.test(on));
    const off = renderToHtml(manifests.button, { attributes: { disabled: false }, children: "x" });
    assert.ok(!off.includes("disabled"));
  });
});

describe("markup normalization", () => {
  test("attribute order does not matter", () => {
    assert.ok(isEquivalent('<button type="button" class="a">x</button>', '<button class="a" type="button">x</button>'));
  });

  test("class order does not matter", () => {
    assert.ok(isEquivalent('<i class="a b c"></i>', '<i class="c a b"></i>'));
  });

  test("insignificant whitespace does not matter", () => {
    assert.ok(isEquivalent("<p>  <b>x</b>  </p>", "<p><b>x</b></p>"));
  });

  test("tag case does not matter", () => {
    assert.ok(isEquivalent("<BUTTON>x</BUTTON>", "<button>x</button>"));
  });

  test("a different class IS a divergence", () => {
    assert.ok(!isEquivalent('<i class="a b"></i>', '<i class="a c"></i>'));
  });

  test("a missing attribute IS a divergence", () => {
    assert.ok(!isEquivalent('<button type="button">x</button>', "<button>x</button>"));
  });

  test("different text content IS a divergence", () => {
    assert.ok(!isEquivalent("<b>Save</b>", "<b>Cancel</b>"));
  });

  test("a different element IS a divergence", () => {
    assert.ok(!isEquivalent('<a class="gov-button">x</a>', '<button class="gov-button">x</button>'));
  });
});

describe("conformance harness", () => {
  const manifests = loadManifests();

  test("golden fixtures exist for every component", () => {
    for (const name of Object.keys(manifests)) {
      assert.ok(readGolden(name), "missing golden fixture for " + name);
    }
  });

  test("the reference renderer matches the goldens on disk", () => {
    const result = checkEmitter("reference", createRenderer(manifests), manifests);
    assert.equal(result.failures.length, 0, JSON.stringify(result.failures, null, 2));
  });

  test("cases come from the manifest's declared examples", () => {
    const cases = casesFor(manifests.button).map((c) => c.name);
    assert.deepEqual(cases, Object.keys(manifests.button.examples));
  });

  test("every declared variant value is covered by an example", () => {
    const missing = Object.values(manifests).flatMap(uncoveredVariants);
    assert.deepEqual(missing, []);
  });

  test("every component declares at least one example", () => {
    // validateManifest enforces this at load time; asserting it here
    // means the rule is visible where the cases are defined.
    for (const [name, manifest] of Object.entries(manifests)) {
      assert.ok(Object.keys(manifest.examples).length > 0, name + " has no examples");
    }
  });

  /*
   * The point of the harness is catching a divergent emitter. These two
   * tests are the ones that prove the gate actually closes — without
   * them, a harness that silently passed everything would look healthy.
   */
  test("catches an emitter that drops a class", () => {
    const result = checkEmitter(
      "broken-classes",
      (name, props) => createRenderer(manifests)(name, props).replace(" gov-button--md", ""),
      manifests,
    );
    assert.ok(result.failures.length > 0, "a dropped class must fail conformance");
    assert.equal(result.failures[0].reason, "markup diverged");
  });

  test("catches an emitter that uses the wrong element", () => {
    const result = checkEmitter(
      "broken-element",
      (name, props) => createRenderer(manifests)(name, props).replace(/<table/g, "<div"),
      manifests,
    );
    assert.ok(result.failures.length > 0, "a wrong element must fail conformance");
  });

  test("catches an emitter that throws", () => {
    const result = checkEmitter("broken-throws", () => {
      throw new Error("nope");
    }, manifests);
    assert.ok(result.failures.length > 0);
    assert.match(result.failures[0].reason, /emitter threw/);
  });
});

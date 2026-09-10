/*
 * Tests the built UMD bundle, not the source.
 *
 * What ships is dist/gov-ui.js, so that is what is exercised here —
 * including the UMD wrapper itself, which is the part a WordPress theme
 * or a Razor page depends on.
 *
 * The DOM is stubbed rather than emulated. Pulling in jsdom to test a
 * zero-dependency library would undercut the reason the library has no
 * dependencies; the registry only needs querySelectorAll and
 * getAttribute, so those are all that is provided.
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const GovUI = require("../packages/core/dist/gov-ui.js");

function element(moduleNames) {
  return {
    attributes: { "data-gov-module": moduleNames },
    getAttribute(name) {
      return this.attributes[name];
    },
  };
}

function root(elements) {
  return {
    querySelectorAll(selector) {
      assert.equal(selector, "[data-gov-module]");
      return elements;
    },
  };
}

describe("core registry", () => {
  beforeEach(() => GovUI.reset());

  test("the UMD bundle exports the expected surface", () => {
    assert.equal(typeof GovUI.register, "function");
    assert.equal(typeof GovUI.init, "function");
    assert.equal(typeof GovUI.registered, "function");
  });

  test("registers and initializes a module", () => {
    const seen = [];
    GovUI.register("demo", (el) => seen.push(el));

    const el = element("demo");
    GovUI.init(root([el]));

    assert.deepEqual(seen, [el]);
    assert.deepEqual(GovUI.registered(), ["demo"]);
  });

  test("initialization is idempotent", () => {
    let calls = 0;
    GovUI.register("demo", () => calls++);

    const el = element("demo");
    const scope = root([el]);

    GovUI.init(scope);
    GovUI.init(scope);
    GovUI.init(scope);

    // Content-managed pages re-render fragments constantly. Re-running
    // init must upgrade only what is new.
    assert.equal(calls, 1, "a module must initialize an element at most once");
  });

  test("one element can carry several modules", () => {
    const seen = [];
    GovUI.register("a", () => seen.push("a"));
    GovUI.register("b", () => seen.push("b"));

    GovUI.init(root([element("a b")]));

    assert.deepEqual(seen.sort(), ["a", "b"]);
  });

  test("unknown modules are ignored rather than throwing", () => {
    // Progressive enhancement: markup for a component whose behavior was
    // not shipped in this build must still render and stay usable.
    assert.doesNotThrow(() => GovUI.init(root([element("not-shipped")])));
  });

  test("an empty or whitespace-only attribute is harmless", () => {
    assert.doesNotThrow(() => GovUI.init(root([element("")])));
    assert.doesNotThrow(() => GovUI.init(root([element("   ")])));
  });

  test("bookkeeping does not leak into the DOM", () => {
    // Anything written as an attribute would show up as a diff against
    // the golden markup and break adapter conformance.
    GovUI.register("demo", () => {});
    const el = element("demo");
    GovUI.init(root([el]));

    assert.deepEqual(Object.keys(el.attributes), ["data-gov-module"]);
    assert.ok(!Object.keys(el).includes("govUiApplied"), "internal state must be non-enumerable");
  });

  test("rejects an invalid registration", () => {
    assert.throws(() => GovUI.register("", () => {}), /non-empty string/);
    assert.throws(() => GovUI.register("x", "not a function"), /must be a function/);
  });
});

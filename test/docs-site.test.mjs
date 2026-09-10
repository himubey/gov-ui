/*
 * The documentation site is the design system's first real consumer, so
 * anything awkward in it is a finding rather than a nuisance.
 *
 * These tests cover three things the site claims:
 *
 *   1. It carries no official insignia and states the disclaimer. This
 *      is the project's own rule (CLAUDE.md section 46) and the one with
 *      actual legal exposure — a site that looks government-endorsed is
 *      a problem regardless of what the footer says.
 *   2. It is accessible in the ways a generator can get wrong: language,
 *      skip link, one h1, no skipped heading levels, labelled controls.
 *   3. Its live examples are the golden markup. A documentation site
 *      showing markup that has not shipped is worse than none.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadManifests } from "../packages/manifest/index.mjs";
import { readGolden } from "../scripts/conformance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, "..", "apps", "docs", "dist");

const built = existsSync(DIST);
const pages = built ? readdirSync(DIST).filter((f) => f.endsWith(".html")) : [];

function read(page) {
  return readFileSync(join(DIST, page), "utf8");
}

function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

describe("documentation site", () => {
  test("is built", () => {
    assert.ok(built, "run `npm run build:docs` first");
    assert.ok(pages.length >= 14, "expected a page per component plus the guides");
  });

  describe("branding and legal", () => {
    for (const page of pages) {
      test(page + " carries no official insignia", () => {
        // The disclaimer legitimately names the things it disclaims, so
        // scan everything except the disclaimer itself.
        const html = read(page)
          .replace(/<p class="docs-footer__note">[\s\S]*?<\/p>/, "")
          .toLowerCase();
        // Cheap but load-bearing. The State Emblem of India is restricted
        // under the 2005 Act, and GOV.UK prohibits non-government use of
        // the crown. Neither belongs in an independent project.
        for (const term of ["crown copyright", "royal-arms", "ogl", "state emblem", "ashoka"]) {
          assert.ok(!html.includes(term), page + " references " + term);
        }
      });

      test(page + " states the disclaimer", () => {
        assert.match(
          read(page),
          /Not affiliated with, or endorsed by, any government/,
          "every page needs the disclaimer, not just the landing page",
        );
      });
    }
  });

  describe("accessibility", () => {
    for (const page of pages) {
      const html = stripComments(read(page));

      test(page + " declares a language", () => {
        // WCAG 2.2 SC 3.1.1, and how a screen reader picks pronunciation.
        assert.match(html, /<html lang="[a-z-]+"/);
      });

      test(page + " has a skip link as the first focusable element", () => {
        const firstAnchor = html.match(/<a\s[^>]*>/);
        assert.ok(firstAnchor, "no links on the page");
        assert.match(
          firstAnchor[0],
          /href="#main"/,
          "the skip link must be the first link, or a keyboard user tabs through the whole nav first",
        );
        assert.match(html, /<main[^>]+id="main"/, "the skip link needs a target");
      });

      test(page + " has exactly one h1", () => {
        const count = (html.match(/<h1[\s>]/g) || []).length;
        assert.equal(count, 1, "found " + count + " h1 elements");
      });

      test(page + " does not skip heading levels", () => {
        // A jump from h1 to h3 breaks the outline screen reader users
        // navigate by. The sidebar's h2 group headings are part of this
        // sequence too, which is why they are h2 and not styled divs.
        const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
        let previous = levels[0];
        for (const level of levels.slice(1)) {
          assert.ok(
            level <= previous + 1,
            "heading jumped from h" + previous + " to h" + level + " in " + page,
          );
          previous = level;
        }
      });

      test(page + " labels every form control", () => {
        const ids = [...html.matchAll(/<(?:input|select)[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
        for (const id of ids) {
          assert.ok(html.includes('for="' + id + '"'), "control #" + id + " has no label");
        }
      });

      test(page + " labels every nav landmark", () => {
        // A page with several nav landmarks and no labels announces
        // "navigation" repeatedly, which helps nobody.
        for (const nav of html.match(/<nav[^>]*>/g) || []) {
          assert.match(nav, /aria-label="/, "unlabelled nav landmark: " + nav);
        }
      });
    }
  });

  describe("progressive enhancement", () => {
    test("search is hidden until its script runs", () => {
      // A search box that is present but silently does nothing is worse
      // than no search box.
      assert.match(read("index.html"), /<form class="docs-search" data-docs-search hidden/);
    });

    test("the site is readable with no JavaScript", () => {
      const html = stripComments(read("button.html"));
      // Nothing on the page may depend on script to render. The only
      // inline handler permitted is the search form's submit guard,
      // which is inert when the field is hidden.
      const handlers = html.match(/\son(?:click|change|load|input)=/g) || [];
      assert.deepEqual(handlers, [], "no inline event handlers");
      assert.ok(html.includes("<h1>Button</h1>"), "content is in the HTML, not built by script");
    });
  });

  describe("links", () => {
    test("every internal link resolves", () => {
      const available = new Set(readdirSync(DIST));
      const broken = [];

      for (const page of pages) {
        // Strip the rendered specimens first. A Breadcrumb example
        // legitimately links to "/" and a Pagination example to
        // "?page=2"; those are demonstration content, not navigation
        // this site is expected to resolve.
        const navigable = read(page)
          .replace(/<div class="docs-example__preview">[\s\S]*?<\/div>\n/g, "")
          .replace(/<iframe[\s\S]*?<\/iframe>/g, "");

        for (const match of navigable.matchAll(/href="([^"#][^"]*)"/g)) {
          const href = match[1];
          if (/^(https?:|mailto:)/.test(href)) continue;
          const target = href.split("#")[0];
          if (target && !available.has(target)) broken.push(page + " -> " + href);
        }
      }

      assert.deepEqual(broken, [], "broken internal links: " + broken.join(", "));
    });

    test("ships the built assets it links", () => {
      // The site links the stylesheet and script the same way a consumer
      // does. If these are missing the page still renders, unstyled,
      // which is exactly the failure nobody notices in review.
      for (const asset of ["gov-ui.css", "gov-ui.js", "docs.css", "search.js"]) {
        assert.ok(existsSync(join(DIST, asset)), "missing asset: " + asset);
      }
    });
  });

  describe("examples are the contract", () => {
    const manifests = loadManifests();

    for (const [name, manifest] of Object.entries(manifests)) {
      test(name + " renders its golden markup", () => {
        const html = read(name + ".html");
        const golden = readGolden(name);

        for (const caseName of Object.keys(manifest.examples)) {
          const markup = golden[caseName];
          assert.ok(markup, "no golden case " + caseName);

          // A specimen appears either inline, or escaped inside an
          // iframe srcdoc when it renders its own heading. Both are the
          // golden string; only the presentation differs.
          const escaped = markup
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

          assert.ok(
            html.includes(markup) || html.includes(escaped),
            name + "/" + caseName + ": the page must render the golden markup verbatim, " +
              "so documentation cannot show markup that has not shipped",
          );
        }
      });
    }

    test("every component has a page", () => {
      for (const name of Object.keys(manifests)) {
        assert.ok(pages.includes(name + ".html"), "no page for " + name);
      }
    });
  });

  describe("dogfooding", () => {
    test("the site uses GOV UI components, not lookalikes", () => {
      // The docs shell needs its own layout CSS, but anything the design
      // system already provides must come from it. If the site starts
      // reimplementing tables or fields, that is a gap worth finding.
      const html = read("install.html");
      assert.match(html, /class="gov-table"/, "tables should be GOV UI tables");
      assert.match(read("index.html"), /class="gov-visually-hidden"/);
    });

    test("every token the docs shell references exists", () => {
      // A typo in a var() name fails silently: the property is simply
      // dropped and the page renders slightly wrong in a way nobody
      // notices in review.
      const tokens = new Set(
        [...readFileSync(join(here, "..", "packages/css/src/tokens.css"), "utf8")
          .matchAll(/(--gov-[\w-]+)\s*:/g)].map((m) => m[1]),
      );
      const used = [...readFileSync(join(here, "..", "apps/docs/docs.css"), "utf8")
        .matchAll(/var\((--gov-[\w-]+)\)/g)].map((m) => m[1]);

      const missing = [...new Set(used)].filter((token) => !tokens.has(token));
      assert.deepEqual(missing, [], "undefined tokens: " + missing.join(", "));
    });

    test("docs CSS uses only tokens, never raw colors", () => {
      const css = readFileSync(join(here, "..", "apps", "docs", "docs.css"), "utf8");
      const hexes = css.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
      assert.deepEqual(
        hexes,
        [],
        "raw colors in the docs shell: " + hexes.join(", ") +
          " — anything not expressible in tokens is a gap in the token layer",
      );
    });
  });
});

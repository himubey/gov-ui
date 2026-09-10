/*
 * The README is the project's front door, and the one file where a
 * broken link is visible to everyone and noticed by nobody who could
 * fix it.
 *
 * The important subtlety: it is rendered by GitHub from the *repository*,
 * not from a working copy. A file that exists locally but is gitignored
 * produces a 404 for every reader while looking perfectly fine to the
 * person who wrote the link. So the check is against what git tracks,
 * not against what is on disk.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const readme = readFileSync(join(root, "README.md"), "utf8");

/** Everything git actually tracks. */
function trackedFiles() {
  const output = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" });
  return new Set(output.split("\n").filter(Boolean));
}

/** Relative link and image targets, ignoring anchors and absolute URLs. */
function relativeTargets(markdown) {
  const targets = new Set();

  for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
    const href = match[1].trim();
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    targets.add(href.split("#")[0]);
  }

  for (const match of markdown.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const src = match[1].trim();
    if (/^(https?:|data:)/.test(src)) continue;
    targets.add(src);
  }

  targets.delete("");
  return [...targets];
}

describe("README", () => {
  test("every relative link points at a file git actually tracks", () => {
    const tracked = trackedFiles();

    // A trailing slash is a directory link. GitHub renders those as the
    // folder listing (or its README), so the target is valid when the
    // repository tracks anything beneath it.
    const resolves = (target) =>
      target.endsWith("/")
        ? [...tracked].some((file) => file.startsWith(target))
        : tracked.has(target);

    const broken = relativeTargets(readme).filter((target) => !resolves(target));

    assert.deepEqual(
      broken,
      [],
      "these render as 404s on GitHub — the file exists locally but is not in the repository: " +
        broken.join(", "),
    );
  });

  test("carries the no-affiliation disclaimer", () => {
    // The claim with actual legal exposure. A project called "GOV UI"
    // that looks government-endorsed is a problem regardless of what the
    // licence section says.
    assert.match(readme, /Not affiliated with, or endorsed by, any government/);
  });

  test("makes no accessibility claim it cannot support", () => {
    // "WCAG 2.2 AA" as a target is honest; as a completed certification
    // it is not, and the difference matters in procurement.
    assert.ok(
      !/\b(fully|certified|guaranteed)\s+(WCAG|accessible)/i.test(readme),
      "the README must describe a target and evidence, never a certification",
    );
  });

  test("the banner carries no official insignia", () => {
    const svg = readFileSync(join(root, "assets/banner.svg"), "utf8").toLowerCase();
    for (const term of ["crown", "emblem", "ashoka", "royal", "seal"]) {
      // The <desc> explains what the banner deliberately omits, so scan
      // the drawn content rather than the description of it.
      const drawn = svg.replace(/<desc>[\s\S]*?<\/desc>/, "");
      assert.ok(!drawn.includes(term), "banner references " + term);
    }
  });

  test("the banner uses only palette colours from the tokens", () => {
    const svg = readFileSync(join(root, "assets/banner.svg"), "utf8");
    const tokens = readFileSync(join(root, "packages/css/src/tokens.css"), "utf8");

    const defined = new Set(
      [...tokens.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0].toLowerCase()),
    );
    // White is not a token; it is the value --gov-primary-contrast holds.
    defined.add("#ffffff");

    const used = [...svg.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{6})"/g)].map((m) =>
      m[1].toLowerCase(),
    );
    const foreign = [...new Set(used)].filter((colour) => !defined.has(colour));

    assert.deepEqual(
      foreign,
      [],
      "the banner should be made of the design system it advertises: " + foreign.join(", "),
    );
  });
});

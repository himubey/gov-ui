/*
 * Builds dist/gov-ui.js.
 *
 * Concatenates the source files and wraps them in a UMD factory. Not a
 * bundler, and deliberately not ESM-only: the output has to work from a
 * plain script tag in a WordPress theme or a Razor page, where there is
 * no build step at all.
 *
 * Source files are plain scripts sharing one scope. They declare
 * functions and call `register`; only the registry file defines GovUI.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "src");
const dist = join(here, "dist");

const BANNER = [
  "/*!",
  " * GOV UI — framework-free component behavior",
  " *",
  " * Add one script tag; components with a data-gov-module attribute",
  " * initialize themselves. No bundler required.",
  " *",
  " * MIT licensed. Not affiliated with or endorsed by any government.",
  " */",
].join("\n");

// registry.js first — it defines everything the modules depend on.
const modulesDir = join(src, "modules");
const moduleFiles = existsSync(modulesDir)
  ? readdirSync(modulesDir).filter((f) => f.endsWith(".js")).sort()
  : [];

const bodies = [readFileSync(join(src, "registry.js"), "utf8")];
for (const file of moduleFiles) {
  bodies.push(readFileSync(join(modulesDir, file), "utf8"));
}

// Indent the concatenated bodies so the wrapper stays readable.
const body = bodies
  .join("\n")
  .split("\n")
  .map((line) => (line ? "  " + line : line))
  .join("\n");

const output = [
  BANNER,
  "(function (root, factory) {",
  '  if (typeof module === "object" && module.exports) {',
  "    module.exports = factory();",
  '  } else if (typeof define === "function" && define.amd) {',
  "    define([], factory);",
  "  } else {",
  "    root.GovUI = factory();",
  "  }",
  '})(typeof self !== "undefined" ? self : this, function () {',
  '  "use strict";',
  "",
  body,
  "",
  "  return GovUI;",
  "});",
  "",
].join("\n");

mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, "gov-ui.js"), output);

const bytes = Buffer.byteLength(output);
console.log(
  "gov-ui.js   " + moduleFiles.length + " module(s)  " + (bytes / 1024).toFixed(1) + " KB raw",
);
